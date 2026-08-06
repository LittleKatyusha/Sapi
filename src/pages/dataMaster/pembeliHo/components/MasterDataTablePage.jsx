import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import {
  Plus, Filter, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreVertical, Eye, Pencil, Trash2, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
} from 'lucide-react';
import Notification from './Notification';

const ACCENTS = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    border: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    focus: 'focus:border-emerald-400 focus:ring-emerald-100',
    sort: 'text-emerald-600',
    badge: 'bg-emerald-600',
    editText: 'text-emerald-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700',
    border: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    focus: 'focus:border-indigo-400 focus:ring-indigo-100',
    sort: 'text-indigo-600',
    badge: 'bg-indigo-600',
    editText: 'text-indigo-500',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    btn: 'bg-amber-600 hover:bg-amber-700',
    border: 'border-amber-200 bg-amber-50 text-amber-700',
    focus: 'focus:border-amber-400 focus:ring-amber-100',
    sort: 'text-amber-600',
    badge: 'bg-amber-600',
    editText: 'text-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    btn: 'bg-rose-600 hover:bg-rose-700',
    border: 'border-rose-200 bg-rose-50 text-rose-700',
    focus: 'focus:border-rose-400 focus:ring-rose-100',
    sort: 'text-rose-600',
    badge: 'bg-rose-600',
    editText: 'text-rose-500',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    btn: 'bg-sky-600 hover:bg-sky-700',
    border: 'border-sky-200 bg-sky-50 text-sky-700',
    focus: 'focus:border-sky-400 focus:ring-sky-100',
    sort: 'text-sky-600',
    badge: 'bg-sky-600',
    editText: 'text-sky-500',
  },
};

/**
 * Shared master data table page with server-side pagination, sorting, filtering,
 * collapsible filter panel, skeleton loading, pagination footer, action menu,
 * and detail drawer.
 *
 * Props:
 * - storageKey: sessionStorage key for state persistence
 * - title, subtitle: header text
 * - accent: 'emerald' | 'indigo' | 'amber' | 'rose' | 'sky' (tailwind color name)
 * - icon: lucide icon component
 * - hook: instance of useXxx hook (must expose fetchXxx, createXxx, updateXxx, deleteXxx, loading, error)
 * - filterFields: [{ key, placeholder }]
 * - columns: extra columns (inserted between No and Aksi) — array of { name, cell, grow, width, ... }
 * - AddEditModal: component
 * - DeleteModal: component
 * - addLabel: text for add button
 * - entityLabel: label for notifications (e.g. "Klasifikasi Feedmil")
 * - rowNameKey: key to get display name from row (default 'name')
 */
