import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, X, Loader2, Package, RefreshCw, Eye, Edit2, Trash2, MoreVertical, AlertCircle } from 'lucide-react';

import usePembelianBahanPembantu from '../pembelianLainLain/hooks/usePembelianBahanPembantu';
import useDivisiData from '../pembelianLainLain/hooks/useDivisiData';
import useJenisPembelianAPI from '../pembelianLainLain/hooks/useJenisPembelianAPI';
import useSatuanAPI from '../pembelianLainLain/hooks/useSatuanAPI';
import useTipePembayaranLazy from '../../../hooks/useTipePembayaranLazy';
import useBanksAPILazy from '../../../hooks/useBanksAPILazy';
import { API_ENDPOINTS } from '../../../config/api';
import HttpClient from '../../../services/httpClient';
import enhancedLainLainTableStyles from '../pembelianLainLain/constants/tableStyles';

import DeleteConfirmationModal from '../pembelianLainLain/modals/DeleteConfirmationModal';
import AddEditBahanPembantuModal from '../pembelianLainLain/modals/AddEditBahanPembantuModal';

const PembelianBahanPembantuPage = () => {
    const {
        pembelianBahanPembantu,
        loading,
        error,
        searchTerm,
        serverPagination,
        fetchPembelianBahanPembantu,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        createPembelianBahanPembantu,
        updatePembelianBahanPembantu,
        deletePembelianBahanPembantu,
    } = usePembelianBahanPembantu();

    const { divisiOptions, loading: divisiLoading } = useDivisiData();
    const { jenisPembelianOptions, loading: jenisPembelianLoading } = useJenisPembelianAPI();
    const { satuanOptions, loading: satuanLoading } = useSatuanAPI();
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        fetchTipePembayaran,
    } = useTipePembayaranLazy();
    const {
        bankOptions,
        loading: bankLoading,
        fetchBanks,
    } = useBanksAPILazy();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDetailMode, setIsDetailMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        fetchPembelianBahanPembantu();
        fetchTipePembayaran();
        fetchBanks();
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
        await Promise.all([fetchTipePembayaran(), fetchBanks()]);
        setSelectedItem(null);
        setIsDetailMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = async (row) => {
        setOpenMenuId(null);
        try {
            await Promise.all([fetchTipePembayaran(), fetchBanks()]);
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/show`, {
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
            setNotification({ type: 'error', message: err.message || 'Gagal mengambil data bahan pembantu untuk diedit' });
        }
    };

    const handleOpenDetail = async (row) => {
        setOpenMenuId(null);
        try {
            await Promise.all([fetchTipePembayaran(), fetchBanks()]);
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/show`, {
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
            setNotification({ type: 'error', message: err.message || 'Gagal mengambil data bahan pembantu' });
        }
    };

    const handleOpenDelete = (row) => {
        setOpenMenuId(null);
        setSelectedItem({ ...row, reportType: 'bahan_pembantu' });
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

    const handleSave = async (bahanPembantuData) => {
        setIsSubmitting(true);
        try {
            let result;
            if (selectedItem && selectedItem.pid) {
                result = await updatePembelianBahanPembantu(selectedItem.pid, bahanPembantuData);
            } else {
                result = await createPembelianBahanPembantu(bahanPembantuData);
            }
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data berhasil ${selectedItem ? 'diperbarui' : 'disimpan'}!`,
                });
                handleCloseModal();
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                throw new Error(result.message || 'Gagal menyimpan data');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal menyimpan data bahan pembantu' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (item) => {
        try {
            const pid = item.pid || item.encryptedPid;
            const result = await deletePembelianBahanPembantu(pid);
            if (result.success) {
                setNotification({ type: 'success', message: result.message || 'Data berhasil dihapus' });
                handleCloseDelete();
                await fetchPembelianBahanPembantu(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                setNotification({ type: 'error', message: result.message || 'Gagal menghapus data' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Gagal menghapus data bahan pembantu' });
        }
    };

    const columns = useMemo(() => [
        {
            name: 'No',
            width: '55px',
            center: true,
            cell: (_, index) => (
                <span className="text-xs text-gray-500 font-medium">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
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
            name: 'Nama Produk',
            selector: (row) => row.nama_produk,
            sortable: true,
            minWidth: '160px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.nama_produk || '-'}</span>
            ),
        },
        {
            name: 'Peruntukan',
            selector: (row) => row.peruntukan,
            sortable: true,
            minWidth: '140px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.peruntukan || '-'}</span>
            ),
        },
        {
            name: 'Jumlah',
            selector: (row) => row.jumlah,
            sortable: true,
            minWidth: '90px',
            right: true,
            cell: (row) => (
                <span className="text-xs text-gray-700">
                    {row.jumlah ? `${formatNumber(row.jumlah)} ${row.satuan || ''}` : '-'}
                </span>
            ),
        },
        {
            name: 'Harga Satuan',
            selector: (row) => row.harga_satuan,
            sortable: true,
            minWidth: '130px',
            right: true,
            cell: (row) => (
                <span className="text-xs text-gray-700">{formatCurrency(row.harga_satuan)}</span>
            ),
        },
        {
            name: 'Pemasok',
            selector: (row) => row.pemasok,
            sortable: true,
            minWidth: '140px',
            cell: (row) => (
                <span className="text-xs text-gray-700">{row.pemasok || '-'}</span>
            ),
        },
        {
            name: 'Biaya Kirim',
            selector: (row) => row.biaya_kirim,
            sortable: true,
            minWidth: '120px',
            right: true,
            cell: (row) => (
                <span className="text-xs text-gray-600">{formatCurrency(row.biaya_kirim)}</span>
            ),
        },
        {
            name: 'Biaya Lain',
            selector: (row) => row.biaya_lain,
            sortable: true,
            minWidth: '120px',
            right: true,
            cell: (row) => (
                <span className="text-xs text-gray-600">{formatCurrency(row.biaya_lain)}</span>
            ),
        },
        {
            name: 'Total Biaya',
            selector: (row) => row.biaya_total,
            sortable: true,
            minWidth: '130px',
            right: true,
            cell: (row) => (
                <span className="text-xs font-semibold text-teal-600">
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
                <span className="text-xs text-gray-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {row.jenis_pembelian || '-'}
                </span>
            ),
        },
        {
            name: 'Syarat Pembelian',
            selector: (row) => row.syarat_pembelian,
            sortable: true,
            minWidth: '140px',
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
            minWidth: '160px',
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
                                <Edit2 size={13} className="text-teal-500" /> Edit
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
        return pembelianBahanPembantu.reduce((acc, row) => acc + (parseFloat(row.biaya_total) || 0), 0);
    }, [pembelianBahanPembantu]);

    const totalJumlah = useMemo(() => {
        return pembelianBahanPembantu.reduce((acc, row) => acc + (parseFloat(row.jumlah) || 0), 0);
    }, [pembelianBahanPembantu]);

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
                        <Package size={22} className="text-teal-500" />
                        Pembelian Bahan Pembantu
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manajemen data pembelian bahan pembantu HO</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchPembelianBahanPembantu(1, serverPagination.perPage, searchTerm, false, true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
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
                    <p className="text-xs text-gray-400 mt-1">Data bahan pembantu</p>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-teal-500 mb-1">Total Biaya (Halaman Ini)</p>
                    <p className="text-lg font-bold text-teal-700 truncate" title={formatCurrency(totalBiaya)}>
                        {formatCurrency(totalBiaya)}
                    </p>
                    <p className="text-xs text-teal-400 mt-1">Akumulasi biaya</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hidden sm:block">
                    <p className="text-xs text-gray-500 mb-1">Total Jumlah (Halaman Ini)</p>
                    <p className="text-xl font-bold text-gray-800">{formatNumber(totalJumlah)}</p>
                    <p className="text-xs text-gray-400 mt-1">Unit bahan pembantu</p>
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
                            placeholder="Cari bahan pembantu..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
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
                        <Package size={13} />
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
                    data={pembelianBahanPembantu}
                    progressPending={loading}
                    progressComponent={
                        <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                            <Loader2 size={20} className="animate-spin text-teal-500" />
                            <span className="text-sm">Memuat data...</span>
                        </div>
                    }
                    noDataComponent={
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Package size={40} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium">Tidak ada data bahan pembantu</p>
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
            <AddEditBahanPembantuModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingItem={selectedItem}
                divisiOptions={divisiOptions}
                jenisPembelianOptions={jenisPembelianOptions}
                satuanOptions={satuanOptions}
                syaratPembayaranOptions={tipePembayaranOptions}
                bankOptions={bankOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={divisiLoading}
                jenisPembelianLoading={jenisPembelianLoading}
                satuanLoading={satuanLoading}
                syaratPembayaranLoading={tipePembayaranLoading}
                bankLoading={bankLoading}
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

export default PembelianBahanPembantuPage;
