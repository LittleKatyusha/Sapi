import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Wheat, ArrowLeft, AlertCircle, Loader2, Calendar, Search, CheckSquare, Square } from 'lucide-react';
import PersediaanPakanService from '../../../../services/persediaanPakanService';
import StokSapiService from '../../../../services/stokSapiService';
import KandangService from '../../../../services/kandangService';

const todayStr = (input) => {
  const d = input ? new Date(input) : new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
};

const BeriMakanSapiPage = () => {
  const navigate = useNavigate();
  const { pid } = useParams();

  const [sourceItem, setSourceItem] = useState(null);
  const [isLoadingSource, setIsLoadingSource] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [tglPemberian, setTglPemberian] = useState('');
  const [jamPemberian, setJamPemberian] = useState('08:00');
  const [namaPeternak, setNamaPeternak] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [stokSapiRows, setStokSapiRows] = useState([]);
  const [selectedSapiPids, setSelectedSapiPids] = useState(new Set());
  const [kandangOptions, setKandangOptions] = useState([]);
  const [selectedKandangPid, setSelectedKandangPid] = useState('');
  const [sapiSearch, setSapiSearch] = useState('');
  const [isLoadingSapi, setIsLoadingSapi] = useState(false);
  const [sapiError, setSapiError] = useState('');

  const loadKandangOptions = useCallback(async () => {
    const response = await KandangService.getOptions();
    if (response.success) setKandangOptions(response.data || []);
  }, []);

  const loadStokSapi = useCallback(async (tanggal) => {
    if (!tanggal) return;
    setIsLoadingSapi(true);
    setSapiError('');
    const response = await StokSapiService.getStokSapiOptions(tanggal);
    if (response.success) {
      const rows = response.data?.rows || [];
      setStokSapiRows(rows);
      setSelectedSapiPids(new Set(rows.filter((r) => !r.sudah_diberi_pakan).map((r) => r.pid)));
    } else {
      setStokSapiRows([]);
      setSelectedSapiPids(new Set());
      setSapiError(response.message || 'Gagal memuat daftar sapi');
    }
    setIsLoadingSapi(false);
  }, []);

  const loadSource = useCallback(async () => {
    if (!pid) {
      setLoadError('Resep pakan tidak ditemukan.');
      setIsLoadingSource(false);
      return;
    }
    setIsLoadingSource(true);
    setLoadError('');
    try {
      const response = await PersediaanPakanService.showResep(pid);
      if (response.success) {
        const item = response.data;
        if (!item) {
          setLoadError('Resep pakan tidak ditemukan.');
          setIsLoadingSource(false);
          return;
        }
        setSourceItem(item);
        const tglAktif = item?.tgl_aktif ? new Date(item.tgl_aktif) : null;
        const tgl = tglAktif && !isNaN(tglAktif.getTime()) ? todayStr(tglAktif) : todayStr();
        setTglPemberian(tgl);
        setJamPemberian('08:00');
        setNamaPeternak('');
        setSapiSearch('');
        setSelectedKandangPid('');
        loadKandangOptions();
        loadStokSapi(tgl);
      } else {
        setLoadError(response.message || 'Gagal memuat resep pakan.');
      }
    } catch (err) {
      setLoadError(err?.message || 'Terjadi kesalahan saat memuat resep pakan.');
    } finally {
      setIsLoadingSource(false);
    }
  }, [pid, loadKandangOptions, loadStokSapi]);

  useEffect(() => {
    loadSource();
  }, [loadSource]);

  const filteredSapiRows = useMemo(() => {
    let result = stokSapiRows;
    if (selectedKandangPid && selectedKandangPid !== '__all__') {
      const selectedKandang = kandangOptions.find((k) => k.value === selectedKandangPid);
      if (selectedKandang) {
        result = result.filter((r) => r.kode_kandang === selectedKandang.kode);
      }
    }
    const term = sapiSearch.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (r) =>
          String(r.code_eartag || '').toLowerCase().includes(term) ||
          String(r.eartag || '').toLowerCase().includes(term) ||
          String(r.eartag_supplier || '').toLowerCase().includes(term) ||
          String(r.nama_klasifikasi || '').toLowerCase().includes(term) ||
          String(r.kode_kandang || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [stokSapiRows, selectedKandangPid, kandangOptions, sapiSearch]);

  const toggleSapi = (row) => {
    if (row.sudah_diberi_pakan) return;
    setSelectedSapiPids((prev) => {
      const next = new Set(prev);
      if (next.has(row.pid)) next.delete(row.pid);
      else next.add(row.pid);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedSapiPids((prev) => {
      const next = new Set(prev);
      filteredSapiRows.filter((r) => !r.sudah_diberi_pakan).forEach((r) => next.add(r.pid));
      return next;
    });
  };

  const clearAllSapi = () => {
    setSelectedSapiPids(new Set());
  };

  const sourceSummary = useMemo(() => {
    if (!sourceItem) return null;
    return {
      name: sourceItem.name || '-',
      tgl_aktif: sourceItem.tgl_aktif || '-',
      harga_total: Number(sourceItem.harga_total) || 0,
      jumlah_bahan: Number(sourceItem.jumlah_bahan) || 0,
      daftar_bahan: sourceItem.daftar_bahan || '-',
    };
  }, [sourceItem]);

  const sapiColumns = useMemo(() => [
    {
      name: '',
      width: '50px',
      center: true,
      ignoreRowClick: true,
      cell: (row) => {
        const checked = selectedSapiPids.has(row.pid);
        const disabled = row.sudah_diberi_pakan || isSubmitting;
        return (
          <button
            type="button"
            onClick={() => !disabled && toggleSapi(row)}
            disabled={disabled}
            className={`flex-shrink-0 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transition-transform'}`}
            aria-label={checked ? 'Hapus pilihan' : 'Pilih sapi'}
          >
            {checked ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-300" />
            )}
          </button>
        );
      },
    },
    {
      name: 'Code Eartag',
      selector: (row) => row.code_eartag || '-',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center rounded bg-sky-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-sky-700 border border-sky-200">
          {row.code_eartag || '-'}
        </span>
      ),
    },
    {
      name: 'Eartag',
      selector: (row) => row.eartag || '-',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-700">{row.eartag || '-'}</span>
      ),
    },
    {
      name: 'Eartag Supplier',
      selector: (row) => row.eartag_supplier || '-',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">{row.eartag_supplier || '-'}</span>
      ),
    },
    {
      name: 'Klasifikasi',
      selector: (row) => row.nama_klasifikasi || '-',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">{row.nama_klasifikasi || '-'}</span>
      ),
    },
    {
      name: 'Kandang',
      selector: (row) => row.kode_kandang || '-',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
          {row.kode_kandang || '-'}{row.nama_kandang ? ` · ${row.nama_kandang}` : ''}
        </span>
      ),
    },
    {
      name: 'Status',
      width: '180px',
      ignoreRowClick: true,
      cell: (row) => (
        row.sudah_diberi_pakan ? (
          <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
            Sudah diberi{row.nama_resep_terpakai ? `: ${row.nama_resep_terpakai}` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
            Tersedia
          </span>
        )
      ),
    },
  ], [selectedSapiPids, isSubmitting]);

  const conditionalRowStyles = [
    {
      when: (row) => selectedSapiPids.has(row.pid),
      style: { backgroundColor: '#ecfdf5' },
    },
    {
      when: (row) => row.sudah_diberi_pakan,
      style: { opacity: 0.6 },
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!sourceItem?.pid) {
      setSubmitError('Resep pakan sumber tidak valid.');
      return;
    }
    if (!tglPemberian) {
      setSubmitError('Tanggal pemberian pakan wajib diisi.');
      return;
    }
    if (!jamPemberian) {
      setSubmitError('Jam pemberian pakan wajib diisi.');
      return;
    }
    if (selectedSapiPids.size === 0) {
      setSubmitError('Pilih minimal satu sapi yang akan diberi pakan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pid: sourceItem.pid,
        tgl_pemberian_pakan: tglPemberian,
        jam_pemberian_pakan: jamPemberian,
        selected_sapi_pids: Array.from(selectedSapiPids),
      };
      if (namaPeternak && namaPeternak.trim()) payload.nama_peternak = namaPeternak.trim();

      const response = await PersediaanPakanService.beriMakan(payload);
      if (response.success) {
        navigate('/rph/persediaan-ovk');
      } else {
        setSubmitError(response.message || 'Gagal memberi makan sapi.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat memberi makan sapi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSource) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-600">Memuat resep pakan...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="break-words">{loadError}</span>
        </div>
        <button
          onClick={() => navigate('/rph/persediaan-ovk')}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Resep Pakan
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rph/persediaan-ovk')}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Wheat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Beri Makan Sapi</h1>
              <p className="text-xs text-slate-500">Dari resep pakan yang sudah ada</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Source summary — satu baris */}
        {sourceSummary && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center gap-2 flex-wrap">
            <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide flex-shrink-0">Resep Sumber</div>
            <div className="font-bold text-slate-800 text-xs flex-shrink-0">{sourceSummary.name}</div>
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              {sourceSummary.jumlah_bahan} bahan
            </span>
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              Rp {sourceSummary.harga_total.toLocaleString('id-ID')}
            </span>
            {sourceSummary.daftar_bahan && sourceSummary.daftar_bahan !== '-' && (
              <span className="text-[10px] text-slate-500 truncate flex-1 min-w-0">{sourceSummary.daftar_bahan}</span>
            )}
          </div>
        )}

        {/* Nama Peternak, Tanggal Pemberian & Jam Pemberian — satu baris */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Nama Peternak (opsional)</label>
            <input
              type="text"
              value={namaPeternak}
              onChange={(e) => setNamaPeternak(e.target.value)}
              disabled={isSubmitting}
              placeholder="Kosongkan untuk default"
              className="w-full px-3 py-2 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Tanggal Pemberian <span className="text-slate-400 normal-case font-normal">(locked)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={tglPemberian}
                onChange={(e) => setTglPemberian(e.target.value)}
                disabled
                required
                className="w-full pl-9 pr-3 py-2 text-sm border-2 border-slate-200 rounded-lg bg-slate-100 cursor-not-allowed opacity-80"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Jam Pemberian <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={jamPemberian}
              onChange={(e) => setJamPemberian(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3 py-2 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-lg bg-slate-50 focus:bg-white transition-all outline-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* Sapi Selection */}
        <div className="space-y-2.5 rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Pilih Sapi <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Daftar sapi aktif di RPH untuk tanggal pemberian. Sapi yang sudah diberi pakan di tanggal ini otomatis dilewati.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 flex-shrink-0">
              {selectedSapiPids.size} terpilih
            </span>
          </div>

          {/* Stats bar */}
          {!isLoadingSapi && !sapiError && stokSapiRows.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total</div>
                <div className="text-xs font-bold text-slate-700">{stokSapiRows.length}</div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-center">
                <div className="text-[10px] text-emerald-600 uppercase font-semibold">Tersedia</div>
                <div className="text-xs font-bold text-emerald-700">{stokSapiRows.filter(r => !r.sudah_diberi_pakan).length}</div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-center">
                <div className="text-[10px] text-amber-600 uppercase font-semibold">Sudah Diberi</div>
                <div className="text-xs font-bold text-amber-700">{stokSapiRows.filter(r => r.sudah_diberi_pakan).length}</div>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-center">
                <div className="text-[10px] text-indigo-600 uppercase font-semibold">Terpilih</div>
                <div className="text-xs font-bold text-indigo-700">{selectedSapiPids.size}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={selectedKandangPid}
              onChange={(e) => setSelectedKandangPid(e.target.value)}
              disabled={isSubmitting || isLoadingSapi}
              className="flex-1 px-2 py-1.5 text-xs border-2 border-slate-200 rounded-lg bg-slate-50 focus:border-emerald-500 outline-none disabled:opacity-60"
            >
              <option value="__all__">Semua Kandang</option>
              {kandangOptions.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={sapiSearch}
                onChange={(e) => setSapiSearch(e.target.value)}
                disabled={isSubmitting || isLoadingSapi}
                placeholder="Cari code eartag/eartag/klasifikasi/kandang..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border-2 border-slate-200 rounded-lg bg-slate-50 focus:border-emerald-500 outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={selectAllVisible} disabled={isSubmitting || isLoadingSapi} className="flex-1 px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50">
              Pilih Semua Tampil
            </button>
            <button type="button" onClick={clearAllSapi} disabled={isSubmitting || isLoadingSapi} className="flex-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">
              Kosongkan
            </button>
          </div>

          {sapiError && (
            <div className="text-[11px] text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {sapiError}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <DataTable
              columns={sapiColumns}
              data={filteredSapiRows}
              progressPending={isLoadingSapi}
              progressComponent={
                <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Memuat daftar sapi...
                </div>
              }
              noDataComponent={
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <Wheat className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-slate-600 text-sm font-semibold">Tidak ada sapi tersedia</p>
                  <p className="text-slate-400 text-xs mt-1">Coba ubah filter kandang atau kata kunci pencarian</p>
                </div>
              }
              conditionalRowStyles={conditionalRowStyles}
              highlightOnHover
              pointerOnHover={!isSubmitting}
              dense
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              noHeader
            />
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{submitError}</span>
          </div>
        )}

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
          <strong>Catatan:</strong> Stok bahan baku TIDAK dikurangi (sudah diambil saat resep dibuat). Hanya mencatat pemberian pakan ke sapi terpilih di tanggal & jam ini. Sapi yang sudah dapat pakan di tanggal ini akan dilewati.
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/rph/persediaan-ovk')} disabled={isSubmitting} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>) : (<><Wheat className="w-4 h-4" /> Beri Makan</>)}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BeriMakanSapiPage;