const MasterDataTablePage = ({
  storageKey,
  title,
  subtitle,
  accent = 'emerald',
  icon: Icon,
  hook,
  filterFields = [{ key: 'name', placeholder: 'Nama' }, { key: 'description', placeholder: 'Deskripsi' }],
  extraColumns = [],
  AddEditModal,
  DeleteModal,
  addLabel = 'Tambah',
  entityLabel = 'Data',
  rowNameKey = 'name',
}) => {
  const {
    loading, error,
    fetch: fetchFn,
    create: createFn,
    update: updateFn,
    remove: deleteFn,
  } = hook;

  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState(1);
  const [sortDir, setSortDir] = useState('asc');

  const emptyFilters = useMemo(
    () => filterFields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}),
    [filterFields]
  );

  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  const stateRef = useRef({});
  stateRef.current = { currentPage, perPage, sortCol, sortDir, appliedFilters };

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const hasAppliedFilters = useMemo(
    () => Object.values(appliedFilters).some((v) => v !== '' && v !== null && v !== undefined),
    [appliedFilters]
  );

  const startIdx = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, filteredRecords);
  const totalPages = Math.max(1, Math.ceil(filteredRecords / perPage));

  const loadData = useCallback(async () => {
    const { currentPage: cp, perPage: pp, sortCol: sc, sortDir: sd, appliedFilters: af } = stateRef.current;
    const result = await fetchFn({
      start: (cp - 1) * pp,
      length: pp,
      orderColumn: sc,
      orderDir: sd,
      filters: af,
    });
    if (result.success) {
      setData(result.data || []);
      setTotalRecords(result.recordsTotal || 0);
      setFilteredRecords(result.recordsFiltered || 0);
    }
  }, [fetchFn]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  useEffect(() => {
    if (fetchTrigger > 0) loadData();
  }, [fetchTrigger, loadData]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      if (saved.filterInput) setFilterInput({ ...emptyFilters, ...saved.filterInput });
      if (saved.appliedFilters) setAppliedFilters({ ...emptyFilters, ...saved.appliedFilters });
      if (saved.perPage) setPerPage(saved.perPage);
      if (saved.sortCol !== undefined) setSortCol(saved.sortCol);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (saved.currentPage) setCurrentPage(saved.currentPage);
    } catch {}
    setFetchTrigger((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({
      filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage,
    }));
  }, [filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage, storageKey]);

  const handleFilterChange = useCallback((field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
  }, [filterInput]);

  const handleResetFilter = useCallback(() => {
    setFilterInput(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
    setFetchTrigger((t) => t + 1);
  }, [emptyFilters]);

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
        const result = await updateFn(editData.pid, payload);
        if (result.success) {
          showNotif('success', `${entityLabel} berhasil diperbarui`);
          setShowModal(false);
          setEditData(null);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal memperbarui data');
        }
      } else {
        const result = await createFn(payload);
        if (result.success) {
          showNotif('success', `${entityLabel} berhasil ditambahkan`);
          setShowModal(false);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal menambahkan data');
        }
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, updateFn, createFn, showNotif, entityLabel]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await deleteFn(deleteData.pid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', `${entityLabel} berhasil dihapus`);
        setFetchTrigger((t) => t + 1);
      } else {
        showNotif('error', result.message || 'Gagal menghapus data');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteFn, showNotif, entityLabel]);

  const handleEditItem = useCallback((item) => {
    setEditData(item);
    setShowModal(true);
  }, []);

  const handleDeleteItem = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const accentColor = accent;
  const A = ACCENTS[accentColor] || ACCENTS.emerald;
  const accentBg = A.bg;
  const accentText = A.text;
  const accentBtn = A.btn;
  const accentBorder = A.border;
  const accentFocus = A.focus;
  const accentSort = A.sort;
  const accentBadge = A.badge;

  const columns = useMemo(() => {
    const startIdxBase = (currentPage - 1) * perPage;
    const renderSortIcon = (colIdx) => {
      if (sortCol !== colIdx) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
      return sortDir === 'asc'
        ? <ArrowUp className={`h-3 w-3 ${accentSort}`} />
        : <ArrowDown className={`h-3 w-3 ${accentSort}`} />;
    };

    const cols = [
      {
        name: <div className="flex items-center gap-1"><span>No</span></div>,
        width: '52px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center text-xs font-medium text-slate-400">{startIdxBase + index + 1}</div>
        ),
      },
    ];

    extraColumns.forEach((col, idx) => {
      const colIdx = idx + 1;
      if (col.sortable !== false) {
        const origName = col.name;
        cols.push({
          ...col,
          name: (
            <button
              type="button"
              onClick={() => handleSort(colIdx)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              {origName}
              {renderSortIcon(colIdx)}
            </button>
          ),
        });
      } else {
        cols.push(col);
      }
    });

    cols.push({
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
          editColor={A.editText}
        />
      ),
    });
    return cols;
  }, [currentPage, perPage, sortCol, sortDir, handleSort, openMenuId, handleEditItem, handleDeleteItem, extraColumns, accentSort, A]);
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
    headCells: { style: { paddingLeft: '12px', paddingRight: '12px' } },
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
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentBg} ${accentText} shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">{title}</h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg ${accentBtn} px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors shrink-0`}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white flex flex-col">
          <div className="shrink-0 flex flex-col gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFilterPanel((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  showFilterPanel || hasAppliedFilters
                    ? accentBorder
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasAppliedFilters && (
                  <span className={`inline-flex items-center justify-center rounded-full ${accentBadge} px-1.5 text-[10px] font-bold text-white`}>
                    {Object.values(appliedFilters).filter((v) => v !== '' && v !== null && v !== undefined).length}
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

            {showFilterPanel && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filterFields.map((f) => (
                    <input
                      key={f.key}
                      type="text"
                      value={filterInput[f.key]}
                      onChange={(e) => handleFilterChange(f.key, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                      placeholder={f.placeholder}
                      className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none ${accentFocus}`}
                    />
                  ))}
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
                    className={`inline-flex items-center gap-1 rounded-lg ${accentBtn} px-3 py-1.5 text-xs font-semibold text-white transition-colors`}
                  >
                    <Search className="h-3 w-3" />
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

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
                    {hasAppliedFilters ? 'Coba ubah filter atau reset' : `Belum ada ${entityLabel.toLowerCase()} terdaftar`}
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

          <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-4 py-2.5 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Baris:</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className={`rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none ${accentFocus}`}
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
                  className={`w-12 rounded-md border border-slate-200 px-1.5 py-1 text-xs text-center outline-none ${accentFocus}`}
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

      {showModal && AddEditModal && (
        <AddEditModal
          item={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSave={handleSave}
          loading={loading}
        />
      )}

      {detailRow && (
        <DetailDrawer
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={(r) => { setDetailRow(null); handleEditItem(r); }}
          onDelete={(r) => { setDetailRow(null); handleDeleteItem(r); }}
          accentBg={A.bg}
          accentText={A.text}
          accentBtn={A.btn}
          Icon={Icon}
          title={`Detail ${entityLabel}`}
          subtitle={`Informasi lengkap ${entityLabel.toLowerCase()}`}
        />
      )}

      {DeleteModal && (
        <DeleteModal
          isOpen={!!deleteData}
          item={deleteData}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteData(null)}
          isDeleting={isDeleting}
          itemName={deleteData?.[rowNameKey]}
          message={`Apakah Anda yakin ingin menghapus ${entityLabel.toLowerCase()} "${deleteData?.[rowNameKey]}"?`}
        />
      )}

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
        <div className="flex-1 h-3 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </div>
);

const ActionMenu = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete, editColor = 'text-emerald-500' }) => {
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
            <Pencil className={`h-3.5 w-3.5 ${editColor}`} /> Edit
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

const DetailDrawer = ({ row, onClose, onEdit, onDelete, accentBg, accentText, accentBtn, Icon, title, subtitle }) => {

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{row.name}</h2>
            </div>
          </div>
          {Object.entries(row)
            .filter(([k]) => !['pid', 'rawPubid', 'id'].includes(k))
            .map(([key, value]) => (
              <DetailField key={key} label={key.replace(/_/g, ' ')} value={value} />
            ))}
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
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg ${accentBtn} px-3 py-2 text-xs font-semibold text-white transition-colors`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DetailField = ({ label, value }) => {
  const display = Array.isArray(value) ? value.join(', ') : (value === null || value === undefined ? '' : String(value));
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700 break-words">
        {display || <span className="text-slate-300">-</span>}
      </p>
    </div>
  );
};

export default MasterDataTablePage;
