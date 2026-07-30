import React, { useState, useMemo, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Search, X, Loader2, AlertCircle, CheckCircle2, Wheat, FileText, Coins } from 'lucide-react';
import usePersediaanPakan from '../hooks/usePersediaanPakan';
import BuatResepPakanModal from '../modals/BuatResepPakanModal';
import PersediaanPakanActionButton from './PersediaanPakanActionButton';
import CustomPagination from './CustomPagination';
import { enhancedTableStyles } from '../constants/tableStyles';
import PersediaanPakanService from '../../../../../services/persediaanPakanService';

const SkeletonRows = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100">
        <div className="w-8 h-4 rounded bg-slate-100 animate-pulse" />
        <div className="w-10 h-7 rounded bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="w-2/3 h-4 rounded bg-slate-100 animate-pulse" />
          <div className="w-1/3 h-3 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="w-20 h-6 rounded bg-slate-100 animate-pulse" />
        <div className="w-28 h-6 rounded bg-slate-100 animate-pulse" />
      </div>
    ))}
  </>
);

const ResepSummaryCard = ({ data }) => {
  const stats = useMemo(() => {
    const totalResep = data.length;
    const totalJumlah = data.reduce((s, r) => s + (Number(r.total_jumlah) || 0), 0);
    const totalNilai = data.reduce((s, r) => s + (Number(r.harga_total) || 0), 0);
    return { totalResep, totalJumlah, totalNilai };
  }, [data]);

  const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

  const cards = [
    { label: 'Total Resep', value: stats.totalResep, icon: FileText, color: 'emerald', sub: 'resep tercatat' },
    { label: 'Total Bahan', value: stats.totalJumlah, icon: Wheat, color: 'sky', sub: 'item bahan' },
    { label: 'Nilai Resep', value: formatRp(stats.totalNilai), icon: Coins, color: 'amber', sub: 'estimasi total' },
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', ring: 'ring-emerald-100' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', value: 'text-sky-700', ring: 'ring-sky-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700', ring: 'ring-amber-100' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const c = colorMap[card.color];
        return (
          <div key={card.label} className={`relative overflow-hidden rounded-xl bg-white border border-slate-200 p-3.5 ring-1 ${c.ring}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${c.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-500 truncate">{card.label}</div>
                <div className={`text-lg font-extrabold ${c.value} leading-tight truncate`}>{card.value}</div>
                <div className="text-[10px] text-slate-400 font-medium">{card.sub}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const NOTIFICATION_TIMEOUT = 5000;

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

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isDeleting ? onClose : undefined}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Konfirmasi Hapus</h3>
                                    <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-gray-800 text-center">Apakah Anda yakin ingin menghapus resep pakan ini?</p>
                            {itemName && (
                                <p className="text-gray-600 text-center mt-2 font-semibold">"{itemName}"</p>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PersediaanPakanTab = () => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        persediaanData,
        loading,
        searchTerm,
        isSearching,
        searchError,
        serverPagination,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        refresh,
    } = usePersediaanPakan();

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Handle modal open/close
    const handleOpenModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    // Handle edit
    const handleEdit = async (item) => {
        setOpenMenuId(null);
        setNotification({ type: 'info', message: 'Memuat data resep...' });
        
        try {
            const response = await PersediaanPakanService.showResep(item.pid);
            
            if (response.success && response.data) {
                setEditingItem(response.data);
                setIsModalOpen(true);
                setNotification(null);
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal memuat data resep' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan saat memuat data' });
        }
    };

    // Handle delete
    const handleDeleteClick = (item) => {
        setDeleteItem(item);
        setOpenMenuId(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;

        setIsDeleting(true);
        try {
            setNotification({ type: 'info', message: 'Menghapus data...' });
            
            const response = await PersediaanPakanService.deleteResep(deleteItem.pid);
            
            if (response.success) {
                setNotification({ type: 'success', message: response.message || 'Data berhasil dihapus' });
                setDeleteItem(null);
                refresh();
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal menghapus data' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle modal success
    const handleModalSuccess = () => {
        handleCloseModal();
        refresh();
        setNotification({ type: 'success', message: 'Data resep pakan berhasil disimpan' });
    };

    // Format currency
    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        }).format(value);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Define columns - clean & informative
    const columns = useMemo(() => [
        {
            name: 'No',
            width: '56px',
            sortable: false,
            center: true,
            cell: (row, index) => (
                <div className="text-slate-500 text-sm text-center w-full font-medium">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            ),
        },
        {
            name: '',
            width: '60px',
            ignoreRowClick: true,
            center: true,
            cell: row => (
                <div className="flex justify-center w-full">
                    <PersediaanPakanActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        isActive={openMenuId === (row.pid || row.id)}
                    />
                </div>
            ),
        },
        {
            name: 'Tanggal & Resep',
            selector: row => row.name,
            sortable: true,
            minWidth: '280px',
            cell: row => (
                <div className="text-left w-full py-1" title={row.keterangan || row.name}>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{row.name || '-'}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                            {formatDate(row.tgl_aktif)}
                        </span>
                        {row.keterangan && (
                            <span className="text-xs text-slate-400 line-clamp-1 leading-snug">{row.keterangan}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            name: 'Jumlah Bahan',
            selector: row => row.total_jumlah,
            sortable: true,
            width: '130px',
            center: true,
            cell: row => (
                <div className="flex justify-center w-full">
                    <span className="inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-bold">
                        {row.total_jumlah || 0}
                    </span>
                </div>
            ),
        },
        {
            name: 'Harga Total',
            selector: row => row.harga_total,
            sortable: true,
            width: '170px',
            right: true,
            cell: row => (
                <div className="text-right w-full whitespace-nowrap py-1">
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(row.harga_total)}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {row.total_jumlah > 0 ? formatCurrency(Math.round((row.harga_total || 0) / row.total_jumlah)) + '/bahan' : '-'}
                    </div>
                </div>
            ),
        },
    ], [openMenuId, serverPagination]);

    return (
        <div className="space-y-3">
            <Notification notification={notification} onClose={() => setNotification(null)} />

            {!searchError && persediaanData && persediaanData.length > 0 && <ResepSummaryCard data={persediaanData} />}

            {/* Search & Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    {isSearching && (
                        <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                    )}
                    {searchTerm && !isSearching && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <input
                        type="text"
                        placeholder="Cari nama resep, keterangan..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={`w-full pl-9 ${searchTerm ? 'pr-10' : 'pr-3'} py-2.5 text-sm border-2 ${searchError ? 'border-red-300' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15'} rounded-lg bg-slate-50 focus:bg-white transition-all outline-none placeholder:text-slate-400`}
                    />
                </div>
                <button
                    onClick={handleOpenModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Buat Resep
                </button>
            </div>

            {/* Active search filter chip */}
            {searchTerm && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter aktif:</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <Search className="h-3 w-3" />
                        "{searchTerm}"
                        <button
                            onClick={clearSearch}
                            className="ml-0.5 rounded-full hover:bg-emerald-100 p-0.5 transition-colors"
                            aria-label="Hapus filter"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                </div>
            )}

            {/* Data Table — desktop */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable
                    columns={columns}
                    data={persediaanData || []}
                    customStyles={enhancedTableStyles}
                    progressPending={loading}
                    progressComponent={<SkeletonRows />}
                    noDataComponent={
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Wheat className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-700 text-base font-bold">Belum ada resep pakan</p>
                            <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">
                                {searchTerm ? 'Coba kata kunci lain atau hapus pencarian' : 'Buat resep pakan pertama untuk mulai mencatat komposisi pakan'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleOpenModal}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    Buat Resep Pertama
                                </button>
                            )}
                        </div>
                    }
                    pagination
                    paginationServer
                    paginationTotalRows={serverPagination.totalRows}
                    paginationPerPage={serverPagination.perPage}
                    paginationDefaultPage={serverPagination.currentPage}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    paginationComponent={props => <CustomPagination {...props} />}
                    highlightOnHover
                    pointerOnHover
                    responsive
                    dense
                    fixedHeader
                    fixedHeaderScrollHeight="calc(100vh - 320px)"
                />
            </div>

            {/* Mobile Card List — thumb-friendly */}
            <div className="lg:hidden space-y-2.5">
                {loading && (
                    <>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3.5 animate-pulse">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="w-3/4 h-4 rounded bg-slate-100" />
                                        <div className="w-1/3 h-3 rounded bg-slate-100" />
                                    </div>
                                    <div className="w-8 h-8 rounded bg-slate-100" />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <div className="h-12 rounded bg-slate-100" />
                                    <div className="h-12 rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {!loading && (persediaanData || []).length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                            <Wheat className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-slate-700 text-sm font-bold">Belum ada resep</p>
                        <p className="text-slate-500 text-xs mt-1">
                            {searchTerm ? 'Coba kata kunci lain' : 'Buat resep pertama untuk mulai'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={handleOpenModal}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white active:scale-95 transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Buat Resep
                            </button>
                        )}
                    </div>
                )}

                {!loading && (persediaanData || []).map((row, index) => (
                    <div key={row.pid || row.id || index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3.5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-400">#{(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}</span>
                                        <span className="inline-flex items-center rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                                            {formatDate(row.tgl_aktif)}
                                        </span>
                                    </div>
                                    <div className="font-bold text-slate-900 text-sm leading-tight">{row.name || '-'}</div>
                                    {row.keterangan && (
                                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{row.keterangan}</div>
                                    )}
                                </div>
                                <PersediaanPakanActionButton
                                    row={row}
                                    openMenuId={openMenuId}
                                    setOpenMenuId={setOpenMenuId}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                    isActive={openMenuId === (row.pid || row.id)}
                                />
                            </div>
                            <div className="mt-2.5 grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Bahan</div>
                                    <div className="text-sm font-bold text-slate-700">{row.total_jumlah || 0}</div>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Harga Total</div>
                                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(row.harga_total)}</div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {row.total_jumlah > 0 ? formatCurrency(Math.round((row.harga_total || 0) / row.total_jumlah)) + '/bahan' : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            <BuatResepPakanModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                editData={editingItem}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConfirm}
                itemName={deleteItem?.name}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default PersediaanPakanTab;
