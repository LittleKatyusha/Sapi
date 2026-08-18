import React from 'react';
import { AlertCircle, Check, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';
import hrisService from '../../services/hrisService';

const emptyForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' };
const statusStyle = {
    PENDING: 'bg-amber-100 text-amber-800', APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-rose-100 text-rose-800', CANCELLED: 'bg-slate-100 text-slate-700',
};

const LeaveRequestPage = () => {
    const [rows, setRows] = React.useState([]);
    const [types, setTypes] = React.useState([]);
    const [status, setStatus] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');
    const [canSubmit, setCanSubmit] = React.useState(false);
    const [modal, setModal] = React.useState(false);
    const [form, setForm] = React.useState(emptyForm);

    const load = React.useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [requestResponse, typeResponse] = await Promise.all([
                hrisService.getLeaveRequests(status ? { status, per_page: 100 } : { per_page: 100 }),
                hrisService.getLeaveTypes(),
            ]);
            setRows(requestResponse?.data?.data || []);
            setCanSubmit(Boolean(requestResponse?.can_submit));
            setTypes(typeResponse?.data || []);
        } catch (requestError) {
            setError(requestError.message || 'Data pengajuan cuti gagal dimuat.');
        } finally { setLoading(false); }
    }, [status]);

    React.useEffect(() => { load(); }, [load]);

    const submit = async (event) => {
        event.preventDefault(); setSaving(true); setError('');
        const start = new Date(`${form.start_date}T00:00:00`);
        const end = new Date(`${form.end_date}T00:00:00`);
        const duration = Math.floor((end - start) / 86400000) + 1;
        if (!Number.isFinite(duration) || duration < 1) {
            setError('Tanggal selesai harus sama atau setelah tanggal mulai.'); setSaving(false); return;
        }
        try {
            await hrisService.submitLeaveRequest({ ...form, leave_type_id: Number(form.leave_type_id), duration });
            setModal(false); setForm(emptyForm); await load();
        } catch (requestError) {
            setError(requestError.message || 'Pengajuan cuti gagal disimpan.');
        } finally { setSaving(false); }
    };

    const decide = async (row, decision) => {
        const approval = row.approvals?.find(item => item.can_act);
        if (!approval) return;
        const reason = decision === 'reject' ? window.prompt('Alasan penolakan:') : null;
        if (decision === 'reject' && !reason) return;
        setError('');
        try {
            if (decision === 'approve') await hrisService.approveLeaveRequest(row.id, approval.level);
            else await hrisService.rejectLeaveRequest(row.id, approval.level, reason);
            await load();
        } catch (requestError) { setError(requestError.message || 'Keputusan gagal disimpan.'); }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Manajemen Pengajuan Cuti</h2>
                <div className="flex flex-wrap gap-2">
                    <select aria-label="Filter status" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="">Semua status</option>
                        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(value => <option key={value}>{value}</option>)}
                    </select>
                    <button onClick={load} aria-label="Muat ulang" className="rounded-lg border p-2 hover:bg-gray-50"><RefreshCw size={20}/></button>
                    {canSubmit && <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"><Plus size={18}/>Ajukan Cuti</button>}
                </div>
            </div>

            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {loading ? <div className="flex items-center justify-center py-16 text-gray-500"><LoaderCircle className="mr-3 animate-spin"/>Memuat pengajuan cuti...</div>
                : rows.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><AlertCircle size={40} className="mb-3 text-yellow-400"/><p className="font-semibold text-gray-600">Belum ada pengajuan cuti</p></div>
                : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b bg-gray-50 text-gray-600"><tr><th className="px-4 py-3">Karyawan</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Periode</th><th className="px-4 py-3">Durasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y">{rows.map(row => <tr key={row.id}><td className="px-4 py-3"><p className="font-medium text-gray-800">{row.employee?.full_name || '-'}</p><p className="text-xs text-gray-500">{row.employee?.nik || '-'}</p></td><td className="px-4 py-3">{row.leave_type?.name || '-'}</td><td className="px-4 py-3">{row.start_date} s.d. {row.end_date}</td><td className="px-4 py-3">{Number(row.duration)} {row.leave_type?.unit === 'HOUR' ? 'jam' : 'hari'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[row.status] || 'bg-gray-100 text-gray-700'}`}>{row.status}</span></td><td className="px-4 py-3">{row.status === 'PENDING' && row.approvals?.some(item => item.can_act) ? <span className="flex gap-3"><button onClick={() => decide(row, 'approve')} className="flex items-center gap-1 font-semibold text-green-700"><Check size={16}/>Setujui</button><button onClick={() => decide(row, 'reject')} className="flex items-center gap-1 font-semibold text-red-700"><X size={16}/>Tolak</button></span> : '-'}</td></tr>)}</tbody></table></div>}

            {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="leave-form-title"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 id="leave-form-title" className="text-xl font-bold">Ajukan Cuti</h3><button type="button" onClick={() => setModal(false)} aria-label="Tutup"><X/></button></div><div className="mt-5 grid gap-4"><label className="text-sm font-medium">Jenis cuti<select required value={form.leave_type_id} onChange={event => setForm({...form, leave_type_id: event.target.value})} className="mt-1 w-full rounded-lg border p-3 font-normal"><option value="">Pilih jenis cuti</option>{types.map(type => <option key={type.id} value={type.id}>{type.code} — {type.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Tanggal mulai<input required type="date" value={form.start_date} onChange={event => setForm({...form, start_date: event.target.value})} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="text-sm font-medium">Tanggal selesai<input required type="date" min={form.start_date} value={form.end_date} onChange={event => setForm({...form, end_date: event.target.value})} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label></div><label className="text-sm font-medium">Alasan<textarea required value={form.reason} onChange={event => setForm({...form, reason: event.target.value})} className="mt-1 min-h-24 w-full rounded-lg border p-3 font-normal"/></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-lg border px-4 py-2 font-semibold">Batal</button><button disabled={saving || types.length === 0} className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Kirim Pengajuan'}</button></div></form></div>}
        </div>
    );
};

export default LeaveRequestPage;
