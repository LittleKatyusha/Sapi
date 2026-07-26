import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Wallet, Search, Eye, Loader2, Banknote, MoreVertical, ArrowUpCircle, CheckCircle, Clock,
  SlidersHorizontal, ChevronDown, RotateCcw
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import usePengeluaranRph from '../../../../hooks/usePengeluaranRph';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const JENIS_PEMBELIAN_OPTIONS = [
  { value: 'sapi', label: 'Pembelian Sapi RPH' },
  { value: 'qurban', label: 'Pembelian Sapi Qurban' },
  { value: 'feedmil', label: 'Pembelian Feedmil' },
  { value: 'ovk', label: 'Pembelian OVK' },
  { value: 'lain_lain', label: 'Pembelian Lain-Lain' },
  { value: 'kulit', label: 'Pembelian Kulit' },
];

const ActionMenuCell = ({ row, onDetail, onBayar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const gap = 4;
    const padding = 8;
    // position:fixed uses viewport coords — do not add scrollY/scrollX
    let left = rect.right - menuWidth;
    left = Math.max(padding, Math.min(left, window.innerWidth - menuWidth - padding));
    let top = rect.bottom + gap;
    if (top + 120 > window.innerHeight) {
      top = Math.max(padding, rect.top - 120 - gap);
    }
    setMenuPos({ top, left });
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setMenuPos(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const isInsideButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
        setMenuPos(null);
      }
    };
    const onScrollOrResize = () => updatePosition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const menuContent = menuPos && (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-40 z-[99999]"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        type="button"
        onClick={() => { setIsOpen(false); setMenuPos(null); onDetail(row); }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition"
      >
        <Eye className="w-4 h-4 text-blue-500" /> Detail
      </button>
      {(row.sisa_pembayaran || 0) > 0 && (
        <button
          type="button"
          onClick={() => { setIsOpen(false); setMenuPos(null); onBayar(row); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-2 transition"
        >
          <Banknote className="w-4 h-4 text-emerald-500" /> Bayar
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        title="Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && menuContent && createPortal(menuContent, document.body)}
    </div>
  );
};

const PAYMENT_STATUS_CONFIG = {
  2: { label: 'Belum Bayar', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  0: { label: 'Belum Lunas', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  1: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
};

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');

const SummaryCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const TABS = [
  { id: 'transaksi', label: 'Transaksi', status: null },
  { id: 'riwayat', label: 'Riwayat Pengeluaran', status: null },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'belum_bayar', label: 'Belum Bayar' },
  { value: 'belum_lunas', label: 'Belum Lunas' },
  { value: 'lunas', label: 'Lunas' },
];

const buildSearchQuery = (filters) => {
  const parts = [];
  if (filters.no_po) parts.push(filters.no_po);
  if (filters.nota) parts.push(filters.nota);
  if (filters.nota_sistem) parts.push(filters.nota_sistem);
  if (filters.no_surat_jalan) parts.push(filters.no_surat_jalan);
  if (filters.no_faktur) parts.push(filters.no_faktur);
  if (filters.nama_pembayar) parts.push(filters.nama_pembayar);
  if (filters.metode_pembayaran) parts.push(filters.metode_pembayaran);
  return parts.length ? parts.join(' ') : undefined;
};

const INITIAL_ADVANCED = {
  no_po: '',
  nota: '',
  nota_sistem: '',
  no_surat_jalan: '',
  no_faktur: '',
  nama_pembayar: '',
  metode_pembayaran: '',
  payment_status: 'all',
  tanggal_awal: '',
  tanggal_akhir: '',
};

const PengeluaranRphPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transaksi');
  const [jenisValue, setJenisValue] = useState('sapi');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState(INITIAL_ADVANCED);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_ADVANCED);
  const [tableData, setTableData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const { loading, error, fetchList, fetchHistory } = usePengeluaranRph();

  const isHistory = activeTab === 'riwayat';

  const loadData = useCallback(async () => {
    if (isHistory) {
      const result = await fetchHistory({
        length: 1000,
        purchase_type: jenisValue,
        search: buildSearchQuery(appliedFilters),
        tanggal_awal: appliedFilters.tanggal_awal || undefined,
        tanggal_akhir: appliedFilters.tanggal_akhir || undefined,
      });
      if (result.success) {
        setHistoryData(result.data || []);
      }
      return;
    }
    const result = await fetchList({
      length: 1000,
      payment_status: appliedFilters.payment_status && appliedFilters.payment_status !== 'all' ? appliedFilters.payment_status : undefined,
      purchase_type: jenisValue,
      search: buildSearchQuery(appliedFilters),
      tanggal_awal: appliedFilters.tanggal_awal || undefined,
      tanggal_akhir: appliedFilters.tanggal_akhir || undefined,
    });
    if (result.success) {
      setTableData(result.data || []);
    }
  }, [isHistory, fetchList, fetchHistory, jenisValue, appliedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAdvanced(INITIAL_ADVANCED);
    setAppliedFilters(INITIAL_ADVANCED);
  };

  const handleJenisChange = (val) => {
    setJenisValue(val || 'sapi');
  };

  const handleAdvancedSearch = () => {
    setAppliedFilters(advanced);
  };

  const handleReset = () => {
    setAdvanced(INITIAL_ADVANCED);
    setAppliedFilters(INITIAL_ADVANCED);
  };

  const activeFilterCount = useMemo(
    () => Object.entries(appliedFilters).filter(([k, v]) => {
      if (k === 'payment_status') return v && v !== 'all';
      return v && String(v).trim() !== '';
    }).length,
    [appliedFilters]
  );

  const filteredData = useMemo(() => {
    const data = isHistory ? historyData : tableData;
    return data;
  }, [tableData, historyData, isHistory]);

  const stats = useMemo(() => {
    const totalSisa = filteredData.reduce((sum, r) => sum + (r.sisa_pembayaran || 0), 0);
    const totalBayar = filteredData.reduce((sum, r) => sum + (r.total_terbayar || r.amount || 0), 0);
    const totalTagihan = filteredData.reduce((sum, r) => sum + (r.total_tagihan || 0), 0);
    return { count: filteredData.length, totalSisa, totalBayar, totalTagihan };
  }, [filteredData]);

  const onBayar = useCallback((row) => {
    navigate(`/rph/keuangan/pengeluaran/bayar/${row.pid}`);
  }, [navigate]);

  const onDetail = useCallback((row) => {
    navigate(`/rph/keuangan/pengeluaran/bayar/${row.pid}`);
  }, [navigate]);

  const columns = useMemo(() => {
    if (isHistory) {
      return [
        {
          name: 'No PO / Nota',
          cell: (r) => (
            <div className="py-1">
              <div className="text-sm font-semibold text-gray-800">{r.no_po || '-'}</div>
              <div className="text-xs text-gray-500">{r.nota || '-'}</div>
            </div>
          ),
          sortable: true,
          sortField: 'no_po',
        },
        {
          name: 'Tanggal',
          selector: (r) => r.payment_date || r.created_at,
          sortable: true,
          cell: (r) => <span className="text-sm text-gray-600">{r.payment_date || r.created_at}</span>,
        },
        {
          name: 'Nominal',
          selector: (r) => r.amount,
          sortable: true,
          right: true,
          cell: (r) => <span className="text-sm font-bold text-emerald-600">{formatRupiah(r.amount)}</span>,
        },
        {
          name: 'Metode',
          selector: (r) => r.metode_pembayaran,
          center: true,
          cell: (r) => (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
              {r.metode_pembayaran?.replace('_', ' ')?.toUpperCase() || '-'}
            </span>
          ),
        },
        {
          name: 'Pembayar',
          selector: (r) => r.nama_pembayar,
          cell: (r) => <span className="text-sm text-gray-600">{r.nama_pembayar || '-'}</span>,
        },
      ];
    }

    return [
      {
        name: 'No PO / Nota',
        cell: (r) => (
          <div className="py-1">
            <div className="text-sm font-semibold text-gray-800">{r.no_po || r.nota_sistem || r.nota || '-'}</div>
            <div className="text-xs text-gray-500">
              {r.nota_sistem_ho ? `HO: ${r.nota_sistem_ho}` : (r.nota && r.nota_sistem ? r.nota : '-')}
            </div>
            {r.nota && r.nota_sistem_ho && (
              <div className="text-xs text-gray-500">Nota: {r.nota}</div>
            )}
          </div>
        ),
        sortable: true,
        sortField: 'no_po',
      },
      {
        name: 'Total Tagihan',
        selector: (r) => r.total_tagihan,
        sortable: true,
        right: true,
        cell: (r) => <span className="text-sm font-bold text-gray-800">{formatRupiah(r.total_tagihan)}</span>,
      },
      {
        name: 'Dibayar',
        selector: (r) => r.total_terbayar,
        sortable: true,
        right: true,
        cell: (r) => <span className="text-sm font-bold text-emerald-600">{formatRupiah(r.total_terbayar)}</span>,
      },
      {
        name: 'Sisa',
        selector: (r) => r.sisa_pembayaran,
        sortable: true,
        right: true,
        cell: (r) => (
          <span className={`text-sm font-bold ${(r.sisa_pembayaran || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatRupiah(r.sisa_pembayaran)}
          </span>
        ),
      },
      {
        name: 'Status',
        selector: (r) => r.payment_status,
        center: true,
        cell: (r) => {
          const cfg = PAYMENT_STATUS_CONFIG[r.payment_status] || PAYMENT_STATUS_CONFIG[2];
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {cfg.label}
            </span>
          );
        },
      },
      {
        name: 'Aksi',
        right: true,
        cell: (r) => <ActionMenuCell row={r} onDetail={onDetail} onBayar={onBayar} />,
      },
    ];
  }, [isHistory, onBayar, onDetail]);

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '48px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '8px 12px', fontSize: '13px', color: '#334155' } },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-800 truncate">Pengeluaran RPH</h1>
            <p className="text-gray-500 text-[11px] truncate">Pembayaran Pembelian Sapi RPH ke HO</p>
          </div>
        </div>

        {/* Summary Cards - always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total Transaksi" value={stats.count} icon={Wallet} color="blue" />
          <SummaryCard label="Total Tagihan" value={formatRupiah(stats.totalTagihan)} icon={Banknote} color="slate" />
          <SummaryCard label="Total Dibayar" value={formatRupiah(stats.totalBayar)} icon={CheckCircle} color="emerald" />
          <SummaryCard label="Total Sisa" value={formatRupiah(stats.totalSisa)} icon={Clock} color="red" />
        </div>

        {/* Unified Toolbar: tabs + jenis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1 w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Jenis Pembelian - compact inline */}
            <div className="flex items-center gap-2 lg:w-72">
              <label className="text-[10px] font-bold text-gray-500 uppercase shrink-0">Jenis</label>
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  options={JENIS_PEMBELIAN_OPTIONS}
                  value={jenisValue}
                  onChange={handleJenisChange}
                  placeholder="Pilih jenis..."
                  isClearable={false}
                  accentColor="green"
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Lanjutan - separate card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 transition ${
              advancedOpen ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-gray-700">Filter Lanjutan</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-emerald-500 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Advanced Filter Panel - collapsible */}
          {advancedOpen && (
            <div className="px-4 pb-4 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No PO</label>
                  <input
                    type="text"
                    placeholder="Cari no PO..."
                    value={advanced.no_po}
                    onChange={(e) => setAdvanced((p) => ({ ...p, no_po: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nota</label>
                  <input
                    type="text"
                    placeholder="Cari nota..."
                    value={advanced.nota}
                    onChange={(e) => setAdvanced((p) => ({ ...p, nota: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nota Sistem</label>
                  <input
                    type="text"
                    placeholder="Cari nota sistem..."
                    value={advanced.nota_sistem}
                    onChange={(e) => setAdvanced((p) => ({ ...p, nota_sistem: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No Surat Jalan</label>
                  <input
                    type="text"
                    placeholder="Cari surat jalan..."
                    value={advanced.no_surat_jalan}
                    onChange={(e) => setAdvanced((p) => ({ ...p, no_surat_jalan: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">No Faktur</label>
                  <input
                    type="text"
                    placeholder="Cari no faktur..."
                    value={advanced.no_faktur}
                    onChange={(e) => setAdvanced((p) => ({ ...p, no_faktur: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                {/* Status Pembayaran - only for transaksi tab */}
                {!isHistory && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status Bayar</label>
                    <SearchableSelect
                      options={PAYMENT_STATUS_OPTIONS}
                      value={advanced.payment_status}
                      onChange={(val) => setAdvanced((p) => ({ ...p, payment_status: val ?? 'all' }))}
                      placeholder="Semua Status"
                      isSearchable={false}
                      isClearable={false}
                      accentColor="green"
                      className="text-sm"
                    />
                  </div>
                )}
                {isHistory && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Pembayar</label>
                      <input
                        type="text"
                        placeholder="Cari nama pembayar..."
                        value={advanced.nama_pembayar}
                        onChange={(e) => setAdvanced((p) => ({ ...p, nama_pembayar: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Metode Bayar</label>
                      <input
                        type="text"
                        placeholder="Cari metode..."
                        value={advanced.metode_pembayaran}
                        onChange={(e) => setAdvanced((p) => ({ ...p, metode_pembayaran: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tanggal Awal</label>
                  <input
                    type="date"
                    value={advanced.tanggal_awal}
                    onChange={(e) => setAdvanced((p) => ({ ...p, tanggal_awal: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={advanced.tanggal_akhir}
                    onChange={(e) => setAdvanced((p) => ({ ...p, tanggal_akhir: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleAdvancedSearch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Terapkan Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            progressPending={loading}
            progressComponent={
              <div className="py-10 flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
              </div>
            }
            noDataComponent={
              <div className="py-10 text-center">
                <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Tidak ada data pengeluaran</p>
              </div>
            }
            customStyles={customStyles}
            highlightOnHover
            responsive
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PengeluaranRphPage;
