import React, { useState, useRef } from 'react';
import { Search, X, Loader2, ArrowUpDown, Info, User, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import ActionButton from './ActionButton';
import CustomPagination from '../../penjualan/penjualanSapi/components/CustomPagination';

const TableHeader = ({ children, field, sortField, sortDirection, onSort, className = '' }) => {
    const isSorted = sortField === field;
    return (
        <th
            className={`px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap ${className}`}
            onClick={() => field && onSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                {field && (
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${isSorted ? 'text-green-600' : 'text-gray-400'}`} />
                )}
            </div>
        </th>
    );
};

const PaymentBadge = ({ type }) => {
    const labels = { 1: 'Tunai', 2: 'Tempo', 3: 'Transfer' };
    const colors = {
        1: 'bg-green-50 text-green-700 border-green-200',
        2: 'bg-amber-50 text-amber-700 border-amber-200',
        3: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    const label = labels[type] || type || '-';
    const color = colors[type] || 'bg-gray-50 text-gray-600 border-gray-200';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
            <CreditCard className="w-3 h-3 mr-1" />
            {label}
        </span>
    );
};

const TableSkeleton = ({ colSpan }) => (
    <tbody className="divide-y divide-gray-100">
        {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
                <td className="px-3 py-2.5"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
            </tr>
        ))}
    </tbody>
);

const SummaryFooter = ({ summary, colSpan }) => {
    if (!summary) return null;
    return (
        <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
                <td colSpan={colSpan} className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-semibold text-gray-700">Total keseluruhan:</span>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                            <TrendingUp className="w-3 h-3" /> {summary.total_jumlah || 0} unit
                        </span>
                        <span className="inline-flex items-center gap-1 text-gray-600">
                            <Info className="w-3 h-3" /> Harga beli: {formatCurrency(summary.total_harga_beli)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                            Harga jual: {formatCurrency(summary.total_harga)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-green-700">
                            Selisih: {formatCurrency(summary.total_selisih)}
                        </span>
                    </div>
                </td>
            </tr>
        </tfoot>
    );
};

const PenjualanCompactTable = ({
    data = [],
    loading = false,
    error = null,
    searchTerm = '',
    isSearching = false,
    searchError = null,
    serverPagination = {},
    handleSearch,
    clearSearch,
    handleServerPageChange,
    handleServerPerPageChange,
    activeTab,
    summary,
    onDownload,
    onEdit,
    onCancel
}) => {
    const searchInputRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [sortField, setSortField] = useState('tgl_penjualan');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        if (handleSearch) handleSearch(value);
    };

    const handleClearSearch = () => {
        if (clearSearch) clearSearch();
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    const displayedData = data;
    const colSpan = 11;

    const activeTabLabel = activeTab === 'bahan-baku' ? 'Bahan Baku Pangan' : 'OVK';

    return (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Cari nota, produk, pelanggan, supir..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500">
                    {isSearching ? (
                        <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" /> Mencari...
                        </span>
                    ) : (
                        <span>Total {serverPagination.totalRows || 0} data</span>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <caption className="px-4 py-2 text-xs text-left text-gray-600 bg-gray-50 border-b border-gray-100">
                        <span className="font-semibold">Daftar Penjualan {activeTabLabel}</span>
                        {' — '}
                        Menampilkan {serverPagination.totalRows || 0} transaksi
                        {summary && summary.total_harga > 0 && (
                            <span> dengan total harga jual {formatCurrency(summary.total_harga)}</span>
                        )}
                    </caption>
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <TableHeader className="w-10">No</TableHeader>
                            <TableHeader className="w-12">Aksi</TableHeader>
                            <TableHeader field="tgl_penjualan" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Tanggal</TableHeader>
                            <TableHeader field="nomor_faktur" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>No Faktur</TableHeader>
                            <TableHeader field="nama_pembeli" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                                <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> Pelanggan</span>
                            </TableHeader>
                            <TableHeader field="nama_produk" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Produk</TableHeader>
                            <TableHeader field="total_jumlah" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Jumlah</TableHeader>
                            <TableHeader>Keuangan</TableHeader>
                            <TableHeader>Pembayaran</TableHeader>
                            <TableHeader>Keterangan</TableHeader>
                            <TableHeader>Pengiriman</TableHeader>
                        </tr>
                    </thead>
                    {loading ? (
                        <TableSkeleton colSpan={colSpan} />
                    ) : (
                        <tbody className="divide-y divide-gray-100">
                            {displayedData.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-3 py-12 text-center">
                                        {error ? (
                                            <div className="text-red-600 text-sm">{error}</div>
                                        ) : searchError ? (
                                            <div className="text-red-600 text-sm">{searchError}</div>
                                        ) : searchTerm ? (
                                            <div className="text-gray-500 text-sm">
                                                Tidak ada hasil untuk "{searchTerm}"
                                                <button onClick={handleClearSearch} className="ml-2 text-green-600 hover:underline">Clear</button>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm">Tidak ada data penjualan</div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                displayedData.map((row, index) => {
                                    const rowNumber = ((serverPagination.currentPage || 1) - 1) * (serverPagination.perPage || 10) + index + 1;
                                    const selisih = row.total_selisih_harga ?? 0;
                                    return (
                                        <tr
                                            key={row.id || row.pid || row.pubid || index}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 text-gray-500 text-xs text-center">{rowNumber}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-end">
                                                    <ActionButton
                                                        row={row}
                                                        openMenuId={openMenuId}
                                                        setOpenMenuId={setOpenMenuId}
                                                        onDownload={onDownload}
                                                        onEdit={onEdit}
                                                        onCancel={onCancel}
                                                        isActive={openMenuId === (row.id || row.pid)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(row.tgl_penjualan)}</td>
                                            <td className="px-3 py-2.5 font-semibold text-gray-900">{row.nomor_faktur || '-'}</td>
                                            <td className="px-3 py-2.5 text-gray-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {row.nama_pembeli || '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-700">{row.nama_produk || '-'}</td>
                                            <td className="px-3 py-2.5 text-gray-700 text-center">{row.total_jumlah || 0}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Beli:</span>
                                                        <span className="text-gray-600 whitespace-nowrap">{formatCurrency(row.total_harga_beli)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Jual:</span>
                                                        <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(row.harga_total)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Selisih:</span>
                                                        <span className={`font-medium whitespace-nowrap ${selisih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                            {formatCurrency(selisih)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <PaymentBadge type={row.tipe_pembayaran} />
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-700 max-w-xs truncate" title={row.keterangan}>{row.keterangan || '-'}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Supir:</span>
                                                        <span className="text-gray-700">{row.nama_supir || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Penerima:</span>
                                                        <span className="text-gray-700">{row.nama_penerima || '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-gray-500">Plat:</span>
                                                        <span className="text-gray-700 font-mono">{row.plat_nomor || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    )}
                    {!loading && displayedData.length > 0 && (
                        <SummaryFooter summary={summary} colSpan={colSpan} />
                    )}
                </table>
            </div>

            <CustomPagination
                currentPage={serverPagination.currentPage || 1}
                totalPages={serverPagination.totalPages || 0}
                totalItems={serverPagination.totalRows || 0}
                itemsPerPage={serverPagination.perPage || 10}
                onPageChange={handleServerPageChange}
                onItemsPerPageChange={handleServerPerPageChange}
                itemsPerPageOptions={[10, 25, 50, 100]}
                loading={loading}
            />
        </div>
    );
};

export default PenjualanCompactTable;
