import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import KeuanganActionMenu from './KeuanganActionMenu';
import { formatCurrency, formatDate } from './ModernKeuanganTable';

const StatusBadge = ({ status }) => {
    const statusLower = (status || '').toLowerCase();
    let cls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (statusLower.includes('disetujui') && !statusLower.includes('sebagian')) {
        cls = 'bg-green-100 text-green-800 border-green-200';
    } else if (statusLower.includes('sebagian')) {
        cls = 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (statusLower.includes('ditolak')) {
        cls = 'bg-red-100 text-red-800 border-red-200';
    }
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
            {status || 'Pending'}
        </span>
    );
};

/**
 * Modern minimal datatable for Pengajuan tab.
 * Consolidates: No + Aksi, Nomor + Tanggal, Nominal + Metode, Divisi + Jenis Biaya, Pengaju + Persetujuan, Status.
 */
const ModernPengajuanTable = ({
    data,
    loading,
    error,
    pagination,
    onPageChange,
    onPerPageChange,
    openMenuId,
    setOpenMenuId,
    onProses,
    onDownload
}) => {
    const totalPages = Math.ceil(pagination.totalItems / pagination.perPage) || 1;
    const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems);

    const getActions = (row) => {
        const actions = [];
        if (onProses) {
            actions.push({ key: 'proses', label: 'Proses', onClick: onProses });
        }
        if (onDownload) {
            actions.push({ key: 'download', label: 'Unduh Berkas', onClick: onDownload });
        }
        return actions;
    };

    const columns = [
        { key: 'no', name: 'No', width: '50px', align: 'center' },
        { key: 'pengajuan', name: 'Pengajuan', width: '200px' },
        { key: 'nominal', name: 'Nominal & Metode', width: '180px' },
        { key: 'keperluan', name: 'Keperluan & Biaya', width: '220px' },
        { key: 'pengaju', name: 'Pengaju & Persetujuan', width: '200px' },
        { key: 'status', name: 'Status', width: '120px', align: 'center' },
        { key: 'aksi', name: 'Aksi', width: '70px', align: 'center' },
    ];

    const renderCell = (row, colKey, index) => {
        const rowNumber = (pagination.currentPage - 1) * pagination.perPage + index + 1;

        switch (colKey) {
            case 'no':
                return <div className="font-medium text-gray-500 text-xs">{rowNumber}</div>;

            case 'pengajuan':
                return (
                    <div className="space-y-0.5">
                        <div className="font-semibold text-blue-600 text-sm">
                            {row.nomor_pengajuan || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatDate(row.tgl_pengajuan)}
                        </div>
                    </div>
                );

            case 'nominal':
                return (
                    <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(row.nominal)}
                        </div>
                        <div className="text-xs text-gray-500">
                            {row.metode_bayar || '-'}
                        </div>
                    </div>
                );

            case 'keperluan':
                return (
                    <div className="space-y-0.5">
                        <div className="text-sm text-gray-700 truncate max-w-[200px]">
                            {row.keperluan || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {row.divisi || '-'}{row.jenis_biaya ? ` • ${row.jenis_biaya}` : ''}
                        </div>
                    </div>
                );

            case 'pengaju':
                return (
                    <div className="space-y-0.5">
                        <div className="text-sm text-gray-700">
                            {row.nama_pengaju || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                            HO: {row.persetujuan_ho || '-'}
                        </div>
                    </div>
                );

            case 'status':
                return <StatusBadge status={row.status} />;

            case 'aksi':
                return (
                    <KeuanganActionMenu
                        row={row}
                        rowId={row.id || row.pid}
                        actions={getActions(row)}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                    />
                );

            default:
                return row[colKey] || '-';
        }
    };

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
                                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Tidak ada data pengajuan</p>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => {
                                    const rowId = row.id || row.pid || `row-${index}`;
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
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Tidak ada data pengajuan</p>
                    </div>
                ) : (
                    data.map((row, index) => {
                        const rowId = row.id || row.pid || `row-${index}`;
                        return (
                            <div key={rowId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-blue-600 text-sm truncate">
                                            {row.nomor_pengajuan || '-'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {formatDate(row.tgl_pengajuan)} • {row.metode_bayar || '-'}
                                        </div>
                                    </div>
                                    {renderCell(row, 'aksi', index)}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-gray-400">Nominal</div>
                                        <div className="font-semibold text-gray-900">{formatCurrency(row.nominal)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Divisi</div>
                                        <div className="font-medium text-gray-700">{row.divisi || '-'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-gray-400">Keperluan</div>
                                        <div className="font-medium text-gray-700 truncate">{row.keperluan || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Pengaju</div>
                                        <div className="font-medium text-gray-700">{row.nama_pengaju || '-'}</div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between mt-1">
                                        <StatusBadge status={row.status} />
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

export default ModernPengajuanTable;
