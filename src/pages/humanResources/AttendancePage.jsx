import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import hrisService from '../../services/hrisService';

const localDate = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const AttendancePage = () => {
    const [currentDate, setCurrentDate] = useState(localDate);
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState({ hadir: 0, sakit: 0, izin: 0, alpa: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const cards = [
        ['Hadir', summary.hadir],
        ['Sakit', summary.sakit],
        ['Izin', summary.izin],
        ['Alpa', summary.alpa],
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Absensi</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="attendance-date" className="text-sm font-medium">Tanggal:</label>
                        <input
                            type="date"
                            id="attendance-date"
                            value={currentDate}
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="input-field p-2"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {cards.map(([label, total]) => (
                        <div key={label} className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-700">{loading ? '-' : total}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <LoaderCircle size={28} className="mr-3 animate-spin" /> Memuat data absensi...
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle size={40} className="mb-3 text-red-400" />
                        <p className="font-semibold text-gray-700">Data absensi gagal dimuat</p>
                        <p className="text-sm mt-1 text-gray-500">{error}</p>
                        <button onClick={loadAttendance} className="mt-4 px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800">
                            Coba Lagi
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle size={40} className="mb-3 text-yellow-400" />
                        <p className="font-semibold text-gray-600">Belum ada aktivitas absensi</p>
                        <p className="text-sm mt-1 text-gray-400">Tidak ada check-in atau check-out pada tanggal ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">Aktivitas</th>
                                    <th className="px-4 py-3">Waktu</th>
                                    <th className="px-4 py-3">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {events.map(event => (
                                    <tr key={event.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{event.employee?.full_name || '-'}</p>
                                            <p className="text-xs text-gray-500">{event.employee?.nik || '-'}</p>
                                        </td>
                                        <td className="px-4 py-3">{event.event_type === 'IN' ? 'Check-in' : 'Check-out'}</td>
                                        <td className="px-4 py-3">{event.timestamp_server ? new Date(event.timestamp_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
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
