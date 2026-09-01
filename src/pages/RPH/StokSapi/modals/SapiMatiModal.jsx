import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, FileText, AlertTriangle, Paperclip } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import StokSapiService from '../../../../services/stokSapiService';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Toast = ({ notification, onClose }) => {
  if (!notification) return null;

  const config = {
    success: {
      border: 'border-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'Berhasil!',
      icon: CheckCircle2,
    },
    info: {
      border: 'border-sky-500',
      iconBg: 'bg-sky-50 text-sky-600',
      title: 'Memproses...',
      icon: Loader2,
    },
    error: {
      border: 'border-red-500',
      iconBg: 'bg-red-50 text-red-600',
      title: 'Gagal!',
      icon: AlertCircle,
    },
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

const SapiMatiModal = ({ isOpen, onClose, onSuccess, cowData }) => {
  const [tglKematian, setTglKematian] = useState(getToday());
  const [idSebabKematian, setIdSebabKematian] = useState(null);
  const [idMengetahui, setIdMengetahui] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [bukti, setBukti] = useState(null);

  const [sebabOptions, setSebabOptions] = useState([]);
  const [mengetahuiOptions, setMengetahuiOptions] = useState([]);

  const [loadingSebab, setLoadingSebab] = useState(false);
  const [loadingMengetahui, setLoadingMengetahui] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchSebabOptions = useCallback(async () => {
    setLoadingSebab(true);
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'sebab_kematian'
      });
      if (response.data && Array.isArray(response.data)) {
        setSebabOptions(response.data.map(item => ({
          value: parseInt(item.value),
          label: item.name
        })));
      }
    } catch (err) {
      console.error('Error fetching sebab options:', err);
    }
    setLoadingSebab(false);
  }, []);

  const fetchMengetahuiOptions = useCallback(async () => {
    setLoadingMengetahui(true);
    try {
      const response = await HttpClient.get(`${API_ENDPOINTS.MASTER.PERSETUJUAN_RPH}/data`, {
        cache: true
      });
      if (response.data && Array.isArray(response.data)) {
        setMengetahuiOptions(response.data.map(item => ({
          value: item.id,
          label: item.name || 'Unknown'
        })));
      }
    } catch (err) {
      console.error('Error fetching mengetahui options:', err);
    }
    setLoadingMengetahui(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSebabOptions();
      fetchMengetahuiOptions();
    }
  }, [isOpen, fetchSebabOptions, fetchMengetahuiOptions]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleClose = () => {
    if (isSubmitting) return;
    setTglKematian(getToday());
    setIdSebabKematian(null);
    setIdMengetahui(null);
    setKeterangan('');
    setBukti(null);
    setNotification(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tglKematian) {
      setNotification({ type: 'error', message: 'Tanggal kematian wajib diisi.' });
      return;
    }

    if (!idSebabKematian) {
      setNotification({ type: 'error', message: 'Sebab kematian wajib dipilih.' });
      return;
    }

    if (!idMengetahui) {
      setNotification({ type: 'error', message: 'Mengetahui wajib dipilih.' });
      return;
    }

    if (bukti && !['image/jpeg', 'image/png', 'application/pdf'].includes(bukti.type)) {
      setNotification({ type: 'error', message: 'Bukti harus berupa JPG, PNG, atau PDF.' });
      return;
    }

    if (bukti && bukti.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Ukuran bukti maksimal 5 MB.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Menyimpan data sapi mati...' });

    const payload = {
      pid: cowData?.pid,
      tgl_kematian: tglKematian,
      id_sebab_kematian: parseInt(idSebabKematian),
      id_mengetahui: parseInt(idMengetahui),
      keterangan: keterangan.trim() || null,
      file: bukti,
    };

    const response = await StokSapiService.sapiMati(payload);

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data sapi mati berhasil disimpan.' });
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1000);
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menyimpan data sapi mati.' });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 p-3 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Sapi Mati</h2>
                <p className="text-sm text-slate-500">Form pencatatan sapi mati</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <form id="sapi-mati-form" onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
            {cowData && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Data Sapi</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Jenis Sapi</p>
                    <p className="font-semibold text-slate-900">{cowData.jenis_sapi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Eartag</p>
                    <p className="font-semibold text-slate-900">{cowData.eartag || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Bobot</p>
                    <p className="font-semibold text-slate-900">{cowData.bobot ? `${cowData.bobot} KG` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Lokasi</p>
                    <p className="font-semibold text-slate-900">{cowData.lokasi_sapi || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <Field label="Tanggal Kematian" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={tglKematian}
                  onChange={(e) => setTglKematian(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all"
                  required
                />
              </div>
            </Field>

            <Field label="Sebab Kematian" required>
              <SearchableSelect
                options={sebabOptions}
                value={idSebabKematian}
                onChange={setIdSebabKematian}
                placeholder={loadingSebab ? 'Memuat...' : 'Pilih sebab kematian'}
                isLoading={loadingSebab}
                isDisabled={loadingSebab || isSubmitting}
              />
            </Field>

            <Field label="Mengetahui" required>
              <SearchableSelect
                options={mengetahuiOptions}
                value={idMengetahui}
                onChange={setIdMengetahui}
                placeholder={loadingMengetahui ? 'Memuat...' : 'Pilih yang mengetahui'}
                isLoading={loadingMengetahui}
                isDisabled={loadingMengetahui || isSubmitting}
              />
            </Field>

            <Field label="Keterangan" helperText="Opsional">
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Tambahkan keterangan jika diperlukan..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all resize-none"
                />
              </div>
            </Field>

            <Field label="Bukti Kematian" helperText="Opsional. JPG, PNG, atau PDF, maksimal 5 MB.">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5 text-sm transition-colors hover:border-slate-400 hover:bg-slate-50">
                <Paperclip className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="min-w-0 flex-1 truncate text-slate-600">{bukti ? bukti.name : 'Pilih berkas bukti'}</span>
                <span className="text-xs font-medium text-slate-500">Pilih</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(event) => setBukti(event.target.files?.[0] || null)}
                  disabled={isSubmitting}
                  className="sr-only"
                />
              </label>
            </Field>
          </form>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              form="sapi-mati-form"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl hover:from-slate-600 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Sapi Mati
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SapiMatiModal;
