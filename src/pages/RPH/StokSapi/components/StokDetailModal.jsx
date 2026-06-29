import React from 'react';
import { X, Eye } from 'lucide-react';

const StokDetailModal = ({ row, onClose }) => {
  if (!row) return null;

  const detailItems = [
    ['Jenis Sapi', row.jenis_sapi],
    ['Eartag', row.eartag],
    ['Bobot', row.bobot ? `${row.bobot} KG` : '-'],
    ['Lokasi Sapi', row.lokasi_sapi],
    ['Harga Beli', row.harga_beli ? `Rp ${row.harga_beli}` : '-'],
    ['DOF', row.dof_hari],
    ['Kg Pakan', row.kg],
    ['Nilai Pakan', row.nilai_pakan ? `Rp ${row.nilai_pakan}` : '-'],
    ['OVK', row.ovk],
    ['Nilai OVK', row.nilai_ovk ? `Rp ${row.nilai_ovk}` : '-'],
    ['Total', row.total ? `Rp ${row.total}` : '-'],
    ['Status Sapi', row.status_sapi],
    ['Pemasok', row.pemasok],
    ['Nomor Nota', row.nomor_nota],
    ['Pengirim', row.pengirim],
    ['Tanggal Kedatangan', row.tanggal_kedatangan],
    ['Penerima', row.penerima],
    ['Kondisi Sapi', row.kondisi_sapi],
    ['Keterangan', row.keterangan_kondisi],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="detail-stok-title">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-3">
          <div className="flex items-start gap-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h2 id="detail-stok-title" className="text-sm font-bold text-slate-900">Detail Stok Sapi</h2>
              <p className="text-xs text-slate-500">Informasi lengkap data sapi.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup detail"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {detailItems.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-0.5 break-words text-xs font-semibold text-slate-800">{value || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 p-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default StokDetailModal;
