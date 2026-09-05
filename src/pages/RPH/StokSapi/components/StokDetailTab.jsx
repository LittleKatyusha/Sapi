import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, RotateCcw, RefreshCw, AlertCircle, Home, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import ActionButton from './ActionButton';
import StokDetailModal from './StokDetailModal';
import BulkAssignKandangModal from '../modals/BulkAssignKandangModal';
import HistoryPakanKonsentratModal from '../modals/HistoryPakanKonsentratModal';
import StokSapiService from '../../../../services/stokSapiService';
import { formatNumber } from '../constants/dummyData';
import { Notification } from '../../../../components/shared/NotificationComponent';

const StokDetailTab = ({ onOvk, onPotongPaksa, onPotongSapiBiasa, onSapiMati, refreshTrigger = 0 }) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [historyPakanTarget, setHistoryPakanTarget] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kandangFilter, setKandangFilter] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const startDateRef = useRef('');
  const endDateRef = useRef('');
  const searchQueryRef = useRef('');
  const statusFilterRef = useRef('');
  const kandangFilterRef = useRef('');
  const currentPageRef = useRef(1);
  const perPageRef = useRef(10);
  const [selectedPids, setSelectedPids] = useState([]);
  const [bulkKandangModalOpen, setBulkKandangModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsFiltered, setRecordsFiltered] = useState(0);

  // Filter options from backend
  const [kandangOptions, setKandangOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const rows = useMemo(() => data?.rows || [], [data]);
  const totalPages = Math.max(1, Math.ceil(recordsFiltered / perPage));

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  // Selection helpers
  const allPids = useMemo(() => rows.map((r) => r.pid).filter(Boolean), [rows]);
  const allSelected = allPids.length > 0 && selectedPids.length === allPids.length;
  const someSelected = selectedPids.length > 0 && selectedPids.length < allPids.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedPids(allSelected ? [] : allPids);
  }, [allSelected, allPids]);

  const toggleSelect = useCallback((pid) => {
    setSelectedPids((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
  }, []);

  const clearSelection = useCallback(() => setSelectedPids([]), []);

  const handleDetail = (row) => {
    setDetailRow(row);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setDetailRow(null);
  };

  const fetchData = useCallback(async (opts = {}) => {
    const {
      start = (currentPageRef.current - 1) * perPageRef.current,
      length = perPageRef.current,
      search = searchQueryRef.current,
      statusFilter: sf = statusFilterRef.current,
      kandangFilter: kf = kandangFilterRef.current,
      startDate: sd = startDateRef.current,
      endDate: ed = endDateRef.current,
    } = opts;

    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getStokDetail(sd || null, ed || null, {
        start,
        length,
        search,
        statusFilter: sf,
        kandangFilter: kf,
        draw: 1,
      });
      if (response.success) {
        setData(response.data);
        setRecordsTotal(response.data?.recordsTotal ?? 0);
        setRecordsFiltered(response.data?.recordsFiltered ?? 0);
      } else {
        setError(response.message || 'Gagal memuat data');
        showNotification('error', response.message || 'Gagal memuat data stok detail');
        setData(null);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      showNotification('error', err?.message || 'Terjadi kesalahan saat mengambil data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Fetch filter options once on mount
  useEffect(() => {
    (async () => {
      const res = await StokSapiService.getFilterOptions();
      if (res.success) {
        setKandangOptions(res.data?.kandang || []);
        setStatusOptions(res.data?.status || []);
      }
    })();
  }, []);

  const handleBulkKandangSuccess = useCallback((res) => {
    setBulkKandangModalOpen(false);
    setSelectedPids([]);
    showNotification('success', res?.message || 'Berhasil assign kandang');
    fetchData();
  }, [fetchData, showNotification]);

  // Initial load + refresh trigger only (not on filter typing)
  useEffect(() => {
    fetchData();
  }, [refreshTrigger, fetchData]);

  const handleSearch = () => {
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    searchQueryRef.current = searchQuery;
    statusFilterRef.current = statusFilter;
    kandangFilterRef.current = kandangFilter;
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchData({ start: 0 });
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setStatusFilter('');
    setKandangFilter('');
    startDateRef.current = '';
    endDateRef.current = '';
    searchQueryRef.current = '';
    statusFilterRef.current = '';
    kandangFilterRef.current = '';
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchData({ start: 0, search: '', statusFilter: '', kandangFilter: '', startDate: '', endDate: '' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    currentPageRef.current = newPage;
    setCurrentPage(newPage);
    fetchData({ start: (newPage - 1) * perPageRef.current });
  };

  const handlePerPageChange = (newPerPage) => {
    perPageRef.current = newPerPage;
    setPerPage(newPerPage);
    currentPageRef.current = 1;
    setCurrentPage(1);
    fetchData({ start: 0, length: newPerPage });
  };

  const hasActiveFilter = searchQuery || statusFilter || kandangFilter || startDate || endDate;

  /** Render status badge based on status_sapi value */
  const renderStatusBadge = (status) => {
    if (!status) return <span className="text-gray-300">-</span>;
    const upper = String(status).toUpperCase();
    if (upper === 'PEMELIHARAAN') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {status}
        </span>
      );
    }
    if (upper.includes('SIAP') || upper.includes('POTONG')) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
          {status}
        </span>
      );
    }
    // Default badge for other statuses
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .skeleton-cell {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .stok-detail-table-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }
        .stok-detail-table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Filter Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Filter className="h-4 w-4 text-emerald-600" />
            Filter Pencarian
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilter && (
              <span className="text-xs text-emerald-600 font-medium">
                {recordsFiltered} dari {recordsTotal} sapi
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowAdvancedFilter((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter Lanjutan
              {showAdvancedFilter ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Main filter row */}
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:gap-2">
          {/* Search */}
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Cari</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Eartag, jenis sapi, pemasok, nota..."
                className="w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          {/* Date range */}
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5 lg:w-40">
              <label className="text-xs font-medium text-gray-500">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { startDateRef.current = e.target.value; setStartDate(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 lg:w-40">
              <label className="text-xs font-medium text-gray-500">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { endDateRef.current = e.target.value; setEndDate(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Search className="h-4 w-4" />
              Cari
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                startDateRef.current = startDate;
                endDateRef.current = endDate;
                searchQueryRef.current = searchQuery;
                statusFilterRef.current = statusFilter;
                kandangFilterRef.current = kandangFilter;
                fetchData();
              }}
              disabled={loading}
              title="Refresh"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Advanced filters (collapsible) */}
        {showAdvancedFilter && (
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Status Sapi</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="">Semua status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Kandang</label>
              <select
                value={kandangFilter}
                onChange={(e) => setKandangFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              >
                <option value="">Semua kandang</option>
                {kandangOptions.map((k) => (
                  <option key={k.kode} value={k.kode}>{k.kode} — {k.nama}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-emerald-600 font-medium hover:underline"
                >
                  {recordsFiltered} dari {recordsTotal} sapi · Reset filter
                </button>
              ) : (
                <span className="text-xs text-gray-400">Tidak ada filter aktif</span>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!loading && !rows.length && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium text-gray-500">Tidak ada data stok sapi</p>
          <p className="text-xs mt-1 text-gray-400">Belum ada sapi yang terdaftar di stok</p>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedPids.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
          <div className="text-sm text-emerald-800">
            <span className="font-semibold">{selectedPids.length} sapi</span> dipilih
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkKandangModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Home className="h-4 w-4" />
              Assign Kandang
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Detail Table with horizontal scroll */}
      {(rows.length > 0 || loading) && !error && (
      <div className="relative stok-detail-table-wrapper overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        {loading && (
          <div className="absolute top-0 left-0 right-0 z-30 h-0.5 overflow-hidden bg-emerald-100">
            <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          </div>
        )}
        <table className="w-full text-sm border-collapse" style={{ minWidth: '1400px' }}>
          <thead>
            <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {/* Sticky columns */}
              <th
                className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky left-0 z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ width: '40px', minWidth: '40px' }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer accent-emerald-600"
                  disabled={loading || rows.length === 0}
                />
              </th>
              <th
                className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '40px', width: '50px', minWidth: '50px' }}
              >
                No
              </th>
              <th
                className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '90px', width: '70px', minWidth: '70px' }}
              >
                Aksi
              </th>
              <th
                className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap sticky z-20 bg-gradient-to-r from-emerald-600 to-teal-600"
                style={{ left: '160px', minWidth: '160px' }}
              >
                Sapi
              </th>
              {/* Scrollable columns */}
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Kandang</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">No Nota</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Pemeliharaan</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">OVK</th>
              <th className="py-2 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Nilai</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Status</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Asal</th>
              <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Keterangan</th>
            </tr>
          </thead>

          <tbody className={loading && rows.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
            {loading && rows.length === 0 && Array.from({ length: 8 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="border-b border-gray-100 bg-white">
                <td className="py-3 px-3 border border-gray-100 sticky left-0 z-10 bg-white" style={{ width: '40px', minWidth: '40px' }}>
                  <div className="skeleton-cell h-4 w-4 rounded mx-auto" />
                </td>
                <td className="py-3 px-3 border border-gray-100 sticky z-20 bg-white" style={{ left: '40px', width: '50px', minWidth: '50px' }}>
                  <div className="skeleton-cell h-4 w-6 rounded mx-auto" />
                </td>
                <td className="py-3 px-3 border border-gray-100 sticky z-20 bg-white" style={{ left: '90px', width: '70px', minWidth: '70px' }}>
                  <div className="skeleton-cell h-6 w-8 rounded mx-auto" />
                </td>
                <td className="py-3 px-3 border border-gray-100 sticky z-10 bg-white" style={{ left: '160px', minWidth: '160px' }}>
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-4 w-32 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                    <div className="skeleton-cell h-3 w-20 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="skeleton-cell h-3 w-20 rounded" />
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-16 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-28 rounded" />
                    <div className="skeleton-cell h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-20 rounded ml-auto" />
                    <div className="skeleton-cell h-4 w-24 rounded ml-auto" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-5 w-28 rounded-full" />
                    <div className="skeleton-cell h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="space-y-1.5">
                    <div className="skeleton-cell h-3 w-28 rounded" />
                    <div className="skeleton-cell h-3 w-20 rounded" />
                    <div className="skeleton-cell h-3 w-24 rounded" />
                  </div>
                </td>
                <td className="py-3 px-3 border border-gray-100">
                  <div className="skeleton-cell h-3 w-24 rounded" />
                </td>
              </tr>
            ))}
            {rows.length > 0 && rows.map((row, index) => (
              <tr
                key={row.pid || index}
                className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                {/* Sticky: Checkbox */}
                <td
                  className={`py-2 px-3 text-center border border-gray-100 sticky left-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ width: '40px', minWidth: '40px' }}
                >
                  <input
                    type="checkbox"
                    checked={row.pid ? selectedPids.includes(row.pid) : false}
                    onChange={() => row.pid && toggleSelect(row.pid)}
                    className="h-4 w-4 cursor-pointer accent-emerald-600"
                  />
                </td>
                {/* Sticky: No */}
                <td
                  className={`py-2 px-3 text-center font-medium text-gray-600 border border-gray-100 sticky z-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: '40px', width: '50px', minWidth: '50px' }}
                >
                  {row.no_urut || index + 1}
                </td>
                {/* Sticky: Aksi */}
                <td
                  className={`py-2 px-3 text-center border border-gray-100 sticky z-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: '90px', width: '70px', minWidth: '70px' }}
                >
                  <div className="flex items-center justify-center">
                    <ActionButton
                       row={{ id: row.pid || row.no_urut, ...row }}
                       openMenuId={openMenuId}
                       setOpenMenuId={setOpenMenuId}
                       onDetail={() => handleDetail(row)}
                       onEdit={() => navigate(`/rph/stok-sapi/edit/${row.pid}`)}
                       onDelete={() => console.log('Delete', row)}
                        onOvk={() => onOvk(row)}
                       onPotongPaksa={() => onPotongPaksa(row)}
                        onPotongSapiBiasa={() => onPotongSapiBiasa(row)}
                        onSapiMati={() => onSapiMati(row)}
                    />
                  </div>
                </td>
                {/* Sticky: Sapi */}
                <td
                  className={`py-2 px-3 border border-gray-100 whitespace-nowrap sticky z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  style={{ left: '160px', minWidth: '160px' }}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-gray-800">{row.jenis_sapi}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Eartag:</span> {row.eartag || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Eartag Supplier:</span> {row.eartag_supplier || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Jenis Kelamin:</span>{' '}
                      {row.jenis_kelamin === 'JANTAN'
                        ? 'Jantan'
                        : row.jenis_kelamin === 'BETINA'
                          ? 'Betina'
                          : row.jenis_kelamin === 'BELUM_DIKETAHUI'
                            ? 'Belum Diketahui'
                            : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Bobot:</span> {row.bobot ? `${Number(row.bobot)} KG` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">RPH:</span> {row.nama_rph || row.lokasi_sapi || '-'}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        row.source === 'BIRTH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {row.source === 'BIRTH' ? 'Kelahiran' : 'Pembelian'}
                      </span>
                    </div>
                  </div>
                </td>
                {/* Kandang */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  {row.kandang_kode ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200" title={row.kandang_nama}>
                      {row.kandang_kode}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                {/* No Nota */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <span className="text-xs text-gray-700 font-medium" title={row.nomor_nota}>{row.nomor_nota || '-'}</span>
                </td>
                {/* Pemeliharaan */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setHistoryPakanTarget(row)}
                    className="block text-left space-y-0.5 rounded-lg hover:bg-amber-50/60 hover:ring-2 hover:ring-amber-100 transition cursor-pointer px-1 -mx-1"
                    title="Klik untuk lihat history pemberian pakan"
                  >
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">DOF:</span> {row.dof_hari || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Pakan:</span> {row.jumlah_pakan_sesi || 0}x · Rp {row.nilai_pakan || '0'}
                    </div>
                    <div className="text-xs text-gray-700 font-medium">
                      total: Rp {row.nilai_pakan || '0'}
                    </div>
                    {row.sudah_diberi_pakan_hari_ini && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Sudah diberi pakan hari ini{row.sesi_pakan_hari_ini > 1 ? ` (${row.sesi_pakan_hari_ini}x)` : ''}
                      </div>
                    )}
                  </button>
                </td>
                {/* OVK */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600 max-w-[140px] truncate" title={row.ovk}>{row.ovk || '-'}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Nilai:</span> {row.nilai_ovk || 'Rp 0'}
                    </div>
                  </div>
                </td>
                {/* Nilai */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap text-right">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500" title="Harga Pokok Pembelian per kg (harga + markup)">
                      <span className="text-gray-400">Beli/kg:</span> {row.hpp ? `Rp ${row.hpp}` : 'Rp 0'}
                    </div>
                    <div className="font-semibold text-teal-700" title="(bobot × hpp) + pakan + ovk">
                      {row.total || 'Rp 0'}
                    </div>
                    <div className="text-[10px] text-gray-400 leading-tight">
                      ({row.bobot || 0} × {row.hpp || 0}) + {row.nilai_pakan || 0} + {row.nilai_ovk || 0}
                    </div>
                  </div>
                </td>
                {/* Status */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    {renderStatusBadge(row.status_sapi)}
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Kondisi:</span> {row.kondisi_sapi || '-'}
                    </div>
                  </div>
                </td>
                {/* Asal */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600 max-w-[140px] truncate" title={row.pemasok}>{row.pemasok || '-'}</div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Pengirim:</span> {row.pengirim || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Penerima:</span> {row.penerima || '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-gray-400">Tgl:</span> {row.tanggal_kedatangan || '-'}
                    </div>
                  </div>
                </td>
                {/* Keterangan */}
                <td className="py-2 px-3 border border-gray-100 whitespace-nowrap max-w-[160px] truncate" title={row.keterangan_kondisi}>
                  <span className="text-gray-600">{row.keterangan_kondisi || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Summary footer + pagination */}
      {rows.length > 0 && !loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <p className="text-sm text-gray-500 font-medium">
            Total {formatNumber(recordsFiltered)} data sapi{hasActiveFilter && recordsFiltered !== recordsTotal ? ` (dari ${formatNumber(recordsTotal)})` : ''}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tampilkan</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">/ halaman</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <StokDetailModal
          row={detailRow}
          onClose={handleCloseDetail}
        />
      )}

      <BulkAssignKandangModal
        isOpen={bulkKandangModalOpen}
        onClose={() => setBulkKandangModalOpen(false)}
        selectedPids={selectedPids}
        onSuccess={handleBulkKandangSuccess}
      />

      <HistoryPakanKonsentratModal
        isOpen={Boolean(historyPakanTarget)}
        onClose={() => setHistoryPakanTarget(null)}
        sapi={historyPakanTarget}
      />

      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default StokDetailTab;
