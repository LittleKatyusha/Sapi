import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, X, Loader2, Package, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import useQurban from './hooks/useQurban';
import ActionButton from './components/ActionButton';
import QurbanCard from './components/QurbanCard';
import CustomPagination from './components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import UnduhBerkasModal from './modals/UnduhBerkasModal';

const NOTIFICATION_TIMEOUT = 5000;

const StatCard = React.memo(({ title, icon: Icon, accentColor, children }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
            {Icon && <div className={`p-1 rounded ${accentColor}`}><Icon className="h-3.5 w-3.5 text-white" /></div>}
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        </div>
        {children}
    </div>
));

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;
    const borderColor = notification.type === 'success' ? 'border-green-500' : notification.type === 'info' ? 'border-blue-500' : 'border-red-500';
    return (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50">
            <div className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${borderColor}`}>
                <div className="p-4 flex items-start">
                    <div className="flex-shrink-0">
                        {notification.type === 'success' ? (
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                        ) : notification.type === 'info' ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Memproses...' : 'Error!'}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 break-words">{notification.message}</p>
                    </div>
                    <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
});

const PembelianSapiQurbanPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isTableReady, setIsTableReady] = useState(false);
    const isFetchingRef = useRef(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUnduhBerkasModalOpen, setIsUnduhBerkasModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const {
        poList: filteredData, loading, searchTerm,
        isSearching, searchError, stats, serverPagination,
        fetchPoList, deletePo,
        handleSearch, clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
    } = useQurban();

    useEffect(() => {
        if (!location.state?.fromEdit) fetchPoList();
        const timer = setTimeout(() => setIsTableReady(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleVisibility = () => {
            if (!document.hidden && isTableReady && !isFetchingRef.current && Date.now() - lastRefreshTime > 30000) {
                isFetchingRef.current = true;
                setTimeout(async () => {
                    await fetchPoList();
                    setLastRefreshTime(Date.now());
                    isFetchingRef.current = false;
                }, 1000);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isTableReady, lastRefreshTime, fetchPoList]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleAdd = () => {
        navigate('/rph/pembelian-sapi-qurban/add');
    };

    const handleDownloadCSV = () => {
        if (!filteredData || filteredData.length === 0) {
            setNotification({ type: 'info', message: 'Tidak ada data untuk diunduh' });
            return;
        }
        const headers = ['No', 'Nota Sistem', 'Tanggal Pesanan', 'Jenis Pembelian', 'Jumlah Hewan', 'Total Harga', 'Pemasok', 'Penerima', 'Tempat Tiba', 'Pengirim', 'Plat Nomor'];
        const rows = filteredData.map((row, i) => [
            (serverPagination.currentPage - 1) * serverPagination.perPage + i + 1,
            row.nota_sistem || '',
            row.tanggal_pemesanan || '',
            row.jenis_pembelian || '',
            row.jumlah_hewan || 0,
            row.total_harga || 0,
            row.pemasok || '',
            row.nama_penerima || '',
            row.tempat_tiba || '',
            row.pengirim || '',
            row.plat_nomor || ''
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pembelian-sapi-qurban-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setNotification({ type: 'success', message: 'CSV berhasil diunduh' });
    };

    const handleEdit = useCallback((item) => {
        const id = item.pid || item.encryptedPid || item.pubid;
        navigate(`/rph/pembelian-sapi-qurban/edit/${id}`, { state: { item } });
        setOpenMenuId(null);
    }, [navigate]);

    const handleDetailSapi = useCallback((item) => {
        const id = item.pid || item.encryptedPid || item.pubid;
        navigate(`/rph/pembelian-sapi-qurban/detail-sapi/${id}`);
        setOpenMenuId(null);
    }, [navigate]);

    const handleDelete = useCallback((item) => { setSelectedItem(item); setIsDeleteModalOpen(true); setOpenMenuId(null); }, []);
    const handleUnduhBerkas = useCallback((item) => { setSelectedItem(item); setIsUnduhBerkasModalOpen(true); setOpenMenuId(null); }, []);

    const handleConfirmDelete = async (pid) => {
        try {
            setNotification({ type: 'info', message: 'Menghapus data...' });
            const result = await deletePo(pid);
            if (result.success) {
                setNotification({ type: 'success', message: result.message || 'Data berhasil dihapus' });
                setIsDeleteModalOpen(false); setSelectedItem(null);
            } else setNotification({ type: 'error', message: result.message || 'Gagal menghapus data' });
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
        }
    };

    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const getJenisBadge = (jenis) => {
        const map = { 'SUPPLIER (PERUSAHAAN)': 'bg-blue-50 text-blue-700 border-blue-100', 'PETERNAK LOKAL': 'bg-green-50 text-green-700 border-green-100', 'PENGUMPUL': 'bg-amber-50 text-amber-700 border-amber-100', 'Bull': 'bg-blue-50 text-blue-700 border-blue-100', 'SO': 'bg-green-50 text-green-700 border-green-100', 'Bali': 'bg-amber-50 text-amber-700 border-amber-100', 'Madura': 'bg-purple-50 text-purple-700 border-purple-100' };
        return <span className={`px-2 py-0.5 ${map[jenis] || 'bg-gray-50 text-gray-700 border-gray-100'} rounded border text-xs font-medium inline-block whitespace-nowrap`}>{jenis || '-'}</span>;
    };

    const columns = useMemo(() => [
        {
            name: 'No', width: '45px', sortable: false, center: true,
            cell: (row, index) => <span className="text-xs text-gray-500">{(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}</span>
        },
        {
            name: 'Nomor', selector: row => row.nota_sistem, sortable: true, width: '140px', center: true,
            cell: row => <span className="font-mono text-xs text-gray-700 whitespace-nowrap">{row.nota_sistem || '-'}</span>
        },
        {
            name: 'Tanggal', selector: row => row.tanggal_pemesanan, sortable: true, width: '110px', center: true,
            cell: row => <span className="text-xs text-gray-700 whitespace-nowrap">{row.tanggal_pemesanan ? new Date(row.tanggal_pemesanan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</span>
        },
        {
            name: 'Jenis', selector: row => row.jenis_pembelian, sortable: true, width: '150px', center: true,
            cell: row => <div className="flex justify-center">{getJenisBadge(row.jenis_pembelian)}</div>
        },
        {
            name: 'Jumlah', selector: row => row.jumlah_hewan, sortable: true, width: '80px', center: true,
            cell: row => <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{row.jumlah_hewan || 0} ekor</span>
        },
        {
            name: 'Total', selector: row => row.total_harga, sortable: true, width: '130px', center: true,
            cell: row => <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{formatCurrency(row.total_harga)}</span>
        },
        {
            name: 'Pemasok', selector: row => row.pemasok, sortable: true, minWidth: '160px', grow: 2,
            cell: row => <div className="text-left text-xs text-gray-700 truncate w-full" title={row.pemasok}>{row.pemasok || '-'}</div>
        },
        {
            name: '', width: '50px', ignoreRowClick: true, center: true,
            cell: row => <ActionButton row={row} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} onEdit={handleEdit} onDelete={handleDelete} onUnduhBerkas={handleUnduhBerkas} onDetailSapi={handleDetailSapi} isActive={openMenuId === (row.pid || row.encryptedPid || row.pubid)} />
        },
    ], [openMenuId, serverPagination, handleEdit, handleDetailSapi, handleDelete, handleUnduhBerkas]);

    const safeStats = stats || {};
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="min-h-screen bg-gray-50">
            <Notification notification={notification} onClose={() => setNotification(null)} />

            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Pembelian Sapi Qurban</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola data Pembelian Sapi Qurban</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDownloadCSV} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-md text-xs font-medium transition-colors">
                                <Download className="w-3.5 h-3.5 text-gray-500" />
                                <span className="hidden sm:inline">Unduh CSV</span>
                            </button>
                            <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm hover:shadow active:scale-[0.98]">
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>+ Tambah</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard title="Hari Ini" icon={Package} accentColor="bg-blue-500">
                        <p className="text-xl font-bold text-gray-900">{safeStats.today_ekor || 0} <span className="text-xs font-medium text-gray-500">ekor</span></p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{safeStats.today_po || 0} PO</span>
                            <span>{formatCurrency(safeStats.today_total || 0)}</span>
                        </div>
                    </StatCard>
                    <StatCard title="Minggu Ini" icon={TrendingUp} accentColor="bg-emerald-500">
                        <p className="text-xl font-bold text-gray-900">{safeStats.week_ekor || 0} <span className="text-xs font-medium text-gray-500">ekor</span></p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{safeStats.week_po || 0} PO</span>
                            <span>{formatCurrency(safeStats.week_total || 0)}</span>
                        </div>
                    </StatCard>
                    <StatCard title="Bulan Ini" icon={DollarSign} accentColor="bg-amber-500">
                        <p className="text-xl font-bold text-gray-900">{safeStats.month_ekor || 0} <span className="text-xs font-medium text-gray-500">ekor</span></p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{safeStats.month_po || 0} PO</span>
                            <span>{formatCurrency(safeStats.month_total || 0)}</span>
                        </div>
                    </StatCard>
                    <StatCard title="Status PO" icon={Package} accentColor="bg-purple-500">
                        <p className="text-xl font-bold text-gray-900">{safeStats.total_po || 0} <span className="text-xs font-medium text-gray-500">PO</span></p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>{safeStats.pending || 0} Pending</span>
                            <span>{safeStats.approved || 0} Approved</span>
                            <span>{safeStats.rejected || 0} Rejected</span>
                        </div>
                    </StatCard>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {isSearching && <Loader2 className="absolute right-9 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-green-500 animate-spin" />}
                    {searchTerm && !isSearching && (
                        <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                    )}
                    <input
                        type="text" placeholder="Cari nomor pesanan, jenis, pemasok..."
                        value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
                        className={`w-full pl-9 ${searchTerm ? 'pr-9' : 'pr-3'} py-2 border ${searchError ? 'border-red-300' : 'border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500'} rounded-lg transition-all text-sm bg-white`}
                    />
                </div>

                {/* Data Table / Card View */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {isMobile ? (
                        <div className="p-3 space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-green-500 animate-spin" /><span className="ml-2 text-sm text-gray-500">Memuat data...</span></div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-500">Tidak ada data ditemukan</div>
                            ) : (
                                filteredData.map((item, index) => (
                                    <QurbanCard
                                        key={item.pid || item.encryptedPid || index}
                                        item={item} index={(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                                        onEdit={handleEdit} onUnduhBerkas={handleUnduhBerkas}
                                        formatCurrency={formatCurrency}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <DataTable
                            columns={columns} data={filteredData || []}
                            customStyles={enhancedTableStyles}
                            progressPending={loading}
                            progressComponent={<div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-green-500 animate-spin" /><span className="ml-2 text-sm text-gray-500">Memuat data...</span></div>}
                            noDataComponent={<div className="text-center py-8 text-sm text-gray-500">Tidak ada data ditemukan</div>}
                            pagination paginationServer
                            paginationTotalRows={serverPagination.totalRows}
                            paginationPerPage={serverPagination.perPage}
                            paginationDefaultPage={serverPagination.currentPage}
                            onChangePage={handleServerPageChange}
                            onChangeRowsPerPage={handleServerPerPageChange}
                            paginationRowsPerPageOptions={[10, 25, 50, 100]}
                            paginationComponent={props => <CustomPagination {...props} />}
                            highlightOnHover pointerOnHover responsive dense fixedHeader fixedHeaderScrollHeight="calc(100vh - 320px)"
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            {isDeleteModalOpen && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedItem(null); }} onConfirm={handleConfirmDelete} item={selectedItem} />}
            {isUnduhBerkasModalOpen && <UnduhBerkasModal isOpen={isUnduhBerkasModalOpen} onClose={() => { setIsUnduhBerkasModalOpen(false); setSelectedItem(null); }} item={selectedItem} />}
        </div>
    );
};

export default PembelianSapiQurbanPage;