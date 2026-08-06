import React, { useState, useMemo, useCallback } from 'react';
import {
    PlusCircle, Search, Store, MapPin, Phone,
    ChevronUp, ChevronDown, ChevronsUpDown, RotateCcw,
    Trash2, AlertTriangle,
} from 'lucide-react';

import ActionButton from './outlet/components/ActionButton';
import AddEditOutletModal from './outlet/modals/AddEditOutletModal';
import OutletDetailModal from './outlet/modals/OutletDetailModal';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';
import useOutlets from './outlet/hooks/useOutlets';

const SortIcon = ({ field, sortField, sortDir }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-gray-300" />;
    return sortDir === 'asc'
        ? <ChevronUp size={13} className="text-red-600" />
        : <ChevronDown size={13} className="text-red-600" />;
};

const SkeletonRow = () => (
    <tr className="border-b border-gray-100">
        <td className="px-4 py-3"><div className="h-4 w-4 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-48 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200 animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-8 rounded bg-gray-200 animate-pulse ml-auto" /></td>
    </tr>
);

const EmptyState = () => (
    <tr>
        <td colSpan={6} className="py-16 text-center">
            <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Tidak ada data outlet ditemukan</p>
            <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci pencarian atau reset filter</p>
        </td>
    </tr>
);

const OutletPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [bulkDeleteData, setBulkDeleteData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    const {
        outlets,
        loading,
        error,
        searchInput, setSearchInput,
        page, setPage,
        perPage, setPerPage,
        meta,
        sortField, sortDir, handleSort,
        filterStatus, setFilterStatus,
        resetFilters,
        selectedIds, toggleSelectId, toggleSelectAll, clearSelection,
        stats,
        createOutlet, updateOutlet, deleteOutlet, bulkDelete,
    } = useOutlets();

    const handleAdd = useCallback(() => {
        setEditData(null);
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setEditData(item);
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((item) => {
        setDeleteData(item);
    }, []);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteData) return;
        setIsDeleting(true);
        try {
            await deleteOutlet(deleteData.pubid);
        } finally {
            setIsDeleting(false);
            setDeleteData(null);
        }
    }, [deleteData, deleteOutlet]);

    const handleConfirmBulkDelete = useCallback(async () => {
        if (!bulkDeleteData) return;
        setIsDeleting(true);
        try {
            await bulkDelete(bulkDeleteData);
            clearSelection();
        } finally {
            setIsDeleting(false);
            setBulkDeleteData(null);
        }
    }, [bulkDeleteData, bulkDelete, clearSelection]);

    const handleSave = useCallback(async (formData) => {
        try {
            if (editData) {
                await updateOutlet(editData.pubid, formData);
            } else {
                await createOutlet(formData);
            }
            setShowAddModal(false);
            setShowEditModal(false);
            setEditData(null);
        } catch (err) {
            console.error('Save error:', err);
        }
    }, [editData, updateOutlet, createOutlet]);

    const allSelected = outlets.length > 0 && selectedIds.length === outlets.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < outlets.length;
    const hasActiveFilter = searchInput || filterStatus !== 'all' || sortField !== 'id' || sortDir !== 'asc';

    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxButtons = 5;
        let start = Math.max(1, page - Math.floor(maxButtons / 2));
        let end = Math.min(meta.last_page || 1, start + maxButtons - 1);
        if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [page, meta.last_page]);

    return (
        <div className="min-h-dvh bg-slate-50 p-4 md:p-6">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Manajemen Outlet</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau outlet penjualan dengan mudah</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <PlusCircle size={18} />
                        Tambah Outlet
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                                <Store size={16} className="text-red-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Total Outlet</div>
                                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Store size={16} className="text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Ditampilkan</div>
                                <div className="text-lg font-bold text-gray-900">{outlets.length}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
                                <MapPin size={16} className="text-sky-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Halaman</div>
                                <div className="text-lg font-bold text-gray-900">{meta.current_page} / {meta.last_page || 1}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Phone size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500">Terpilih</div>
                                <div className="text-lg font-bold text-gray-900">{selectedIds.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, alamat, atau kontak outlet..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Tidak Aktif</option>
                        </select>
                        {hasActiveFilter && (
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <RotateCcw size={14} />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk action bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                            <AlertTriangle size={16} />
                            <span className="font-medium">{selectedIds.length} outlet terpilih</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBulkDeleteData(selectedIds)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                                <Trash2 size={14} />
                                Hapus Terpilih
                            </button>
                            <button
                                onClick={clearSelection}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('nama')}>
                                        <div className="inline-flex items-center gap-1.5">Nama Outlet <SortIcon field="nama" sortField={sortField} sortDir={sortDir} /></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('alamat')}>
                                        <div className="inline-flex items-center gap-1.5">Lokasi <SortIcon field="alamat" sortField={sortField} sortDir={sortDir} /></div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => handleSort('kontak')}>
                                        <div className="inline-flex items-center gap-1.5">Kontak <SortIcon field="kontak" sortField={sortField} sortDir={sortDir} /></div>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={`sk-${i}`} />)
                                ) : outlets.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    outlets.map((row, index) => {
                                        const isSelected = selectedIds.includes(row.pubid);
                                        return (
                                            <tr
                                                key={row.pubid}
                                                className={`group transition-colors ${isSelected ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectId(row.pubid)}
                                                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 font-medium">
                                                    {meta.from + index}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Store size={15} className="text-gray-400 flex-shrink-0" />
                                                        <span className="font-medium text-gray-800 truncate max-w-[200px]" title={row.name}>
                                                            {row.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-gray-600">
                                                        <MapPin size={13} className="flex-shrink-0 text-gray-400" />
                                                        <span className="max-w-[220px] truncate" title={row.location}>
                                                            {row.location}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-gray-600">
                                                        <Phone size={13} className="flex-shrink-0 text-gray-400" />
                                                        <span className="whitespace-nowrap">{row.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
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

                    {/* Pagination footer */}
                    <div className="border-t border-gray-200 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-gray-500">
                            Menampilkan <span className="font-medium text-gray-700">{meta.from || 0}</span>–<span className="font-medium text-gray-700">{meta.to || 0}</span> dari <span className="font-medium text-gray-700">{meta.total || 0}</span> data
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Baris:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-red-500"
                                >
                                    {[10, 25, 50, 100].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page <= 1}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                                >
                                    ‹
                                </button>
                                {pageNumbers.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-2.5 py-1 text-xs border rounded-md ${
                                            p === page
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage((p) => Math.min(meta.last_page || 1, p + 1))}
                                    disabled={page >= (meta.last_page || 1)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setPage(meta.last_page || 1)}
                                    disabled={page >= (meta.last_page || 1)}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50"
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AddEditOutletModal
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
                loading={loading}
            />

            <OutletDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailData(null);
                }}
                data={detailData}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteData}
                onClose={() => { setDeleteData(null); setIsDeleting(false); }}
                onConfirm={handleConfirmDelete}
                title={`Hapus Outlet "${deleteData?.name || ''}"?`}
                description="Tindakan ini akan menghapus data outlet secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />

            <DeleteConfirmationModal
                isOpen={!!bulkDeleteData}
                onClose={() => { setBulkDeleteData(null); setIsDeleting(false); }}
                onConfirm={handleConfirmBulkDelete}
                title={`Hapus ${bulkDeleteData?.length || 0} outlet terpilih?`}
                description="Tindakan ini akan menghapus semua outlet terpilih secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />
        </div>
    );
};

export default OutletPage;
