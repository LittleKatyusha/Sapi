import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, X, Loader2, TrendingUp, Calendar, RefreshCw, Eye, Edit2, Trash2, MoreVertical, AlertCircle } from 'lucide-react';

import usePembelianBeban from '../pembelianLainLain/hooks/usePembelianBeban';
import useDivisiData from '../pembelianLainLain/hooks/useDivisiData';
import useJenisPembelianLainLain from '../pembelianLainLain/hooks/useJenisPembelianLainLain';
import useTipePembayaranLazy from '../../../hooks/useTipePembayaranLazy';
import { API_ENDPOINTS } from '../../../config/api';
import HttpClient from '../../../services/httpClient';
import enhancedLainLainTableStyles from '../pembelianLainLain/constants/tableStyles';

import DeleteConfirmationModal from '../pembelianLainLain/modals/DeleteConfirmationModal';
import AddEditBebanModal from '../pembelianLainLain/modals/AddEditBebanModal';

const PembelianBebanBiayaPage = () => {
    const {
        pembelianBeban,
        loading,
        error,
        searchTerm,
        serverPagination,
        fetchPembelianBeban,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembelianBeban,
        updatePembelianBeban,
        deletePembelianBeban,
    } = usePembelianBeban();

    const { divisiOptions, loading: divisiLoading } = useDivisiData();
    const { jenisPembelianOptions, loading: jenisPembelianLoading } = useJenisPembelianLainLain();
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        fetchTipePembayaran,
    } = useTipePembayaranLazy();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailMode, setIsDetailMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchPembelianBeban();
        fetchTipePembayaran();
    }, []);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('[data-dropdown]')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseFloat(value.toString().replace(/[.,]/g, '')) || 0;
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '-';
        return `Rp ${formatNumber(value)}`;
    };

    // Handlers
    const handleOpenAdd = async () => {
        await fetchTipePembayaran();
        setSelectedItem(null);
        setIsDetailMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = async (row) => {
        setOpenMenuId(null);
        try {
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/show`, {
                pid: row.pid,
            });
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                const detail = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedItem(detail);
                setIsDetailMode(false);
                setIsModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal mengambil data beban untuk diedit' });
        }
    };

    const handleOpenDetail = async (row) => {
        setOpenMenuId(null);
        try {
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/show`, {
                pid: row.pid,
            });
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                const detail = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedItem(detail);
                setIsDetailMode(true);
                setIsModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal mengambil data beban' });
        }
    };

    const handleOpenDelete = (row) => {
        setOpenMenuId(null);
        setSelectedItem({ ...row, reportType: 'beban' });
        setIsDeleteModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setIsDetailMode(false);
    };

    const handleCloseDelete = () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
    };

    const handleSave = async (bebanData) => {
        setIsSubmitting(true);
        try {
            let result;
            if (selectedItem && selectedItem.pid) {
                result = await updatePembelianBeban(selectedItem.pid, bebanData);
            } else {
                result = await createPembelianBeban(bebanData);
            }
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data berhasil ${selectedItem ? 'diperbarui' : 'disimpan'}!`,
                });
                handleCloseModal();
                await fetchPembelianBeban(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                throw new Error(result.message || 'Gagal menyimpan data');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal menyimpan data beban' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (item) => {
        try {
            const pid = item.pid || item.encryptedPid;
            const result = await deletePembelianBeban(pid);
            if (result.success) {
                setNotification({ type: 'success', message: result.message || 'Data berhasil dihapus' });
                handleCloseDelete();
                await fetchPembelianBeban(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                setNotification({ type: 'error', message: result.message || 'Gagal menghapus data' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal menghapus data beban' });
        }
    };

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (_, index) => index + 1,
            width: '55px',
            center: true,
            cell: (_, index) => (
                <span className="text-xs text-gray-500 font-medium">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </span>
            ),
        },
        {
            name: 'Tanggal Pembayaran',
            selector: (row) => row.tgl_pembayaran,
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs text-gray-700">
                    {row.tgl_pembayaran || '-'}
                </span>
            ),
        },
        {
            name: 'Farm/Divisi',
            selector: (row) => row.farm,
            sortable: true,
            minWidth: '130px',
            cell: (row) => (
                <span className="text-xs text-gray-700 font-medium">{row.farm || '-'}</span>
            ),
        },
        {
            name: 'Nama Item',
            selector: (row) => row.nama_item,
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.nama_item || '-'}</span>
            ),
        },
        {
            name: 'Peruntukan',
            selector: (row) => row.peruntukan,
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.peruntukan || '-'}</span>
            ),
        },
        {
            name: 'Dibayarkan Oleh',
            selector: (row) => row.nama_pembayar,
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.nama_pembayar || '-'}</span>
            ),
        },
        {
            name: 'Biaya Total',
            selector: (row) => row.biaya_total,
            sortable: true,
            minWidth: '140px',
            right: true,
            cell: (row) => (
                <span className="text-xs font-semibold text-orange-600">
                    {formatCurrency(row.biaya_total)}
                </span>
            ),
        },
        {
            name: 'Jenis Pembelian',
            selector: (row) => row.jenis_pembelian,
            sortable: true,
            minWidth: '140px',
            cell: (row) => (
                <span className="text-xs text-gray-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    {row.jenis_pembelian || '-'}
                </span>
            ),
        },
        {
            name: 'Syarat Pembayaran',
            selector: (row) => row.syarat_pembelian,
            sortable: true,
            minWidth: '150px',
            cell: (row) => (
                <span className="text-xs text-gray-600">{row.syarat_pembelian || '-'}</span>
            ),
        },
        {
            name: 'Tipe Pembayaran',
            selector: (row) => row.tipe_pembayaran,
            sortable: true,
            minWidth: '140px',
            cell: (row) => (
                <span className="text-xs text-gray-600">{row.tipe_pembayaran || '-'}</span>
            ),
        },
        {
            name: 'Keterangan',
            selector: (row) => row.keterangan,
            minWidth: '180px',
            cell: (row) => (
                <span className="text-xs text-gray-500 truncate max-w-xs" title={row.keterangan}>
                    {row.keterangan || '-'}
                </span>
            ),
        },
        {
            name: 'Aksi',
            center: true,
            width: '80px',
            cell: (row) => (
                <div className="relative" data-dropdown>
                    <button
                        onClick={() => setOpenMenuId(openMenuId === row.pid ? null : row.pid)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Aksi"
                    >
                        <MoreVertical size={15} />
                    </button>
                    {openMenuId === row.pid && (
                        <div className="absolute right-0 z-50 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-xs">
                            <button
                                onClick={() => handleOpenDetail(row)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700"
                            >
                                <Eye size={13} className="text-blue-500" /> Detail
                            </button>
                            <button
                                onClick={() => handleOpenEdit(row)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-gray-700"
                            >
                                <Edit2 size={13} className="text-amber-500" /> Edit
                            </button>
                            <button
                                onClick={() => handleOpenDelete(row)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-red-600"
                            >
                                <Trash2 size={13} /> Hapus
                            </button>
                        </div>
                    )}
                </div>
            ),
        },
    ], [openMenuId, serverPagination]);

    const totalBiaya = useMemo(() => {
        return pembelianBeban.reduce((acc, row) => acc + (parseFloat(row.biaya_total) || 0), 0);
    }, [pembelianBeban]);

    return (
        <div className="p-4 space-y-4">
            {/* Notification */}
            {notification && (
                <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-sm ${
                        notification.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : notification.type === 'info'
                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                >
                    <AlertCircle size={16} />
                    <span className="flex-1">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-auto">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={22} className="text-orange-500" />
                        Pembelian Beban Biaya
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manajemen data pembelian beban dan biaya HO</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchPembelianBeban(1, serverPagination.perPage, searchTerm, false, true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <PlusCircle size={15} />
                        Tambah
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Total Record</p>
                    <p className="text-xl font-bold text-gray-800">{serverPagination.totalItems.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-400 mt-1">Data beban biaya</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-orange-500 mb-1">Total Biaya (Halaman Ini)</p>
                    <p className="text-lg font-bold text-orange-700 truncate" title={formatCurrency(totalBiaya)}>
                        {formatCurrency(totalBiaya)}
                    </p>
                    <p className="text-xs text-orange-400 mt-1">Akumulasi biaya</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hidden sm:block">
                    <p className="text-xs text-gray-500 mb-1">Halaman</p>
                    <p className="text-xl font-bold text-gray-800">
                        {serverPagination.currentPage} / {serverPagination.totalPages || 1}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Navigasi data</p>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari beban biaya..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={13} />
                        <span>{serverPagination.totalItems} data ditemukan</span>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mx-4 my-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        <AlertCircle size={15} />
                        <span>{error}</span>
                    </div>
                )}

                {/* DataTable */}
                <DataTable
                    columns={columns}
                    data={pembelianBeban}
                    progressPending={loading}
                    progressComponent={
                        <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                            <Loader2 size={20} className="animate-spin text-orange-500" />
                            <span className="text-sm">Memuat data...</span>
                        </div>
                    }
                    noDataComponent={
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <TrendingUp size={40} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">Tidak ada data beban biaya</p>
                            <p className="text-xs mt-1">Klik "Tambah" untuk menambahkan data baru</p>
                        </div>
                    }
                    customStyles={enhancedLainLainTableStyles}
                    pagination
                    paginationServer
                    paginationTotalRows={serverPagination.totalItems}
                    paginationDefaultPage={serverPagination.currentPage}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    paginationPerPage={serverPagination.perPage}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    dense
                    striped
                    highlightOnHover
                    responsive
                />
            </div>

            {/* Modals */}
            <AddEditBebanModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingItem={selectedItem}
                divisiOptions={divisiOptions}
                jenisBebanOptions={jenisPembelianOptions}
                syaratPembelianOptions={tipePembayaranOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={divisiLoading}
                jenisBebanLoading={jenisPembelianLoading}
                syaratPembelianLoading={tipePembayaranLoading}
                isSubmitting={isSubmitting}
                isDetailMode={isDetailMode}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDelete}
                onConfirm={handleConfirmDelete}
                data={selectedItem}
                loading={loading}
            />
        </div>
    );
};

export default PembelianBebanBiayaPage;
