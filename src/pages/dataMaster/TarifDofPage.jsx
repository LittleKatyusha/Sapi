import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import {
  Plus, Filter, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreVertical, Eye, Tag, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
} from 'lucide-react';

import useTarifDof from './tarifDof/hooks/useTarifDof';
import AddTarifDofModal from './tarifDof/modals/AddTarifDofModal';
import Notification from './tarifDof/components/Notification';

const STORAGE_KEY = 'tarif_dof_state_v1';

const TarifDofPage = () => {
  const { data: rawData, loading, error, fetchData, createItem } = useTarifDof();

  const data = useMemo(() => rawData.map((item) => ({
    ...item,
    pid: item.pid || item.pubid || item.id,
  })), [rawData]);

  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState(1);
  const [sortDir, setSortDir] = useState('asc');

  const [filterInput, setFilterInput] = useState({ name: '', office: '', klasifikasi: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', office: '', klasifikasi: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const hasAppliedFilters = useMemo(
    () => Object.values(appliedFilters).some((v) => v !== '' && v !== null && v !== undefined),
    [appliedFilters]
  );

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (hasAppliedFilters) {
      result = result.filter((row) => {
        if (appliedFilters.name && !String(row.name || '').toLowerCase().includes(appliedFilters.name.toLowerCase())) return false;
        if (appliedFilters.office) {
          const officeText = `${row.id_office ?? ''} ${row.office?.name ?? ''}`.toLowerCase();
          if (!officeText.includes(appliedFilters.office.toLowerCase())) return false;
        }
        if (appliedFilters.klasifikasi) {
          const klasText = `${row.id_klasifikasi_hewan ?? ''} ${row.klasifikasi_hewan?.name ?? ''}`.toLowerCase();
          if (!klasText.includes(appliedFilters.klasifikasi.toLowerCase())) return false;
        }
        return true;
      });
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortCol) {
        case 1:
          return String(a.name || '').localeCompare(String(b.name || '')) * dir;
        case 2:
          return String(a.id_office || '').localeCompare(String(b.id_office || '')) * dir;
        case 3:
          return String(a.id_klasifikasi_hewan || '').localeCompare(String(b.id_klasifikasi_hewan || '')) * dir;
        case 4: {
          const av = Number(a.harga || 0);
          const bv = Number(b.harga || 0);
          return (av - bv) * dir;
        }
        case 5:
          return String(a.created_at || '').localeCompare(String(b.created_at || '')) * dir;
        default:
          return 0;
      }
    });
    return result;
  }, [data, appliedFilters, hasAppliedFilters, sortCol, sortDir]);

  useEffect(() => {
    setTotalRecords(data.length);
    setFilteredRecords(filteredData.length);
  }, [data.length, filteredData.length]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords / perPage));
  const startIdx = filteredRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, filteredRecords);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  useEffect(() => {
    if (fetchTrigger > 0) fetchData();
  }, [fetchTrigger, fetchData]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.filterInput) setFilterInput(saved.filterInput);
      if (saved.appliedFilters) setAppliedFilters(saved.appliedFilters);
      if (saved.perPage) setPerPage(saved.perPage);
      if (saved.sortCol !== undefined) setSortCol(saved.sortCol);
      if (saved.sortDir) setSortDir(saved.sortDir);
      if (saved.currentPage) setCurrentPage(saved.currentPage);
    } catch {}
    setFetchTrigger((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage,
    }));
  }, [filterInput, appliedFilters, perPage, sortCol, sortDir, currentPage]);

  const handleFilterChange = useCallback((field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(filterInput);
    setCurrentPage(1);
  }, [filterInput]);

  const handleResetFilter = useCallback(() => {
    const empty = { name: '', office: '', klasifikasi: '' };
    setFilterInput(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((colIdx) => {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  }, [sortCol]);

  const handlePerPageChange = useCallback((n) => {
    setPerPage(n);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  }, [totalPages]);

  const handleSave = useCallback(async (payload) => {
    try {
      await createItem(payload);
      showNotif('success', 'Tarif DOF berhasil ditambahkan');
      setShowModal(false);
      setFetchTrigger((t) => t + 1);
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [createItem, showNotif]);

  const columns = useMemo(() => {
    const startIdxBase = (currentPage - 1) * perPage;
    const renderSortIcon = (colIdx) => {
      if (sortCol !== colIdx) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
      return sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-amber-600" />
        : <ArrowDown className="h-3 w-3 text-amber-600" />;
    };

    return [
      {
        name: <div className="flex items-center gap-1"><span>No</span></div>,
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
            <span>Nama Tarif</span>
            {renderSortIcon(1)}
          </button>
        ),
        grow: 1.5,
        minWidth: '200px',
        cell: (row) => (
          <div className="py-1.5 min-w-0 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
              <Tag className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{row.name}</div>
            </div>
          </div>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(2)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Office</span>
            {renderSortIcon(2)}
          </button>
        ),
        width: '120px',
        cell: (row) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
            {row.id_office ?? '-'}
          </span>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(3)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Klasifikasi Hewan</span>
            {renderSortIcon(3)}
          </button>
        ),
        width: '160px',
        cell: (row) => (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">
            {row.id_klasifikasi_hewan ?? '-'}
          </span>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(4)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Harga</span>
            {renderSortIcon(4)}
          </button>
        ),
        width: '160px',
        cell: (row) => (
          <span className="text-sm font-semibold text-slate-700">{formatRupiah(row.harga)}</span>
        ),
      },
      {
        name: (
          <button
            type="button"
            onClick={() => handleSort(5)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Dibuat</span>
            {renderSortIcon(5)}
          </button>
        ),
        width: '130px',
        cell: (row) => (
          <span className="text-xs text-slate-500">{row.created_at || '-'}</span>
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
          />
        ),
      },
    ];
  }, [currentPage, perPage, sortCol, sortDir, handleSort, openMenuId]);

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
    <div className="flex min-h-dvh flex-col bg-slate-50 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Tarif DOF</h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">Kelola data master tarif DOF per office dan klasifikasi hewan</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tambah
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
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {hasAppliedFilters && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white">
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
                  <input
                    type="text"
                    value={filterInput.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Nama tarif"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <input
                    type="text"
                    value={filterInput.office}
                    onChange={(e) => handleFilterChange('office', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Office ID / nama"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <input
                    type="text"
                    value={filterInput.klasifikasi}
                    onChange={(e) => handleFilterChange('klasifikasi', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Klasifikasi hewan ID / nama"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
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
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
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
              data={pageData}
              customStyles={customTableStyles}
              progressPending={loading}
              progressComponent={<SkeletonRows />}
              noDataComponent={
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {hasAppliedFilters ? 'Coba ubah filter atau reset' : 'Belum ada tarif DOF terdaftar'}
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
                className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
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
                  className="w-12 rounded-md border border-slate-200 px-1.5 py-1 text-xs text-center outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
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

      {showModal && (
        <AddTarifDofModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {detailRow && (
        <DetailDrawer
          row={detailRow}
          onClose={() => setDetailRow(null)}
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
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </div>
);

const ActionMenu = ({ row, isOpen, onToggle, onClose, onDetail }) => {
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
        </div>,
        document.body
      )}
    </div>
  );
};

const DetailDrawer = ({ row, onClose }) => {
  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detail Tarif DOF</h3>
            <p className="text-xs text-slate-500">Informasi lengkap tarif DOF</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{row.name}</h2>
            </div>
          </div>
          <DetailField label="Office ID" value={row.id_office} />
          <DetailField label="Klasifikasi Hewan ID" value={row.id_klasifikasi_hewan} />
          <DetailField label="Harga" value={formatRupiah(row.harga)} />
          <DetailField label="Dibuat" value={row.created_at} />
          <DetailField label="Diperbarui" value={row.updated_at} />
        </div>
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const DetailField = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 px-3 py-2">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm text-slate-700 break-words">
      {value || value === 0 ? value : <span className="text-slate-300">-</span>}
    </p>
  </div>
);

export default TarifDofPage;
