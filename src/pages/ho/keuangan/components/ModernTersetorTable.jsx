import React from 'react';
import { ChevronLeft, ChevronRight, Wallet, PlusCircle, Printer, Loader2 } from 'lucide-react';
import KeuanganActionMenu from './KeuanganActionMenu';
import { formatCurrency } from './ModernKeuanganTable';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Handle d-m-Y format (e.g. "02-09-2026" = 2 Sept 2026) — JS parses as MM-DD by default
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [dd, mm, yyyy] = dateString.split('-');
        const d = new Date(`${yyyy}-${mm}-${dd}`);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Modern minimal datatable for Tersetor (Kas ke Bank) tab.
 * Consolidates: No, Tanggal + Bank, Penyetor + Jumlah, Bukti Setor, Aksi.
 */
const ModernTersetorTable = ({
    data,
    loading,
    error,
    pagination,
    onPageChange,
    onPerPageChange,
    onAdd,
    onDownloadReport,
    isDownloading = false,
    dateFilter,
    openMenuId,
    setOpenMenuId
}) => {
    const totalPages = Math.ceil((pagination.totalRecords || pagination.totalItems || 0) / pagination.perPage) || 1;
    const totalItems = pagination.totalRecords || pagination.totalItems || 0;
    const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.perPage, totalItems);

    const getActions = () => {
        const actions = [];
        if (onDownloadReport) {
            actions.push({ key: 'cetak', label: 'Cetak Bukti', onClick: onDownloadReport });
        }
        return actions;
    };

    const columns = [
        { key: 'no', name: 'No', width: '50px', align: 'center' },
        { key: 'setor', name: 'Tanggal & Bank', width: '220px' },
        { key: 'penyetor', name: 'Penyetor & Jumlah', width: '220px' },
        { key: 'bukti', name: 'Bukti Setor', width: '120px', align: 'center' },
        { key: 'aksi', name: 'Aksi', width: '70px', align: 'center' },
    ];

    const renderCell = (row, colKey, index) => {
        const rowNumber = (pagination.currentPage - 1) * pagination.perPage + index + 1;

        switch (colKey) {
            case 'no':
                return <div className="font-medium text-gray-500 text-xs">{rowNumber}</div>;

            case 'setor':
                return (
                    <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-800">
                            {formatDate(row.deposit_date)}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                            {row.nama_bank || '-'}
                        </div>
                    </div>
                );

            case 'penyetor':
                return (
                    <div className="space-y-0.5">
                        <div className="text-sm text-gray-700">
                            {row.depositor_name || '-'}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(row.amount)}
                        </div>
                    </div>
                );

            case 'bukti':
                return (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                        row.proof_status === 1
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                        {row.proof_status === 1 ? 'Ada' : 'Tidak Ada'}
                    </span>
                );

            case 'aksi':
                return (
                    <KeuanganActionMenu
                        row={row}
                        rowId={row.id || row.pubid}
                        actions={getActions(row)}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                    />
                );

            default:
                return row[colKey] || '-';
        }
    };

    const hasDateFilter = dateFilter && (dateFilter.startDate || dateFilter.endDate);

    return (
        <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                    {hasDateFilter
                        ? `Periode: ${dateFilter.startDate || '...'} s/d ${dateFilter.endDate || '...'}`
                        : 'Semua periode'}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDownloadReport}
                        disabled={isDownloading || !hasDateFilter}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDownloading || !hasDateFilter
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                        title={!hasDateFilter ? 'Pilih periode tanggal di filter terlebih dahulu' : 'Cetak laporan'}
                    >
                        {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Printer className="w-4 h-4" />
                        )}
                        Cetak
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Tambah Setoran
                    </button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-3 py-2.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                                            col.align === 'center' ? 'text-center' :
                                            col.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                        style={{ width: col.width, minWidth: col.width }}
                                    >
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-3 py-12 text-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-500 text-xs mt-2">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-3 py-12 text-center">
                                        <div className="text-red-600">
                                            <p className="text-sm font-semibold mb-1">Gagal memuat data</p>
                                            <p className="text-xs text-gray-500">{error}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-3 py-12 text-center">
                                        <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Tidak ada data setoran</p>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => {
                                    const rowId = row.id || row.pubid || `row-${index}`;
                                    return (
                                        <tr key={rowId} className="hover:bg-gray-50/50 transition-colors">
                                            {columns.map((col) => (
                                                <td
                                                    key={`${rowId}-${col.key}`}
                                                    className={`px-3 py-2.5 text-sm text-gray-700 ${
                                                        col.align === 'center' ? 'text-center' :
                                                        col.align === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                                    style={{ width: col.width, minWidth: col.width }}
                                                >
                                                    {renderCell(row, col.key, index)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 text-xs mt-2">Memuat data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-red-600">
                        <p className="text-sm font-semibold mb-1">Gagal memuat data</p>
                        <p className="text-xs text-gray-500">{error}</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Tidak ada data setoran</p>
                    </div>
                ) : (
                    data.map((row, index) => {
                        const rowId = row.id || row.pubid || `row-${index}`;
                        return (
                            <div key={rowId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 text-sm">
                                            {formatDate(row.deposit_date)}
                                        </div>
                                        <div className="text-xs text-blue-600 font-medium mt-0.5">
                                            {row.nama_bank || '-'}
                                        </div>
                                    </div>
                                    {renderCell(row, 'aksi', index)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-400">Penyetor</div>
                                        <div className="font-medium text-gray-700">{row.depositor_name || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Jumlah</div>
                                        <div className="font-semibold text-green-600">{formatCurrency(row.amount)}</div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between mt-1">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            row.proof_status === 1
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            Bukti: {row.proof_status === 1 ? 'Ada' : 'Tidak Ada'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-600">
                    Menampilkan <span className="font-semibold">{startItem}</span> - <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{totalItems}</span> data
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={pagination.perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        {[10, 25, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-600 px-1">
                        <span className="font-semibold">{pagination.currentPage}</span> / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModernTersetorTable;
