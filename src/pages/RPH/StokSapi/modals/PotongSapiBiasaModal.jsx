import React, { useState, useEffect, useCallback } from 'react';
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
  id_item_potong: null,
  berat: '',
});

const PotongSapiBiasaModal = ({ isOpen, onClose, onSuccess, cowData }) => {
  const [tglPotong, setTglPotong] = useState(getToday());
  const [details, setDetails] = useState([createEmptyDetail()]);
  const [itemPotongOptions, setItemPotongOptions] = useState([]);
  const [loadingItemPotong, setLoadingItemPotong] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchItemPotongOptions = useCallback(async () => {
    setLoadingItemPotong(true);
    try {
      const response = await StokSapiService.getItemPotongOptions();
      if (response.success && Array.isArray(response.data)) {
        setItemPotongOptions(response.data.map(item => ({
          value: item.id,
          label: item.name || `Item Potong #${item.id}`,
          id_jenis_potong: Number(item.id_jenis_potong),
        })));
      }
    } catch (err) {
      console.error('Error fetching item potong options:', err);
    }
    setLoadingItemPotong(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchItemPotongOptions();
    }
  }, [isOpen, fetchItemPotongOptions]);

  useEffect(() => {
    if (!isOpen) return;
    setTglPotong(getToday());
    setDetails([createEmptyDetail()]);
    setNotification(null);
  }, [isOpen]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const getJenisLabel = (value) => JENIS_POTONG_OPTIONS.find(option => option.value === value)?.label || '-';

  const getItemOptions = (jenisPotong, currentIndex) => {
    const selectedIds = details
      .map((detail, index) => (index !== currentIndex ? detail.id_item_potong : null))
      .filter(Boolean);

    const filtered = itemPotongOptions.filter(option =>
      option.id_jenis_potong === Number(jenisPotong) && !selectedIds.includes(option.value),
    );

    return filtered.map(option => ({
      ...option,
      label: `${getJenisLabel(option.id_jenis_potong)} - ${option.label}`,
    }));
  };

  const handleDetailChange = (index, field, value) => {
    setDetails(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'id_jenis_potong') {
        next[index].id_item_potong = null;
      }

      return next;
    });
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

    for (let i = 0; i < details.length; i += 1) {
      const detail = details[i];
      const jenisPotong = Number(detail.id_jenis_potong);

      if (![1, 2, 3].includes(jenisPotong)) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Jenis potong tidak valid.` });
        return;
      }

      if (!detail.id_item_potong) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Item potong wajib dipilih.` });
        return;
      }

      const selectedItem = itemPotongOptions.find(item => item.value === detail.id_item_potong);
      if (!selectedItem) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Item potong tidak ditemukan.` });
        return;
      }

      if (selectedItem.id_jenis_potong !== jenisPotong) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Item potong tidak sesuai dengan jenis potong.` });
        return;
      }

      if (!detail.berat || Number.isNaN(Number(detail.berat)) || Number(detail.berat) < 1) {
        setNotification({ type: 'error', message: `Detail #${i + 1}: Berat wajib diisi dengan angka minimal 1.` });
        return;
      }
    }

    const duplicateItemIndex = details.findIndex((detail, index) => (
      detail.id_item_potong
      && details.findIndex((row, rowIndex) => rowIndex !== index && row.id_item_potong === detail.id_item_potong) !== -1
    ));

    if (duplicateItemIndex !== -1) {
      const duplicateLabel = itemPotongOptions.find(item => item.value === details[duplicateItemIndex].id_item_potong)?.label || 'item potong';
      setNotification({
        type: 'error',
        message: `Detail #${duplicateItemIndex + 1}: ${duplicateLabel} sudah dipilih pada detail lain.`,
      });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: 'Menyimpan data potong sapi...' });

    const payload = {
      pid: cowData?.pid,
      tgl_potong: tglPotong,
      detail: details.map(detail => ({
        id_jenis_potong: Number(detail.id_jenis_potong),
        id_item_potong: Number(detail.id_item_potong),
        berat: Number(detail.berat),
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

  const previewDetails = details.map((detail, index) => {
    const jenisLabel = getJenisLabel(detail.id_jenis_potong);
    const selectedItem = itemPotongOptions.find(item => item.value === detail.id_item_potong);

    return {
      key: `${index}-${detail.id_item_potong || 'empty'}`,
      no: index + 1,
      jenisLabel,
      itemLabel: selectedItem ? `${jenisLabel} - ${selectedItem.label}` : '-',
      berat: detail.berat || '-',
    };
  });

  const totalBerat = details.reduce((sum, detail) => sum + (Number(detail.berat) || 0), 0);
  const totalDetail = details.length;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-3 text-white">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Potong Sapi Biasa</h2>
                <p className="text-sm text-slate-500">
                  Form potong sapi untuk sapi <span className="font-semibold text-indigo-600">{cowData?.eartag || cowData?.eartag_supplier || cowData?.jenis_sapi || '-'}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-5 lg:border-r lg:border-slate-100">
              <div className="space-y-5 pr-1">
                <Field label="Tanggal Potong" required>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={tglPotong}
                      onChange={(e) => setTglPotong(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700">Detail Potong</h3>
                      <p className="text-xs text-slate-400">Tambah beberapa detail dalam satu pemotongan.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addDetail}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Detail
                    </button>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {details.map((detail, index) => (
                      <div key={index} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            disabled={isSubmitting}
                            className="absolute right-3 top-3 rounded-lg p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {index + 1}
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail {index + 1}</span>
                        </div>

                        <div className="grid gap-3">
                          <Field label="Jenis Potong" required>
                            <SearchableSelect
                              options={JENIS_POTONG_OPTIONS}
                              value={detail.id_jenis_potong}
                              onChange={(val) => handleDetailChange(index, 'id_jenis_potong', val)}
                              placeholder="Pilih jenis potong"
                              isDisabled={isSubmitting}
                            />
                          </Field>

                          <Field label="Item Potong" required helperText={`Jenis: ${getJenisLabel(detail.id_jenis_potong)}`}>
                            <SearchableSelect
                              options={getItemOptions(detail.id_jenis_potong, index)}
                              value={detail.id_item_potong}
                              onChange={(val) => handleDetailChange(index, 'id_item_potong', val)}
                              placeholder={loadingItemPotong ? 'Memuat item potong...' : 'Pilih item potong'}
                              isLoading={loadingItemPotong}
                              isDisabled={isSubmitting || loadingItemPotong}
                            />
                          </Field>

                          <Field label="Berat (KG)" required>
                            <div className="relative">
                              <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                type="number"
                                value={detail.berat}
                                onChange={(e) => handleDetailChange(index, 'berat', e.target.value)}
                                placeholder="0"
                                min="1"
                                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                required
                              />
                            </div>
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <aside className="min-h-0 overflow-y-auto bg-slate-50/80 p-5">
              <div className="sticky top-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Preview sebelum simpan</p>
                    <h3 className="text-lg font-bold text-slate-900">Ringkasan Pemotongan</h3>
                  </div>
                  <div className="rounded-xl bg-indigo-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold text-indigo-500">Total Berat</p>
                    <p className="text-sm font-bold text-indigo-700">{totalBerat} kg</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{tglPotong || '-'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Detail</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{totalDetail}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Daftar Detail</p>
                    <span className="text-xs text-slate-400">Live preview</span>
                  </div>

                  <div className="space-y-3">
                    {previewDetails.map((item, index) => (
                      <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">Detail {item.no}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{item.itemLabel}</p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            details[index]?.id_jenis_potong === 1 ? 'bg-blue-100 text-blue-800' :
                            details[index]?.id_jenis_potong === 2 ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.jenisLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-slate-500">Berat</span>
                          <span className="font-semibold text-slate-900">{item.berat} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                    Semua perubahan di atas akan dikirim saat tombol simpan ditekan. Preview ini membantu cek item, jenis potong, dan berat tanpa harus scroll bolak-balik.
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white p-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
