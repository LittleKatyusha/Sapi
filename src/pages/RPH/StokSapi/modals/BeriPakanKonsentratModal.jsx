import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2, Save, Calendar, Wheat, Search, CheckSquare, Square, Calculator, Beef, ChevronDown, Scale, AlertTriangle } from 'lucide-react';
import pemberianPakanKonsentratService from '../../../../services/pemberianPakanKonsentratService';
import StokSapiService from '../../../../services/stokSapiService';
import StokDokaService from '../../../../services/stokDokaService';

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

const BeriPakanKonsentratModal = ({ isOpen, onClose, onSuccess, animalType = 'sapi' }) => {
  const isDoka = animalType === 'doka';
  const animalLabel = isDoka ? 'DOKA' : 'sapi';
  const animalLabelCap = isDoka ? 'DOKA' : 'Sapi';
  const [tanggal, setTanggal] = useState(getToday());
  const [resepKode, setResepKode] = useState('');
  const [totalKg, setTotalKg] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [selectedPids, setSelectedPids] = useState(new Set());
  const [search, setSearch] = useState('');
  const [kandangFilter, setKandangFilter] = useState('');

  const [sapiList, setSapiList] = useState([]);
  const [loadingSapi, setLoadingSapi] = useState(false);

  const [resepOptions, setResepOptions] = useState([]);
  const [loadingResep, setLoadingResep] = useState(false);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const idRph = getRphId();

  // Fetch semua hewan tersedia di RPH (via stok-options endpoint)
  const fetchSapiList = useCallback(async (tgl) => {
    setLoadingSapi(true);
    const res = isDoka
      ? await StokDokaService.getStokDokaOptions(tgl || getToday())
      : await StokSapiService.getStokSapiOptions(tgl || getToday());
    setLoadingSapi(false);
    if (res.success && res.data?.rows) {
      setSapiList(res.data.rows.map((r) => ({
        pid: r.pid,
        eartag: r.eartag,
        eartag_supplier: r.eartag_supplier,
        code_eartag: r.code_eartag,
        jenis_sapi: r.nama_klasifikasi,
        id_kandang: r.id_kandang,
        kandang_kode: r.kode_kandang,
        kandang_nama: r.nama_kandang,
        sudah_diberi_pakan: r.sudah_diberi_pakan,
        nama_resep_terpakai: r.nama_resep_terpakai,
      })));
    } else {
      setSapiList([]);
    }
  }, [isDoka]);

  // Default: semua sapi tersedia (yang belum diberi pakan) tercentang saat modal dibuka & data sudah dimuat
  useEffect(() => {
    if (isOpen && sapiList.length > 0) {
      const availablePids = new Set(
        sapiList.filter((s) => allowMultiple || !s.sudah_diberi_pakan).map((s) => s.pid).filter(Boolean)
      );
      setSelectedPids(availablePids);
    } else if (isOpen) {
      setSelectedPids(new Set());
    }
  }, [isOpen, sapiList, allowMultiple]);

  // Fetch stok resep
  const fetchResep = useCallback(async () => {
    if (!idRph) return;
    setLoadingResep(true);
    const res = await pemberianPakanKonsentratService.listStokResep(parseInt(idRph));
    setLoadingResep(false);
    if (res.success) {
      setResepOptions(res.data?.resep || []);
    } else {
      setResepOptions([]);
      setNotification({ type: 'error', message: res.message || 'Gagal memuat stok konsentrat' });
    }
  }, [idRph]);

  // Reset form & fetch data saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTanggal(getToday());
      setResepKode('');
      setTotalKg('');
      setKeterangan('');
      setAllowMultiple(false);
      setPreview(null);
      setNotification(null);
      setSearch('');
      setKandangFilter('');
      fetchSapiList(getToday());
      fetchResep();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Re-fetch sapi list saat tanggal berubah (modal terbuka)
  useEffect(() => {
    if (isOpen && tanggal) {
      fetchSapiList(tanggal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal]);

  const kandangOptions = useMemo(() => {
    const map = new Map();
    sapiList.forEach((s) => {
      if (s.id_kandang && !map.has(s.id_kandang)) {
        map.set(s.id_kandang, { id: s.id_kandang, kode: s.kandang_kode, nama: s.kandang_nama });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
  }, [sapiList]);

  const filteredSapi = useMemo(() => {
    let list = sapiList;
    if (kandangFilter) {
      list = list.filter((s) => String(s.id_kandang) === String(kandangFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        String(s.eartag || '').toLowerCase().includes(q) ||
        String(s.eartag_supplier || '').toLowerCase().includes(q) ||
        String(s.jenis_sapi || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [sapiList, search, kandangFilter]);

  const selectedCount = selectedPids.size;
  const selectedResep = useMemo(() => resepOptions.find((r) => r.resep_kode === resepKode), [resepOptions, resepKode]);

  const toggleAll = () => {
    const filteredPids = filteredSapi
      .filter((s) => allowMultiple || !s.sudah_diberi_pakan)
      .map((s) => s.pid)
      .filter(Boolean);
    const allFilteredSelected = filteredPids.every((p) => selectedPids.has(p));
    if (allFilteredSelected) {
      // Uncheck only filtered, keep others
      const next = new Set(selectedPids);
      filteredPids.forEach((p) => next.delete(p));
      setSelectedPids(next);
    } else {
      // Check all filtered (yang belum diberi pakan, kecuali allowMultiple on)
      const next = new Set(selectedPids);
      filteredPids.forEach((p) => next.add(p));
      setSelectedPids(next);
    }
  };

  const toggleOne = (pid) => {
    setSelectedPids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!idRph) {
      setNotification({ type: 'error', message: 'ID RPH tidak ditemukan di session user.' });
      return;
    }
    if (!resepKode) {
      setNotification({ type: 'error', message: 'Pilih resep konsentrat dulu.' });
      return;
    }
    if (selectedCount === 0) {
      setNotification({ type: 'error', message: `Pilih minimal 1 ${animalLabel}.` });
      return;
    }
    const kg = parseFloat(totalKg);
    if (!kg || kg <= 0) {
      setNotification({ type: 'error', message: 'Total kg harus > 0.' });
      return;
    }

    setPreviewLoading(true);
    setNotification({ type: 'info', message: 'Menghitung alokasi FIFO per resep...' });
    const res = await pemberianPakanKonsentratService.previewBulkSelected({
      id_rph: parseInt(idRph),
      resep_kode: resepKode,
      total_kg: kg,
      sapi_pids: Array.from(selectedPids),
    });
    setPreviewLoading(false);
    if (res.success) {
      setPreview(res.data);
      setNotification(null);
    } else {
      setPreview(null);
      setNotification({ type: 'error', message: res.message || 'Gagal preview.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tanggal) {
      setNotification({ type: 'error', message: 'Tanggal wajib diisi.' });
      return;
    }
    if (!resepKode) {
      setNotification({ type: 'error', message: 'Pilih resep konsentrat.' });
      return;
    }
    if (selectedCount === 0) {
      setNotification({ type: 'error', message: `Pilih minimal 1 ${animalLabel}.` });
      return;
    }
    const kg = parseFloat(totalKg);
    if (!kg || kg <= 0) {
      setNotification({ type: 'error', message: 'Total kg harus > 0.' });
      return;
    }
    if (!idRph) {
      setNotification({ type: 'error', message: 'ID RPH tidak ditemukan.' });
      return;
    }

    setIsSubmitting(true);
    setNotification({ type: 'info', message: `Menyimpan pemberian pakan untuk ${selectedCount} ${animalLabel}...` });

    const payload = {
      id_rph: parseInt(idRph),
      resep_kode: resepKode,
      tanggal,
      total_kg: kg,
      sapi_pids: Array.from(selectedPids),
      keterangan: keterangan.trim() || null,
      allow_multiple: allowMultiple,
    };

    const res = await pemberianPakanKonsentratService.storeBulkSelected(payload);
    if (res.success) {
      setNotification({ type: 'success', message: res.message || 'Pemberian pakan berhasil disimpan.' });
      setIsSubmitting(false);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1200);
      return;
    }

    setNotification({ type: 'error', message: res.message || 'Gagal menyimpan.' });
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTanggal(getToday());
    setResepKode('');
    setTotalKg('');
    setKeterangan('');
    setAllowMultiple(false);
    setPreview(null);
    setNotification(null);
    setSearch('');
    setKandangFilter('');
    onClose();
  };

  const previewDetail = useMemo(() => preview?.detail || [], [preview]);

  if (!isOpen) return null;

  return (
    <>
      {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl transform transition-all">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />

          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3 text-white">
                <Wheat className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Beri Pakan Konsentrat {animalLabelCap}</h2>
                <p className="text-sm text-slate-500">FIFO per resep · alokasi kg dibagi rata ke {animalLabel} terpilih</p>
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

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-140px)]">
            <div className="p-5 space-y-4">
              {/* Tanggal + Resep + Total Pakan — 1 baris */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <Field label="Resep Konsentrat" required helperText={loadingResep ? 'Memuat stok...' : (selectedResep ? `Tersedia: ${formatNumber(selectedResep.total_kg)} kg` : 'Pilih resep')}>
                  <div className="relative">
                    <Wheat className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                    <select
                      value={resepKode}
                      onChange={(e) => {
                        setResepKode(e.target.value);
                        setPreview(null);
                      }}
                      disabled={isSubmitting || loadingResep}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                    >
                      <option value="">{loadingResep ? 'Memuat...' : '-- Pilih Resep --'}</option>
                      {resepOptions.map((r) => (
                        <option key={r.resep_kode} value={r.resep_kode}>
                          {r.resep_name} ({r.resep_kode}) — {formatNumber(r.total_kg)} kg
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>

                <Field label="Total Pakan (kg)" required helperText={selectedCount > 0 ? `${formatNumber(parseFloat(totalKg || 0) / selectedCount)} kg/ekor · ${selectedCount} ${animalLabel}` : `Pilih ${animalLabel} dulu`}>
                  <div className="relative">
                    <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                    />
                  </div>
                </Field>
              </div>

              {/* Toggle boleh beri pakan 2x di tanggal sama */}
              <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${allowMultiple ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'}`}>
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => {
                    setAllowMultiple(e.target.checked);
                    setPreview(null);
                  }}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Izinkan beri pakan lebih dari 1x di tanggal yang sama
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Default: tiap {animalLabel} hanya boleh dikasih pakan 1x per hari. Centang jika perlu memberi pakan tambahan (mis. salah input / pakan kedua) — {animalLabel} yang sudah diberi pakan akan tetap bisa dipilih.
                  </p>
                </div>
              </label>

              {/* Notice ketika allowMultiple aktif & ada sapi terpilih yang sudah diberi pakan */}
              {allowMultiple && selectedCount > 0 && (() => {
                const fedSelected = filteredSapi.filter((s) => s.sudah_diberi_pakan && selectedPids.has(s.pid));
                if (fedSelected.length === 0) return null;
                return (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800">Perhatian — pemberian pakan ganda</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {fedSelected.length} {animalLabel} yang Anda pilih sudah diberi pakan di tanggal <strong>{tanggal}</strong>. Pemberian tambahan akan menambah biaya & sesi pakan untuk {animalLabel}-{animalLabel} tersebut. Pastikan ini memang disengaja.
                      </p>
                    </div>
                  </div>
                );
              })()}

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

              {/* Checklist Sapi */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Beef className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-slate-800">Pilih {animalLabelCap}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {selectedCount}/{sapiList.length} terpilih
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAll}
                    disabled={isSubmitting || filteredSapi.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                  >
                    {filteredSapi.length > 0 && filteredSapi.every((s) => selectedPids.has(s.pid)) ? (
                      <Square className="h-3.5 w-3.5" />
                    ) : (
                      <CheckSquare className="h-3.5 w-3.5" />
                    )}
                    {filteredSapi.length > 0 && filteredSapi.every((s) => selectedPids.has(s.pid)) ? 'Kosongkan Tampilan' : 'Centang Tampilan'}
                  </button>
                </div>

                <div className="px-4 py-2 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="relative sm:col-span-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Cari eartag / eartag supplier / jenis ${animalLabel}...`}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                    />
                  </div>
                  <select
                    value={kandangFilter}
                    onChange={(e) => setKandangFilter(e.target.value)}
                    disabled={isSubmitting || kandangOptions.length === 0}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
                  >
                    <option value="">Semua Kandang</option>
                    {kandangOptions.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama || k.kode || `Kandang #${k.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {loadingSapi ? (
                    <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat daftar {animalLabel}...
                    </div>
                  ) : filteredSapi.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                      {sapiList.length === 0 ? `Tidak ada ${animalLabel} tersedia` : 'Tidak ada hasil pencarian/filter'}
                    </div>
                  ) : (
                    filteredSapi.map((s) => {
                      const checked = selectedPids.has(s.pid);
                      const isFed = !!s.sudah_diberi_pakan;
                      const disabled = isSubmitting || (isFed && !allowMultiple);
                      return (
                        <label
                          key={s.pid}
                          className={`flex items-center gap-3 px-4 py-2.5 transition ${disabled ? 'bg-rose-50/40 cursor-not-allowed' : (isFed ? 'bg-amber-50/40 cursor-pointer' : (checked ? 'bg-amber-50/60 cursor-pointer' : 'bg-white hover:bg-slate-50 cursor-pointer'))}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(s.pid)}
                            disabled={disabled}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 disabled:opacity-40"
                          />
                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 items-center">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{s.eartag || 'T/N'}</p>
                              <p className="text-xs text-slate-400 truncate">Supplier: {s.eartag_supplier || '-'}</p>
                            </div>
                            <div className="min-w-0 text-sm text-slate-700 truncate hidden sm:block">
                              {s.jenis_sapi || '-'}
                            </div>
                            <div className="min-w-0 text-xs text-slate-500 truncate hidden sm:block">
                              {s.kandang_nama ? `Kandang: ${s.kandang_nama}` : 'Tanpa kandang'}
                            </div>
                            <div className="flex justify-end sm:justify-end">
                              {s.sudah_diberi_pakan ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200" title={`Sudah diberi pakan: ${s.nama_resep_terpakai || '-'}`}>
                                  <AlertCircle className="h-3 w-3" />
                                  Sudah: {s.nama_resep_terpakai || 'pakan lain'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Tersedia
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Preview FIFO */}
              {preview && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-800">Preview Alokasi FIFO</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white p-3 border border-emerald-100">
                      <p className="text-xs font-semibold uppercase text-slate-400">{animalLabelCap}</p>
                      <p className="text-sm font-bold text-slate-900">{preview.jumlah_sapi} ekor</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 border border-emerald-100">
                      <p className="text-xs font-semibold uppercase text-slate-400">kg/ekor</p>
                      <p className="text-sm font-bold text-slate-900">{formatNumber(preview.kg_per_ekor)}</p>
                    </div>
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
                  disabled={previewLoading || isSubmitting || !resepKode || !totalKg || selectedCount === 0}
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
                disabled={isSubmitting || previewLoading || selectedCount === 0 || !resepKode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? 'Menyimpan...' : `Simpan (${selectedCount} ${animalLabel})`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BeriPakanKonsentratModal;
