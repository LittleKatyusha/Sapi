import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import {
  Plus, Filter, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreVertical, Eye, Pencil, Trash2, Tags, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
} from 'lucide-react';

import useKlasifikasiHewan from './klasifikasiHewan/hooks/useKlasifikasiHewan';
import AddEditKlasifikasiHewanModal from './klasifikasiHewan/modals/AddEditKlasifikasiHewanModal';
import DeleteConfirmationModal from './klasifikasiHewan/modals/DeleteConfirmationModal';
import Notification from './pembeliHo/components/Notification';

const STORAGE_KEY = 'klasifikasi_hewan_state_v1';

const KlasifikasiHewanPage = () => {
  const {
    loading, error, fetchData,
    createKlasifikasiHewan, updateKlasifikasiHewan, deleteKlasifikasiHewan,
    jenisHewanOptions, fetchJenisHewanOptions,
  } = useKlasifikasiHewan();

  const [data, setData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortCol, setSortCol] = useState(1);
  const [sortDir, setSortDir] = useState('asc');

  const [filterInput, setFilterInput] = useState({ name: '', description: '', id_jenis_hewan: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', description: '', id_jenis_hewan: '' });
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
    const result = await fetchData({
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
  }, [fetchData]);

  const [fetchTrigger, setFetchTrigger] = useState(0);
  useEffect(() => {
    if (fetchTrigger > 0) loadData();
  }, [fetchTrigger, loadData]);

  useEffect(() => {
    fetchJenisHewanOptions();
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
    setFetchTrigger((t) => t + 1);
  }, [filterInput]);

  const handleResetFilter = useCallback(() => {
    const empty = { name: '', description: '', id_jenis_hewan: '' };
    setFilterInput(empty);
    setAppliedFilters(empty);
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
        const result = await updateKlasifikasiHewan(editData.pid || editData.pubid, payload);
        if (result.success) {
          showNotif('success', 'Klasifikasi hewan berhasil diperbarui');
          setShowModal(false);
          setEditData(null);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal memperbarui data');
        }
      } else {
        const result = await createKlasifikasiHewan(payload);
        if (result.success) {
          showNotif('success', 'Klasifikasi hewan berhasil ditambahkan');
          setShowModal(false);
          setFetchTrigger((t) => t + 1);
        } else {
          showNotif('error', result.message || 'Gagal menambahkan data');
        }
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, updateKlasifikasiHewan, createKlasifikasiHewan, showNotif]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await deleteKlasifikasiHewan(deleteData.pid || deleteData.pubid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', 'Klasifikasi hewan berhasil dihapus');
        setFetchTrigger((t) => t + 1);
      } else {
        showNotif('error', result.message || 'Gagal menghapus data');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteKlasifikasiHewan, showNotif]);

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
            <span>Nama</span>
            {renderSortIcon(1)}
          </button>
        ),
        grow: 1.6,
        minWidth: '200px',
        cell: (row) => (
          <div className="py-1.5 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{row.name}</div>
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
            <span>Jenis Hewan</span>
            {renderSortIcon(3)}
          </button>
        ),
        width: '140px',
        cell: (row) => (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            {row.jenis || 'Tidak diketahui'}
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
            <span>Deskripsi</span>
            {renderSortIcon(2)}
          </button>
        ),
        grow: 1.4,
        cell: (row) => (
          <div className="py-1.5 min-w-0">
            <div className="text-sm text-slate-600 line-clamp-2">{row.description || <span className="text-slate-300">-</span>}</div>
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
            <span>Dibuat</span>
            {renderSortIcon(4)}
          </button>
        ),
        width: '120px',
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
            isOpen={openMenuId === (row.pid || row.pubid)}
            onToggle={() => setOpenMenuId((cur) => (cur === (row.pid || row.pubid) ? null : (row.pid || row.pubid)))}
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
              <Tags className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Master Klasifikasi Hewan</h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">Kelola data master klasifikasi hewan</p>
            </div>
          </div>
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
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
                    placeholder="Nama klasifikasi"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <select
                    value={filterInput.id_jenis_hewan}
                    onChange={(e) => handleFilterChange('id_jenis_hewan', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  >
                    <option value="">Semua Jenis Hewan</option>
                    {jenisHewanOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={filterInput.description}
                    onChange={(e) => handleFilterChange('description', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Deskripsi"
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
              data={data}
              customStyles={customTableStyles}
              progressPending={loading}
              progressComponent={<SkeletonRows />}
              noDataComponent={
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {hasAppliedFilters ? 'Coba ubah filter atau reset' : 'Belum ada klasifikasi hewan terdaftar'}
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
        <AddEditKlasifikasiHewanModal
          item={editData}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSave={handleSave}
          loading={loading}
          jenisHewanOptions={jenisHewanOptions}
        />
      )}

      {detailRow && (
        <DetailDrawer
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={(r) => { setDetailRow(null); handleEditItem(r); }}
          onDelete={(r) => { setDetailRow(null); handleDeleteItem(r); }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteData}
        title="Hapus Klasifikasi Hewan"
        description={`Apakah Anda yakin ingin menghapus "${deleteData?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteData(null)}
      />

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
        <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
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
            <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit
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
            <h3 className="text-sm font-bold text-slate-900">Detail Klasifikasi Hewan</h3>
            <p className="text-xs text-slate-500">Informasi lengkap klasifikasi hewan</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <h2 className="text-lg font-bold text-slate-900">{row.name}</h2>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 mt-1">
              {row.jenis || 'Tidak diketahui'}
            </span>
          </div>
          <DetailField label="Deskripsi" value={row.description} multiline />
          <DetailField label="Dibuat" value={row.created_at} />
          <DetailField label="Diperbarui" value={row.updated_at} />
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
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Klasifikasi
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

export default KlasifikasiHewanPage;
