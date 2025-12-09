import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, X, Loader2 } from 'lucide-react';
import ActionButton from '../ActionButton';
import { enhancedTableStyles } from '../../constants/tableStyles';

const PengajuanTable = ({
    data,
    loading,
    error,
    searchTerm,
    isSearching,
    searchError,
    serverPagination,
    openMenuId,
    setOpenMenuId,
    handleSearch,
    clearSearch,
    handleServerPageChange,
    handleServerPerPageChange,
    handleProses,
    handleDownload
}) => {
    const columns = useMemo(() => [
        {
            name: 'NO',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '70px',
            center: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'PILIH',
            width: '90px',
            center: true,
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onProses={handleProses}
                    onDownload={handleDownload}
                    isActive={openMenuId === row.id}
                />
            ),
        },
        {
            name: 'TANGGAL PENGAJUAN',
            selector: row => row.tgl_pengajuan,
            sortable: true,
            minWidth: '200px',
            width: '200px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="text-center font-medium text-gray-800 px-2 py-2">
                    {row.tgl_pengajuan ? new Date(row.tgl_pengajuan).toLocaleDateString('id-ID') : '-'}
                </div>
            )
        },
        {
            name: 'NOMOR PENGAJUAN',
            selector: row => row.nomor_pengajuan,
            sortable: true,
            width: '200px',
            wrap: true,
            center: true,
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
            width: '200px',
            wrap: true,
            center: true,
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
            name: 'METODE BAYAR',
            selector: row => row.metode_bayar,
            sortable: true,
            width: '150px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.metode_bayar || '-'}</div>
        },
        {
            name: 'JENIS BIAYA',
            selector: row => row.jenis_biaya,
            sortable: true,
            width: '180px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.jenis_biaya || '-'}</div>
        },
        {
            name: 'KEPERLUAN',
            selector: row => row.keperluan,
            sortable: true,
            minWidth: '250px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.keperluan || '-'}</div>
        },
        {
            name: 'NAMA PENGAJU',
            selector: row => row.nama_pengaju,
            sortable: true,
            width: '200px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.nama_pengaju || '-'}</div>
        },
        {
            name: 'PERSETUJUAN HO',
            selector: row => row.persetujuan_ho,
            sortable: true,
            width: '200px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.persetujuan_ho || '-'}</div>
        },
        {
            name: 'STATUS',
            selector: row => row.status,
            sortable: true,
            width: '200px',
            wrap: true,
            center: true,
            cell: row => {
                const statusLower = (row.status || '').toLowerCase();
                let badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                
                if (statusLower.includes('disetujui') && !statusLower.includes('sebagian')) {
                    badgeClass = 'bg-green-100 text-green-800 border-green-200';
                } else if (statusLower.includes('sebagian')) {
                    badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                } else if (statusLower.includes('ditolak')) {
                    badgeClass = 'bg-red-100 text-red-800 border-red-200';
                }
                
                return (
                    <div className="flex justify-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
                            {row.status || 'Pending'}
                        </span>
                    </div>
                );
            }
        },
        {
            name: 'CATATAN',
            selector: row => row.catatan,
            sortable: true,
            minWidth: '250px',
            wrap: true,
            center: true,
            cell: row => <div className="text-center px-2 py-2">{row.catatan || '-'}</div>
        },
    ], [openMenuId, serverPagination, handleProses, handleDownload, setOpenMenuId]);

    return (
        <>
            <div className="bg-white rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
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
                        placeholder="Cari data..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Data Pengajuan</h3>
                </div>

                {/* Scroll Indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                        </svg>
                        Scroll horizontal untuk melihat semua kolom
                        <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                        </svg>
                    </div>
                    <div className="text-xs text-gray-500">
                        {data.length} item{data.length !== 1 ? 's' : ''}
                    </div>
                </div>
                
                <div className="w-full overflow-x-auto max-w-full table-scroll-container" style={{maxHeight: '60vh'}}>
                    <div className="min-w-full">
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
                                    <p className="text-gray-500">Tidak ada data</p>
                                </div>
                            }
                            highlightOnHover
                            pointerOnHover
                        />
                    </div>
                </div>
                
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                        Menampilkan {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1} - {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)} dari {serverPagination.totalItems}
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

export default PengajuanTable;