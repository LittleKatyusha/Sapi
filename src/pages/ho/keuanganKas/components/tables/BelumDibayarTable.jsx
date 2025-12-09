import React, { useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, X, Loader2, Wallet } from 'lucide-react';
import ActionButtonBelumDibayar from '../ActionButtonBelumDibayar';

const BelumDibayarTable = ({
    data,
    loading = false,
    error = null,
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
    handleBayar
}) => {
    // Custom table styles for BelumDibayarTable
    const belumDibayarTableStyles = {
        table: {
            style: {
                backgroundColor: '#fff',
                borderRadius: '0px',
                width: '100%',
                minWidth: '1400px',
                tableLayout: 'auto',
                borderCollapse: 'separate',
                borderSpacing: 0,
            }
        },
        tableWrapper: {
            style: {
                overflowX: 'auto',
                overflowY: 'visible',
                width: '100%',
                border: 'none',
                borderRadius: '0',
            }
        },
        headRow: {
            style: {
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                minHeight: '52px',
            }
        },
        headCells: {
            style: {
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                padding: '12px 16px',
                textAlign: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #e5e7eb',
                '&:last-child': {
                    borderRight: 'none',
                },
            }
        },
        rows: {
            style: {
                minHeight: '48px',
                borderBottom: '1px solid #f3f4f6',
                '&:hover': {
                    backgroundColor: '#f9fafb',
                },
            }
        },
        cells: {
            style: {
                padding: '12px 16px',
                fontSize: '13px',
                color: '#374151',
                textAlign: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #f3f4f6',
                '&:last-child': {
                    borderRight: 'none',
                },
            }
        }
    };

    const columns = useMemo(() => [
        {
            name: 'NO URUT',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '100px',
            center: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'PILIH',
            width: '90px',
            center: true,
            cell: row => (
                <ActionButtonBelumDibayar
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onBayar={handleBayar}
                />
            ),
        },
        {
            name: 'NOMOR FAKTUR/NOTA',
            selector: row => row.nota,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-semibold text-blue-600">
                    {row.nota || row.nota_sistem || '-'}
                </div>
            )
        },
        {
            name: 'JENIS PEMBELIAN',
            selector: row => row.purchase_type_name,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.purchase_type_name || '-'}
                </div>
            )
        },
        {
            name: 'NILAI (Rp.)',
            selector: row => row.total_tagihan,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-semibold text-green-600">
                    {row.total_tagihan ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(row.total_tagihan) : '-'}
                </div>
            )
        },
        {
            name: 'TANGGAL MASUK',
            selector: row => row.tgl_masuk,
            sortable: true,
            width: '180px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.tgl_masuk || '-'}
                </div>
            )
        },
        {
            name: 'TANGGAL JATUH TEMPO',
            selector: row => row.due_date,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="font-medium text-orange-600">
                    {row.due_date || '-'}
                </div>
            )
        },
        {
            name: 'STATUS',
            selector: row => row.payment_status_text,
            sortable: true,
            width: '150px',
            center: true,
            cell: row => (
                <div className="flex justify-center">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-200">
                        {row.payment_status_text || 'Belum Dibayar'}
                    </span>
                </div>
            )
        },
    ], [openMenuId, serverPagination, handleBayar, setOpenMenuId]);

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
                        placeholder="Cari nomor faktur/nota..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Data Belum Dibayar</h3>
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
                            customStyles={belumDibayarTableStyles}
                            progressPending={loading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500 text-sm">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {error ? (
                                        <>
                                            <div className="mb-4">
                                                <Wallet size={64} className="text-red-300 mx-auto" />
                                            </div>
                                            <p className="text-red-500 text-lg font-semibold mb-2">Gagal memuat data</p>
                                            <p className="text-gray-500 text-sm">{error}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <Wallet size={64} className="text-gray-300 mx-auto" />
                                            </div>
                                            <p className="text-gray-500 text-lg">Tidak ada data belum dibayar</p>
                                        </>
                                    )}
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

export default BelumDibayarTable;