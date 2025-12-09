import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, X, Loader2 } from 'lucide-react';
import ActionButton from '../ActionButton';
import { enhancedTableStyles } from '../../constants/tableStyles';

/**
 * PengeluaranTable Component
 * Table for displaying and managing cash disbursement/approval requests
 * Used in KeuanganKasPage for the "Pengeluaran" tab
 */
const PengeluaranTable = ({
    data,
    loading,
    error,
    searchTerm,
    isSearching,
    searchError,
    serverPagination,
    cardData,
    openMenuId,
    setOpenMenuId,
    handleSearch,
    clearSearch,
    handleServerPageChange,
    handleServerPerPageChange,
    handleApprove,
    handleReject,
    handleDetail,
    handleDelete
}) => {
    // Define table columns
    const columns = useMemo(() => [
        {
            name: 'NO',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '70px',
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'AKSI',
            width: '90px',
            cell: row => {
                const isPending = (row.status || '').toLowerCase().includes('menunggu');
                return (
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onApprove={isPending ? handleApprove : null}
                        onReject={isPending ? handleReject : null}
                        onDetail={handleDetail}
                        onDelete={handleDelete}
                        isActive={openMenuId === (row.pid || row.pubid)}
                        isPending={isPending}
                    />
                );
            },
        },
        {
            name: 'JENIS BIAYA',
            selector: row => row.jenis_biaya,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="font-medium text-gray-800">{row.jenis_biaya || '-'}</span>
                </div>
            )
        },
        {
            name: 'NOMOR PENGAJUAN',
            selector: row => row.nomor_pengajuan,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="text-center font-semibold text-blue-600 px-2 py-2">
                    {row.nomor_pengajuan || '-'}
                </div>
            )
        },
        {
            name: 'NOMINAL',
            selector: row => row.nominal,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="text-center font-semibold text-green-600 px-2 py-2">
                    {row.nominal ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(row.nominal) : '-'}
                </div>
            )
        },
        {
            name: 'TGL PENGAJUAN',
            selector: row => row.tgl_pengajuan,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="text-center font-medium text-gray-800 px-2 py-2">
                    {row.tgl_pengajuan ? new Date(row.tgl_pengajuan).toLocaleDateString('id-ID') : '-'}
                </div>
            )
        },
        {
            name: 'KEPERLUAN',
            selector: row => row.keperluan,
            sortable: true,
            minWidth: '250px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="text-gray-700">{row.keperluan || '-'}</span>
                </div>
            )
        },
        {
            name: 'NAMA PENGAJU',
            selector: row => row.nama_pengaju,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="font-medium text-gray-800">{row.nama_pengaju || '-'}</span>
                </div>
            )
        },
        {
            name: 'METODE BAYAR',
            selector: row => row.metode_bayar,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="text-gray-700">{row.metode_bayar || '-'}</span>
                </div>
            )
        },
        {
            name: 'PERSETUJUAN HO',
            selector: row => row.persetujuan_ho,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="text-gray-700">{row.persetujuan_ho || '-'}</span>
                </div>
            )
        },
        {
            name: 'CATATAN',
            selector: row => row.catatan,
            sortable: true,
            minWidth: '200px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="text-gray-600 text-sm">{row.catatan || '-'}</span>
                </div>
            )
        },
        {
            name: 'STATUS',
            selector: row => row.status,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => {
                const statusLower = (row.status || '').toLowerCase();
                let badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                
                if (statusLower.includes('disetujui')) {
                    badgeClass = 'bg-green-100 text-green-800 border-green-200';
                } else if (statusLower.includes('ditolak')) {
                    badgeClass = 'bg-red-100 text-red-800 border-red-200';
                }
                
                return (
                    <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                            {row.status || 'Menunggu Persetujuan'}
                        </span>
                    </div>
                );
            }
        },
        {
            name: 'NAMA PERSETUJUAN',
            selector: row => row.nama_persetujuan,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="font-medium text-gray-800">{row.nama_persetujuan || '-'}</span>
                </div>
            )
        },
        {
            name: 'CATATAN PERSETUJUAN',
            selector: row => row.catatan_persetujuan,
            sortable: true,
            minWidth: '200px',
            wrap: true,
            cell: row => (
                <div className="text-center px-2 py-2">
                    <span className="text-gray-600 text-sm">{row.catatan_persetujuan || '-'}</span>
                </div>
            )
        },
    ], [openMenuId, serverPagination, handleApprove, handleReject, handleDetail, handleDelete, setOpenMenuId]);

    // Format currency helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <>
            {/* Statistics Cards */}
            {cardData && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {/* Pending Card */}
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-4 rounded-xl shadow-lg">
                        <h4 className="text-sm font-medium opacity-90">Menunggu Persetujuan</h4>
                        <p className="text-2xl font-bold mt-1">{cardData.pending?.count || 0}</p>
                        <p className="text-xs mt-1 opacity-75">{formatCurrency(cardData.pending?.nominal || 0)}</p>
                    </div>

                    {/* Today Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-4 rounded-xl shadow-lg">
                        <h4 className="text-sm font-medium opacity-90">Hari Ini</h4>
                        <p className="text-2xl font-bold mt-1">{cardData.today?.count || 0}</p>
                        <p className="text-xs mt-1 opacity-75">{formatCurrency(cardData.today?.nominal || 0)}</p>
                    </div>

                    {/* This Week Card */}
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg">
                        <h4 className="text-sm font-medium opacity-90">Minggu Ini</h4>
                        <p className="text-2xl font-bold mt-1">{cardData.thisWeek?.count || 0}</p>
                        <p className="text-xs mt-1 opacity-75">{formatCurrency(cardData.thisWeek?.nominal || 0)}</p>
                    </div>

                    {/* This Month Card */}
                    <div className="bg-gradient-to-br from-green-500 to-teal-500 text-white p-4 rounded-xl shadow-lg">
                        <h4 className="text-sm font-medium opacity-90">Bulan Ini</h4>
                        <p className="text-2xl font-bold mt-1">{cardData.thisMonth?.count || 0}</p>
                        <p className="text-xs mt-1 opacity-75">{formatCurrency(cardData.thisMonth?.nominal || 0)}</p>
                    </div>

                    {/* This Year Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                        <h4 className="text-sm font-medium opacity-90">Tahun Ini</h4>
                        <p className="text-2xl font-bold mt-1">{cardData.thisYear?.count || 0}</p>
                        <p className="text-xs mt-1 opacity-75">{formatCurrency(cardData.thisYear?.nominal || 0)}</p>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    {isSearching && (
                        <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {searchTerm && !isSearching && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder="Cari pengajuan biaya..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {searchError && (
                    <p className="text-red-500 text-sm mt-2">{searchError}</p>
                )}
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Data Pengeluaran Pengajuan Biaya</h3>
                </div>
                
                <div className="w-full overflow-x-auto" style={{maxHeight: '60vh'}}>
                    <DataTable
                        columns={columns}
                        data={data}
                        pagination={false}
                        customStyles={enhancedTableStyles}
                        progressPending={loading}
                        progressComponent={
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        }
                        noDataComponent={
                            <div className="text-center py-12">
                                {error ? (
                                    <div className="text-red-600">
                                        <p className="text-lg font-semibold">Error</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                ) : searchTerm ? (
                                    <div className="text-gray-500">
                                        <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                        <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                        <button
                                            onClick={clearSearch}
                                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Tidak ada data pengeluaran</p>
                                )}
                            </div>
                        }
                        highlightOnHover
                        pointerOnHover
                    />
                </div>
                
                {/* Pagination */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                        Menampilkan {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1} - {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.total)} dari {serverPagination.total}
                    </span>
                    <div className="flex gap-2">
                        <select
                            value={serverPagination.perPage}
                            onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <button
                            onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                            disabled={serverPagination.currentPage === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">{serverPagination.currentPage} / {serverPagination.totalPages}</span>
                        <button
                            onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                            disabled={serverPagination.currentPage === serverPagination.totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PengeluaranTable;