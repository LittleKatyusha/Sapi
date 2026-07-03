import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Wallet, Search, Eye, Loader2, Banknote, MoreVertical, ArrowUpCircle, CheckCircle, Clock,
  SlidersHorizontal, ChevronUp, ChevronDown, RotateCcw
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
];

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
  { id: 'belum-bayar', label: 'Belum Bayar', status: 'belum_bayar' },
  { id: 'belum-lunas', label: 'Belum Lunas', status: 'belum_lunas' },
  { id: 'lunas', label: 'Lunas', status: 'lunas' },
  { id: 'riwayat', label: 'Riwayat Pengeluaran', status: null },
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
  tanggal_awal: '',
  tanggal_akhir: '',
};

const PengeluaranRphPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('belum-bayar');
  const [jenisSelected, setJenisSelected] = useState(false);
  const [jenisValue, setJenisValue] = useState('sapi');
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [advanced, setAdvanced] = useState(INITIAL_ADVANCED);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_ADVANCED);
  const [tableData, setTableData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const { loading, error, fetchList, fetchHistory } = usePengeluaranRph();

  const isHistory = activeTab === 'riwayat';
  const activeTabConfig = TABS.find((t) => t.id === activeTab);

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
    if (!jenisSelected) return;
    const result = await fetchList({
      length: 1000,
      payment_status: activeTabConfig?.status,
      purchase_type: jenisValue,
      search: buildSearchQuery(appliedFilters),
      tanggal_awal: appliedFilters.tanggal_awal || undefined,
      tanggal_akhir: appliedFilters.tanggal_akhir || undefined,
    });
    if (result.success) {
      setTableData(result.data || []);
    }
  }, [isHistory, activeTabConfig, fetchList, fetchHistory, jenisSelected, jenisValue, appliedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setAdvanced(INITIAL_ADVANCED);
    setAppliedFilters(INITIAL_ADVANCED);
    if (tab === 'belum-bayar' || tab === 'belum-lunas') {
      setJenisSelected(false);
    }
  };

  const handleAdvancedSearch = () => {
    setAppliedFilters(advanced);
  };

  const handleReset = () => {
    setAdvanced(INITIAL_ADVANCED);
    setAppliedFilters(INITIAL_ADVANCED);
  };

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((v) => v && v.trim() !== '').length,
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
            <div className="text-sm font-semibold text-gray-800">{r.no_po || '-'}</div>
            <div className="text-xs text-gray-500">{r.nota || r.nota_sistem || '-'}</div>
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
      <div className="max-w-[1800px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pengeluaran RPH</h1>
            <p className="text-gray-500 text-xs">Pembayaran Pembelian Sapi RPH ke HO</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex gap-1 w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total Transaksi" value={stats.count} icon={Wallet} color="blue" />
          <SummaryCard label="Total Tagihan" value={formatRupiah(stats.totalTagihan)} icon={Banknote} color="slate" />
          <SummaryCard label="Total Dibayar" value={formatRupiah(stats.totalBayar)} icon={CheckCircle} color="emerald" />
          <SummaryCard label="Total Sisa" value={formatRupiah(stats.totalSisa)} icon={Clock} color="red" />
        </div>

        {/* Gatekeeping: Pilih jenis pembelian dulu untuk tab belum-bayar / belum-lunas */}
        {!isHistory && !jenisSelected && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
            <p className="text-gray-500 text-sm mb-4">Pilih jenis pembelian terlebih dahulu untuk menampilkan data</p>
            <div className="max-w-xs mx-auto">
              <SearchableSelect
                options={JENIS_PEMBELIAN_OPTIONS}
                value=""
                onChange={(val) => {
                  setJenisValue(val || 'sapi');
                  setJenisSelected(true);
                }}
                placeholder="Pilih Jenis Pembelian"
                isClearable={false}
              />
            </div>
          </div>
        )}

        {/* Pencarian Lanjutan */}
        {(isHistory || jenisSelected) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
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
              <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">No PO</label>
                    <input
                      type="text"
                      placeholder="Cari no PO..."
                      value={advanced.no_po}
                      onChange={(e) => setAdvanced((p) => ({ ...p, no_po: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nota</label>
                    <input
                      type="text"
                      placeholder="Cari nota..."
                      value={advanced.nota}
                      onChange={(e) => setAdvanced((p) => ({ ...p, nota: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nota Sistem</label>
                    <input
                      type="text"
                      placeholder="Cari nota sistem..."
                      value={advanced.nota_sistem}
                      onChange={(e) => setAdvanced((p) => ({ ...p, nota_sistem: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">No Surat Jalan</label>
                    <input
                      type="text"
                      placeholder="Cari surat jalan..."
                      value={advanced.no_surat_jalan}
                      onChange={(e) => setAdvanced((p) => ({ ...p, no_surat_jalan: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">No Faktur</label>
                    <input
                      type="text"
                      placeholder="Cari no faktur..."
                      value={advanced.no_faktur}
                      onChange={(e) => setAdvanced((p) => ({ ...p, no_faktur: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  {isHistory && (
                    <>
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Pembayar</label>
                        <input
                          type="text"
                          placeholder="Cari nama pembayar..."
                          value={advanced.nama_pembayar}
                          onChange={(e) => setAdvanced((p) => ({ ...p, nama_pembayar: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Metode Pembayaran</label>
                        <input
                          type="text"
                          placeholder="Cari metode..."
                          value={advanced.metode_pembayaran}
                          onChange={(e) => setAdvanced((p) => ({ ...p, metode_pembayaran: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Awal</label>
                    <input
                      type="date"
                      value={advanced.tanggal_awal}
                      onChange={(e) => setAdvanced((p) => ({ ...p, tanggal_awal: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Akhir</label>
                    <input
                      type="date"
                      value={advanced.tanggal_akhir}
                      onChange={(e) => setAdvanced((p) => ({ ...p, tanggal_akhir: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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
        )}

        {/* Table — only show when jenis selected or history tab */}
        {(isHistory || jenisSelected) && (
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
        )}

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
