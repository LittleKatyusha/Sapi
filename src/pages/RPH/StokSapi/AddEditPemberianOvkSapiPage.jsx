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
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      {required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
    {children}
    {helperText ? <p className="text-[11px] text-slate-400">{helperText}</p> : null}
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
  const [jumlah, setJumlah] = useState(1);

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
    setJumlah(Number(stateRecord.jumlah) > 0 ? Number(stateRecord.jumlah) : 1);
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
        setJumlah(Number(detail.jumlah) > 0 ? Number(detail.jumlah) : 1);
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

  const maxStok = useMemo(() => {
    const stok = Number(selectedOvkDetail?.stok);
    return Number.isFinite(stok) && stok > 0 ? stok : 0;
  }, [selectedOvkDetail]);

  // Reset qty when product changes (create mode)
  useEffect(() => {
    if (isEditMode) return;
    setJumlah(1);
  }, [selectedOvk, isEditMode]);

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

    const qty = Number(jumlah);
    if (!isEditMode) {
      if (!Number.isFinite(qty) || qty < 1) {
        setNotification({ type: 'error', message: 'Jumlah (qty) minimal 1.' });
        return;
      }
      if (maxStok > 0 && qty > maxStok) {
        setNotification({ type: 'error', message: `Jumlah melebihi stok tersedia (${maxStok}).` });
        return;
      }
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
        jumlah: qty,
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
          <p className="mt-2 text-sm font-medium text-slate-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  const estimasiTotal = selectedOvkDetail && jumlah > 0 && selectedOvkDetail.harga
    ? Number(selectedOvkDetail.harga) * Number(jumlah)
    : null;

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {/* === Compact Header === */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">{pageTitle}</h1>
                <p className="text-xs text-slate-500 truncate hidden sm:block">
                  {isEditMode ? 'Perbarui catatan pemberian OVK sapi' : 'Catat pemberian obat/vitamin/konsentrat untuk sapi RPH'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            form="pemberian-ovk-sapi-form"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSubmitting ? 'Menyimpan...' : submitText}</span>
            <span className="sm:hidden">{isSubmitting ? '...' : 'Simpan'}</span>
          </button>
        </div>
      </header>

      {/* === Main Content — 2 column, fills viewport === */}
      <form id="pemberian-ovk-sapi-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden">
        <div className="h-full w-full mx-auto px-4 sm:px-6 py-3">
          <div className="grid h-full gap-4 lg:grid-cols-[1fr_420px]">

            {/* === Left Column — Selections === */}
            <div className="flex flex-col gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
              {/* Cow info card */}
              {selectedCowDetail ? (
                <div className="grid grid-cols-3 gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm shrink-0">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Eartag</p>
                    <p className="mt-0.5 font-semibold text-slate-800 font-mono text-xs truncate">{selectedCowDetail.eartag || selectedCowDetail.eartag_sapi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Jenis</p>
                    <p className="mt-0.5 font-semibold text-slate-800 truncate">{selectedCowDetail.jenis_sapi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Bobot</p>
                    <p className="mt-0.5 font-semibold text-slate-800">{selectedCowDetail.bobot ? `${selectedCowDetail.bobot} KG` : '-'}</p>
                  </div>
                </div>
              ) : null}

              {/* Selections card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 flex-1 min-h-0 lg:overflow-hidden">
                {/* Pilih Sapi */}
                {isEditMode || stateCow ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sapi Terpilih</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                      [{selectedCowDetail?.eartag || selectedCowDetail?.eartag_sapi || 'Tanpa Eartag'}] {selectedCowDetail?.jenis_sapi || '-'}
                    </p>
                  </div>
                ) : (
                  <Field label="Pilih Sapi" required>
                    <SearchableSelect
                      value={selectedCow}
                      onChange={setSelectedCow}
                      options={cowOptions}
                      placeholder={isLoadingCowOptions ? 'Memuat sapi...' : 'Pilih Sapi RPH'}
                      isLoading={isLoadingCowOptions}
                      isDisabled={isLoadingCowOptions || isSubmitting}
                    />
                  </Field>
                )}

                {/* Pilih OVK */}
                {isEditMode ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Produk OVK</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">
                      {selectedOvkDetail ? selectedOvkDetail.label : `OVK ID #${selectedOvk}`}
                    </p>
                  </div>
                ) : (
                  <Field label="Produk OVK" required>
                    <SearchableSelect
                      value={selectedOvk}
                      onChange={setSelectedOvk}
                      options={ovkOptions}
                      placeholder={isLoadingOvkOptions ? 'Memuat OVK...' : 'Pilih OVK'}
                      isLoading={isLoadingOvkOptions}
                      isDisabled={isLoadingOvkOptions || isSubmitting}
                    />
                  </Field>
                )}

                {/* Qty */}
                {!isEditMode ? (
                  <Field
                    label="Jumlah (Qty)"
                    required
                    helperText={
                      selectedOvkDetail
                        ? `Maks ${maxStok || 0} ${selectedOvkDetail.satuan || ''}`
                        : 'Pilih OVK dulu'
                    }
                  >
                    <input
                      type="number"
                      min={1}
                      max={maxStok > 0 ? maxStok : undefined}
                      step={1}
                      value={jumlah}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next === '') { setJumlah(''); return; }
                        const num = Math.floor(Number(next));
                        if (!Number.isFinite(num)) return;
                        setJumlah(num < 1 ? 1 : num);
                      }}
                      disabled={isSubmitting || !selectedOvk}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </Field>
                ) : (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jumlah (Qty)</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{jumlah || 1}</p>
                  </div>
                )}

                {/* Tanggal & Jam — inline 2 col */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tanggal" required>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={tglPemberian}
                        onChange={(event) => setTglPemberian(event.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        required
                      />
                    </div>
                  </Field>
                  <Field label="Jam" required>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="time"
                        value={jamPemberian}
                        onChange={(event) => setJamPemberian(event.target.value)}
                        disabled={isSubmitting}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        required
                      />
                    </div>
                  </Field>
                </div>

                {/* Nama Peternak */}
                <Field label="Nama Peternak" required>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={namaPeternak}
                      onChange={(event) => setNamaPeternak(event.target.value)}
                      disabled={isSubmitting}
                      maxLength={150}
                      placeholder="Masukkan nama peternak"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      required
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* === Right Column — Summary (desktop only) === */}
            <aside className="hidden lg:flex flex-col rounded-xl border border-slate-200 bg-white p-4 min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 shrink-0">
                <Info className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Ringkasan</h2>
              </div>

              <div className="mt-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
                {/* Sapi */}
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sapi</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                    {selectedCowDetail
                      ? `[${selectedCowDetail.eartag || selectedCowDetail.eartag_sapi || '-'}] ${selectedCowDetail.jenis_sapi || '-'}`
                      : 'Belum dipilih'}
                  </p>
                  {selectedCowDetail?.bobot ? (
                    <p className="text-xs text-slate-500 mt-0.5">Bobot: {selectedCowDetail.bobot} KG</p>
                  ) : null}
                </div>

                {/* OVK */}
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Produk OVK</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
                    {selectedOvkDetail ? selectedOvkDetail.label : (isEditMode ? `OVK ID #${selectedOvk}` : 'Belum dipilih')}
                  </p>
                  {selectedOvkDetail ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Stok: {selectedOvkDetail.stok ?? '-'} {selectedOvkDetail.satuan || ''}
                      </span>
                      {selectedOvkDetail.harga ? (
                        <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          @ Rp {Number(selectedOvkDetail.harga).toLocaleString('id-ID')}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Qty + Estimasi */}
                {!isEditMode ? (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-500">Jumlah</span>
                      <span className="text-sm font-bold text-slate-900">{jumlah || 0} {selectedOvkDetail?.satuan || ''}</span>
                    </div>
                    {estimasiTotal ? (
                      <div className="mt-2 flex items-baseline justify-between border-t border-emerald-100 pt-2">
                        <span className="text-xs font-medium text-slate-500">Estimasi Total</span>
                        <span className="text-base font-bold text-emerald-700">Rp {estimasiTotal.toLocaleString('id-ID')}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Pelaksana */}
                <div className="rounded-lg bg-slate-50 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pelaksanaan</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{tglPemberian || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{jamPemberian || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{namaPeternak || 'Belum diisi'}</span>
                  </div>
                </div>
              </div>

              {/* Footer hint */}
              <p className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed shrink-0">
                Pastikan data sudah benar sebelum menyimpan. Stok OVK akan terpotong otomatis setelah disimpan.
              </p>
            </aside>
          </div>
        </div>
      </form>

      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
};

export default AddEditPemberianOvkSapiPage;
