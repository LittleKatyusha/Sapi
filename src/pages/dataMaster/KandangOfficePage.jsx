import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import {
  Plus, Filter, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown,
  MoreVertical, Eye, Pencil, Trash2, Building2, MapPin, X, AlertCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';

import AddEditOfficeModal from './office/modals/AddEditOfficeModal';
import OfficeDetailModal from './office/modals/OfficeDetailModal';
import DeleteConfirmationModal from './office/modals/DeleteConfirmationModal';
import useOffices from './office/hooks/useOffices';
import Notification from './pembeliHo/components/Notification';

const STORAGE_KEY = 'kandang_office_page_state_v1';

const KategoriBadge = ({ id, getKategoriName }) => {
  const name = getKategoriName(id);
  const palette = {
    1: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    2: 'bg-sky-50 text-sky-700 ring-sky-200',
    3: 'bg-amber-50 text-amber-700 ring-amber-200',
    4: 'bg-violet-50 text-violet-700 ring-violet-200',
    5: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  const cls = palette[id] || palette[5];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${cls}`}>
      {name}
    </span>
  );
};

const KandangOfficePage = () => {
  const {
    offices, loading, error,
    setSearchInput,
    page, setPage,
    perPage, setPerPage,
    meta,
    sortField, sortDir, handleSort,
    filterKategori, setFilterKategori,
    resetFilters,
    selectedIds, toggleSelectId, toggleSelectAll, clearSelection,
    createOffice, updateOffice, deleteOffice, bulkDelete,
    getKategoriName, kategoriList, getActiveKategori, kategoriLoading,
  } = useOffices();

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [bulkDeleteData, setBulkDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [detailRow, setDetailRow] = useState(null);

  const [filterInput, setFilterInput] = useState({ name: '', description: '', location: '' });
  const [appliedFilters, setAppliedFilters] = useState({ name: '', description: '', location: '' });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const hasAppliedFilters = useMemo(
    () => Object.values(appliedFilters).some((v) => v !== '' && v !== null && v !== undefined) || filterKategori !== 'all',
    [appliedFilters, filterKategori]
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.filterInput) setFilterInput(saved.filterInput);
      if (saved.appliedFilters) setAppliedFilters(saved.appliedFilters);
      if (saved.perPage) setPerPage(saved.perPage);
      if (saved.page) setPage(saved.page);
      if (saved.filterKategori) setFilterKategori(saved.filterKategori);
    } catch {}
  }, [setPage, setPerPage, setFilterKategori]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      filterInput, appliedFilters, perPage, sortField, sortDir, page, filterKategori,
    }));
  }, [filterInput, appliedFilters, perPage, sortField, sortDir, page, filterKategori]);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / perPage));
  const startIdx = meta.total === 0 ? 0 : (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, meta.total || 0);

  const handleFilterChange = useCallback((field, value) => {
    setFilterInput((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(filterInput);
    setSearchInput(filterInput.name || filterInput.description || filterInput.location || '');
    setPage(1);
  }, [filterInput, setSearchInput, setPage]);

  const handleResetFilter = useCallback(() => {
    const empty = { name: '', description: '', location: '' };
    setFilterInput(empty);
    setAppliedFilters(empty);
    setFilterKategori('all');
    setSearchInput('');
    resetFilters();
  }, [resetFilters, setSearchInput, setFilterKategori]);

  const handlePerPageChange = useCallback((n) => {
    setPerPage(n);
    setPage(1);
  }, [setPerPage, setPage]);

  const handlePageChange = useCallback((p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }, [setPage, totalPages]);

  const handleSave = useCallback(async (formData) => {
    try {
      if (editData) {
        const result = await updateOffice(editData.pubid, formData);
        if (result.success) {
          showNotif('success', 'Office berhasil diperbarui');
          setShowModal(false);
          setEditData(null);
        } else {
          showNotif('error', result.message || 'Gagal memperbarui data');
        }
      } else {
        const result = await createOffice(formData);
        if (result.success) {
          showNotif('success', 'Office berhasil ditambahkan');
          setShowModal(false);
          setEditData(null);
        } else {
          showNotif('error', result.message || 'Gagal menambahkan data');
        }
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, updateOffice, createOffice, showNotif]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await deleteOffice(deleteData.pubid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', 'Office berhasil dihapus');
      } else {
        showNotif('error', result.message || 'Gagal menghapus data');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteOffice, showNotif]);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteData) return;
    setIsDeleting(true);
    try {
      const result = await bulkDelete(bulkDeleteData);
      if (result.success) {
        setBulkDeleteData(null);
        clearSelection();
        showNotif('success', `${bulkDeleteData.length} office berhasil dihapus`);
      } else {
        showNotif('error', result.message || 'Gagal menghapus data');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }, [bulkDeleteData, bulkDelete, clearSelection, showNotif]);

  const handleEditItem = useCallback((item) => {
    setEditData(item);
    setShowModal(true);
  }, []);

  const handleDeleteItem = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const allSelected = offices.length > 0 && selectedIds.length === offices.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < offices.length;

  const columns = useMemo(() => {
    const renderSortIcon = (field) => {
      if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
      return sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 text-amber-600" />
        : <ArrowDown className="h-3 w-3 text-amber-600" />;
    };

    return [
      {
        name: (
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            aria-label="Pilih semua"
          />
        ),
        width: '44px',
        center: true,
        ignoreRowClick: true,
        cell: (row) => {
          const isSelected = selectedIds.includes(row.pubid);
          return (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectId(row.pubid)}
              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              aria-label={`Pilih ${row.name}`}
            />
          );
        },
      },
      {
        name: <span className="text-xs font-semibold text-slate-600">No</span>,
        width: '52px',
        center: true,
        cell: (row, index) => (
          <div className="w-full text-center text-xs font-medium text-slate-400">{(meta.from || 0) + index}</div>
        ),
      },
      {
        name: (
          <button type="button" onClick={() => handleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <span>Nama Office</span>{renderSortIcon('name')}
          </button>
        ),
        grow: 1.6,
        minWidth: '220px',
        cell: (row) => (
          <div className="py-1.5 min-w-0 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{row.name}</div>
              <div className="text-xs text-slate-500 truncate">{row.description || '-'}</div>
            </div>
          </div>
        ),
      },
      {
        name: (
          <button type="button" onClick={() => handleSort('description')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <span>Deskripsi</span>{renderSortIcon('description')}
          </button>
        ),
        grow: 1.4,
        minWidth: '200px',
        cell: (row) => (
          <span className="text-xs text-slate-600 line-clamp-2">{row.description || '-'}</span>
        ),
      },
      {
        name: (
          <button type="button" onClick={() => handleSort('location')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <span>Lokasi</span>{renderSortIcon('location')}
          </button>
        ),
        grow: 1.2,
        minWidth: '180px',
        cell: (row) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate">{row.location || '-'}</span>
          </div>
        ),
      },
      {
        name: (
          <button type="button" onClick={() => handleSort('id_kategori')} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
            <span>Kategori</span>{renderSortIcon('id_kategori')}
          </button>
        ),
        width: '130px',
        cell: (row) => <KategoriBadge id={row.id_kategori} getKategoriName={getKategoriName} />,
      },
      {
        name: <span className="text-xs font-semibold text-slate-600">Aksi</span>,
        width: '64px',
        center: true,
        ignoreRowClick: true,
        cell: (row) => (
          <ActionMenu
            row={row}
            isOpen={openMenuId === row.pubid}
            onToggle={() => setOpenMenuId((cur) => (cur === row.pubid ? null : row.pubid))}
            onClose={() => setOpenMenuId(null)}
            onDetail={(r) => { setDetailRow(r); setOpenMenuId(null); }}
            onEdit={(r) => { handleEditItem(r); setOpenMenuId(null); }}
            onDelete={(r) => { handleDeleteItem(r); setOpenMenuId(null); }}
          />
        ),
      },
    ];
  }, [meta.from, sortField, sortDir, handleSort, openMenuId, handleEditItem, handleDeleteItem, selectedIds, toggleSelectId, toggleSelectAll, allSelected, someSelected, getKategoriName]);

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

  useEffect(() => {
    document.title = 'Manajemen Kandang/Office - TernaSys';
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 overflow-hidden">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Manajemen Kandang/Office</h1>
              <p className="text-xs text-slate-500 truncate hidden sm:block">Kelola data kandang & office</p>
            </div>
          </div>
          <button
            onClick={() => { setEditData(null); setShowModal(true); }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" /> Tambah
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
                    {(Object.values(appliedFilters).filter((v) => v !== '' && v !== null && v !== undefined).length) + (filterKategori !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
              {hasAppliedFilters && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
              <div className="ml-auto text-xs text-slate-500 hidden sm:block">
                <span className="font-semibold text-slate-700">{(meta.total || 0).toLocaleString('id-ID')}</span> data
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/70 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="font-medium">{selectedIds.length} dipilih</span>
                  <button onClick={clearSelection} className="text-red-500 underline-offset-2 hover:underline">Batal pilih</button>
                </div>
                <button
                  onClick={() => setBulkDeleteData([...selectedIds])}
                  className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  <Trash2 className="h-3 w-3" /> Hapus Terpilih
                </button>
              </div>
            )}

            {showFilterPanel && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={filterInput.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Nama office"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <input
                    type="text"
                    value={filterInput.description}
                    onChange={(e) => handleFilterChange('description', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Deskripsi"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <input
                    type="text"
                    value={filterInput.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                    placeholder="Lokasi"
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  />
                  <select
                    value={filterKategori}
                    onChange={(e) => { setFilterKategori(e.target.value); setPage(1); }}
                    disabled={kategoriLoading}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 disabled:bg-slate-100"
                  >
                    <option value="all">Semua Kategori</option>
                    {getActiveKategori().map((kategori, index) => (
                      <option key={`kategori-${kategori.id || kategori.value || index}`} value={kategori.value}>
                        {kategori.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    <Search className="h-3 w-3" /> Terapkan
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
              data={offices}
              customStyles={customTableStyles}
              progressPending={loading}
              progressComponent={<SkeletonRows />}
              noDataComponent={
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">Tidak ada data ditemukan</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {hasAppliedFilters ? 'Coba ubah filter atau reset' : 'Belum ada office terdaftar'}
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
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-slate-500">
                {(meta.total || 0) === 0 ? '0-0' : `${startIdx}-${endIdx}`} dari{' '}
                <span className="font-semibold text-slate-700">{(meta.total || 0).toLocaleString('id-ID')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => handlePageChange(1)} disabled={page <= 1 || loading} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Halaman pertama">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Prev">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1 px-2 text-xs text-slate-600">
                <span>Hal</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => { const p = Number(e.target.value); if (p >= 1 && p <= totalPages) handlePageChange(p); }}
                  className="w-12 rounded-md border border-slate-200 px-1.5 py-1 text-xs text-center outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                />
                <span>/ {totalPages.toLocaleString('id-ID')}</span>
              </div>
              <button type="button" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages || loading} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Next">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => handlePageChange(totalPages)} disabled={page >= totalPages || loading} className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" title="Halaman terakhir">
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AddEditOfficeModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditData(null); }}
          onSave={handleSave}
          editData={editData}
          kategoriList={kategoriList}
          kategoriLoading={kategoriLoading}
        />
      )}

      {detailRow && (
        <DetailDrawer
          row={detailRow}
          getKategoriName={getKategoriName}
          onClose={() => setDetailRow(null)}
          onEdit={(r) => { setDetailRow(null); handleEditItem(r); }}
          onDelete={(r) => { setDetailRow(null); handleDeleteItem(r); }}
        />
      )}

      <OfficeDetailModal
        isOpen={!!detailRow && false}
        onClose={() => setDetailRow(null)}
        data={detailRow}
        getKategoriName={getKategoriName}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus Office "${deleteData?.name || ''}"?`}
        description="Tindakan ini akan menghapus data office secara permanen dan tidak dapat dibatalkan."
        loading={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={!!bulkDeleteData}
        onClose={() => { setBulkDeleteData(null); setIsDeleting(false); }}
        onConfirm={handleConfirmBulkDelete}
        title={`Hapus ${bulkDeleteData?.length || 0} data terpilih?`}
        description="Tindakan ini akan menghapus semua data office yang dipilih secara permanen."
        loading={isDeleting}
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
        <div className="h-3 w-4 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
        <div className="flex-1 h-3 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
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
          <button onClick={() => onDetail(row)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Eye className="h-3.5 w-3.5 text-slate-500" /> Lihat Detail
          </button>
          <button onClick={() => onEdit(row)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit
          </button>
          <button onClick={() => onDelete(row)} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
            <Trash2 className="h-3.5 w-3.5 text-red-500" /> Hapus
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

const DetailDrawer = ({ row, getKategoriName, onClose, onEdit, onDelete }) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Detail Office</h3>
            <p className="text-xs text-slate-500">Informasi lengkap office/kandang</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{row.name}</h2>
              <KategoriBadge id={row.id_kategori} getKategoriName={getKategoriName} />
            </div>
          </div>
          <DetailField label="Deskripsi" value={row.description} />
          <DetailField label="Lokasi" value={row.location} />
        </div>
        <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => onDelete(row)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
          <button onClick={() => onEdit(row)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit Office
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
    <p className="mt-0.5 text-sm text-slate-700 break-words">{value || <span className="text-slate-300">-</span>}</p>
  </div>
);

export default KandangOfficePage;
