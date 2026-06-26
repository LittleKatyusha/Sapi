import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Handshake, Calendar, User, FileText, Loader2, AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: FileText },
  diajukan: { label: 'Diajukan', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Send },
  disetujui: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle },
};

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');
const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

const DetailPenawaranPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { loading, error, detail, fetchDetail } = usePenawaranPenjualan();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (pid) {
      const load = async () => {
        const result = await fetchDetail(pid);
        if (result.success) setData(result.data);
      };
      load();
    }
  }, [pid, fetchDetail]);

  const status = STATUS_CONFIG[data?.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-sm">Memuat detail...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Gagal Memuat Data</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={() => navigate('/rph/penawaran')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-emerald-600" />
              Detail Penawaran
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{data.no_penawaran}</p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${status.bg} ${status.border}`}>
          <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center ${status.text}`}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide ${status.text}`}>Status</p>
            <p className={`text-lg font-bold ${status.text}`}>{status.label}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Informasi Penawaran</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(data.tanggal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <User className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Pedagang</p>
                <p className="text-sm font-semibold text-gray-800">{data.nama_pedagang || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Handshake className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Penawaran</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(data.total_harga)}</p>
              </div>
            </div>
          </div>
          {data.keterangan && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Keterangan</p>
              <p className="text-sm text-gray-600">{data.keterangan}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Item Penawaran</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase py-3 px-2">No</th>
                  <th className="text-left text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Nama Item</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Qty</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Harga</th>
                  <th className="text-right text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-800">{item.nama_item}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">{item.qty}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">{formatRupiah(item.harga)}</td>
                    <td className="py-3 px-2 text-sm font-bold text-gray-800 text-right">{formatRupiah(item.qty * item.harga)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100">
                  <td colSpan={4} className="py-4 px-2 text-sm font-bold text-gray-600 text-right">Total</td>
                  <td className="py-4 px-2 text-base font-bold text-emerald-600 text-right">{formatRupiah(data.total_harga)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Timeline Status</h2>
          <div className="space-y-0">
            {[
              { key: 'draft', label: 'Draft', desc: 'Penawaran dibuat', date: data.created_at },
              { key: 'diajukan', label: 'Diajukan', desc: 'Menunggu persetujuan', date: data.tanggal_diajukan },
              { key: 'disetujui', label: 'Disetujui', desc: 'Penawaran diterima', date: data.tanggal_disetujui },
            ].map((step, idx, arr) => {
              const isActive = ['draft', 'diajukan', 'disetujui', 'ditolak'].indexOf(data.status) >= ['draft', 'diajukan', 'disetujui'].indexOf(step.key);
              const isCurrent = data.status === step.key || (step.key === 'disetujui' && data.status === 'ditolak');
              const isRejected = step.key === 'disetujui' && data.status === 'ditolak';
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? (isRejected ? 'bg-red-50 border-red-500 text-red-600' : 'bg-emerald-50 border-emerald-500 text-emerald-600') : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      {idx + 1}
                    </div>
                    {idx < arr.length - 1 && <div className={`w-0.5 h-10 ${isActive ? 'bg-emerald-200' : 'bg-gray-200'}`} />}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-bold ${isActive ? (isRejected ? 'text-red-700' : 'text-gray-800') : 'text-gray-400'}`}>{isRejected ? 'Ditolak' : step.label}</p>
                    <p className="text-xs text-gray-500">{isRejected ? 'Penawaran ditolak oleh approver' : step.desc}</p>
                    {step.date && <p className="text-[10px] text-gray-400 mt-1">{formatDate(step.date)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
};

export default DetailPenawaranPage;
