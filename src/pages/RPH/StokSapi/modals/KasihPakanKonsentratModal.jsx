import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, Wheat, Beef, Calculator } from 'lucide-react';
import pemberianPakanKonsentratService from '../../../../services/pemberianPakanKonsentratService';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getRphId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id_office || user?.office_id || null;
  } catch {
    return null;
  }
};

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const Toast = ({ notification, onClose }) => {
  if (!notification) return null;

  const config = {
    success: { border: 'border-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600', title: 'Berhasil!', icon: CheckCircle2 },
    info: { border: 'border-sky-500', iconBg: 'bg-sky-50 text-sky-600', title: 'Memproses...', icon: Loader2 },
    error: { border: 'border-red-500', iconBg: 'bg-red-50 text-red-600', title: 'Gagal!', icon: AlertCircle },
  }[notification.type] || {
    border: 'border-slate-500',
    iconBg: 'bg-slate-50 text-slate-600',
    title: 'Informasi',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm">
      <div className={`overflow-hidden rounded-xl border-l-4 ${config.border} bg-white shadow-lg ring-1 ring-black/5`}>
        <div className="flex items-start gap-3 p-4">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBg}`}>
            <Icon className={`h-4 w-4 ${notification.type === 'info' ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{config.title}</p>
            <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required = false, helperText, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
    {children}
    {helperText ? <p className="text-xs text-slate-400">{helperText}</p> : null}
  </div>
);

const KasihPakanKonsentratModal = ({ isOpen, onClose, onSuccess, cowData }) => {
  const [tanggal, setTanggal] = useState(getToday());
  const [totalKg, setTotalKg] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const idRph = getRphId();

  const cowEartag = cowData?.eartag || cowData?.eartag_sapi || '-';
  const cowJenis = cowData?.jenis_sapi || '-';

  useEffect(() => {
    if (isOpen) {
      setTanggal(getToday());
      setTotalKg('');
      setKeterangan('');
      setPreview(null);
      setNotification(null);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!cowData?.pid) {
      setNotification({ type: 'error', message: 'Data sapi tidak valid.' });
      return;
    }
    if (!idRph) {
      setNotification({ type: 'error', message: 'ID RPH tidak ditemukan di session user.' });
      return;
    }
    const kg = parseFloat(totalKg);
    if (!kg || kg <= 0) {
      setNotification({ type: 'error', message: 'Total kg harus > 0.' });
      return;
    }

    setPreviewLoading(true);
    setNotification({ type: 'info', message: 'Menghitung alokasi FIFO stok konsentrat...' });
    const res = await pemberianPakanKonsentratService.previewPerSapi({
      pid: cowData.pid,
      id_rph: parseInt(idRph),
      total_kg: kg,
    });
    setPreviewLoading(false);
    if (res.success) {
      setPreview(res.data);
      setNotification(null);
    } else {
      setPreview(null);
      setNotification({ type: 'error', message: res.message || 'Gagal preview pemberian pakan.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tanggal) {
      setNotification({ type: 'error', message: 'Tanggal wajib diisi.' });
      return;
    }
    const kg = parseFloat(totalKg);
    if (!kg || kg <= 0) {
      setNotification({ type: 'error', message: 'Total kg harus > 0.' });
      return;
    }
    if (!cowData?.pid) {
      setNotification({ type: 'error', message: 'Data sapi tidak valid.' });
      return;
    }
    if (!idRph) {
      setNotification({ type: 'error', message: 'ID RPH tidak ditemukan.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Menyimpan pemberian pakan konsentrat...' });

    const payload = {
      pid: cowData.pid,
      id_rph: parseInt(idRph),
      tanggal,
      total_kg: kg,
      keterangan: keterangan.trim() || null,
    };

    const res = await pemberianPakanKonsentratService.storePerSapi(payload);
    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Pemberian pakan konsentrat berhasil disimpan.' });
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1000);
      return;
    }

    setNotification({ type: 'error', message: res.message || 'Gagal menyimpan pemberian pakan.' });
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTanggal(getToday());
    setTotalKg('');
    setKeterangan('');
    setPreview(null);
    setNotification(null);
    onClose();
  };

  const previewDetail = useMemo(() => preview?.detail || [], [preview]);

  if (!isOpen) return null;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 text-white">
                <Wheat className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Kasih Pakan Konsentrat</h2>
                <p className="text-sm text-slate-500">FIFO konsumsi stok konsentrat RPH untuk 1 sapi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-5 space-y-4">
              {/* Info Sapi */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                    <Beef className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Sapi Target</p>
                    <p className="text-sm font-bold text-slate-900">{cowEartag}</p>
                    <p className="text-xs text-slate-500">{cowJenis}</p>
                  </div>
                </div>
              </div>

              <Field label="Tanggal Pemberian" required>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                  />
                </div>
              </Field>

              <Field label="Total Pakan (kg)" required helperText="Jumlah kg konsentrat yang diberikan ke sapi ini.">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={totalKg}
                  onChange={(e) => {
                    setTotalKg(e.target.value);
                    setPreview(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="0.000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                />
              </Field>

              <Field label="Keterangan">
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Opsional"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                />
              </Field>

              {/* Preview FIFO */}
              {preview && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">Preview Alokasi FIFO</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 border border-emerald-100">
                      <p className="text-xs font-semibold uppercase text-slate-400">Harga/kg (avg)</p>
                      <p className="text-sm font-bold text-slate-900">{formatRupiah(preview.weighted_avg_harga)}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-emerald-100">
                      <p className="text-xs font-semibold uppercase text-slate-400">Total Biaya</p>
                      <p className="text-sm font-bold text-emerald-700">{formatRupiah(preview.total_biaya)}</p>
                    </div>
                  </div>

                  {previewDetail.length > 0 && (
                    <div className="rounded-xl bg-white border border-emerald-100 overflow-hidden">
                      <div className="px-3 py-2 bg-emerald-100/60 border-b border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-800">Batch Stok Dikonsumsi ({previewDetail.length})</p>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                        {previewDetail.map((d, idx) => (
                          <div key={idx} className="px-3 py-2 flex items-center justify-between text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 truncate">{d.resep_name}</p>
                              <p className="text-slate-400">{d.resep_kode} · {formatRupiah(d.harga_beli)}/kg</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-slate-800">{formatNumber(d.qty_out)} kg</p>
                              <p className="text-slate-400">{formatRupiah(d.subtotal)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!preview && (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewLoading || isSubmitting || !totalKg}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Preview Alokasi FIFO
                </button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || previewLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pemberian Pakan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default KasihPakanKonsentratModal;
