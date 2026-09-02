import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, FileText, X } from 'lucide-react';

const ExportPengajuanModal = ({ isOpen, loading, onClose, onExport }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
      setStatus('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const days = startDate && endDate
    ? Math.floor((new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000)
    : null;
  const valid = days !== null && days >= 0 && days <= 31;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
      <button type="button" aria-label="Tutup modal" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div><h2 className="font-semibold">Cetak / Export Pengajuan</h2><p className="text-xs text-gray-500">Periode wajib, maksimal 31 hari.</p></div>
          <button type="button" onClick={onClose} disabled={loading}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-xs font-medium">Tanggal mulai<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
            <label className="text-xs font-medium">Tanggal akhir<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
          </div>
          <label className="block text-xs font-medium">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block w-full rounded border p-2 text-sm"><option value="">Semua status</option><option value="Menunggu Persetujuan">Menunggu Persetujuan</option><option value="Disetujui">Disetujui</option><option value="Ditolak">Ditolak</option></select></label>
          {days !== null && !valid && <p className="text-xs text-red-600">Periksa urutan tanggal atau batasi periode 31 hari.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" disabled={!valid || loading} onClick={() => onExport('pdf', { startDate, endDate, status })} className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"><FileText className="h-4 w-4" />PDF</button>
          <button type="button" disabled={!valid || loading} onClick={() => onExport('excel', { startDate, endDate, status })} className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50"><FileSpreadsheet className="h-4 w-4" />{loading ? 'Memproses...' : 'Excel'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ExportPengajuanModal;
