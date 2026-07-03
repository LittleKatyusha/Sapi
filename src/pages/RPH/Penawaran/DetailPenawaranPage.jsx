import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Handshake, Calendar, Users, FileText, Loader2, AlertCircle, CheckCircle2, Send, User } from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: FileText },
  diajukan: { label: 'Diajukan', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: Send },
  disetujui: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle },
};

const DISP_CONFIG = {
  belum_digunakan: { label: 'Belum Digunakan', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  sudah_digunakan: { label: 'Sudah Digunakan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const formatRupiah = (val) => 'Rp ' + (Number(val || 0)).toLocaleString('id-ID');
const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
const formatDateTime = (str) => str ? new Date(str).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

const DetailPenawaranPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { loading, error, fetchDetail } = usePenawaranPenjualan();
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
            Detail Penawaran Dispensasi
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{data.nomor_spp}</p>
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
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tanggal Pengajuan</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(data.tgl_pengajuan)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Pedagang</p>
              <p className="text-sm font-semibold text-gray-800">{data.total_pedagang || 0} pedagang</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Handshake className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Total Saldo</p>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(data.total_saldo)}</p>
            </div>
          </div>
        </div>
        {data.disetujui_pada && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Diverifikasi Oleh</p>
              <p className="text-sm font-semibold text-gray-800">
                {data.disetujui_oleh_user?.name || '-'} · {formatDateTime(data.disetujui_pada)}
              </p>
            </div>
          </div>
        )}
        {data.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan</p>
            <p className="text-sm text-gray-600">{data.notes}</p>
          </div>
        )}
      </div>

      {/* Pedagang Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Daftar Pedagang Dispensasi</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase py-3 px-2">No</th>
                <th className="text-left text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Pedagang</th>
                <th className="text-right text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Saldo Awal</th>
                <th className="text-right text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Saldo Akhir</th>
                <th className="text-center text-[10px] font-bold text-gray-400 uppercase py-3 px-2">Status Dispensasi</th>
              </tr>
            </thead>
            <tbody>
              {data.detail?.map((item, idx) => {
                const disp = DISP_CONFIG[item.status_dispensasi] || null;
                return (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 px-2 text-sm text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-2 text-sm font-medium text-gray-800">
                      {item.pedagang?.nama_alias || item.pedagang?.nama_identitas || '-'}
                      <div className="text-xs text-gray-400">{item.pedagang?.nomor_hp || ''}</div>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">{formatRupiah(item.saldo_awal)}</td>
                    <td className="py-3 px-2 text-sm font-bold text-gray-800 text-right">{formatRupiah(item.saldo_akhir)}</td>
                    <td className="py-3 px-2 text-center">
                      {disp ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${disp.bg} ${disp.text} ${disp.border}`}>
                          {disp.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-100">
                <td colSpan={3} className="py-4 px-2 text-sm font-bold text-gray-600 text-right">Total Saldo</td>
                <td className="py-4 px-2 text-base font-bold text-emerald-600 text-right">{formatRupiah(data.total_saldo)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetailPenawaranPage;
