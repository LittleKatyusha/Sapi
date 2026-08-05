import React, { useEffect, useMemo, useState } from 'react';
import { Copy, X, AlertCircle, Loader2, Calendar } from 'lucide-react';
import PersediaanPakanService from '../../../../../services/persediaanPakanService';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (dateString) => {
  if (!dateString || dateString === '-') return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const todayStr = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};

const CopyResepPakanModal = ({ isOpen, onClose, onSuccess, sourceItem }) => {
  const [tglAktif, setTglAktif] = useState('');
  const [name, setName] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTglAktif(todayStr());
    setName(sourceItem?.name || '');
    setKeterangan(sourceItem?.keterangan && sourceItem.keterangan !== '-' ? sourceItem.keterangan : '');
    setSubmitError('');
  }, [isOpen, sourceItem]);

  const sourceSummary = useMemo(() => {
    if (!sourceItem) return null;
    return {
      name: sourceItem.name || '-',
      tgl_aktif: sourceItem.tgl_aktif || '-',
      total_jumlah: Number(sourceItem.total_jumlah) || 0,
      harga_total: Number(sourceItem.harga_total) || 0,
      keterangan: sourceItem.keterangan || '-',
    };
  }, [sourceItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!sourceItem?.pid) {
      setSubmitError('Resep sumber tidak valid.');
      return;
    }
    if (!tglAktif) {
      setSubmitError('Tanggal aktif tujuan wajib diisi.');
      return;
    }
    if (sourceItem?.tgl_aktif && tglAktif === sourceItem.tgl_aktif.slice(0, 10)) {
      setSubmitError('Tanggal aktif tujuan tidak boleh sama dengan tanggal sumber.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pid: sourceItem.pid,
        tgl_aktif: tglAktif,
      };
      if (name && name.trim()) payload.name = name.trim();
      if (keterangan && keterangan.trim()) payload.keterangan = keterangan.trim();

      const response = await PersediaanPakanService.copyResepToDate(payload);
      if (response.success) {
        if (onSuccess) onSuccess(response);
      } else {
        setSubmitError(response.message || 'Gagal menyalin resep pakan.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat menyalin resep.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={!isSubmitting ? onClose : undefined}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Copy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Copy Resep ke Tanggal Lain</h3>
                  <p className="text-violet-100 text-sm">Stok bahan baku akan diambil ulang (FIFO)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {sourceSummary && (
              <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 space-y-2">
                <div className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide">Resep Sumber</div>
                <div className="font-bold text-slate-800 text-sm">{sourceSummary.name}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center rounded bg-sky-50 px-1.5 py-0.5 font-bold text-sky-700 border border-sky-100">
                    {formatDate(sourceSummary.tgl_aktif)}
                  </span>
                  <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 border border-slate-200">
                    {sourceSummary.total_jumlah} item
                  </span>
                  <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 border border-emerald-100">
                    {formatCurrency(sourceSummary.harga_total)}
                  </span>
                </div>
                {sourceSummary.keterangan !== '-' && (
                  <div className="text-xs text-slate-500 mt-1">{sourceSummary.keterangan}</div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Tanggal Aktif Tujuan <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 -mt-0.5">Tanggal untuk resep baru. Stok bahan baku akan diambil ulang via FIFO di tanggal ini.</p>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={tglAktif}
                  onChange={(e) => setTglAktif(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Resep baru akan memiliki tanggal aktif ini dan dapat dipakai pada tanggal tersebut.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nama Resep (opsional)
              </label>
              <p className="text-[11px] text-slate-500 -mt-0.5">Nama untuk resep baru. Kosongkan untuk menggunakan nama dari resep sumber.</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Kosongkan untuk menggunakan nama sumber"
                className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Keterangan (opsional)
              </label>
              <p className="text-[11px] text-slate-500 -mt-0.5">Catatan tambahan untuk resep baru. Kosongkan untuk menggunakan keterangan dari resep sumber.</p>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                disabled={isSubmitting}
                rows={2}
                placeholder="Kosongkan untuk menggunakan keterangan sumber"
                className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60 resize-none"
              />
            </div>

            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{submitError}</span>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
              <strong>Catatan:</strong> Stok bahan baku akan diambil ulang menggunakan FIFO berdasarkan komposisi resep sumber. Pastikan stok mencukupi.
            </div>
          </form>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:from-violet-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyalin...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Resep
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyResepPakanModal;
