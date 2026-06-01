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
  Wheat,
  X,
} from 'lucide-react';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import PemberianPakanSapiService from '../../../services/pemberianPakanSapiService';

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

const AddEditPemberianPakanSapiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const encodedPid = params.pid;
  const pid = encodedPid ? decodeURIComponent(encodedPid) : null;
  const isEditMode = Boolean(pid);

  useDocumentTitle(isEditMode ? 'Edit Pemberian Pakan Sapi RPH' : 'Tambah Pemberian Pakan Sapi RPH');

  const stateRecord = location.state?.record || null;

  const [resepOptions, setResepOptions] = useState([]);
  const [selectedResep, setSelectedResep] = useState(null);
  const [tglPemberian, setTglPemberian] = useState(getToday);
  const [jamPemberian, setJamPemberian] = useState('08:00');
  const [namaPeternak, setNamaPeternak] = useState('');
  const [detailInfo, setDetailInfo] = useState(stateRecord);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const pageTitle = isEditMode ? 'Edit Pemberian Pakan Sapi' : 'Tambah Pemberian Pakan Sapi';
  const submitText = isEditMode ? 'Simpan Perubahan' : 'Simpan Pemberian Pakan';

  useEffect(() => {
    let active = true;

    const loadResepOptions = async () => {
      setIsLoadingOptions(true);
      const response = await PemberianPakanSapiService.getResepPakanOptions();
      if (!active) return;

      setResepOptions(response.data || []);
      if (!response.success) {
        setNotification({ type: 'error', message: response.message || 'Gagal memuat resep pakan' });
      }
      setIsLoadingOptions(false);
    };

    loadResepOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stateRecord) return;

    setTglPemberian(stateRecord.tgl_pemberian_pakan || getToday());
    setJamPemberian(String(stateRecord.jam_pemberian_pakan || '08:00').slice(0, 5));
    setNamaPeternak(stateRecord.nama_peternak === '-' ? '' : stateRecord.nama_peternak || '');
  }, [stateRecord]);

  useEffect(() => {
    if (!isEditMode || !pid) return;
    if (stateRecord) return;

    let active = true;

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      const response = await PemberianPakanSapiService.show(pid);
      if (!active) return;

      if (response.success && response.data) {
        const detail = response.data;
        setDetailInfo(detail);
        setTglPemberian(detail.tgl_pemberian_pakan || getToday());
        setJamPemberian(String(detail.jam_pemberian_pakan || '08:00').slice(0, 5));
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

  useEffect(() => {
    if (!isEditMode || selectedResep || resepOptions.length === 0) return;

    const recipeName = stateRecord?.nama_resep_pakan || detailInfo?.nama_resep_pakan || detailInfo?.name;
    if (!recipeName) return;

    const match = resepOptions.find(
      (option) => String(option.label || '').toLowerCase() === String(recipeName).toLowerCase()
    );

    if (match) setSelectedResep(match.value);
  }, [detailInfo, isEditMode, resepOptions, selectedResep, stateRecord]);

  useEffect(() => {
    if (!notification || notification.type === 'info') return undefined;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const selectedResepDetail = useMemo(
    () => resepOptions.find((option) => option.value === selectedResep),
    [resepOptions, selectedResep]
  );

  const handleBack = () => {
    navigate('/rph/pemberian-pakan-sapi');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedResep) {
      setNotification({ type: 'error', message: 'Resep pakan wajib dipilih.' });
      return;
    }

    if (!tglPemberian || !jamPemberian || !namaPeternak.trim()) {
      setNotification({ type: 'error', message: 'Tanggal, jam, dan nama peternak wajib diisi.' });
      return;
    }

    const payload = {
      ...(isEditMode ? { pid } : {}),
      ...(isEditMode ? { pid_resep_pakan: selectedResep } : { pid: selectedResep }),
      tgl_pemberian_pakan: tglPemberian,
      jam_pemberian_pakan: jamPemberian,
      nama_peternak: namaPeternak.trim(),
    };

    setIsSubmitting(true);
    setNotification({ type: 'info', message: isEditMode ? 'Memperbarui data...' : 'Menyimpan data...' });

    const response = isEditMode
      ? await PemberianPakanSapiService.update(payload)
      : await PemberianPakanSapiService.store(payload);

    if (response.success) {
      const message = response.message || (isEditMode ? 'Data berhasil diperbarui' : 'Data berhasil disimpan');
      setNotification({ type: 'success', message });
      setIsSubmitting(false);
      setTimeout(() => {
        navigate('/rph/pemberian-pakan-sapi', {
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
          <p className="mt-3 text-sm font-medium text-slate-500">Memuat data pemberian pakan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.25)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500" />
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Kembali ke daftar pemberian pakan"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="rounded-3xl bg-emerald-100 p-4 text-emerald-700">
                  <Wheat className="h-7 w-7" />
                </div>
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Info className="h-3.5 w-3.5" />
                    Pemberian Pakan RPH
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{pageTitle}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                    {isEditMode
                      ? 'Perbarui resep pakan, tanggal, jam, dan nama peternak pada catatan pemberian pakan sapi.'
                      : 'Catatan baru akan dibuat untuk seluruh stok sapi aktif pada RPH sesuai tanggal pemberian pakan.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="pemberian-pakan-sapi-form"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? 'Menyimpan...' : submitText}
            </button>
          </div>
        </section>

        <form id="pemberian-pakan-sapi-form" onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-lg font-bold text-slate-900">Data Pemberian Pakan</h2>
              <p className="mt-1 text-sm text-slate-500">Lengkapi data utama sesuai aktivitas pemberian pakan sapi di RPH.</p>
            </div>

            {isEditMode && detailInfo ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-slate-600 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Nama Sapi</p>
                  <p className="mt-1 font-semibold text-slate-800">{detailInfo.nama_sapi || detailInfo.nama_klasifikasi_hewan || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Eartag</p>
                  <p className="mt-1 font-mono font-semibold text-slate-800">{detailInfo.eartag_sapi || detailInfo.eartag_supplier || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resep Saat Ini</p>
                  <p className="mt-1 font-semibold text-slate-800">{detailInfo.nama_resep_pakan || '-'}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Resep Pakan"
                  required
                  helperText={isEditMode ? 'Pilih resep pakan untuk memperbarui data. Jika opsi tidak otomatis terpilih, pilih ulang resep yang sesuai.' : 'Resep pakan akan digunakan untuk seluruh stok sapi aktif.'}
                >
                  <SearchableSelect
                    value={selectedResep}
                    onChange={setSelectedResep}
                    options={resepOptions}
                    placeholder={isLoadingOptions ? 'Memuat resep pakan...' : 'Pilih resep pakan'}
                    isLoading={isLoadingOptions}
                    isDisabled={isLoadingOptions || isSubmitting}
                  />
                </Field>
              </div>

              {selectedResepDetail ? (
                <div className="md:col-span-2 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-cyan-900">
                  <p className="font-semibold">{selectedResepDetail.label}</p>
                  <p className="mt-1 text-xs text-cyan-700">
                    Total jumlah: {selectedResepDetail.total_jumlah ?? '-'} | Harga total: {selectedResepDetail.harga_total ? `Rp ${Number(selectedResepDetail.harga_total).toLocaleString('id-ID')}` : '-'}
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

export default AddEditPemberianPakanSapiPage;
