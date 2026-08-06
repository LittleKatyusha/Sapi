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
    text: 'text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
    border: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
    focus: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/15',
    sort: 'text-emerald-600',
    badge: 'bg-emerald-600',
    editText: 'text-emerald-600',
    ring: 'ring-emerald-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    btn: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
    border: 'border-indigo-200/80 bg-indigo-50 text-indigo-800',
    focus: 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15',
    sort: 'text-indigo-600',
    badge: 'bg-indigo-600',
    editText: 'text-indigo-600',
    ring: 'ring-indigo-500/20',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
    border: 'border-amber-200/80 bg-amber-50 text-amber-800',
    focus: 'focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15',
    sort: 'text-amber-600',
    badge: 'bg-amber-600',
    editText: 'text-amber-600',
    ring: 'ring-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    btn: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
    border: 'border-rose-200/80 bg-rose-50 text-rose-800',
    focus: 'focus:border-rose-400 focus:ring-2 focus:ring-rose-500/15',
    sort: 'text-rose-600',
    badge: 'bg-rose-600',
    editText: 'text-rose-600',
    ring: 'ring-rose-500/20',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    btn: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
    border: 'border-sky-200/80 bg-sky-50 text-sky-800',
    focus: 'focus:border-sky-400 focus:ring-2 focus:ring-sky-500/15',
    sort: 'text-sky-600',
    badge: 'bg-sky-600',
    editText: 'text-sky-600',
    ring: 'ring-sky-500/20',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
    border: 'border-violet-200/80 bg-violet-50 text-violet-800',
    focus: 'focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15',
    sort: 'text-violet-600',
    badge: 'bg-violet-600',
    editText: 'text-violet-600',
    ring: 'ring-violet-500/20',
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
 * - addEditModalExtraProps: extra props to pass to AddEditModal (e.g. jenisPotongOptions)
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
  addEditModalExtraProps = {},
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
      if (sortCol !== colIdx) return <ArrowUpDown className="h-3 w-3 text-zinc-300" />;
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
          <div className="w-full text-center text-[11px] font-medium tabular-nums text-zinc-400">
            {startIdxBase + index + 1}
          </div>
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
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-800 transition-colors duration-150"
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
    table: {
      style: {
        backgroundColor: 'transparent',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#FAFAFA',
        borderBottom: '1px solid #F4F4F5',
        fontSize: '11px',
        fontWeight: '600',
        color: '#71717A',
        minHeight: '40px',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      },
    },
    headCells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '13px',
        color: '#18181B',
        minHeight: '48px',
        borderBottom: '1px solid #F4F4F5',
        backgroundColor: '#FFFFFF',
        transition: 'background-color 150ms ease',
        '&:hover': {
          backgroundColor: '#FAFAFA',
          cursor: 'pointer',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
  };

  const pageBtnClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-35';

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-slate-50">
      <header className="shrink-0 border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-3.5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentBg} ${accentText} ring-1 ring-inset ring-black/[0.03] shrink-0`}>
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-semibold tracking-tight text-zinc-900 truncate">{title}</h1>
              <p className="text-[12px] text-zinc-500 truncate hidden sm:block mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setEditData(null); setShowModal(true); }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl ${accentBtn} px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors duration-150 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${A.ring}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {addLabel}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 sm:px-8">
        <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="shrink-0 flex flex-col gap-3 border-b border-zinc-100 px-4 sm:px-5 py-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFilterPanel((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors duration-150 ${
                  showFilterPanel || hasAppliedFilters
                    ? accentBorder
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
                Filter
                {hasAppliedFilters && (
                  <span className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full ${accentBadge} px-1 text-[10px] font-semibold text-white`}>
                    {Object.values(appliedFilters).filter((v) => v !== '' && v !== null && v !== undefined).length}
                  </span>
                )}
              </button>
              {hasAppliedFilters && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors duration-150"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                  Reset
                </button>
              )}
              <div className="ml-auto text-[12px] text-zinc-500 hidden sm:block">
                <span className="font-semibold tabular-nums text-zinc-800">{filteredRecords.toLocaleString('id-ID')}</span>
                {hasAppliedFilters && filteredRecords !== totalRecords && (
                  <span className="text-zinc-400"> dari {totalRecords.toLocaleString('id-ID')}</span>
                )}
                {' '}data
              </div>
            </div>

            {showFilterPanel && (
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filterFields.map((f) => (
                    <input
                      key={f.key}
                      type="text"
                      value={filterInput[f.key]}
                      onChange={(e) => handleFilterChange(f.key, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                      placeholder={f.placeholder}
                      className={`rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-zinc-800 placeholder:text-zinc-400 outline-none transition-shadow duration-150 ${accentFocus}`}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors duration-150"
                  >
                    <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className={`inline-flex items-center gap-1.5 rounded-xl ${accentBtn} px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-150`}
                  >
                    <Search className="h-3 w-3" strokeWidth={1.75} />
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 sm:mx-5 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] text-rose-700">
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
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                    <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] font-medium text-zinc-700">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-[12px] text-zinc-400">
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

          <div className="shrink-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-100 px-4 sm:px-5 py-3 bg-zinc-50/40">
            <div className="flex items-center gap-2 text-[12px] text-zinc-600">
              <span className="text-zinc-500">Baris</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className={`h-8 rounded-lg border border-zinc-200 bg-white px-2 text-[12px] outline-none transition-shadow duration-150 ${accentFocus}`}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="text-zinc-500 tabular-nums">
                {filteredRecords === 0 ? '0–0' : `${startIdx}–${endIdx}`} dari{' '}
                <span className="font-semibold text-zinc-800">{filteredRecords.toLocaleString('id-ID')}</span>
                {hasAppliedFilters && filteredRecords !== totalRecords && (
                  <span className="text-zinc-400"> (filter dari {totalRecords.toLocaleString('id-ID')})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1 || loading}
                className={pageBtnClass}
                title="Halaman pertama"
              >
                <ChevronsLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className={pageBtnClass}
                title="Prev"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <div className="flex items-center gap-1.5 px-2 text-[12px] text-zinc-600">
                <span className="text-zinc-500">Hal</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    if (p >= 1 && p <= totalPages) handlePageChange(p);
                  }}
                  className={`h-8 w-11 rounded-lg border border-zinc-200 bg-white px-1 text-center text-[12px] tabular-nums outline-none transition-shadow duration-150 ${accentFocus}`}
                />
                <span className="tabular-nums text-zinc-400">/ {totalPages.toLocaleString('id-ID')}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                className={pageBtnClass}
                title="Next"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages || loading}
                className={pageBtnClass}
                title="Halaman terakhir"
              >
                <ChevronsRight className="h-3.5 w-3.5" strokeWidth={1.75} />
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
          {...addEditModalExtraProps}
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
  <div className="py-1">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-50">
        <div className="h-2.5 w-7 rounded-full bg-zinc-100 animate-pulse" />
        <div className="flex-1 h-2.5 rounded-full bg-zinc-100 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-zinc-100 animate-pulse" />
        <div className="h-2.5 w-16 rounded-full bg-zinc-100 animate-pulse" />
        <div className="h-2.5 w-6 rounded-full bg-zinc-100 animate-pulse" />
      </div>
    ))}
  </div>
);

const ActionMenu = ({ row, isOpen, onToggle, onClose, onDetail, onEdit, onDelete, editColor = 'text-emerald-600' }) => {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const toggle = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 168 });
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
        type="button"
        ref={buttonRef}
        onClick={toggle}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ${
          isOpen ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
        }`}
        title="Aksi"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-42 w-[168px] rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg shadow-zinc-900/8"
          style={{ top: menuPos.top, left: menuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onDetail(row)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-zinc-700 transition-colors duration-150 hover:bg-zinc-50"
          >
            <Eye className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} /> Lihat Detail
          </button>
          <button
            type="button"
            onClick={() => onEdit(row)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-zinc-700 transition-colors duration-150 hover:bg-zinc-50"
          >
            <Pencil className={`h-3.5 w-3.5 ${editColor}`} strokeWidth={1.75} /> Edit
          </button>
          <div className="my-1 border-t border-zinc-100" />
          <button
            type="button"
            onClick={() => onDelete(row)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] text-rose-600 transition-colors duration-150 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" strokeWidth={1.75} /> Hapus
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

const DetailDrawer = ({ row, onClose, onEdit, onDelete, accentBg, accentText, accentBtn, Icon, title, subtitle }) => {
  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex w-full max-w-md flex-col bg-white shadow-2xl shadow-zinc-900/10">
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h3 className="text-[14px] font-semibold tracking-tight text-zinc-900">{title}</h3>
            <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-3">
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-3.5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentBg} ${accentText}`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-semibold tracking-tight text-zinc-900">{row.name}</h2>
            </div>
          </div>
          {Object.entries(row)
            .filter(([k]) => !['pid', 'rawPubid', 'id'].includes(k))
            .map(([key, value]) => (
              <DetailField key={key} label={key.replace(/_/g, ' ')} value={value} />
            ))}
        </div>
        <div className="shrink-0 flex gap-2 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5">
          <button
            type="button"
            onClick={() => onDelete(row)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-[12px] font-medium text-rose-600 transition-colors duration-150 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Hapus
          </button>
          <button
            type="button"
            onClick={() => onEdit(row)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl ${accentBtn} px-3.5 py-2 text-[12px] font-medium text-white transition-colors duration-150`}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
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
    <div className="rounded-xl border border-zinc-200/80 px-3.5 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-[13px] text-zinc-800 break-words leading-snug">
        {display || <span className="text-zinc-300">—</span>}
      </p>
    </div>
  );
};

export default MasterDataTablePage;
