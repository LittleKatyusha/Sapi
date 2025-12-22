import React, { useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { Search, Wallet, PlusCircle, X, Loader2, Calendar, Printer } from 'lucide-react';
import BankDepositService from '../../../../../services/bankDepositService';
import pengeluaranService from '../../../../../services/pengeluaranService';

const TersetorTable = ({
    data,
    loading,
    error,
    searchTerm,
    isSearching,
    searchError,
    serverPagination,
    dateFilter,
    handleSearch,
    clearSearch,
    handleServerPageChange,
    handleServerPerPageChange,
    handleDateFilterChange,
    handleAdd,
    setNotification
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
    const [startDate, setStartDate] = useState(dateFilter?.startDate || '');
    const [endDate, setEndDate] = useState(dateFilter?.endDate || '');
    const [isDownloading, setIsDownloading] = useState(false);

    // Custom table styles
    const tableStyles = {
        table: {
            style: {
                backgroundColor: '#fff',
                borderRadius: '0px',
                width: '100%',
                tableLayout: 'fixed',
            }
        },
        tableWrapper: {
            style: {
                overflowX: 'auto',
                overflowY: 'visible',
                width: '100%',
            }
        },
        headRow: {
            style: {
                position: 'sticky',
                top: 0,
                zIndex: 1200,
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
                '&:last-child': { borderRight: 'none' },
            }
        },
        rows: {
            style: {
                minHeight: '48px',
                borderBottom: '1px solid #f3f4f6',
                '&:hover': { backgroundColor: '#f9fafb' },
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
                '&:last-child': { borderRight: 'none' },
            }
        }
    };

    const columns = useMemo(() => [
        {
            name: 'NO',
            selector: (row, index) => {
                const startIndex = (serverPagination.currentPage - 1) * serverPagination.perPage;
                return startIndex + index + 1;
            },
            sortable: false,
            width: '70px',
            center: true,
            cell: (row, index) => {
                const startIndex = (serverPagination.currentPage - 1) * serverPagination.perPage;
                return (
                    <div className="font-semibold text-gray-600">
                        {startIndex + index + 1}
                    </div>
                );
            }
        },
        {
            name: 'TANGGAL SETOR',
            selector: row => row.deposit_date,
            sortable: true,
            width: '180px',
            center: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {BankDepositService.formatDate(row.deposit_date)}
                </div>
            )
        },
        {
            name: 'BANK',
            selector: row => row.nama_bank,
            sortable: true,
            grow: 1,
            center: true,
            cell: row => (
                <div className="font-medium text-blue-600">
                    {row.nama_bank || '-'}
                </div>
            )
        },
        {
            name: 'PENYETOR',
            selector: row => row.depositor_name,
            sortable: true,
            grow: 1,
            center: true,
            cell: row => (
                <div className="font-medium text-gray-800">
                    {row.depositor_name || '-'}
                </div>
            )
        },
        {
            name: 'JUMLAH',
            selector: row => row.amount,
            sortable: true,
            width: '180px',
            center: true,
            cell: row => (
                <div className="font-semibold text-green-600">
                    {BankDepositService.formatCurrency(row.amount)}
                </div>
            )
        },
        {
            name: 'BUKTI SETOR',
            selector: row => row.proof_status,
            sortable: false,
            width: '120px',
            center: true,
            cell: row => (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    row.proof_status === 1 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                    {row.proof_status === 1 ? 'Ada' : 'Tidak Ada'}
                </span>
            )
        },
    ], [serverPagination]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleSearch(localSearchTerm);
    };

    const handleClearSearch = () => {
        setLocalSearchTerm('');
        clearSearch();
    };

    const handleApplyDateFilter = () => {
        handleDateFilterChange(startDate, endDate);
    };

    const handleClearDateFilter = () => {
        setStartDate('');
        setEndDate('');
        handleDateFilterChange(null, null);
    };

    const handleDownloadReport = async () => {
        if (!startDate || !endDate) {
            if (setNotification) {
                setNotification({
                    type: 'error',
                    message: 'Silakan pilih periode tanggal terlebih dahulu'
                });
            } else {
                alert('Silakan pilih periode tanggal terlebih dahulu');
            }
            return;
        }

        try {
            setIsDownloading(true);
            if (setNotification) {
                setNotification({
                    type: 'info',
                    message: 'Sedang mengunduh laporan...'
                });
            }

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin';

            const blob = await pengeluaranService.downloadReportBuktiSetor(startDate, endDate, petugas);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bukti_Setor_Kas_${startDate}_${endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            if (setNotification) {
                setNotification({
                    type: 'success',
                    message: 'Berhasil mengunduh laporan'
                });
            }
        } catch (error) {
            console.error('Error downloading report:', error);
            if (setNotification) {
                setNotification({
                    type: 'error',
                    message: error.message || 'Gagal mengunduh laporan'
                });
            } else {
                alert('Gagal mengunduh laporan');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            {/* Search and Filter Section */}
            <div className="bg-white rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama penyetor atau bank..."
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {localSearchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Dari"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Sampai"
                        />
                        <button
                            type="button"
                            onClick={handleApplyDateFilter}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Filter
                        </button>
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={handleClearDateFilter}
                                className="px-3 py-2 text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleDownloadReport}
                            disabled={isDownloading || !startDate || !endDate}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                isDownloading || !startDate || !endDate
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                            title={!startDate || !endDate ? "Pilih periode tanggal terlebih dahulu" : "Unduh Laporan"}
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Printer className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">Cetak</span>
                        </button>
                    </div>
                </div>

                {/* Search Status */}
                {isSearching && (
                    <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mencari...
                    </div>
                )}
                {searchError && (
                    <div className="mt-3 text-sm text-red-600">
                        {searchError}
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Data Kas Tersetor</h3>
                    <button
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Tambah Setoran
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Table */}
                <div className="w-full">
                    <DataTable
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        progressComponent={
                            <div className="py-12 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                <span className="text-gray-500">Memuat data...</span>
                            </div>
                        }
                        pagination={false}
                        customStyles={tableStyles}
                        fixedHeader
                        fixedHeaderScrollHeight="60vh"
                        noDataComponent={
                            <div className="text-center py-12">
                                <div className="mb-4">
                                    <Wallet size={64} className="text-gray-300 mx-auto" />
                                </div>
                                <p className="text-gray-500 text-lg">Tidak ada data setoran kas</p>
                            </div>
                        }
                        highlightOnHover
                        pointerOnHover
                    />
                </div>

                {/* Pagination Footer */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                        Menampilkan {serverPagination.from} - {serverPagination.to} dari {serverPagination.totalRecords}
                    </span>
                    <div className="flex gap-2 items-center">
                        <select
                            value={serverPagination.perPage}
                            onChange={(e) => handleServerPerPageChange(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <button
                            onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                            disabled={serverPagination.currentPage <= 1}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">
                            {serverPagination.currentPage} / {serverPagination.totalPages || 1}
                        </span>
                        <button
                            onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                            disabled={serverPagination.currentPage >= serverPagination.totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TersetorTable;
