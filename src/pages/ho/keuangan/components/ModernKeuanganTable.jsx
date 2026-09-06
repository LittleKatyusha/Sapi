import React from 'react';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import KeuanganActionMenu from './KeuanganActionMenu';

const formatCurrency = (value) => {
    if (!value || value === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Backend returns d-m-Y (e.g. "02-09-2026" = 2 Sept 2026).
    // JS new Date() parses as MM-DD-YYYY (US) → swaps day/month.
    // Parse d-m-Y manually to avoid ambiguity.
    if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [dd, mm, yyyy] = dateString.split('-');
        const d = new Date(`${yyyy}-${mm}-${dd}`);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    // Fallback for ISO or other formats
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const StatusBadge = ({ status, text }) => {
    const statusLower = (text || '').toLowerCase();
    let cls = 'bg-gray-100 text-gray-700 border-gray-200';
    if (statusLower.includes('lunas') && !statusLower.includes('belum')) {
        cls = 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('belum bayar') || statusLower.includes('belum dibayar')) {
        cls = 'bg-red-100 text-red-800 border-red-200';
    } else if (statusLower.includes('belum lunas')) {
        cls = 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {text || 'Unknown'}
        </span>
    );
};

/**
 * Modern minimal datatable for Keuangan.
 * Menggabungkan kolom: Nota (sistem+manual), Tanggal (masuk+jatuh tempo),
 * Nilai (tagihan+terbayar+sisa), Aksi (portal dropdown).
 */
const ModernKeuanganTable = ({
    data,
    loading,
    error,
    pagination,
    onPageChange,
    onPerPageChange,
    openMenuId,
    setOpenMenuId,
    onBayar,
    onDownload,
    onDetail
}) => {
    const totalPages = Math.ceil(pagination.totalItems / pagination.perPage) || 1;
    const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems);

    const getActions = (row) => {
        const actions = [];
        const status = row.payment_status;
        if (onDetail) {
            actions.push({ key: 'detail', label: 'Detail', onClick: onDetail });
        }
        // Belum Bayar (2) atau Belum Lunas (0) → bisa bayar
        if (status === 2 || status === 0) {
            if (onBayar) {
                actions.push({ key: 'bayar', label: 'Bayar', onClick: onBayar });
            }
        }
        // Semua status → bisa download bukti (tagihan/pembayaran)
        if (onDownload) {
            actions.push({ key: 'download', label: row.payment_status === 1 ? 'Download Bukti' : 'Cetak Bukti', onClick: onDownload });
        }
        return actions;
    };

    const renderCell = (row, colKey, index) => {
        const rowNumber = (pagination.currentPage - 1) * pagination.perPage + index + 1;

        switch (colKey) {
            case 'no':
                return <div className="font-medium text-gray-500 text-xs">{rowNumber}</div>;

            case 'nota':
                return (
                    <div className="space-y-0.5">
                        <div className="font-semibold text-blue-600 text-sm">
                            {row.nota || row.nota_sistem || '-'}
                        </div>
                        {row.nota_sistem && row.nota && row.nota !== row.nota_sistem && (
                            <div className="text-xs text-gray-400">{row.nota_sistem}</div>
                        )}
                    </div>
                );

            case 'jenis':
                return (
                    <div className="text-sm text-gray-700">
                        {row.purchase_type_name || '-'}
                    </div>
                );

            case 'tanggal':
                return (
                    <div className="space-y-0.5">
                        <div className="text-xs text-gray-500">
                            <span className="text-gray-400">Masuk:</span> {formatDate(row.tgl_masuk)}
                        </div>
                        <div className="text-xs">
                            <span className="text-gray-400">Jatuh tempo:</span>{' '}
                            <span className={row.due_date ? 'font-medium text-orange-600' : 'text-gray-400'}>
                                {formatDate(row.due_date)}
                            </span>
                        </div>
                    </div>
                );

            case 'nilai':
                return (
                    <div className="space-y-0.5 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(row.total_tagihan)}
                        </div>
                        {(row.payment_status === 0 || row.payment_status === 1) && (
                            <div className="text-xs">
                                <span className="text-gray-400">Terbayar:</span>{' '}
                                <span className="text-blue-600 font-medium">{formatCurrency(row.total_terbayar)}</span>
                            </div>
                        )}
                        {row.payment_status === 0 && (
                            <div className="text-xs">
                                <span className="text-gray-400">Sisa:</span>{' '}
                                <span className="text-red-600 font-semibold">
                                    {formatCurrency((row.total_tagihan || 0) - (row.total_terbayar || 0))}
                                </span>
                            </div>
                        )}
                    </div>
                );

            case 'pembayaran':
                if (row.payment_status === 1) {
                    return (
                        <div className="space-y-0.5">
                            <div className="text-xs">
                                <span className="text-gray-400">Tipe:</span>{' '}
                                <span className="font-medium text-gray-700">{row.payment_type_name || '-'}</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-gray-400">Lunas:</span>{' '}
                                <span className="font-medium text-green-600">{formatDate(row.settlement_date)}</span>
                            </div>
                        </div>
                    );
                }
                if (row.payment_status === 0) {
                    return (
                        <div className="space-y-0.5">
                            <div className="text-xs">
                                <span className="text-gray-400">Tipe:</span>{' '}
                                <span className="font-medium text-gray-700">{row.payment_type_name || '-'}</span>
                            </div>
                            <div className="text-xs">
                                <span className="text-gray-400">Bayar:</span>{' '}
                                <span className="font-medium text-gray-700">{formatDate(row.settlement_date)}</span>
                            </div>
                        </div>
                    );
                }
                return <div className="text-xs text-gray-400">-</div>;

            case 'status':
                return <StatusBadge status={row.payment_status} text={row.payment_status_text} />;

            case 'aksi':
                return (
                    <KeuanganActionMenu
                        row={row}
                        rowId={row.id_pembayaran || row.id}
                        actions={getActions(row)}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                    />
                );

            default:
                return row[colKey] || '-';
        }
    };

    // Column definitions - unified table showing all statuses
    const getColumns = () => {
        const cols = [
            { key: 'no', name: 'No', width: '50px', align: 'center' },
            { key: 'nota', name: 'Nota / Faktur', width: '180px' },
            { key: 'jenis', name: 'Jenis', width: '130px' },
            { key: 'tanggal', name: 'Tanggal', width: '170px' },
            { key: 'nilai', name: 'Nilai & Pembayaran', width: '180px', align: 'right' },
            { key: 'pembayaran', name: 'Info Pembayaran', width: '160px' },
            { key: 'status', name: 'Status', width: '120px', align: 'center' },
            { key: 'aksi', name: 'Aksi', width: '70px', align: 'center' },
        ];

        return cols;
    };

    const columns = getColumns();

    return (
        <div className="space-y-3">
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
                                        <p className="text-gray-500 text-sm">Tidak ada data</p>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => {
                                    const rowId = row.id_pembayaran || row.id || `row-${index}`;
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
                        <p className="text-gray-500 text-sm">Tidak ada data</p>
                    </div>
                ) : (
                    data.map((row, index) => {
                        const rowId = row.id_pembayaran || row.id || `row-${index}`;
                        return (
                            <div key={rowId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-blue-600 text-sm truncate">
                                            {row.nota || row.nota_sistem || '-'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {row.purchase_type_name || '-'}
                                        </div>
                                    </div>
                                    {renderCell(row, 'aksi', index)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-400">Jatuh Tempo</div>
                                        <div className="font-medium text-orange-600">{formatDate(row.due_date)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Nilai</div>
                                        <div className="font-semibold text-gray-900">{formatCurrency(row.total_tagihan)}</div>
                                    </div>
                                    {(row.payment_status === 0 || row.payment_status === 1) && (
                                        <div>
                                            <div className="text-gray-400">Terbayar</div>
                                            <div className="font-medium text-blue-600">{formatCurrency(row.total_terbayar)}</div>
                                        </div>
                                    )}
                                    {row.payment_status === 0 && (
                                        <div>
                                            <div className="text-gray-400">Sisa</div>
                                            <div className="font-semibold text-red-600">
                                                {formatCurrency((row.total_tagihan || 0) - (row.total_terbayar || 0))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="col-span-2 flex items-center justify-between mt-1">
                                        <StatusBadge status={row.payment_status} text={row.payment_status_text} />
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
                    Menampilkan <span className="font-semibold">{startItem}</span> - <span className="font-semibold">{endItem}</span> dari <span className="font-semibold">{pagination.totalItems}</span> data
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

export default ModernKeuanganTable;
export { formatCurrency, formatDate };
