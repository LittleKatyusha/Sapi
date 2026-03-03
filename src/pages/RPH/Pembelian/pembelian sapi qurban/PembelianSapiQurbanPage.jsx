import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, X, Loader2, Calendar, Package, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import useQurban from './hooks/useQurban';
import ActionButton from './components/ActionButton';
import QurbanCard from './components/QurbanCard';
import CustomPagination from './components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import UnduhBerkasModal from './modals/UnduhBerkasModal';

const NOTIFICATION_TIMEOUT = 5000;

const StatCard = React.memo(({ title, icon: Icon, bgColor, children }) => (
    <div className={`${bgColor} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium opacity-90">{title}</h3>
            {Icon && <div className="p-2 bg-white/20 rounded-lg"><Icon className="h-5 w-5 text-white" /></div>}
        </div>
        {children}
    </div>
));

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;
    const borderColor = notification.type === 'success' ? 'border-green-400' : notification.type === 'info' ? 'border-blue-400' : 'border-red-400';
    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${borderColor}`}>
                <div className="p-4 flex items-start">
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Memproses...' : 'Error!'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                    </div>
                    <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
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
        poList: filteredData, loading, searchTerm, dateRange,
        isSearching, searchError, stats, serverPagination,
        fetchPoList, createPo, deletePo,
        handleSearch, clearSearch, handleDateRangeFilter, clearDateRange,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
    } = useQurban();

    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formattedDateTime = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const d = currentDateTime;
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, Pukul ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')} WIB`;
    }, [currentDateTime]);

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

    const handleEdit = (item) => {
        const id = item.pid || item.encryptedPid || item.pubid;
        navigate(`/rph/pembelian-sapi-qurban/edit/${id}`, { state: { item } });
        setOpenMenuId(null);
    };

    const handleDelete = (item) => { setSelectedItem(item); setIsDeleteModalOpen(true); setOpenMenuId(null); };
    const handleUnduhBerkas = (item) => { setSelectedItem(item); setIsUnduhBerkasModalOpen(true); setOpenMenuId(null); };

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
        const map = { 'SUPPLIER (PERUSAHAAN)': 'bg-blue-50 text-blue-700', 'PETERNAK LOKAL': 'bg-green-50 text-green-700', 'PENGUMPUL': 'bg-amber-50 text-amber-700', 'Bull': 'bg-blue-50 text-blue-700', 'SO': 'bg-green-50 text-green-700', 'Bali': 'bg-amber-50 text-amber-700', 'Madura': 'bg-purple-50 text-purple-700' };
        return <span className={`px-3 py-1.5 ${map[jenis] || 'bg-gray-50 text-gray-700'} rounded-lg font-semibold text-sm inline-block whitespace-nowrap text-center`}>{jenis || '-'}</span>;
    };

    const columns = useMemo(() => [
        {
            name: 'No', width: '50px', sortable: false, center: true,
            cell: (row, index) => <div className="font-semibold text-gray-600 text-center w-full">{(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}</div>
        },
        {
            name: 'Pilih', width: '70px', ignoreRowClick: true, center: true,
            cell: row => <div className="flex justify-center w-full"><ActionButton row={row} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} onEdit={handleEdit} onDelete={handleDelete} onUnduhBerkas={handleUnduhBerkas} isActive={openMenuId === (row.pid || row.encryptedPid || row.pubid)} /></div>
        },
        {
            name: 'Nomor Pesanan', selector: row => row.nota_sistem, sortable: true, width: '180px', center: true,
            cell: row => <div className="flex justify-center w-full"><div className="font-mono text-sm bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 whitespace-nowrap text-center">{row.nota_sistem || '-'}</div></div>
        },
        {
            name: 'Tanggal Pesanan', selector: row => row.tanggal_pemesanan, sortable: true, width: '160px', center: true,
            cell: row => <div className="font-medium text-gray-800 text-center w-full whitespace-nowrap">{row.tanggal_pemesanan ? new Date(row.tanggal_pemesanan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
        },
        {
            name: 'Jenis', selector: row => row.jenis_pembelian, sortable: true, width: '220px', center: true,
            cell: row => <div className="flex justify-center w-full">{getJenisBadge(row.jenis_pembelian)}</div>
        },
        {
            name: 'Jumlah', selector: row => row.jumlah_hewan, sortable: true, width: '110px', center: true,
            cell: row => <div className="flex justify-center w-full"><div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap text-center">{row.jumlah_hewan || 0} Ekor</div></div>
        },
        {
            name: 'Total Harga', selector: row => row.total_harga, sortable: true, width: '160px', center: true,
            cell: row => <div className="flex justify-center w-full"><div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap text-center">{formatCurrency(row.total_harga)}</div></div>
        },
        {
            name: 'Pemasok', selector: row => row.pemasok, sortable: true, minWidth: '200px',
            cell: row => <div className="text-left font-medium text-gray-800 text-sm line-clamp-2 w-full" title={row.pemasok}>{row.pemasok || '-'}</div>
        },
        {
            name: 'Penerima', selector: row => row.nama_penerima, sortable: true, minWidth: '150px',
            cell: row => <div className="text-left font-medium text-gray-800 text-sm w-full">{row.nama_penerima || '-'}</div>
        },
        {
            name: 'Tempat Tiba',
            selector: row => row.tempat_tiba,
            sortable: true,
            minWidth: '180px',
            cell: row => (
                <div className="text-sm text-gray-700">
                    {row.tempat_tiba || '-'}
                </div>
            ),
        },
        {
            name: 'Pengirim',
            selector: row => row.pengirim,
            sortable: true,
            minWidth: '150px',
            cell: row => (
                <div className="text-sm text-gray-700">
                    {row.pengirim || '-'}
                </div>
            ),
        },
        {
            name: 'Plat Nomor',
            selector: row => row.plat_nomor,
            sortable: true,
            minWidth: '130px',
            cell: row => (
                <div className="text-sm text-gray-700 font-medium">
                    {row.plat_nomor || '-'}
                </div>
            ),
        },
        {
            name: 'Tanggal Dibuat',
            selector: row => row.created_at,
            sortable: true,
            minWidth: '170px',
            cell: row => (
                <div className="text-sm text-gray-500">
                    {row.created_at || '-'}
                </div>
            ),
        },
    ], [openMenuId, serverPagination]);

    const safeStats = stats || {};
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
            <Notification notification={notification} onClose={() => setNotification(null)} />

            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Pembelian Sapi Qurban</h1>
                                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Kelola data Pembelian Sapi Qurban</p>
                            </div>
                        </div>
                        <button onClick={handleAdd} className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base">
                            <PlusCircle className="w-5 h-5" />
                            <span>Tambah Pembelian</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard title="HARI INI" icon={Package} bgColor="bg-gradient-to-br from-blue-600 to-blue-700">
                        <p className="text-3xl font-bold">{safeStats.today_ekor || 0} EKOR</p>
                        <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-sm"><span className="opacity-80">{safeStats.today_po || 0} PO</span></div>
                            <div className="text-sm font-semibold">{formatCurrency(safeStats.today_total || 0)}</div>
                        </div>
                    </StatCard>
                    <StatCard title="MINGGU INI" icon={TrendingUp} bgColor="bg-gradient-to-br from-blue-600 to-blue-700">
                        <p className="text-3xl font-bold">{safeStats.week_ekor || 0} EKOR</p>
                        <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-sm"><span className="opacity-80">{safeStats.week_po || 0} PO</span></div>
                            <div className="text-sm font-semibold">{formatCurrency(safeStats.week_total || 0)}</div>
                        </div>
                    </StatCard>
                    <StatCard title="BULAN INI" icon={DollarSign} bgColor="bg-gradient-to-br from-blue-600 to-blue-700">
                        <p className="text-3xl font-bold">{safeStats.month_ekor || 0} EKOR</p>
                        <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-sm"><span className="opacity-80">{safeStats.month_po || 0} PO</span></div>
                            <div className="text-sm font-semibold">{formatCurrency(safeStats.month_total || 0)}</div>
                        </div>
                    </StatCard>
                    <StatCard title="STATUS PO" icon={Package} bgColor="bg-gradient-to-br from-blue-600 to-blue-700">
                        <p className="text-3xl font-bold">{safeStats.total_po || 0}</p>
                        <div className="border-t border-white/20 pt-2 mt-2 space-y-1">
                            <div className="flex justify-between text-sm"><span className="opacity-80">PENDING</span><span className="font-semibold">= {safeStats.pending || 0}</span></div>
                            <div className="flex justify-between text-sm"><span className="opacity-80">APPROVED</span><span className="font-semibold">= {safeStats.approved || 0}</span></div>
                            <div className="flex justify-between text-sm"><span className="opacity-80">REJECTED</span><span className="font-semibold">= {safeStats.rejected || 0}</span></div>
                        </div>
                    </StatCard>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            {isSearching && <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500 animate-spin" />}
                            {searchTerm && !isSearching && (
                                <button onClick={clearSearch} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            )}
                            <input
                                type="text" placeholder="Cari berdasarkan nomor pesanan, jenis, pemasok..."
                                value={searchTerm} onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-12 ${searchTerm ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 border ${searchError ? 'border-red-300' : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500'} rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
                            />
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                            <input type="date" value={dateRange.startDate} onChange={(e) => handleDateRangeFilter({ ...dateRange, startDate: e.target.value })}
                                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" style={{ minWidth: '150px' }} />
                            <span className="text-gray-500 text-sm font-medium">s/d</span>
                            <input type="date" value={dateRange.endDate} onChange={(e) => handleDateRangeFilter({ ...dateRange, endDate: e.target.value })}
                                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" style={{ minWidth: '150px' }} />
                            {(dateRange.startDate || dateRange.endDate) && (
                                <button onClick={clearDateRange} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all duration-200" title="Hapus Filter Tanggal"><X className="w-4 h-4" /></button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table / Card View */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {isMobile ? (
                        <div className="p-4 space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /><span className="ml-3 text-gray-500">Memuat data...</span></div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">Tidak ada data ditemukan</div>
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
                            progressComponent={<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /><span className="ml-3 text-gray-500">Memuat data...</span></div>}
                            noDataComponent={<div className="text-center py-12 text-gray-500">Tidak ada data ditemukan</div>}
                            pagination paginationServer
                            paginationTotalRows={serverPagination.totalRows}
                            paginationPerPage={serverPagination.perPage}
                            paginationDefaultPage={serverPagination.currentPage}
                            onChangePage={handleServerPageChange}
                            onChangeRowsPerPage={handleServerPerPageChange}
                            paginationRowsPerPageOptions={[10, 25, 50, 100]}
                            paginationComponent={props => <CustomPagination {...props} />}
                            highlightOnHover pointerOnHover responsive dense fixedHeader fixedHeaderScrollHeight="calc(100vh - 400px)"
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