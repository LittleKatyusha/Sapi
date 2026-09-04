import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Beef, Search, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Tag, Calendar, Weight, CircleDollarSign, Hash, CheckCircle2, RotateCcw as RotateCcwIcon, Undo2, MoreVertical, Info, Scissors, Skull, X, Home, Wheat, Package } from 'lucide-react';
import HttpClient from '../../../services/httpClient';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import BulkAssignKandangModal from '../StokSapi/modals/BulkAssignKandangModal';
import BeriPakanKonsentratModal from '../StokSapi/modals/BeriPakanKonsentratModal';
import BeriOvkQurbanModal from './modals/BeriOvkQurbanModal';

const initialAdvanced = { eartag: '', eartag_supplier: '', nota_qurban: '', status: '' };

const ActionMenuCell = ({ row, menuOpen, setMenuOpen, menuPos, setMenuPos, menuButtonRefs, setRestoreTarget, setPotongPaksaTarget, setSapiMatiTarget, setBeriOvkTarget }) => {
  const status = Number(row.status);
  const isReturn = status === 2;
  const isTersedia = status === 0;
  const isTerjual = status === 1;
  // Show menu for all statuses (0, 1, 2) — potong paksa available for all
  const hasMenu = isTersedia || isTerjual || isReturn;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!hasMenu) return;
    if (menuOpen === row.pid) {
      setMenuOpen(null);
      return;
    }
    const rect = menuButtonRefs.current[row.pid]?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 180 });
    }
    setMenuOpen(row.pid);
  };

  if (!hasMenu) return <span className="text-xs text-gray-300">-</span>;

  const open = menuOpen === row.pid;

  return (
    <div className="relative">
      <button
        ref={(el) => { menuButtonRefs.current[row.pid] = el; }}
        onClick={handleToggle}
        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
        title="Aksi"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && createPortal(
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setMenuOpen(null)}
          />
          <div
            className="fixed z-[61] w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            {isTersedia && (
              <>
                <button
                  onClick={() => { setBeriOvkTarget(row); setMenuOpen(null); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-sky-700 hover:bg-sky-50 transition"
                >
                  <Package className="w-3.5 h-3.5" />
                  Beri OVK
                </button>
                <div className="my-1 border-t border-gray-100" />
              </>
            )}
            <button
              onClick={() => { setPotongPaksaTarget(row); setMenuOpen(null); }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition"
            >
              <Scissors className="w-3.5 h-3.5" />
              Potong Paksa
              {isTerjual && <span className="ml-auto text-[10px] text-amber-500">+ganti</span>}
            </button>
            <button
              onClick={() => { setSapiMatiTarget(row); setMenuOpen(null); }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <Skull className="w-3.5 h-3.5" />
              Sapi Mati
              {isTerjual && <span className="ml-auto text-[10px] text-gray-400">+ganti</span>}
            </button>
            {isReturn && (
              <>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => { setRestoreTarget({ ...row, mode: 'cancel' }); setMenuOpen(null); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Cancel Return
                  <span className="ml-auto text-[10px] text-gray-400">ke transaksi</span>
                </button>
                <button
                  onClick={() => { setRestoreTarget({ ...row, mode: 'stock' }); setMenuOpen(null); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                  Ke Stok
                  <span className="ml-auto text-[10px] text-gray-400">tersedia</span>
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const StokSapiQurbanPage = () => {
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null); // row.pid that has menu open
  const menuButtonRefs = useRef({});
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [restoring, setRestoring] = useState(false);
  const [notif, setNotif] = useState(null);

  // Potong Paksa state
  const [potongPaksaTarget, setPotongPaksaTarget] = useState(null);
  const [viewMode, setViewMode] = useState('stok'); // 'stok' | 'potong-paksa' | 'sapi-mati'
  const [potongPaksaList, setPotongPaksaList] = useState([]);
  const [potongPaksaTotal, setPotongPaksaTotal] = useState(0);
  const [potongPaksaLoading, setPotongPaksaLoading] = useState(false);
  const [potongPaksaError, setPotongPaksaError] = useState(null);
  const [ppPage, setPpPage] = useState(1);
  const [ppPerPage, setPpPerPage] = useState(10);
  const [potongPaksaForm, setPotongPaksaForm] = useState({
    tgl_potong_paksa: new Date().toISOString().split('T')[0],
    id_sebab_potong_paksa: '',
    bobot_selisih_potong_paksa: '',
    bobot_setelah_potong: '',
    id_mengetahui: '',
    id_status_sapi_qurban: '',
    pid_sapi_pengganti: '',
    lokasi_penyimpanan: '',
    keterangan: '',
  });
  const [sebabOptions, setSebabOptions] = useState([]);
  const [statusSapiOptions, setStatusSapiOptions] = useState([]);
  const [mengetahuiOptions, setMengetahuiOptions] = useState([]);
  const [penggantiOptions, setPenggantiOptions] = useState([]);
  const [penggantiSearch, setPenggantiSearch] = useState('');
  const [penggantiLoading, setPenggantiLoading] = useState(false);
  const [submittingPotongPaksa, setSubmittingPotongPaksa] = useState(false);

  // Sapi Mati state
  const [sapiMatiTarget, setSapiMatiTarget] = useState(null);
  const [sapiMatiList, setSapiMatiList] = useState([]);
  const [sapiMatiTotal, setSapiMatiTotal] = useState(0);
  const [sapiMatiLoading, setSapiMatiLoading] = useState(false);
  const [sapiMatiError, setSapiMatiError] = useState(null);
  const [smPage, setSmPage] = useState(1);
  const [smPerPage, setSmPerPage] = useState(10);
  const [sapiMatiForm, setSapiMatiForm] = useState({
    tgl_kematian: new Date().toISOString().split('T')[0],
    id_sebab_kematian: '',
    id_mengetahui: '',
    pid_sapi_pengganti: '',
    keterangan: '',
  });
  const [sebabKematianOptions, setSebabKematianOptions] = useState([]);
  const [submittingSapiMati, setSubmittingSapiMati] = useState(false);

  // Assign Kandang (bulk), Beri Pakan Konsentrat (bulk), Beri OVK (per-row) state
  const [selectedRows, setSelectedRows] = useState([]);
  const [assignKandangOpen, setAssignKandangOpen] = useState(false);
  const [beriPakanOpen, setBeriPakanOpen] = useState(false);
  const [beriOvkTarget, setBeriOvkTarget] = useState(null);

  // Collapsible panels
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(true);

  // Search state
  const [advanced, setAdvanced] = useState(initialAdvanced);
  const [appliedFilters, setAppliedFilters] = useState(initialAdvanced);
  const [sortConfig, setSortConfig] = useState({ column: 'tr_qurban.tanggal_pemesanan', dir: 'desc' });

  // Filters for potong paksa & sapi mati tabs
  const [ppFilter, setPpFilter] = useState({ search: '', start_date: '', end_date: '' });
  const [ppFilterApplied, setPpFilterApplied] = useState({ search: '', start_date: '', end_date: '' });
  const [smFilter, setSmFilter] = useState({ search: '', start_date: '', end_date: '' });
  const [smFilterApplied, setSmFilterApplied] = useState({ search: '', start_date: '', end_date: '' });

  const fetchData = useCallback(async (page = 1, limit = perPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await HttpClient.get('/api/rph/qurban/data-persapi', {
        params: {
          start: (page - 1) * limit,
          length: limit,
          draw: 1,
          eartag: appliedFilters.eartag,
          eartag_supplier: appliedFilters.eartag_supplier,
          nota_qurban: appliedFilters.nota_qurban,
          status: appliedFilters.status !== '' && appliedFilters.status !== null ? appliedFilters.status : undefined,
          'order[0][column]': sortConfig.column,
          'order[0][dir]': sortConfig.dir,
        }
      });
      setTableData(response.data || []);
      setTotalRecords(response.recordsFiltered ?? response.recordsTotal ?? 0);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data qurban');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, perPage, sortConfig]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  // Fetch potong paksa history list
  const fetchPotongPaksaList = useCallback(async (page = ppPage, limit = ppPerPage) => {
    setPotongPaksaLoading(true);
    setPotongPaksaError(null);
    try {
      const response = await HttpClient.get('/api/rph/qurban/potong-paksa/data', {
        params: {
          start: (page - 1) * limit,
          length: limit,
          search: ppFilterApplied.search ? { value: ppFilterApplied.search } : undefined,
          start_date: ppFilterApplied.start_date || undefined,
          end_date: ppFilterApplied.end_date || undefined,
        },
      });
      setPotongPaksaList(response?.data || []);
      setPotongPaksaTotal(response?.recordsFiltered ?? response?.recordsTotal ?? response?.total ?? 0);
    } catch (err) {
      setPotongPaksaError(err?.message || 'Gagal memuat riwayat potong paksa');
    } finally {
      setPotongPaksaLoading(false);
    }
  }, [ppPage, ppPerPage, ppFilterApplied]);

  useEffect(() => {
    if (viewMode === 'potong-paksa') fetchPotongPaksaList(ppPage, ppPerPage);
  }, [viewMode, ppPage, ppPerPage, fetchPotongPaksaList]);

  // Fetch sapi mati history list
  const fetchSapiMatiList = useCallback(async (page = smPage, limit = smPerPage) => {
    setSapiMatiLoading(true);
    setSapiMatiError(null);
    try {
      const response = await HttpClient.get('/api/rph/qurban/sapi-mati/data', {
        params: {
          start: (page - 1) * limit,
          length: limit,
          search: smFilterApplied.search ? { value: smFilterApplied.search } : undefined,
          start_date: smFilterApplied.start_date || undefined,
          end_date: smFilterApplied.end_date || undefined,
        },
      });
      setSapiMatiList(response?.data || []);
      setSapiMatiTotal(response?.recordsFiltered ?? response?.recordsTotal ?? response?.total ?? 0);
    } catch (err) {
      setSapiMatiError(err?.message || 'Gagal memuat riwayat sapi mati');
    } finally {
      setSapiMatiLoading(false);
    }
  }, [smPage, smPerPage, smFilterApplied]);

  useEffect(() => {
    if (viewMode === 'sapi-mati') fetchSapiMatiList(smPage, smPerPage);
  }, [viewMode, smPage, smPerPage, fetchSapiMatiList]);
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [sebabRes, statusRes, mengetahuiRes, sebabMatiRes] = await Promise.all([
          HttpClient.post('/api/system/parameter/dataByGroup', { group: 'sebab_potong_paksa' }),
          HttpClient.post('/api/system/parameter/dataByGroup', { group: 'status_sapi_qurban' }),
          HttpClient.get('/api/master/persetujuanrph/data', { params: { length: 100 } }),
          HttpClient.post('/api/system/parameter/dataByGroup', { group: 'sebab_kematian' }),
        ]);
        setSebabOptions(sebabRes?.data || sebabRes || []);
        setStatusSapiOptions(statusRes?.data || statusRes || []);
        setMengetahuiOptions(mengetahuiRes?.data || mengetahuiRes || []);
        setSebabKematianOptions(sebabMatiRes?.data || sebabMatiRes || []);
      } catch (err) {
        // silent fail — dropdowns will be empty
      }
    };
    fetchOptions();
  }, []);

  const handleAdvancedSearch = () => {
    setAppliedFilters(advanced);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setAdvanced(initialAdvanced);
    setAppliedFilters(initialAdvanced);
    setCurrentPage(1);
  };

  const handlePpFilterSearch = () => {
    setPpFilterApplied(ppFilter);
    setPpPage(1);
  };
  const handlePpFilterReset = () => {
    const empty = { search: '', start_date: '', end_date: '' };
    setPpFilter(empty);
    setPpFilterApplied(empty);
    setPpPage(1);
  };
  const handleSmFilterSearch = () => {
    setSmFilterApplied(smFilter);
    setSmPage(1);
  };
  const handleSmFilterReset = () => {
    const empty = { search: '', start_date: '', end_date: '' };
    setSmFilter(empty);
    setSmFilterApplied(empty);
    setSmPage(1);
  };

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((v) => v.trim() !== '').length,
    [appliedFilters]
  );

  const statusConfig = {
    0: { label: 'Tersedia', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    1: { label: 'Terjual', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CircleDollarSign },
    2: { label: 'Return', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: RotateCcwIcon },
  };

  const columns = [
    {
      name: 'No.',
      width: '52px',
      center: true,
      cell: (_, idx) => (currentPage - 1) * perPage + idx + 1,
    },
    {
      name: 'Eartag & Supplier',
      sortable: true,
      sortField: 'tr_pembelian_ho_detail.eartag',
      minWidth: '240px',
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <Tag className={`w-3.5 h-3.5 ${isReturn ? 'text-red-600' : 'text-emerald-600'}`} />
              <span className={`font-mono font-semibold ${isReturn ? 'text-red-700 line-through' : 'text-gray-800'}`}>{row.eartag || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5 pl-5">
              <span className="text-[11px] text-gray-400">Supplier:</span>
              <span className={`font-mono text-xs ${isReturn ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{row.eartag_supplier || '-'}</span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'RPH',
      minWidth: '170px',
      cell: (row) => <span className="text-sm font-medium text-gray-700">{row.nama_rph || '-'}</span>,
    },
    {
      name: 'Status',
      sortable: false,
      width: '130px',
      center: true,
      cell: (row) => {
        const cfg = statusConfig[Number(row.status)] || statusConfig[0];
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} border text-[11px] font-semibold`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      name: 'Berat',
      sortable: true,
      sortField: 'tr_pembelian_ho_detail.berat',
      width: '110px',
      center: true,
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <div className={`flex items-center gap-1.5 justify-center ${isReturn ? 'line-through text-gray-400' : ''}`}>
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 font-medium">{row.berat ? `${row.berat} kg` : '-'}</span>
          </div>
        );
      },
    },
    {
      name: 'Harga Beli',
      sortable: true,
      sortField: 'tr_qurban_detail.harga_beli',
      width: '150px',
      right: true,
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <span className={`font-bold ${isReturn ? 'text-red-400 line-through' : 'text-emerald-600'}`}>
            {row.harga_beli ? `Rp ${Number(row.harga_beli).toLocaleString('id-ID')}` : '-'}
          </span>
        );
      },
    },
    {
      name: 'Nota & Tanggal Qurban',
      sortable: true,
      sortField: 'tr_qurban.nota_sistem',
      minWidth: '220px',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-sm font-medium text-gray-700">{row.nota_sistem || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-5">
            <span className="text-[11px] text-gray-400">Nota Supplier:</span>
            <span className="text-xs text-gray-600">{row.nota_supplier || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{row.tanggal_pemesanan || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Aksi',
      sortable: false,
      width: '60px',
      center: true,
      cell: (row) => (
        <ActionMenuCell
          row={row}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuPos={menuPos}
          setMenuPos={setMenuPos}
          menuButtonRefs={menuButtonRefs}
          setRestoreTarget={setRestoreTarget}
          setPotongPaksaTarget={setPotongPaksaTarget}
          setSapiMatiTarget={setSapiMatiTarget}
          setBeriOvkTarget={setBeriOvkTarget}
        />
      ),
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '56px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
  };

  const handleSort = (column, dir) => {
    if (column.sortField) {
      setSortConfig({ column: column.sortField, dir: dir || 'desc' });
    }
  };

  const handleRestore = useCallback(async () => {
    if (!restoreTarget) return;
    const endpoint = restoreTarget.mode === 'stock'
      ? '/api/rph/qurban/restore-to-stock'
      : '/api/rph/qurban/restore-sapi';
    setRestoring(true);
    try {
      const res = await HttpClient.post(endpoint, { pid: restoreTarget.pid });
      if (res?.status === 'ok' || res?.success !== false) {
        setNotif({ type: 'success', message: res?.message || 'Sapi berhasil dikembalikan' });
        setRestoreTarget(null);
        fetchData(currentPage);
      } else {
        setNotif({ type: 'error', message: res?.message || 'Gagal mengembalikan sapi' });
      }
    } catch (err) {
      setNotif({ type: 'error', message: err?.message || 'Gagal mengembalikan sapi' });
    } finally {
      setRestoring(false);
    }
  }, [restoreTarget, currentPage, fetchData]);

  useEffect(() => {
    if (notif) {
      const t = setTimeout(() => setNotif(null), 3500);
      return () => clearTimeout(t);
    }
  }, [notif]);

  // Fetch sapi pengganti (debounced) — only when target is terjual (status=1)
  useEffect(() => {
    if (!potongPaksaTarget || Number(potongPaksaTarget.status) !== 1) return;
    const t = setTimeout(async () => {
      setPenggantiLoading(true);
      try {
        const res = await HttpClient.get('/api/rph/qurban/potong-paksa/available-sapi-pengganti', {
          params: { search: penggantiSearch },
        });
        setPenggantiOptions(res?.data || res || []);
      } catch (err) {
        setPenggantiOptions([]);
      } finally {
        setPenggantiLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [penggantiSearch, potongPaksaTarget]);

  const handlePotongPaksaSubmit = useCallback(async () => {
    if (!potongPaksaTarget) return;
    setPotongPaksaError(null);

    // Validation
    const f = potongPaksaForm;
    if (!f.tgl_potong_paksa) return setPotongPaksaError('Tanggal potong paksa wajib diisi');
    if (!f.id_sebab_potong_paksa) return setPotongPaksaError('Sebab potong paksa wajib dipilih');
    if (!f.bobot_selisih_potong_paksa) return setPotongPaksaError('Bobot selisih wajib diisi');
    if (!f.id_mengetahui) return setPotongPaksaError('Mengetahui wajib dipilih');
    if (!f.id_status_sapi_qurban) return setPotongPaksaError('Status sapi wajib dipilih');
    if (Number(potongPaksaTarget.status) === 1 && !f.pid_sapi_pengganti) {
      return setPotongPaksaError('Sapi pengganti wajib untuk sapi yang sudah terjual');
    }

    setSubmittingPotongPaksa(true);
    try {
      const payload = { pid: potongPaksaTarget.pid, ...f };
      if (!payload.pid_sapi_pengganti) delete payload.pid_sapi_pengganti;
      if (!payload.bobot_setelah_potong) delete payload.bobot_setelah_potong;
      if (!payload.lokasi_penyimpanan) delete payload.lokasi_penyimpanan;
      if (!payload.keterangan) delete payload.keterangan;

      const res = await HttpClient.post('/api/rph/qurban/potong-paksa/store', payload);
      if (res?.status === 'ok' || res?.success !== false) {
        setNotif({ type: 'success', message: res?.message || 'Potong paksa berhasil dicatat' });
        setPotongPaksaTarget(null);
        setPotongPaksaForm({
          tgl_potong_paksa: new Date().toISOString().split('T')[0],
          id_sebab_potong_paksa: '', bobot_selisih_potong_paksa: '', bobot_setelah_potong: '',
          id_mengetahui: '', id_status_sapi_qurban: '', pid_sapi_pengganti: '',
          lokasi_penyimpanan: '', keterangan: '',
        });
        setPenggantiSearch('');
        setPenggantiOptions([]);
        fetchData(currentPage);
      } else {
        const errMsg = typeof res?.data === 'string' ? res.data : (res?.data?.message || res?.message);
        setPotongPaksaError(errMsg || 'Gagal menyimpan potong paksa');
      }
    } catch (err) {
      const errMsg = typeof err?.data === 'string' ? err.data : (err?.data?.message || err?.message);
      setPotongPaksaError(errMsg || 'Gagal menyimpan potong paksa');
    } finally {
      setSubmittingPotongPaksa(false);
    }
  }, [potongPaksaTarget, potongPaksaForm, fetchData, currentPage]);

  const closePotongPaksaModal = () => {
    setPotongPaksaTarget(null);
    setPotongPaksaError(null);
    setPenggantiSearch('');
    setPenggantiOptions([]);
  };

  // Fetch sapi pengganti for sapi mati (debounced) — only when target is terjual (status=1)
  useEffect(() => {
    if (!sapiMatiTarget || Number(sapiMatiTarget.status) !== 1) return;
    const t = setTimeout(async () => {
      setPenggantiLoading(true);
      try {
        const res = await HttpClient.get('/api/rph/qurban/sapi-mati/available-sapi-pengganti', {
          params: { search: penggantiSearch },
        });
        setPenggantiOptions(res?.data || res || []);
      } catch (err) {
        setPenggantiOptions([]);
      } finally {
        setPenggantiLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [penggantiSearch, sapiMatiTarget]);

  const handleSapiMatiSubmit = useCallback(async () => {
    if (!sapiMatiTarget) return;
    setSapiMatiError(null);

    const f = sapiMatiForm;
    if (!f.tgl_kematian) return setSapiMatiError('Tanggal kematian wajib diisi');
    if (!f.id_sebab_kematian) return setSapiMatiError('Sebab kematian wajib dipilih');
    if (!f.id_mengetahui) return setSapiMatiError('Mengetahui wajib dipilih');
    if (Number(sapiMatiTarget.status) === 1 && !f.pid_sapi_pengganti) {
      return setSapiMatiError('Sapi pengganti wajib untuk sapi yang sudah terjual');
    }

    setSubmittingSapiMati(true);
    try {
      const payload = { pid: sapiMatiTarget.pid, ...f };
      if (!payload.pid_sapi_pengganti) delete payload.pid_sapi_pengganti;
      if (!payload.keterangan) delete payload.keterangan;

      const res = await HttpClient.post('/api/rph/qurban/sapi-mati/store', payload);
      if (res?.status === 'ok' || res?.success !== false) {
        setNotif({ type: 'success', message: res?.message || 'Sapi mati berhasil dicatat' });
        setSapiMatiTarget(null);
        setSapiMatiForm({
          tgl_kematian: new Date().toISOString().split('T')[0],
          id_sebab_kematian: '', id_mengetahui: '', pid_sapi_pengganti: '', keterangan: '',
        });
        setPenggantiSearch('');
        setPenggantiOptions([]);
        fetchData(currentPage);
      } else {
        const errMsg = typeof res?.data === 'string' ? res.data : (res?.data?.message || res?.message);
        setSapiMatiError(errMsg || 'Gagal menyimpan sapi mati');
      }
    } catch (err) {
      const errMsg = typeof err?.data === 'string' ? err.data : (err?.data?.message || err?.message);
      setSapiMatiError(errMsg || 'Gagal menyimpan sapi mati');
    } finally {
      setSubmittingSapiMati(false);
    }
  }, [sapiMatiTarget, sapiMatiForm, fetchData, currentPage]);

  const closeSapiMatiModal = () => {
    setSapiMatiTarget(null);
    setSapiMatiError(null);
    setPenggantiSearch('');
    setPenggantiOptions([]);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Beef className="w-8 h-8 text-emerald-600" />
              Stok Sapi Qurban
            </h1>
            <p className="text-gray-500 text-sm mt-1">Daftar sapi qurban per ekor</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersedia: {tableData.filter(d => Number(d.status) !== 2).length}
            </div>
            <div className="px-3 py-1.5 bg-red-50 rounded-lg text-xs font-medium text-red-700 border border-red-100 flex items-center gap-1.5">
              <RotateCcwIcon className="w-3.5 h-3.5" />
              Return: {tableData.filter(d => Number(d.status) === 2).length}
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              Total: {totalRecords} ekor
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-fit">
        <button
          onClick={() => setViewMode('stok')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewMode === 'stok' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Beef className="w-4 h-4" />
          Stok Sapi
        </button>
        <button
          onClick={() => setViewMode('potong-paksa')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewMode === 'potong-paksa' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Riwayat Potong Paksa
          {potongPaksaTotal > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              viewMode === 'potong-paksa' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
            }`}>
              {potongPaksaTotal}
            </span>
          )}
        </button>
        <button
          onClick={() => setViewMode('sapi-mati')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            viewMode === 'sapi-mati' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Skull className="w-4 h-4" />
          Riwayat Sapi Mati
          {sapiMatiTotal > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              viewMode === 'sapi-mati' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {sapiMatiTotal}
            </span>
          )}
        </button>
      </div>

      {/* === STOK VIEW === */}
      {viewMode === 'stok' && (
      <>
      <div className="bg-gradient-to-br from-blue-50/60 to-emerald-50/40 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Penanganan Sapi Status Return</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Sapi dengan status <span className="text-red-600 font-semibold">Return</span> memiliki 2 opsi penanganan melalui menu <MoreVertical className="inline w-3 h-3 text-gray-500" /> di kolom Aksi.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="bg-white rounded-xl border border-blue-200 p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Undo2 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-blue-700">Cancel Return</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Batalkan return — sapi kembali ke <span className="font-semibold">transaksi penjualan asli</span> (status=terjual). Detail, total transaksi, dan status pembayaran di-revert. Return header ditandai <span className="font-semibold">reverted</span>.
            </p>
            <p className="text-[11px] text-gray-400 mt-2 italic">Gunakan jika return dibuat salah / sapi sebenarnya diterima pembeli.</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <RotateCcwIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-emerald-700">Ke Stok</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sapi diubah ke <span className="font-semibold">Tersedia</span> dan bisa dijual ulang ke transaksi lain. Return tetap valid di transaksi asli (detail & total tetap adjusted).
            </p>
            <p className="text-[11px] text-gray-400 mt-2 italic">Gunakan jika sapi sudah diterima kembali di RPH dan siap dijual ulang.</p>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel (Collapsible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Pencarian Lanjutan</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-emerald-500 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {advancedOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {advancedOpen && (
          <div className="px-5 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Eartag</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari eartag..."
                    value={advanced.eartag}
                    onChange={(e) => setAdvanced((p) => ({ ...p, eartag: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Eartag Supplier</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari eartag supplier..."
                    value={advanced.eartag_supplier}
                    onChange={(e) => setAdvanced((p) => ({ ...p, eartag_supplier: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nota Qurban</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nota qurban..."
                    value={advanced.nota_qurban}
                    onChange={(e) => setAdvanced((p) => ({ ...p, nota_qurban: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Status Sapi</label>
                <SearchableSelect
                  options={[
                    { value: 0, label: 'Tersedia' },
                    { value: 1, label: 'Terjual' },
                    { value: 2, label: 'Return' },
                  ]}
                  value={advanced.status === '' ? null : Number(advanced.status)}
                  onChange={(v) => setAdvanced((p) => ({ ...p, status: v === null ? '' : String(v) }))}
                  placeholder="Semua status"
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleAdvancedSearch}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Cari
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DataTable (Collapsible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Daftar Stok Sapi Qurban</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{totalRecords} data</span>
          </div>
          {tableOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {tableOpen && (
          <div className="border-t border-gray-100">
            {/* Bulk Action Toolbar */}
            {tableData.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-gray-50/60 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-600 mr-1">
                  {selectedRows.length > 0 ? `${selectedRows.length} sapi terpilih` : 'Pilih sapi untuk aksi bulk'}
                </span>
                <button
                  type="button"
                  onClick={() => setAssignKandangOpen(true)}
                  disabled={selectedRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Home className="w-3.5 h-3.5" />
                  Assign Kandang
                </button>
                <button
                  type="button"
                  onClick={() => setBeriPakanOpen(true)}
                  disabled={selectedRows.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Wheat className="w-3.5 h-3.5" />
                  Beri Pakan Konsentrat
                </button>
                {selectedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedRows([])}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Kosongkan pilihan
                  </button>
                )}
              </div>
            )}

            {loading && tableData.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="p-12 flex flex-col items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8 mb-3" />
                <p className="text-sm">{error}</p>
              </div>
            ) : tableData.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Belum ada stok sapi qurban</p>
                <p className="text-xs mt-1">Data akan muncul setelah pembelian qurban ditambahkan</p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={tableData}
                selectableRows
                selectableRowsHighlight
                onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                clearSelectedRows={selectedRows.length === 0 ? 0 : undefined}
                pagination
                paginationServer
                paginationTotalRows={totalRecords}
                paginationPerPage={perPage}
                paginationDefaultPage={currentPage}
                onChangePage={setCurrentPage}
                onChangeRowsPerPage={(n) => { setPerPage(n); setCurrentPage(1); }}
                onSort={handleSort}
                sortServer
                defaultSortFieldId={1}
                defaultSortAsc={false}
                customStyles={customStyles}
                highlightOnHover
                pointerOnHover
                responsive
              />
            )}
          </div>
        )}
      </div>
      </>
      )}

      {/* === POTONG PAKSA VIEW === */}
      {viewMode === 'potong-paksa' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-gray-800">Riwayat Potong Paksa Sapi Qurban</h3>
            </div>
            <span className="text-xs text-gray-500">{potongPaksaTotal} record</span>
          </div>
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50/30 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Eartag / supplier / sebab / keterangan..."
                  value={ppFilter.search}
                  onChange={(e) => setPpFilter((p) => ({ ...p, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePpFilterSearch()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Tgl dari</label>
              <input
                type="date"
                value={ppFilter.start_date}
                onChange={(e) => setPpFilter((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Tgl sampai</label>
              <input
                type="date"
                value={ppFilter.end_date}
                onChange={(e) => setPpFilter((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="button"
                onClick={handlePpFilterReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handlePpFilterSearch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 shadow-sm transition"
              >
                <Search className="w-3.5 h-3.5" />
                Cari
              </button>
            </div>
          </div>
          {potongPaksaLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : potongPaksaError ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-red-500">
              <AlertCircle className="w-7 h-7" />
              <p className="text-sm">{potongPaksaError}</p>
            </div>
          ) : potongPaksaList.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Scissors className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Belum ada data potong paksa</p>
              <p className="text-xs mt-1">Data potong paksa akan muncul setelah ada sapi yang dipotong paksa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Eartag</th>
                    <th className="px-4 py-3">Tgl Potong</th>
                    <th className="px-4 py-3">Sebab</th>
                    <th className="px-4 py-3 text-right">Bobot Selisih</th>
                    <th className="px-4 py-3 text-right">Bobot Setelah</th>
                    <th className="px-4 py-3">Status Sapi</th>
                    <th className="px-4 py-3">Sapi Pengganti</th>
                    <th className="px-4 py-3">Mengetahui</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {potongPaksaList.map((row) => (
                    <tr key={row.pubid || row.id} className="hover:bg-amber-50/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-gray-800">{row.eartag}</div>
                        <div className="text-[10px] text-gray-400">{row.eartag_supplier}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.tgl_potong_paksa || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">{row.sebab_potong_paksa || '-'}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.bobot_selisih_potong_paksa ?? '-'} kg</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{row.bobot_setelah_potong ?? '-'} kg</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">{row.status_sapi_qurban || '-'}</span></td>
                      <td className="px-4 py-3">
                        {row.eartag_pengganti ? (
                          <div>
                            <div className="font-mono text-xs font-semibold text-emerald-700">{row.eartag_pengganti}</div>
                            <div className="text-[10px] text-gray-400">{row.eartag_supplier_pengganti}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.mengetahui || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={row.keterangan}>{row.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Halaman {ppPage} dari {Math.max(1, Math.ceil(potongPaksaTotal / ppPerPage))}</span>
                  <select
                    value={ppPerPage}
                    onChange={(e) => { setPpPerPage(Number(e.target.value)); setPpPage(1); }}
                    className="px-2 py-1 rounded border border-gray-200 text-xs bg-white"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n} / hal</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPpPage((p) => Math.max(1, p - 1))}
                    disabled={ppPage <= 1}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                  >Prev</button>
                  <button
                    onClick={() => setPpPage((p) => p + 1)}
                    disabled={ppPage * ppPerPage >= potongPaksaTotal}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                  >Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {notif && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          notif.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {notif.message}
        </div>
      )}

      {/* === SAPI MATI VIEW === */}
      {viewMode === 'sapi-mati' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-bold text-gray-800">Riwayat Sapi Mati Qurban</h3>
            </div>
            <span className="text-xs text-gray-500">{sapiMatiTotal} record</span>
          </div>
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Eartag / supplier / sebab / keterangan..."
                  value={smFilter.search}
                  onChange={(e) => setSmFilter((p) => ({ ...p, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSmFilterSearch()}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition"
                />
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Tgl dari</label>
              <input
                type="date"
                value={smFilter.start_date}
                onChange={(e) => setSmFilter((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition"
              />
            </div>
            <div className="min-w-[140px]">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Tgl sampai</label>
              <input
                type="date"
                value={smFilter.end_date}
                onChange={(e) => setSmFilter((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="button"
                onClick={handleSmFilterReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleSmFilterSearch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 shadow-sm transition"
              >
                <Search className="w-3.5 h-3.5" />
                Cari
              </button>
            </div>
          </div>
          {sapiMatiLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-gray-500" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : sapiMatiError ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-red-500">
              <AlertCircle className="w-7 h-7" />
              <p className="text-sm">{sapiMatiError}</p>
            </div>
          ) : sapiMatiList.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Skull className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Belum ada data sapi mati</p>
              <p className="text-xs mt-1">Data sapi mati akan muncul setelah ada sapi yang dicatat mati</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Eartag</th>
                    <th className="px-4 py-3">Tgl Kematian</th>
                    <th className="px-4 py-3">Sebab</th>
                    <th className="px-4 py-3">Sapi Pengganti</th>
                    <th className="px-4 py-3">Mengetahui</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sapiMatiList.map((row) => (
                    <tr key={row.pubid || row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-gray-800">{row.eartag}</div>
                        <div className="text-[10px] text-gray-400">{row.eartag_supplier}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.tgl_kematian || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">{row.sebab_kematian || '-'}</span></td>
                      <td className="px-4 py-3">
                        {row.eartag_pengganti ? (
                          <div>
                            <div className="font-mono text-xs font-semibold text-emerald-700">{row.eartag_pengganti}</div>
                            <div className="text-[10px] text-gray-400">{row.eartag_supplier_pengganti}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{row.mengetahui || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={row.keterangan}>{row.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Halaman {smPage} dari {Math.max(1, Math.ceil(sapiMatiTotal / smPerPage))}</span>
                  <select
                    value={smPerPage}
                    onChange={(e) => { setSmPerPage(Number(e.target.value)); setSmPage(1); }}
                    className="px-2 py-1 rounded border border-gray-200 text-xs bg-white"
                  >
                    {[10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n} / hal</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSmPage((p) => Math.max(1, p - 1))}
                    disabled={smPage <= 1}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                  >Prev</button>
                  <button
                    onClick={() => setSmPage((p) => p + 1)}
                    disabled={smPage * smPerPage >= sapiMatiTotal}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                  >Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Kandang Modal (bulk) */}
      <BulkAssignKandangModal
        isOpen={assignKandangOpen}
        onClose={() => setAssignKandangOpen(false)}
        selectedPids={selectedRows.map((r) => r.pid_sapi).filter(Boolean)}
        animalType="sapi"
        onSuccess={(res) => {
          setNotif({ type: 'success', message: res?.message || 'Berhasil assign kandang' });
          setSelectedRows([]);
          fetchData(currentPage);
        }}
      />

      {/* Beri Pakan Konsentrat Modal (bulk) */}
      <BeriPakanKonsentratModal
        isOpen={beriPakanOpen}
        onClose={() => setBeriPakanOpen(false)}
        animalType="sapi"
        preSelectedPids={selectedRows.map((r) => r.pid_sapi).filter(Boolean)}
        onSuccess={(res) => {
          setNotif({ type: 'success', message: res?.message || 'Pemberian pakan konsentrat berhasil disimpan' });
          setSelectedRows([]);
          fetchData(currentPage);
        }}
      />

      {/* Beri OVK Modal */}
      <BeriOvkQurbanModal
        isOpen={Boolean(beriOvkTarget)}
        onClose={() => setBeriOvkTarget(null)}
        row={beriOvkTarget}
        onSuccess={(res) => {
          setNotif({ type: 'success', message: res?.message || 'Pemberian OVK berhasil disimpan' });
          fetchData(currentPage);
        }}
      />

      {/* Confirm Restore Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                restoreTarget.mode === 'stock' ? 'bg-emerald-50' : 'bg-blue-50'
              }`}>
                <Undo2 className={`w-5 h-5 ${restoreTarget.mode === 'stock' ? 'text-emerald-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  {restoreTarget.mode === 'stock' ? 'Kembalikan Sapi ke Stok?' : 'Batalkan Return?'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sapi dengan eartag <span className="font-mono font-semibold text-gray-700">{restoreTarget.eartag || '-'}</span>.
                  {restoreTarget.mode === 'stock' ? (
                    <> Sapi akan diubah ke <span className="text-emerald-600 font-semibold">Tersedia</span> dan bisa dijual ulang. Return tetap valid di transaksi asli.</>
                  ) : (
                    <> Sapi akan <span className="text-blue-600 font-semibold">kembali ke transaksi penjualan</span> (status=terjual). Detail & total transaksi di-revert. Return header ditandai <span className="text-gray-600 font-semibold">reverted</span>.</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                disabled={restoring}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition disabled:opacity-50 ${
                  restoreTarget.mode === 'stock' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                {restoring ? 'Memproses...' : (restoreTarget.mode === 'stock' ? 'Ya, Ke Stok' : 'Ya, Cancel Return')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Potong Paksa Modal */}
      {potongPaksaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Potong Paksa Sapi Qurban</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Eartag: <span className="font-mono font-semibold text-gray-700">{potongPaksaTarget.eartag || '-'}</span>
                    {' · '}
                    <span className="text-amber-600 font-semibold">
                      {Number(potongPaksaTarget.status) === 0 ? 'Tersedia' : Number(potongPaksaTarget.status) === 1 ? 'Terjual (wajib sapi pengganti)' : 'Return'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePotongPaksaModal}
                disabled={submittingPotongPaksa}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {potongPaksaError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{potongPaksaError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Potong Paksa <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={potongPaksaForm.tgl_potong_paksa}
                      onChange={(e) => setPotongPaksaForm((p) => ({ ...p, tgl_potong_paksa: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Sebab */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sebab Potong Paksa <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={sebabOptions.map((o) => ({ value: o.value, label: o.name }))}
                    value={potongPaksaForm.id_sebab_potong_paksa}
                    onChange={(v) => setPotongPaksaForm((p) => ({ ...p, id_sebab_potong_paksa: v ?? '' }))}
                    placeholder="Pilih sebab..."
                    className="text-sm"
                  />
                </div>

                {/* Bobot Selisih */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bobot Selisih (kg) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={potongPaksaForm.bobot_selisih_potong_paksa}
                      onChange={(e) => setPotongPaksaForm((p) => ({ ...p, bobot_selisih_potong_paksa: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Bobot Setelah Potong */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bobot Setelah Potong (kg) <span className="text-gray-400 text-[10px]">opsional</span></label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={potongPaksaForm.bobot_setelah_potong}
                      onChange={(e) => setPotongPaksaForm((p) => ({ ...p, bobot_setelah_potong: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Status Sapi */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Status Sapi (hasil) <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={statusSapiOptions.map((o) => ({ value: o.value, label: o.name }))}
                    value={potongPaksaForm.id_status_sapi_qurban}
                    onChange={(v) => setPotongPaksaForm((p) => ({ ...p, id_status_sapi_qurban: v ?? '' }))}
                    placeholder="Pilih status..."
                    className="text-sm"
                  />
                </div>

                {/* Mengetahui */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mengetahui <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={mengetahuiOptions.map((o) => ({ value: o.id ?? o.pid, label: o.name }))}
                    value={potongPaksaForm.id_mengetahui}
                    onChange={(v) => setPotongPaksaForm((p) => ({ ...p, id_mengetahui: v ?? '' }))}
                    placeholder="Pilih mengetahui..."
                    className="text-sm"
                  />
                </div>

                {/* Lokasi Penyimpanan */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Lokasi Penyimpanan <span className="text-gray-400 text-[10px]">opsional</span></label>
                  <input
                    type="text"
                    placeholder="Cold Storage A, dll"
                    value={potongPaksaForm.lokasi_penyimpanan}
                    onChange={(e) => setPotongPaksaForm((p) => ({ ...p, lokasi_penyimpanan: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Sapi Pengganti — only for status=1 (terjual) */}
              {Number(potongPaksaTarget.status) === 1 && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <label className="block text-xs font-medium text-amber-700 mb-1.5">
                    Sapi Pengganti <span className="text-red-500">*</span>
                    <span className="ml-1 text-[10px] text-amber-600 font-normal">(wajib — sapi terjual, butuh pengganti untuk buyer)</span>
                  </label>
                  <SearchableSelect
                    options={penggantiOptions.map((p) => ({
                      value: p.pid,
                      label: `${p.eartag} / ${p.eartag_supplier} — ${p.nota_sistem || '-'} · ${p.berat ? `${p.berat} kg` : '-'} · Rp ${Number(p.harga_beli || 0).toLocaleString('id-ID')}`,
                    }))}
                    value={potongPaksaForm.pid_sapi_pengganti}
                    onChange={(v) => setPotongPaksaForm((f) => ({ ...f, pid_sapi_pengganti: v ?? '' }))}
                    placeholder="Cari & pilih sapi pengganti..."
                    isLoading={penggantiLoading}
                    className="text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ketik untuk mencari eartag / supplier / nota..."
                    value={penggantiSearch}
                    onChange={(e) => setPenggantiSearch(e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                  {potongPaksaForm.pid_sapi_pengganti && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-100 border border-amber-300 flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">
                        Terpilih: {penggantiOptions.find((p) => p.pid === potongPaksaForm.pid_sapi_pengganti)?.eartag || '-'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan <span className="text-gray-400 text-[10px]">opsional</span></label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={potongPaksaForm.keterangan}
                  onChange={(e) => setPotongPaksaForm((p) => ({ ...p, keterangan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={closePotongPaksaModal}
                disabled={submittingPotongPaksa}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePotongPaksaSubmit}
                disabled={submittingPotongPaksa}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 shadow-sm transition disabled:opacity-50"
              >
                {submittingPotongPaksa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                {submittingPotongPaksa ? 'Menyimpan...' : 'Simpan Potong Paksa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sapi Mati Modal */}
      {sapiMatiTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Skull className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Catat Sapi Mati</h2>
                  <p className="text-xs text-gray-500">Sapi qurban yang dicatat mati — status jadi mati (6)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSapiMatiModal}
                disabled={submittingSapiMati}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Target info */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500 mb-0.5">Eartag</div>
                    <div className="font-mono font-semibold text-gray-800">{sapiMatiTarget.eartag || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Eartag Supplier</div>
                    <div className="font-mono text-gray-700">{sapiMatiTarget.eartag_supplier || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Berat</div>
                    <div className="text-gray-700">{sapiMatiTarget.berat ? `${sapiMatiTarget.berat} kg` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Status</div>
                    <div className="font-semibold text-gray-700">
                      {Number(sapiMatiTarget.status) === 0 ? 'Tersedia' : Number(sapiMatiTarget.status) === 1 ? 'Terjual' : 'Return'}
                    </div>
                  </div>
                </div>
                {Number(sapiMatiTarget.status) === 1 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-amber-700 bg-amber-50 -mx-4 -mb-4 px-4 py-2 rounded-b-xl">
                    ⚠ Sapi terjual — wajib pilih sapi pengganti untuk buyer
                  </div>
                )}
              </div>

              {sapiMatiError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{sapiMatiError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Kematian *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={sapiMatiForm.tgl_kematian}
                      onChange={(e) => setSapiMatiForm((p) => ({ ...p, tgl_kematian: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Sebab Kematian *</label>
                  <SearchableSelect
                    options={sebabKematianOptions.map((o) => ({ value: o.value, label: o.name }))}
                    value={sapiMatiForm.id_sebab_kematian ? Number(sapiMatiForm.id_sebab_kematian) : null}
                    onChange={(v) => setSapiMatiForm((p) => ({ ...p, id_sebab_kematian: v === null ? '' : String(v) }))}
                    placeholder="Pilih sebab kematian..."
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Mengetahui *</label>
                  <SearchableSelect
                    options={mengetahuiOptions.map((o) => ({ value: o.id, label: o.name }))}
                    value={sapiMatiForm.id_mengetahui ? Number(sapiMatiForm.id_mengetahui) : null}
                    onChange={(v) => setSapiMatiForm((p) => ({ ...p, id_mengetahui: v === null ? '' : String(v) }))}
                    placeholder="Pilih yang mengetahui..."
                    className="text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Keterangan</label>
                  <textarea
                    rows={2}
                    value={sapiMatiForm.keterangan}
                    onChange={(e) => setSapiMatiForm((p) => ({ ...p, keterangan: e.target.value }))}
                    placeholder="Catatan tambahan..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:border-gray-400 transition resize-none"
                  />
                </div>
              </div>

              {/* Sapi Pengganti — only for terjual */}
              {Number(sapiMatiTarget.status) === 1 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Beef className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-800">Sapi Pengganti (Wajib)</h4>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl border border-emerald-100 p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Cari sapi pengganti</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={penggantiSearch}
                          onChange={(e) => setPenggantiSearch(e.target.value)}
                          placeholder="Cari eartag / nota qurban..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                        {penggantiLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                      </div>
                    </div>
                    {penggantiOptions.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                        {penggantiOptions.map((opt) => (
                          <button
                            key={opt.pid}
                            type="button"
                            onClick={() => { setSapiMatiForm((p) => ({ ...p, pid_sapi_pengganti: opt.pid })); setPenggantiSearch(`${opt.eartag} / ${opt.eartag_supplier}`); setPenggantiOptions([]); }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-emerald-50 transition ${
                              sapiMatiForm.pid_sapi_pengganti === opt.pid ? 'bg-emerald-50' : ''
                            }`}
                          >
                            <div>
                              <div className="font-mono text-xs font-semibold text-gray-800">{opt.eartag}</div>
                              <div className="text-[10px] text-gray-500">{opt.eartag_supplier} • {opt.berat} kg</div>
                            </div>
                            <div className="text-[10px] text-gray-400">{opt.nota_sistem}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {sapiMatiForm.pid_sapi_pengganti && !penggantiLoading && penggantiOptions.length === 0 && (
                      <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sapi pengganti terpilih
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={closeSapiMatiModal}
                disabled={submittingSapiMati}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSapiMatiSubmit}
                disabled={submittingSapiMati}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 shadow-sm transition disabled:opacity-50"
              >
                {submittingSapiMati ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
                {submittingSapiMati ? 'Menyimpan...' : 'Simpan Sapi Mati'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokSapiQurbanPage;
