import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    PlusCircle, Search, Building2, MapPin,
    ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw,
    Trash2, AlertTriangle,
} from 'lucide-react';

import ActionButton from './office/components/ActionButton';
import AddEditOfficeModal from './office/modals/AddEditOfficeModal';
import OfficeDetailModal from './office/modals/OfficeDetailModal';
import DeleteConfirmationModal from './office/modals/DeleteConfirmationModal';
import useOffices from './office/hooks/useOffices';

const SortIcon = ({ field, sortField, sortDir }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-gray-300" />;
    return sortDir === 'asc'
        ? <ChevronUp size={13} className="text-red-600" />
        : <ChevronDown size={13} className="text-red-600" />;
};

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
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}>
            {name}
        </span>
    );
};

const SkeletonRow = () => (
    <tr className="border-b border-gray-100">
        <td className="px-4 py-3"><div className="h-4 w-4 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-56 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-8 rounded bg-gray-200 animate-pulse ml-auto" /></td>
    </tr>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Building2 className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">Tidak ada data ditemukan</p>
        <p className="mt-1 text-xs text-gray-400">Coba ubah kata kunci pencarian atau reset filter.</p>
    </div>
);

const KandangOfficePage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [bulkDeleteData, setBulkDeleteData] = useState(null);

    const {
        offices,
        loading,
        error,
        searchInput,
        setSearchInput,
        page,
        setPage,
        perPage,
        setPerPage,
        meta,
        sortField,
        sortDir,
        handleSort,
        filterKategori,
        setFilterKategori,
        resetFilters,
        selectedIds,
        toggleSelectId,
        toggleSelectAll,
        clearSelection,
        stats,
        createOffice,
        updateOffice,
        deleteOffice,
        bulkDelete,
        getKategoriName,
        kategoriList,
        getActiveKategori,
        kategoriLoading,
    } = useOffices();

    useEffect(() => {
        document.title = 'Manajemen Kandang/Office - TernaSys';
    }, []);

    const handleAdd = useCallback(() => {
        setEditData(null);
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setEditData(item);
        setShowEditModal(true);
        setOpenMenuId(null);
    }, []);

    const handleDelete = useCallback((item) => {
        setDeleteData(item);
        setOpenMenuId(null);
    }, []);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
        setOpenMenuId(null);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteData) return;
        setIsDeleting(true);
        try {
            await deleteOffice(deleteData.pubid);
        } finally {
            setIsDeleting(false);
            setDeleteData(null);
        }
    }, [deleteData, deleteOffice]);

    const handleConfirmBulkDelete = useCallback(async () => {
        if (!bulkDeleteData) return;
        setIsDeleting(true);
        try {
            await bulkDelete(bulkDeleteData);
        } finally {
            setIsDeleting(false);
            setBulkDeleteData(null);
            clearSelection();
        }
    }, [bulkDeleteData, bulkDelete, clearSelection]);

    const handleSave = useCallback(async (formData) => {
        try {
            if (editData) {
                await updateOffice(editData.pubid, formData);
            } else {
                await createOffice(formData);
            }
            setShowAddModal(false);
            setShowEditModal(false);
            setEditData(null);
        } catch (err) {
            console.error('Save error:', err);
        }
    }, [editData, updateOffice, createOffice]);

    const handlePerPageChange = useCallback((e) => {
        setPerPage(Number(e.target.value));
        setPage(1);
    }, [setPerPage, setPage]);

    const handleFilterKategori = useCallback((e) => {
        setFilterKategori(e.target.value);
        setPage(1);
    }, [setFilterKategori, setPage]);

    const allSelected = offices.length > 0 && selectedIds.length === offices.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < offices.length;
    const hasActiveFilter = searchInput !== '' || filterKategori !== 'all' || sortField !== 'id' || sortDir !== 'asc';

    const columns = useMemo(() => ([
        { key: 'name', label: 'Nama', sortable: true, grow: 2 },
        { key: 'description', label: 'Deskripsi', sortable: true, grow: 3 },
        { key: 'location', label: 'Lokasi', sortable: true, grow: 2 },
    ]), []);

    return (
        <div className="min-h-screen bg-slate-50/60">
            <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
                {/* Header — compact, inline */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                                Manajemen Kandang/Office
                            </h1>
                            <p className="text-xs text-gray-500 sm:text-sm">
                                Kelola data kandang & office — <span className="font-medium text-gray-700">{stats.total.toLocaleString('id-ID')}</span> total data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        <PlusCircle size={16} />
                        Tambah Office
                    </button>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium">Koneksi API Error</p>
                            <p className="mt-0.5 text-xs text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Filter bar — single row, compact */}
                <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, deskripsi, atau lokasi..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={filterKategori}
                            onChange={handleFilterKategori}
                            disabled={kategoriLoading}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 transition focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                        >
                            <option value="all">Semua Kategori</option>
                            {getActiveKategori().map((kategori, index) => (
                                <option key={`kategori-${kategori.id || kategori.value || index}`} value={kategori.value}>
                                    {kategori.label}
                                </option>
                            ))}
                        </select>
                        {hasActiveFilter && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                                title="Reset filter"
                            >
                                <RotateCcw size={13} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk action bar */}
                {selectedIds.length > 0 && (
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50/70 px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 text-red-700">
                            <span className="font-medium">{selectedIds.length} dipilih</span>
                            <button
                                onClick={clearSelection}
                                className="text-xs text-red-500 underline-offset-2 hover:underline"
                            >
                                Batal pilih
                            </button>
                        </div>
                        <button
                            onClick={() => setBulkDeleteData([...selectedIds])}
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                            <Trash2 size={13} />
                            Hapus Terpilih
                        </button>
                    </div>
                )}

                {/* Table card — sticky header, compact rows */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur">
                                <tr className="border-b border-gray-200">
                                    <th className="w-10 px-4 py-2.5 text-left">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            aria-label="Pilih semua"
                                        />
                                    </th>
                                    <th className="w-12 px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        No.
                                    </th>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                                            style={{ minWidth: col.grow ? `${col.grow * 80}px` : undefined }}
                                            onClick={() => col.sortable && handleSort(col.key)}
                                        >
                                            <div className="inline-flex items-center gap-1">
                                                {col.label}
                                                {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="w-16 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: perPage }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)
                                ) : offices.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 3} className="p-0">
                                            <EmptyState />
                                        </td>
                                    </tr>
                                ) : (
                                    offices.map((row, index) => {
                                        const isSelected = selectedIds.includes(row.pubid);
                                        return (
                                            <tr
                                                key={row.pubid}
                                                className={`group transition-colors ${isSelected ? 'bg-red-50/40' : 'hover:bg-gray-50/60'}`}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectId(row.pubid)}
                                                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        aria-label={`Pilih ${row.name}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-2.5 text-xs font-medium text-gray-400">
                                                    {(meta.from || 0) + index}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                                            <Building2 size={14} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium text-gray-800" title={row.name}>
                                                                {row.name}
                                                            </div>
                                                            <div className="mt-0.5">
                                                                <KategoriBadge id={row.id_kategori} getKategoriName={getKategoriName} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <p className="max-w-xs truncate text-sm text-gray-600" title={row.description || '-'}>
                                                        {row.description || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <MapPin size={13} className="flex-shrink-0 text-gray-400" />
                                                        <span className="max-w-[200px] truncate" title={row.location || '-'}>
                                                            {row.location || '-'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end">
                                                        <ActionButton
                                                            row={row}
                                                            openMenuId={openMenuId}
                                                            setOpenMenuId={setOpenMenuId}
                                                            onEdit={handleEdit}
                                                            onDelete={handleDelete}
                                                            onDetail={handleDetail}
                                                            isActive={openMenuId === row.pubid}
                                                            usePortal={true}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer — compact, informative */}
                    <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 text-xs sm:flex-row">
                        <div className="flex items-center gap-3 text-gray-600">
                            <span>
                                {meta.total > 0
                                    ? `Menampilkan ${meta.from}–${meta.to} dari ${meta.total.toLocaleString('id-ID')} data`
                                    : 'Tidak ada data'}
                            </span>
                            <div className="hidden items-center gap-1.5 sm:flex">
                                <span className="text-gray-400">Baris:</span>
                                <select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-400"
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(1)}
                                disabled={page <= 1 || loading}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                «
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ‹
                            </button>
                            <span className="px-2 py-1 text-xs text-gray-600">
                                Hal <span className="font-semibold text-gray-800">{page}</span> / {meta.last_page || 1}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(meta.last_page || 1, p + 1))}
                                disabled={page >= meta.last_page || loading}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => setPage(meta.last_page || 1)}
                                disabled={page >= meta.last_page || loading}
                                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddEditOfficeModal
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
                kategoriList={kategoriList}
                kategoriLoading={kategoriLoading}
            />

            <OfficeDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailData(null);
                }}
                data={detailData}
                getKategoriName={getKategoriName}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteData}
                onClose={() => { setDeleteData(null); setIsDeleting(false); }}
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
        </div>
    );
};

export default KandangOfficePage;
