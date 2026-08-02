import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Save,
  User,
  Package,
  X,
} from 'lucide-react';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import PemberianOvkSapiService from '../../../services/pemberianOvkSapiService';
import StokSapiService from '../../../services/stokSapiService';

const getToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatValidationMessage = (message) => {
  if (!message) return 'Terjadi kesalahan. Silakan coba lagi.';
  if (typeof message === 'string') return message;
  return Object.values(message).flat().join(', ');
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
    icon: Info,
  };

  const Icon = config.icon;

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm">
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

const AddEditPemberianOvkSapiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const encodedPid = params.pid;
  const pid = encodedPid ? decodeURIComponent(encodedPid) : null;
  const isEditMode = Boolean(pid);

  useDocumentTitle(isEditMode ? 'Edit Pemberian OVK Sapi RPH' : 'Tambah Pemberian OVK Sapi RPH');

  // Input state from route state
  const stateRecord = location.state?.record || null;
  const stateCow = location.state?.cow || null;

  // Form selections state
  const [cowOptions, setCowOptions] = useState([]);
  const [selectedCow, setSelectedCow] = useState(stateCow ? stateCow.pid : null);
  const [ovkOptions, setOvkOptions] = useState([]);
  const [selectedOvk, setSelectedOvk] = useState(null);

  // Core fields state
  const [tglPemberian, setTglPemberian] = useState(getToday);
  const [jamPemberian, setJamPemberian] = useState('08:00');
  const [namaPeternak, setNamaPeternak] = useState('');

  // Loading/Submit states
  const [isLoadingCowOptions, setIsLoadingCowOptions] = useState(false);
  const [isLoadingOvkOptions, setIsLoadingOvkOptions] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [detailInfo, setDetailInfo] = useState(stateRecord);

  const pageTitle = isEditMode ? 'Edit Pemberian OVK Sapi' : 'Tambah Pemberian OVK Sapi';
  const submitText = isEditMode ? 'Simpan Perubahan' : 'Simpan Pemberian OVK';

  // Load selected cow details using show endpoint
  useEffect(() => {
    if (isEditMode) return;
    if (!selectedCow) return;
    let active = true;

    const loadCowOptions = async () => {
      setIsLoadingCowOptions(true);
      const res = await StokSapiService.show(selectedCow);
      if (!active) return;

      if (res.success && res.data) {
        const cow = res.data;
        setCowOptions([{
          value: cow.pid,
          label: `[${cow.eartag || 'Tanpa Eartag'}] ${cow.jenis_sapi} (${cow.bobot ? Number(cow.bobot) : '-'} KG)`,
          eartag: cow.eartag,
          jenis_sapi: cow.jenis_sapi,
          bobot: cow.bobot,
          id: cow.id,
        }]);
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal memuat data sapi' });
      }
      setIsLoadingCowOptions(false);
    };

    loadCowOptions();

    return () => {
      active = false;
    };
  }, [isEditMode, selectedCow]);

  // Load OVK Product Options
  useEffect(() => {
    let active = true;

    const loadOvkOptions = async () => {
      setIsLoadingOvkOptions(true);
      const res = await PemberianOvkSapiService.getOvkOptions();
      if (!active) return;

      if (res.success && Array.isArray(res.data)) {
        setOvkOptions(res.data);
      } else {
        setNotification({ type: 'error', message: res.message || 'Gagal memuat daftar OVK' });
      }
      setIsLoadingOvkOptions(false);
    };

    loadOvkOptions();

    return () => {
      active = false;
    };
  }, []);

  // Pre-populate if stateRecord is provided (Edit Mode)
  useEffect(() => {
    if (!stateRecord) return;

    setTglPemberian(stateRecord.tgl_pemberian_ovk || getToday());
    setJamPemberian(String(stateRecord.jam_pemberian_ovk || '08:00').slice(0, 5));
    setNamaPeternak(stateRecord.nama_peternak === '-' ? '' : stateRecord.nama_peternak || '');
  }, [stateRecord]);

  // Fetch detail from server in Edit Mode if state is missing
  useEffect(() => {
    if (!isEditMode || !pid) return;
    if (stateRecord) return;

    let active = true;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      const response = await PemberianOvkSapiService.show(pid);
      if (!active) return;

      if (response.success && response.data) {
        const detail = response.data;
        setDetailInfo(detail);
        setTglPemberian(detail.tgl_pemberian_ovk || getToday());
        setJamPemberian(String(detail.jam_pemberian_ovk || '08:00').slice(0, 5));
        setNamaPeternak(detail.nama_peternak || '');
      } else {
        setNotification({ type: 'error', message: response.message || 'Gagal memuat detail data' });
      }

      setIsLoadingDetail(false);
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [isEditMode, pid, stateRecord]);

  // Pre-select OVK Option in Edit Mode once options are loaded
  useEffect(() => {
    if (!isEditMode || selectedOvk || ovkOptions.length === 0) return;

    const detailItemOvkId = stateRecord?.id_pembelian_rph_detail || detailInfo?.id_pembelian_rph_detail;
    if (!detailItemOvkId) return;

    const match = ovkOptions.find((option) => option.value === detailItemOvkId);
    if (match) {
      setSelectedOvk(match.value);
    }
  }, [detailInfo, isEditMode, ovkOptions, selectedOvk, stateRecord]);

  // Handle auto-clearing notifications
  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const selectedOvkDetail = useMemo(
    () => ovkOptions.find((option) => option.value === selectedOvk),
    [ovkOptions, selectedOvk]
  );

  const selectedCowDetail = useMemo(() => {
    if (stateCow) return stateCow;
    if (isEditMode) return detailInfo;
    return cowOptions.find((opt) => opt.value === selectedCow);
  }, [cowOptions, selectedCow, stateCow, isEditMode, detailInfo]);

  const handleBack = () => {
    navigate('/rph/pemberian-ovk-sapi');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCow) {
      setNotification({ type: 'error', message: 'Sapi wajib dipilih.' });
      return;
    }

    if (!isEditMode && !selectedOvk) {
      setNotification({ type: 'error', message: 'OVK wajib dipilih.' });
      return;
    }

    if (!tglPemberian || !jamPemberian || !namaPeternak.trim()) {
      setNotification({ type: 'error', message: 'Tanggal, jam, dan nama peternak wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: isEditMode ? 'Memperbarui data...' : 'Menyimpan data...' });

    let response;
    if (isEditMode) {
      const payload = {
        pid, // OVK administration pid
        pid_stoksapi: selectedCow, // cow pid
        id_pembelian_rph_detail: Number(selectedOvk),
        tgl_pemberian_ovk: tglPemberian,
        jam_pemberian_ovk: jamPemberian,
        nama_peternak: namaPeternak.trim(),
      };
      response = await PemberianOvkSapiService.update(payload);
    } else {
      const ovkSelection = PemberianOvkSapiService.parseOvkOptionValue(selectedOvk);
      const payload = {
        pid: selectedCow, // cow pid
        id_produk: Number(ovkSelection.id_produk),
        ...(ovkSelection.id_satuan != null ? { id_satuan: Number(ovkSelection.id_satuan) } : {}),
        ...(ovkSelection.harga != null ? { harga: Number(ovkSelection.harga) } : {}),
        tgl_pemberian_ovk: tglPemberian,
        jam_pemberian_ovk: jamPemberian,
        nama_peternak: namaPeternak.trim(),
      };
      response = await PemberianOvkSapiService.store(payload);
    }

    if (response.success) {
      const message = response.message || (isEditMode ? 'Data berhasil diperbarui' : 'Data berhasil disimpan');
      setNotification({ type: 'success', message });
      setIsSubmitting(false);
      setTimeout(() => {
        navigate('/rph/pemberian-ovk-sapi', {
          state: {
            message,
            refresh: true,
          },
        });
      }, 1000);
      return;
    }

    setNotification({ type: 'error', message: formatValidationMessage(response.message) });
    setIsSubmitting(false);
  };

  if (isLoadingDetail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-500" />
          <p className="mt-3 text-sm font-medium text-slate-500">Memuat data pemberian OVK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Kembali ke daftar pemberian OVK"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-teal-100 p-4 text-teal-700">
                  <Package className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    <Info className="h-3.5 w-3.5" />
                    Pemberian OVK RPH
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{pageTitle}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                    {isEditMode
                      ? 'Perbarui resep OVK, tanggal, jam, dan nama peternak pada catatan pemberian OVK sapi.'
                      : 'Pemberian obat, vitamin, atau konsentrat (OVK) khusus untuk sapi tertentu di RPH.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="pemberian-ovk-sapi-form"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? 'Menyimpan...' : submitText}
            </button>
          </div>
        </section>

        <form id="pemberian-ovk-sapi-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-lg font-bold text-slate-900">Data Sapi & OVK</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih sapi dan OVK yang akan diberikan, serta lengkapi data pelaksana.</p>
            </div>

            {selectedCowDetail ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Eartag Sapi</p>
                  <p className="mt-1 font-semibold text-slate-800 font-mono">{selectedCowDetail.eartag || selectedCowDetail.eartag_sapi || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Jenis Sapi</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedCowDetail.jenis_sapi || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Bobot Sapi</p>
                  <p className="mt-1 font-semibold text-slate-800">{selectedCowDetail.bobot ? `${selectedCowDetail.bobot} KG` : '-'}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {/* Select Cow Column (ReadOnly in edit mode or when cow state is pre-selected) */}
              <div className="md:col-span-2">
                {isEditMode || stateCow ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sapi Terpilih</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      [{selectedCowDetail?.eartag || selectedCowDetail?.eartag_sapi || 'Tanpa Eartag'}] {selectedCowDetail?.jenis_sapi || '-'}
                    </p>
                  </div>
                ) : (
                  <Field label="Pilih Sapi" required helperText="Silakan pilih sapi aktif di RPH yang akan diberikan OVK.">
                    <SearchableSelect
                      value={selectedCow}
                      onChange={setSelectedCow}
                      options={cowOptions}
                      placeholder={isLoadingCowOptions ? 'Memuat daftar sapi...' : 'Pilih Sapi RPH'}
                      isLoading={isLoadingCowOptions}
                      isDisabled={isLoadingCowOptions || isSubmitting}
                    />
                  </Field>
                )}
              </div>

              {/* Select OVK Product */}
              <div className="md:col-span-2">
                {isEditMode ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Produk OVK Terpilih</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedOvkDetail ? selectedOvkDetail.label : `OVK ID #${selectedOvk}`}
                    </p>
                  </div>
                ) : (
                  <Field label="Produk OVK" required helperText="OVK yang dipilih harus tersedia dalam stok RPH.">
                    <SearchableSelect
                      value={selectedOvk}
                      onChange={setSelectedOvk}
                      options={ovkOptions}
                      placeholder={isLoadingOvkOptions ? 'Memuat daftar OVK...' : 'Pilih OVK'}
                      isLoading={isLoadingOvkOptions}
                      isDisabled={isLoadingOvkOptions || isSubmitting}
                    />
                  </Field>
                )}
              </div>

              {selectedOvkDetail && !isEditMode ? (
                <div className="md:col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-cyan-900">
                  <p className="font-semibold">{selectedOvkDetail.label}</p>
                  <p className="mt-1 text-xs text-cyan-700">
                    Stok tersedia: {selectedOvkDetail.stok ?? '-'} {selectedOvkDetail.satuan || ''} | Harga satuan: {selectedOvkDetail.harga ? `Rp ${Number(selectedOvkDetail.harga).toLocaleString('id-ID')}` : '-'}
                  </p>
                </div>
              ) : null}

              <Field label="Tanggal Pemberian" required>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={tglPemberian}
                    onChange={(event) => setTglPemberian(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />
                </div>
              </Field>

              <Field label="Jam Pemberian" required>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={jamPemberian}
                    onChange={(event) => setJamPemberian(event.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  />
                </div>
              </Field>

              <div className="md:col-span-2">
                <Field label="Nama Peternak" required helperText="Maksimal 150 karakter.">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={namaPeternak}
                      onChange={(event) => setNamaPeternak(event.target.value)}
                      disabled={isSubmitting}
                      maxLength={150}
                      placeholder="Masukkan nama peternak"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>
        </form>
      </div>

      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
};

export default AddEditPemberianOvkSapiPage;
