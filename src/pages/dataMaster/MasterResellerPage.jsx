import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Plus,
  Search,
  Users,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { createPortal } from 'react-dom';

import useReseller from '../../hooks/useReseller';
import ResellerFormModal from './reseller/ResellerFormModal';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';
import Notification from '../../components/shared/Notification';

const STORAGE_KEY = 'master_reseller_state_v1';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];

const MasterResellerPage = () => {
  const { loading, error, fetchData, create, update, remove } = useReseller();

  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState(1);
  const [sortDir, setSortDir] = useState('asc');

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterInput, setFilterInput] = useState({ kode_reseller: '', nama_reseller: '', telepon: '', email: '', status: '' });
  const [appliedFilters, setAppliedFilters] = useState({ kode_reseller: '', nama_reseller: '', telepon: '', email: '', status: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  const searchTimer = useRef(null);
  const stateRef = useRef({});
  stateRef.current = { currentPage, perPage, appliedSearch, sortCol, sortDir, appliedFilters };

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const hasAppliedFilters = useMemo(
    () => Object.values(appliedFilters).some((v) => v !== '') || appliedSearch !== '',
    [appliedFilters, appliedSearch]
  );

  const startIdx = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, filteredRecords);
  const totalPages = Math.max(1, Math.ceil(filteredRecords / perPage));

  const loadData = useCallback(async () => {
    const { currentPage: cp, perPage: pp, appliedSearch: as_, sortCol: sc, sortDir: sd, appliedFilters: af } = stateRef.current;
    const result = await fetchData({
      start: (cp - 1) * pp,
      length: pp,
      search: as_,
      orderColumn: sc,
      orderDir: sd,
      filters: af,
    });
    if (result.success) {
      setData(result.data || []);
      setTotalRecords(result.recordsTotal || 0);
      setFilteredRecords(result.recordsFiltered || 0);
    }
  }, [fetchData]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  useEffect(() => {
    if (fetchTrigger > 0) loadData();
  }, [fetchTrigger, loadData]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setAppliedSearch(searchInput);
      setCurrentPage(1);
      setFetchTrigger((t) => t + 1);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchInput]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.searchInput !== undefined) setSearchInput(saved.searchInput);
      if (saved.appliedSearch !== undefined) setAppliedSearch(saved.appliedSearch);
      if (saved.filterInput) setFilterInput(saved.filterInput);
      if (saved.appliedFilters) setAppliedFilters(saved.appliedFilters);
      if (saved.perPage) setPerPage(saved.perPage);
      if (saved.sortCol !== undefined) setSortCol(saved.sortCol);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (saved.currentPage) setCurrentPage(saved.currentPage);
    } catch {}
    setFetchTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      searchInput, appliedSearch, filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage,
    }));
  }, [searchInput, appliedSearch, filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage]);

  const handleFilterChange = useCallback((field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
  }, [filterInput]);

  const handleResetFilter = useCallback(() => {
    const empty = { kode_reseller: '', nama_reseller: '', telepon: '', email: '', status: '' };
    setFilterInput(empty);
    setAppliedFilters(empty);
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
  }, []);

  const handleSort = useCallback((colIdx) => {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
    setFetchTrigger((t) => t + 1);
  }, [sortCol]);

  const handlePerPageChange = useCallback((n) => {
    setPerPage(n);
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
  }, []);

  const handlePageChange = useCallback((p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    setFetchTrigger((t) => t + 1);
  }, [totalPages]);

  const handleSave = useCallback(async (payload) => {
    try {
      if (editData) {
        const result = await update({ ...payload, pid: editData.pid });
        if (result.success) {
          showNotif('success', 'Reseller berhasil diperbarui');
          setShowModal(false);
          setEditData(null);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal memperbarui reseller');
        }
      } else {
        const result = await create(payload);
        if (result.success) {
          showNotif('success', 'Reseller berhasil ditambahkan');
          setShowModal(false);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal menambahkan reseller');
        }
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, update, create, showNotif]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await remove(deleteData.pid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', 'Reseller berhasil dihapus');
        setFetchTrigger((t) => t + 1);
      } else {
        showNotif('error', result.message || 'Gagal menghapus reseller');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus reseller');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, remove, showNotif]);

  const handleEditItem = useCallback((item) => {
    setEditData(item);
    setShowModal(true);
  }, []);

  const handleDeleteItem = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const columns = useMemo(() => {
    const startIdxBase = (currentPage - 1) * perPage;
    const renderSortIcon = (colIdx) => {
      if (sortCol !== colIdx) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
      return sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-emerald-600" />
        : <ArrowDown className="h-3 w-3 text-emerald-600" />;
    };

    return [
      {
        name: (
          <div className="flex items-center gap-1">
            <span>No</span>
          </div>
        ),
        width: '52px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center text-xs font-medium text-slate-400">{startIdxBase + index + 1}</div>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(1)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Kode</span>
            {renderSortIcon(1)}
          </button>
        ),
        width: '130px',
        cell: (row) => (
          <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-blue-700">
            {row.kode_reseller}
          </span>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(2)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Nama Reseller</span>
            {renderSortIcon(2)}
          </button>
        ),
        grow: 1.6,
        minWidth: '200px',
        cell: (row) => (
          <div className="py-1.5 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{row.nama_reseller}</div>
            {row.alamat && (
              <div className="text-xs text-slate-500 truncate max-w-[280px]">{row.alamat}</div>
            )}
          </div>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(3)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Kontak</span>
            {renderSortIcon(3)}
          </button>
        ),
        width: '200px',
        cell: (row) => (
          <div className="py-1.5">
            {row.telepon && <div className="text-sm text-slate-700">{row.telepon}</div>}
            {row.email && <div className="text-xs text-slate-400 truncate max-w-[180px]">{row.email}</div>}
            {!row.telepon && !row.email && <div className="text-sm text-slate-300">-</div>}
          </div>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(4)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Status</span>
            {renderSortIcon(4)}
          </button>
        ),
        width: '110px',
        center: true,
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              row.status === 'aktif'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
      },
      {
        name: 'Aksi',
        width: '64px',
        center: true,
        ignoreRowClick: true,
        cell: (row) => (
          <ActionMenu
            row={row}
            isOpen={openMenuId === row.pid}
            onToggle={() => setOpenMenuId((cur) => (cur === row.pid ? null : row.pid))}
            onClose={() => setOpenMenuId(null)}
            onDetail={(r) => { setDetailRow(r); setOpenMenuId(null); }}
            onEdit={(r) => { handleEditItem(r); setOpenMenuId(null); }}
            onDelete={(r) => { handleDeleteItem(r); setOpenMenuId(null); }}
          />
        ),
      },
    ];
  }, [currentPage, perPage, sortCol, sortDir, handleSort, openMenuId, handleEditItem, handleDeleteItem]);

  const customTableStyles = {
    headRow: {
      style: {
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        fontSize: '12px',
        fontWeight: '600',
        color: '#475569',
        minHeight: '38px',
      },
    },
    headCells: {
      style: { paddingLeft: '12px', paddingRight: '12px' },
    },
    rows: {
      style: {
        fontSize: '13px',
        color: '#1E293B',
        minHeight: '44px',
        '&:hover': { backgroundColor: '#F8FAFC', cursor: 'pointer' },
      },
    },
    cells: { style: { paddingLeft: '12px', paddingRight: '12px' } },
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {/* === Sticky Header === */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Master Reseller</h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">Kelola data master reseller penjualan sapi</p>
            </div>
          </div>
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </header>

      {/* === Main Content === */}
      <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white flex flex-col">
          {/* Toolbar */}
          <div className="shrink-0 flex flex-col gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFilterPanel((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  showFilterPanel || hasAppliedFilters
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasAppliedFilters && (
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {Object.values(appliedFilters).filter((v) => v !== '').length + (appliedSearch ? 1 : 0)}
                  </span>
                )}
              </button>
              {hasAppliedFilters && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
              <div className="ml-auto text-xs text-slate-500 hidden sm:block">
                <span className="font-semibold text-slate-700">{filteredRecords.toLocaleString('id-ID')}</span>
                {hasAppliedFilters && filteredRecords !== totalRecords && (
                  <span className="text-slate-400"> dari {totalRecords.toLocaleString('id-ID')}</span>
                )} data
              </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilterPanel && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={filterInput.kode_reseller}
                    onChange={(e) => handleFilterChange('kode_reseller', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Kode reseller"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={filterInput.nama_reseller}
                    onChange={(e) => handleFilterChange('nama_reseller', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Nama reseller"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={filterInput.telepon}
                    onChange={(e) => handleFilterChange('telepon', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Telepon"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <input
                    type="text"
                    value={filterInput.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Email"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                  <select
                    value={filterInput.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <Search className="h-3 w-3" />
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Table area */}
          <div className="flex-1 min-h-0 overflow-auto">
            <DataTable
              columns={columns}
              data={data}
              customStyles={customTableStyles}
              progressPending={loading}
              progressComponent={<SkeletonRows />}
              noDataComponent={
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {hasAppliedFilters ? 'Coba ubah filter atau reset' : 'Belum ada reseller terdaftar'}
                  </p>
                </div>
              }
              highlightOnHover
              pointerOnHover
              responsive
              dense
              onRowClicked={(row) => setDetailRow(row)}
              pagination={false}
              fixedHeader={false}
            />
          </div>

          {/* Pagination footer */}
          <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-4 py-2.5 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Baris:</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-slate-500">
                {filteredRecords === 0 ? '0-0' : `${startIdx}-${endIdx}`} dari{' '}
                <span className="font-semibold text-slate-700">{filteredRecords.toLocaleString('id-ID')}</span>
                {hasAppliedFilters && filteredRecords !== totalRecords && (
                  <span className="text-slate-400"> (filter dari {totalRecords.toLocaleString('id-ID')})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1 || loading}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Halaman pertama"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Prev"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1 px-2 text-xs text-slate-600">
                <span>Hal</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    if (p >= 1 && p <= totalPages) handlePageChange(p);
                  }}
                  className="w-12 rounded-md border border-slate-200 px-1.5 py-1 text-xs text-center outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
                <span>/ {totalPages.toLocaleString('id-ID')}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Halaman terakhir"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <ResellerFormModal
          item={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSave={handleSave}
        />
      )}

      {/* Detail Drawer */}
      {detailRow && (
        <DetailDrawer
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={(r) => { setDetailRow(null); handleEditItem(r); }}
          onDelete={(r) => { setDetailRow(null); handleDeleteItem(r); }}
        />
      )}

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Hapus Reseller?"
        description={`Apakah Anda yakin ingin menghapus reseller "${deleteData?.nama_reseller}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* Notification */}
      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification((n) => ({ ...n, isVisible: false }))}
      />
    </div>
  );
};

const SkeletonRows = () => (
  <div className="py-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-50">
        <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="flex-1 h-3 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </div>
);

const ActionMenu = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete }) => {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const toggle = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    onToggle();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      const inBtn = buttonRef.current && buttonRef.current.contains(e.target);
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!inBtn && !inMenu) onClose();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen, onClose]);

  return (
    <div className="relative flex justify-center">
      <button
        ref={buttonRef}
        onClick={toggle}
        className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
        title="Aksi"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 w-40 z-[99999]"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onDetail(row)}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" /> Lihat Detail
          </button>
          <button
            onClick={() => onEdit(row)}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit
          </button>
          <button
            onClick={() => onDelete(row)}
            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" /> Hapus
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

const DetailDrawer = ({ row, onClose, onEdit, onDelete }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detail Reseller</h3>
            <p className="text-xs text-slate-500">Informasi lengkap reseller</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-blue-700">
                {row.kode_reseller}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  row.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{row.nama_reseller}</h2>
          </div>
          <DetailField label="Telepon" value={row.telepon} />
          <DetailField label="Email" value={row.email} />
          <DetailField label="Alamat" value={row.alamat} multiline />
        </div>
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => onDelete(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
          <button
            onClick={() => onEdit(row)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Reseller
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DetailField = ({ label, value, multiline }) => (
  <div className="rounded-lg border border-slate-200 px-3 py-2">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-0.5 text-sm text-slate-700 ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
      {value || <span className="text-slate-300">-</span>}
    </p>
  </div>
);

export default MasterResellerPage;
