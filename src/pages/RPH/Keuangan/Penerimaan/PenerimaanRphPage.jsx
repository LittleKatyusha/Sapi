import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Wallet, Search, Eye, Loader2, FileText, AlertCircle, CheckCircle, Banknote, MoreVertical,
  SlidersHorizontal, ChevronDown, RotateCcw, ArrowDownCircle
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import usePenjualanSapiUtuh from '../../../../hooks/usePenjualanSapiUtuh';
import PenjualanSapiUtuhService from '../../../../services/penjualanSapiUtuhService';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

// Action menu cell with portal to escape table overflow clipping
const ActionMenuCell = ({ row, onDetail, onBayar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX - 140,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const isInsideButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-40 z-[99999]"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        onClick={() => { setIsOpen(false); onDetail(row); }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition"
      >
        <Eye className="w-4 h-4 text-blue-500" /> Detail
      </button>
      {(row.sisa_pembayaran || 0) > 0 && (
        <button
          onClick={() => { setIsOpen(false); onBayar(row); }}
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
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        title="Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};

const JENIS_PENJUALAN_OPTIONS = [
  { value: 'sapi_qurban_utuh', label: 'Sapi Qurban / Utuh' },
];

const TABS = [
  { id: 'transaksi', label: 'Transaksi' },
  { id: 'riwayat', label: 'Riwayat Penerimaan' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'belum_bayar', label: 'Belum Bayar' },
  { value: 'dp', label: 'DP' },
  { value: 'lunas', label: 'Lunas' },
];

const INITIAL_ADVANCED = {
  search: '',
  payment_status: 'all',
  tanggal_awal: '',
  tanggal_akhir: '',
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  cancelled: { label: 'Batal', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' },
};

const BAYAR_CONFIG = {
  lunas: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  dp: { label: 'DP', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
  belum_bayar: { label: 'Belum', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

const formatRupiah = (val) => {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
};

const SummaryCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
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

const PenerimaanRphPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transaksi');
  const [jenisValue, setJenisValue] = useState('sapi_qurban_utuh');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState(INITIAL_ADVANCED);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_ADVANCED);
  const [tableData, setTableData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const { loading, error, fetchData } = usePenjualanSapiUtuh();

  const isHistory = activeTab === 'riwayat';

  // Load data
  const loadData = useCallback(async () => {
    if (isHistory) {
      setHistoryLoading(true);
      setHistoryError(null);
      const result = await PenjualanSapiUtuhService.getPenerimaanHistory({
        length: 1000,
        search: appliedFilters.search || undefined,
        tanggal_awal: appliedFilters.tanggal_awal || undefined,
        tanggal_akhir: appliedFilters.tanggal_akhir || undefined,
      });
      if (result.success) {
        setHistoryData(result.data || []);
      } else {
        setHistoryError(result.message);
      }
      setHistoryLoading(false);
      return;
    }
    const statusBayar = appliedFilters.payment_status && appliedFilters.payment_status !== 'all'
      ? appliedFilters.payment_status
      : 'belum_bayar,dp,lunas';
    const result = await fetchData({
      length: 1000,
      status_pembayaran: statusBayar,
      exclude_status_transaksi: 'draft',
      search: appliedFilters.search || undefined,
    });
    if (result.success && result.data) {
      setTableData(result.data);
    }
  }, [isHistory, fetchData, appliedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAdvanced(INITIAL_ADVANCED);
    setAppliedFilters(INITIAL_ADVANCED);
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
    return tableData;
  }, [tableData]);

  const stats = useMemo(() => {
    const totalSisa = filteredData.reduce((sum, r) => sum + (r.sisa_pembayaran || 0), 0);
    const totalBayar = filteredData.reduce((sum, r) => sum + (r.nominal_pembayaran || 0), 0);
    const totalGrand = filteredData.reduce((sum, r) => {
      return sum + (r.total_harga || 0) + (r.biaya_kirim || 0) + (r.biaya_potong || 0);
    }, 0);
    return {
      count: filteredData.length,
      totalSisa,
      totalBayar,
      totalGrand,
    };
  }, [filteredData]);

  // Filtered history data
  const filteredHistoryData = useMemo(() => {
    return historyData;
  }, [historyData]);

  // History DataTable columns
  const historyColumns = [
    {
      name: 'Tgl Bayar',
      selector: (row) => row.payment_date,
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{row.payment_date || '-'}</span>
          <span className="text-xs text-gray-400">{row.created_at}</span>
        </div>
      ),
    },
    {
      name: 'No Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-800">{row.no_transaksi}</span>,
    },
    {
      name: 'Pembeli',
      selector: (row) => row.nama_pembeli,
      sortable: true,
    },
    {
      name: 'Jenis',
      selector: (row) => row.purchase_type_label,
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.purchase_type === 8 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {row.purchase_type_label}
        </span>
      ),
    },
    {
      name: 'Pembayar',
      selector: (row) => row.nama_pembayar,
      sortable: true,
      cell: (row) => <span className="text-gray-600">{row.nama_pembayar || '-'}</span>,
    },
    {
      name: 'Metode',
      selector: (row) => row.metode_pembayaran,
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">
          {row.metode_pembayaran?.replace('_', ' ') || '-'}
        </span>
      ),
    },
    {
      name: 'Jumlah Diterima',
      selector: (row) => row.amount,
      sortable: true,
      right: true,
      cell: (row) => <span className="font-semibold text-emerald-600">{formatRupiah(row.amount)}</span>,
    },
    {
      name: 'Status',
      selector: (row) => row.payment_status,
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.payment_status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {row.payment_status_label}
        </span>
      ),
    },
  ];

  // DataTable columns
  const columns = useMemo(() => [
    {
      name: 'No.',
      width: '52px',
      center: true,
      cell: (_, idx) => <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>,
    },
    {
      name: 'No. Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      minWidth: '130px',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-gray-800">{row.no_transaksi}</p>
          <p className="text-xs text-gray-400">{row.tanggal_transaksi}</p>
        </div>
      ),
    },
    {
      name: 'Jenis',
      selector: (row) => row.no_transaksi,
      sortable: true,
      width: '110px',
      center: true,
      cell: (row) => {
        const isQurban = row.no_transaksi?.toUpperCase().startsWith('PSQ');
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isQurban
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {isQurban ? 'Qurban' : 'Utuh'}
          </span>
        );
      },
    },
    {
      name: 'Pembeli',
      selector: (row) => row.nama_pembeli,
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.nama_pembeli || '-'}</p>
          <p className="text-xs text-gray-400">{row.no_hp_pembeli || '-'}</p>
        </div>
      ),
    },
    {
      name: 'PIC',
      selector: (row) => row.pic,
      sortable: true,
      width: '90px',
      cell: (row) => <span className="text-sm text-gray-600">{row.pic || '-'}</span>,
    },
    {
      name: 'Total & Sisa',
      minWidth: '170px',
      right: true,
      cell: (row) => {
        const grandTotal = (row.total_harga || 0) + (row.biaya_kirim || 0) + (row.biaya_potong || 0);
        const sisa = row.sisa_pembayaran || 0;
        return (
          <div className="text-right py-1">
            <p className="text-sm font-bold text-gray-800">{formatRupiah(grandTotal)}</p>
            <p className={`text-xs font-semibold ${sisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {sisa > 0 ? `Sisa ${formatRupiah(sisa)}` : 'Lunas'}
            </p>
          </div>
        );
      },
    },
    {
      name: 'Pembayaran',
      selector: (row) => row.status_pembayaran,
      sortable: true,
      width: '120px',
      center: true,
      cell: (row) => {
        const b = BAYAR_CONFIG[row.status_pembayaran] || BAYAR_CONFIG.belum_bayar;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
            {b.label}
          </span>
        );
      },
    },
    {
      name: 'Status',
      selector: (row) => row.status_transaksi,
      sortable: true,
      width: '120px',
      center: true,
      cell: (row) => {
        const c = STATUS_CONFIG[row.status_transaksi] || STATUS_CONFIG.draft;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
          </span>
        );
      },
    },
    {
      name: '',
      center: true,
      width: '52px',
      cell: (row) => (
        <ActionMenuCell
          row={row}
          onDetail={(r) => navigate(`/rph/penjualan-sapi-utuh/detail/${r.pid}`)}
          onBayar={(r) => navigate(`/rph/keuangan/penerimaan/bayar/${r.pid}`)}
        />
      ),
    },
  ], [navigate]);

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '48px', borderBottom: '1px solid #f1f5f9', '&:hover': { backgroundColor: '#f8fafc' } } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
    pagination: { style: { borderTop: '1px solid #e2e8f0', padding: '10px 14px' } },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-800 truncate">Penerimaan</h1>
            <p className="text-gray-500 text-[11px] truncate">Daftar piutang & pelunasan penjualan sapi</p>
          </div>
        </div>

        {/* Summary Cards - always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total Record" value={stats.count} icon={FileText} color="blue" />
          <SummaryCard label="Total Tagihan" value={formatRupiah(stats.totalGrand)} icon={Banknote} color="amber" />
          <SummaryCard label="Total Diterima" value={formatRupiah(stats.totalBayar)} icon={CheckCircle} color="emerald" />
          <SummaryCard label="Total Sisa" value={formatRupiah(stats.totalSisa)} icon={AlertCircle} color="red" />
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

            {/* Jenis Penjualan - compact inline */}
            <div className="flex items-center gap-2 lg:w-72">
              <label className="text-[10px] font-bold text-gray-500 uppercase shrink-0">Jenis</label>
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  options={JENIS_PENJUALAN_OPTIONS}
                  value={jenisValue}
                  onChange={(val) => setJenisValue(val || 'sapi_qurban_utuh')}
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
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pencarian</label>
                  <input
                    type="text"
                    placeholder={isHistory ? "Cari no transaksi, pembeli, pembayar..." : "Cari no transaksi, pembeli, PIC..."}
                    value={advanced.search}
                    onChange={(e) => setAdvanced((p) => ({ ...p, search: e.target.value }))}
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
          {isHistory ? (
            <DataTable
              columns={historyColumns}
              data={filteredHistoryData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              progressPending={historyLoading}
              progressComponent={
                <div className="py-10 flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Memuat riwayat...
                </div>
              }
              noDataComponent={
                <div className="py-10 text-center">
                  <Banknote className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Belum ada riwayat penerimaan</p>
                </div>
              }
              customStyles={customStyles}
              highlightOnHover
              responsive
            />
          ) : (
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
                  <p className="text-gray-500 text-sm">Tidak ada data penerimaan</p>
                </div>
              }
              customStyles={customStyles}
              highlightOnHover
              responsive
            />
          )}
        </div>

        {(error || historyError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error || historyError}
          </div>
        )}
      </div>
    </div>
  );
};

export default PenerimaanRphPage;
