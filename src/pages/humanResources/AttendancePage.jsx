import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import hrisService from '../../services/hrisService';

const localDate = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const formatTime = (value, withSeconds = false) => value
    ? new Date(value).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        ...(withSeconds ? { second: '2-digit' } : {}),
    })
    : '--:--';

const requestId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `attendance-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const AttendancePage = () => {
    const [currentDate, setCurrentDate] = useState(localDate);
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState({ hadir: 0, sakit: 0, izin: 0, alpa: 0 });
    const [myAttendance, setMyAttendance] = useState(null);
    const [clock, setClock] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionNotice, setActionNotice] = useState(null);

    const loadAttendance = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await hrisService.getAttendanceEvents({ date: currentDate, per_page: 100 });
            setEvents(response?.data?.data || []);
            setSummary(response?.summary || { hadir: 0, sakit: 0, izin: 0, alpa: 0 });
        } catch (requestError) {
            setEvents([]);
            setSummary({ hadir: 0, sakit: 0, izin: 0, alpa: 0 });
            setError(requestError.message || 'Data absensi gagal dimuat.');
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    const loadMyAttendance = useCallback(async () => {
        try {
            const response = await hrisService.getMyAttendanceStatus();
            setMyAttendance(response?.data || null);
        } catch {
            setMyAttendance(null);
        }
    }, []);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    useEffect(() => {
        loadMyAttendance();
        const timer = window.setInterval(() => setClock(new Date()), 1000);
        return () => window.clearInterval(timer);
    }, [loadMyAttendance]);

    const recordAttendance = async () => {
        if (!myAttendance || myAttendance.next_action === 'DONE') return;

        const action = myAttendance.next_action;
        setActionLoading(true);
        setActionNotice(null);
        try {
            const payload = { request_id: requestId(), timestamp_client: new Date().toISOString() };
            const response = action === 'IN'
                ? await hrisService.checkIn(payload)
                : await hrisService.checkOut(payload);
            setActionNotice({ type: 'success', message: response?.message || 'Absensi berhasil dicatat.' });
            await Promise.all([loadMyAttendance(), loadAttendance()]);
        } catch (requestError) {
            setActionNotice({ type: 'error', message: requestError.message || 'Absensi gagal dicatat.' });
            await loadMyAttendance();
        } finally {
            setActionLoading(false);
        }
    };

    const cards = [
        ['Hadir', summary.hadir],
        ['Sakit', summary.sakit],
        ['Izin', summary.izin],
        ['Alpa', summary.alpa],
    ];
    const nextAction = myAttendance?.next_action;
    const actionLabel = nextAction === 'IN' ? 'Check-in Sekarang' : nextAction === 'OUT' ? 'Check-out Sekarang' : 'Absensi Hari Ini Selesai';
    const ActionIcon = nextAction === 'IN' ? LogIn : nextAction === 'OUT' ? LogOut : CheckCircle2;

    return (
        <div className="space-y-6">
            {myAttendance && (
                <section className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white shadow-lg sm:p-7" aria-labelledby="self-attendance-title">
                    <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-emerald-800/40" aria-hidden="true" />
                    <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <div className="mb-4 flex items-center gap-2 text-emerald-200">
                                <ShieldCheck size={18} aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-[0.18em]">Absensi Saya</span>
                            </div>
                            <h2 id="self-attendance-title" className="text-2xl font-bold sm:text-3xl">{myAttendance.employee?.full_name}</h2>
                            <p className="mt-1 text-sm text-emerald-200">{myAttendance.employee?.nik} · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

                            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Masuk</p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums">{formatTime(myAttendance.check_in)}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Pulang</p>
                                    <p className="mt-1 text-2xl font-bold tabular-nums">{formatTime(myAttendance.check_out)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="min-w-[250px] rounded-2xl bg-white p-4 text-emerald-950 shadow-xl sm:p-5">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Waktu perangkat</p>
                                    <p className="mt-1 text-3xl font-black tabular-nums">{formatTime(clock, true)}</p>
                                </div>
                                <Clock3 className="text-emerald-700" size={30} aria-hidden="true" />
                            </div>
                            <button
                                type="button"
                                onClick={recordAttendance}
                                disabled={actionLoading || nextAction === 'DONE'}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:text-emerald-800"
                            >
                                {actionLoading ? <LoaderCircle className="animate-spin" size={20} aria-hidden="true" /> : <ActionIcon size={20} aria-hidden="true" />}
                                {actionLoading ? 'Mencatat...' : actionLabel}
                            </button>
                            <p className="mt-3 text-center text-xs text-gray-500">Waktu server menjadi catatan resmi.</p>
                        </div>
                    </div>

                    {actionNotice && (
                        <div role="status" className={`relative mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${actionNotice.type === 'success' ? 'bg-emerald-800 text-emerald-50' : 'bg-red-950 text-red-100'}`}>
                            {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {actionNotice.message}
                        </div>
                    )}
                </section>
            )}

            <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
                <div className="mb-6 flex flex-col items-start justify-between border-b pb-4 sm:flex-row sm:items-center">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800 sm:mb-0">Riwayat Absensi</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="attendance-date" className="text-sm font-medium">Tanggal:</label>
                        <input type="date" id="attendance-date" value={currentDate} onChange={(event) => setCurrentDate(event.target.value)} className="input-field p-2" />
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {cards.map(([label, total]) => (
                        <div key={label} className="rounded-lg bg-gray-50 p-4 text-center">
                            <p className="text-2xl font-bold text-gray-700">{loading ? '-' : total}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500"><LoaderCircle size={28} className="mr-3 animate-spin" /> Memuat data absensi...</div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle size={40} className="mb-3 text-red-400" />
                        <p className="font-semibold text-gray-700">Data absensi gagal dimuat</p>
                        <p className="mt-1 text-sm text-gray-500">{error}</p>
                        <button type="button" onClick={loadAttendance} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Coba Lagi</button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle size={40} className="mb-3 text-yellow-400" />
                        <p className="font-semibold text-gray-600">Belum ada aktivitas absensi</p>
                        <p className="mt-1 text-sm text-gray-400">Tidak ada check-in atau check-out pada tanggal ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Karyawan</th><th className="px-4 py-3">Aktivitas</th><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">IP</th></tr></thead>
                            <tbody className="divide-y">
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td className="px-4 py-3"><p className="font-medium text-gray-800">{event.employee?.full_name || '-'}</p><p className="text-xs text-gray-500">{event.employee?.nik || '-'}</p></td>
                                        <td className="px-4 py-3">{event.event_type === 'IN' ? 'Check-in' : 'Check-out'}</td>
                                        <td className="px-4 py-3">{formatTime(event.timestamp_server)}</td>
                                        <td className="px-4 py-3 text-gray-500">{event.ip_address || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;