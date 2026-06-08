import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, Scale, FileText } from 'lucide-react';
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

const PotongPaksaModal = ({ isOpen, onClose, onSuccess, cowData }) => {
  const [tglPotongPaksa, setTglPotongPaksa] = useState(getToday());
  const [idSebabPotongPaksa, setIdSebabPotongPaksa] = useState(null);
  const [bobotSelisih, setBobotSelisih] = useState('');
  const [idMengetahui, setIdMengetahui] = useState(null);
  const [idStatusSapiQurban, setIdStatusSapiQurban] = useState(null);
  const [keterangan, setKeterangan] = useState('');

  const [sebabOptions, setSebabOptions] = useState([]);
  const [mengetahuiOptions, setMengetahuiOptions] = useState([]);
  const [statusSapiQurbanOptions, setStatusSapiQurbanOptions] = useState([]);

  const [loadingSebab, setLoadingSebab] = useState(false);
  const [loadingMengetahui, setLoadingMengetahui] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchSebabOptions = useCallback(async () => {
    setLoadingSebab(true);
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'sebab_potong_paksa'
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
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'mengetahui'
      });
      if (response.data && Array.isArray(response.data)) {
        setMengetahuiOptions(response.data.map(item => ({
          value: parseInt(item.value),
          label: item.name
        })));
      }
    } catch (err) {
      console.error('Error fetching mengetahui options:', err);
    }
    setLoadingMengetahui(false);
  }, []);

  const fetchStatusSapiQurbanOptions = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PARAMETERS}/dataByGroup`, {
        group: 'status_sapi_qurban'
      });
      if (response.data && Array.isArray(response.data)) {
        setStatusSapiQurbanOptions(response.data.map(item => ({
          value: parseInt(item.value),
          label: item.name
        })));
      }
    } catch (err) {
      console.error('Error fetching status sapi qurban options:', err);
    }
    setLoadingStatus(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSebabOptions();
      fetchMengetahuiOptions();
      fetchStatusSapiQurbanOptions();
    }
  }, [isOpen, fetchSebabOptions, fetchMengetahuiOptions, fetchStatusSapiQurbanOptions]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleClose = () => {
    if (isSubmitting) return;
    setTglPotongPaksa(getToday());
    setIdSebabPotongPaksa(null);
    setBobotSelisih('');
    setIdMengetahui(null);
    setIdStatusSapiQurban(null);
    setKeterangan('');
    setNotification(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tglPotongPaksa) {
      setNotification({ type: 'error', message: 'Tanggal potong paksa wajib diisi.' });
      return;
    }

    if (!idSebabPotongPaksa) {
      setNotification({ type: 'error', message: 'Sebab potong paksa wajib dipilih.' });
      return;
    }

    if (!bobotSelisih || isNaN(parseInt(bobotSelisih))) {
      setNotification({ type: 'error', message: 'Bobot selisih wajib diisi dengan angka.' });
      return;
    }

    if (!idMengetahui) {
      setNotification({ type: 'error', message: 'Mengetahui wajib dipilih.' });
      return;
    }

    if (!idStatusSapiQurban) {
      setNotification({ type: 'error', message: 'Status sapi qurban wajib dipilih.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Menyimpan data potong paksa...' });

    const payload = {
      pid: cowData?.pid,
      tgl_potong_paksa: tglPotongPaksa,
      id_sebab_potong_paksa: parseInt(idSebabPotongPaksa),
      bobot_selisih_potong_paksa: parseInt(bobotSelisih),
      id_mengetahui: parseInt(idMengetahui),
      id_status_sapi_qurban: parseInt(idStatusSapiQurban),
      keterangan: keterangan.trim() || null,
    };

    const response = await StokSapiService.potongPaksa(payload);

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data potong paksa berhasil disimpan.' });
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1000);
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menyimpan data potong paksa.' });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-3 text-white">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Potong Paksa Sapi</h2>
                <p className="text-sm text-slate-500">Form potong paksa untuk sapi</p>
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

          <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Potong Paksa" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={tglPotongPaksa}
                    onChange={(e) => setTglPotongPaksa(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    required
                  />
                </div>
              </Field>

              <Field label="Bobot Selisih" required helperText="Selisih bobot sebelum dan sesudah potong">
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    value={bobotSelisih}
                    onChange={(e) => setBobotSelisih(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                    required
                  />
                </div>
              </Field>
            </div>

            <Field label="Sebab Potong Paksa" required>
              <SearchableSelect
                options={sebabOptions}
                value={idSebabPotongPaksa}
                onChange={setIdSebabPotongPaksa}
                placeholder={loadingSebab ? 'Memuat...' : 'Pilih sebab potong paksa'}
                isLoading={loadingSebab}
                isDisabled={loadingSebab || isSubmitting}
              />
            </Field>

            <Field label="Status Sapi Qurban" required>
              <SearchableSelect
                options={statusSapiQurbanOptions}
                value={idStatusSapiQurban}
                onChange={setIdStatusSapiQurban}
                placeholder={loadingStatus ? 'Memuat...' : 'Pilih status sapi qurban'}
                isLoading={loadingStatus}
                isDisabled={loadingStatus || isSubmitting}
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
                />
              </div>
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Potong Paksa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PotongPaksaModal;