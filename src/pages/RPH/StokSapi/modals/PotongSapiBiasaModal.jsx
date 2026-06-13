import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, Scale, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import StokSapiService from '../../../../services/stokSapiService';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const JENIS_POTONG_OPTIONS = [
  { value: 1, label: 'Boning' },
  { value: 2, label: 'Karkas' },
  { value: 3, label: 'Kulit' },
];

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

const createEmptyDetail = () => ({
  id_jenis_potong: 1,
  header_pid: null,
  id_header_boning_karkas: null,
  id_jenis_boning_karkas: null,
  berat: '',
});

const PotongSapiBiasaModal = ({ isOpen, onClose, onSuccess, cowData }) => {
  const [tglPotong, setTglPotong] = useState(getToday());
  const [details, setDetails] = useState([createEmptyDetail()]);

  const [boningHeaders, setBoningHeaders] = useState([]);
  const [karkasHeaders, setKarkasHeaders] = useState([]);
  const [boningDetailsMap, setBoningDetailsMap] = useState({});
  const [karkasDetailsMap, setKarkasDetailsMap] = useState({});

  const [loadingBoning, setLoadingBoning] = useState(false);
  const [loadingKarkas, setLoadingKarkas] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const detailsCache = useRef({});

  const fetchBoningItems = useCallback(async () => {
    setLoadingBoning(true);
    try {
      const response = await StokSapiService.getBoningItems();
      if (response.success && Array.isArray(response.data)) {
        setBoningHeaders(response.data.map(item => ({
          value: item.id,
          label: item.name || `Boning #${item.id}`,
          pid: item.pid,
        })));
      }
    } catch (err) {
      console.error('Error fetching boning items:', err);
    }
    setLoadingBoning(false);
  }, []);

  const fetchKarkasItems = useCallback(async () => {
    setLoadingKarkas(true);
    try {
      const response = await StokSapiService.getKarkasItems();
      if (response.success && Array.isArray(response.data)) {
        setKarkasHeaders(response.data.map(item => ({
          value: item.id,
          label: item.name || `Karkas #${item.id}`,
          pid: item.pid,
        })));
      }
    } catch (err) {
      console.error('Error fetching karkas items:', err);
    }
    setLoadingKarkas(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBoningItems();
      fetchKarkasItems();
    }
  }, [isOpen, fetchBoningItems, fetchKarkasItems]);

  useEffect(() => {
    if (isOpen) {
      setTglPotong(getToday());
      setDetails([createEmptyDetail()]);
      setNotification(null);
      detailsCache.current = {};
    }
  }, [isOpen]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const fetchHeaderDetails = useCallback(async (jenisPotong, headerId, headerPid, index) => {
    if (!headerPid) return;

    if (detailsCache.current[headerId]) {
      if (jenisPotong === 1) {
        setBoningDetailsMap(prev => ({ ...prev, [headerId]: detailsCache.current[headerId] }));
      } else {
        setKarkasDetailsMap(prev => ({ ...prev, [headerId]: detailsCache.current[headerId] }));
      }
      return;
    }

    setLoadingDetail(prev => ({ ...prev, [index]: true }));
    try {
      const response = jenisPotong === 1
        ? await StokSapiService.showBoning(headerPid)
        : await StokSapiService.showKarkas(headerPid);

      if (response.success && response.data?.details && Array.isArray(response.data.details)) {
        const options = response.data.details.map(d => ({
          value: d.id,
          label: d.name || `Detail #${d.id}`,
        }));
        detailsCache.current[headerId] = options;

        if (jenisPotong === 1) {
          setBoningDetailsMap(prev => ({ ...prev, [headerId]: options }));
        } else {
          setKarkasDetailsMap(prev => ({ ...prev, [headerId]: options }));
        }
      }
    } catch (err) {
      console.error('Error fetching header details:', err);
    }
    setLoadingDetail(prev => ({ ...prev, [index]: false }));
  }, []);

  const handleDetailChange = (index, field, value) => {
    setDetails(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'id_jenis_potong') {
        next[index].header_pid = null;
        next[index].id_header_boning_karkas = null;
        next[index].id_jenis_boning_karkas = null;
      }

      if (field === 'id_header_boning_karkas') {
        next[index].id_jenis_boning_karkas = null;

        if (value) {
          const headers = next[index].id_jenis_potong === 1 ? boningHeaders : karkasHeaders;
          const selectedHeader = headers.find(h => h.value === value);
          next[index].header_pid = selectedHeader?.pid || null;
        } else {
          next[index].header_pid = null;
        }
      }

      return next;
    });

    if (field === 'id_header_boning_karkas' && value) {
      const detail = details[index];
      const jenisPotong = field === 'id_header_boning_karkas'
        ? details[index].id_jenis_potong
        : detail.id_jenis_potong;
      const headers = jenisPotong === 1 ? boningHeaders : karkasHeaders;
      const selectedHeader = headers.find(h => h.value === value);
      if (selectedHeader?.pid) {
        fetchHeaderDetails(jenisPotong, value, selectedHeader.pid, index);
      }
    }
  };

  const addDetail = () => {
    setDetails(prev => [...prev, createEmptyDetail()]);
  };

  const removeDetail = (index) => {
    setDetails(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTglPotong(getToday());
    setDetails([createEmptyDetail()]);
    setNotification(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tglPotong) {
      setNotification({ type: 'error', message: 'Tanggal potong wajib diisi.' });
      return;
    }

    if (details.length === 0) {
      setNotification({ type: 'error', message: 'Minimal 1 detail potong wajib diisi.' });
      return;
    }

    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const jenisPotong = d.id_jenis_potong;

      if (![1, 2, 3].includes(jenisPotong)) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Jenis potong tidak valid.` });
        return;
      }

      if (jenisPotong === 3) {
        if (d.id_header_boning_karkas) {
          setNotification({ type: 'error', message: `Detail #${i + 1}: Header boning/karkas harus kosong untuk kulit.` });
          return;
        }
        if (d.id_jenis_boning_karkas) {
          setNotification({ type: 'error', message: `Detail #${i + 1}: Jenis boning/karkas harus kosong untuk kulit.` });
          return;
        }
      } else {
        if (!d.id_header_boning_karkas) {
          setNotification({ type: 'error', message: `Detail #${i + 1}: Header ${jenisPotong === 1 ? 'boning' : 'karkas'} wajib dipilih.` });
          return;
        }
        if (!d.id_jenis_boning_karkas) {
          setNotification({ type: 'error', message: `Detail #${i + 1}: Jenis ${jenisPotong === 1 ? 'boning' : 'karkas'} wajib dipilih.` });
          return;
        }
      }

      if (!d.berat || isNaN(parseInt(d.berat)) || parseInt(d.berat) < 1) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Berat wajib diisi dengan angka minimal 1.` });
        return;
      }
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Menyimpan data potong sapi...' });

    const payload = {
      pid: cowData?.pid,
      tgl_potong: tglPotong,
      detail: details.map(d => ({
        id_jenis_potong: d.id_jenis_potong,
        id_header_boning_karkas: [1, 2].includes(d.id_jenis_potong) ? d.id_header_boning_karkas : null,
        id_jenis_boning_karkas: [1, 2].includes(d.id_jenis_potong) ? d.id_jenis_boning_karkas : null,
        berat: parseInt(d.berat),
      })),
    };

    const response = await StokSapiService.potongSapiBiasa(payload);

    if (response.success) {
      setNotification({ type: 'success', message: response.message || 'Data potong sapi berhasil disimpan.' });
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1000);
      return;
    }

    setNotification({ type: 'error', message: response.message || 'Gagal menyimpan data potong sapi.' });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  const getHeaderOptions = (jenisPotong) => {
    if (jenisPotong === 1) return boningHeaders;
    if (jenisPotong === 2) return karkasHeaders;
    return [];
  };

  const getDetailOptions = (jenisPotong, headerId) => {
    if (!headerId) return [];
    if (jenisPotong === 1) return boningDetailsMap[headerId] || [];
    if (jenisPotong === 2) return karkasDetailsMap[headerId] || [];
    return [];
  };

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-3 text-white">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Potong Sapi Biasa</h2>
                <p className="text-sm text-slate-500">Form potong sapi untuk sapi <span className="font-semibold text-indigo-600">{cowData?.eartag || cowData?.jenis_sapi || '-'}</span></p>
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
            <Field label="Tanggal Potong" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={tglPotong}
                  onChange={(e) => setTglPotong(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                />
              </div>
            </Field>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Detail Potong</h3>
                <button
                  type="button"
                  onClick={addDetail}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Detail
                </button>
              </div>

              {details.map((detail, index) => (
                <div key={index} className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
                  {details.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDetail(index)}
                      disabled={isSubmitting}
                      className="absolute top-3 right-3 p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  <div className="space-y-4">
                    <Field label="Detail" required>
                      <SearchableSelect
                        options={JENIS_POTONG_OPTIONS}
                        value={detail.id_jenis_potong}
                        onChange={(val) => handleDetailChange(index, 'id_jenis_potong', val)}
                        placeholder="Pilih jenis potong"
                        isDisabled={isSubmitting}
                      />
                    </Field>

                    {detail.id_jenis_potong !== 3 && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={detail.id_jenis_potong === 1 ? 'Header Boning' : 'Header Karkas'} required>
                          <SearchableSelect
                            options={getHeaderOptions(detail.id_jenis_potong)}
                            value={detail.id_header_boning_karkas}
                            onChange={(val) => handleDetailChange(index, 'id_header_boning_karkas', val)}
                            placeholder={detail.id_jenis_potong === 1
                              ? (loadingBoning ? 'Memuat...' : 'Pilih header boning')
                              : (loadingKarkas ? 'Memuat...' : 'Pilih header karkas')}
                            isLoading={detail.id_jenis_potong === 1 ? loadingBoning : loadingKarkas}
                            isDisabled={isSubmitting}
                          />
                        </Field>

                        <Field label={detail.id_jenis_potong === 1 ? 'Jenis Boning' : 'Jenis Karkas'} required>
                          <SearchableSelect
                            options={getDetailOptions(detail.id_jenis_potong, detail.id_header_boning_karkas)}
                            value={detail.id_jenis_boning_karkas}
                            onChange={(val) => handleDetailChange(index, 'id_jenis_boning_karkas', val)}
                            placeholder={detail.id_header_boning_karkas
                              ? (loadingDetail[index] ? 'Memuat...' : 'Pilih jenis')
                              : 'Pilih header terlebih dahulu'}
                            isLoading={!!loadingDetail[index]}
                            isDisabled={!detail.id_header_boning_karkas || isSubmitting}
                          />
                        </Field>
                      </div>
                    )}

                    <Field label="Berat (KG)" required>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          value={detail.berat}
                          onChange={(e) => handleDetailChange(index, 'berat', e.target.value)}
                          placeholder="0"
                          min="1"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          required
                        />
                      </div>
                    </Field>
                  </div>
                </div>
              ))}
            </div>
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Potong Sapi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PotongSapiBiasaModal;
