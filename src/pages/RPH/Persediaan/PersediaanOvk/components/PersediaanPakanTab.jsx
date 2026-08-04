import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Plus, Search, X, Loader2, AlertCircle, CheckCircle2, Wheat, FileText, Coins, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import usePersediaanPakan from '../hooks/usePersediaanPakan';
import BuatResepPakanModal from '../modals/BuatResepPakanModal';
import CopyResepPakanModal from '../modals/CopyResepPakanModal';
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

const CancelConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
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
                                    <h3 className="text-lg font-bold text-white">Konfirmasi Cancel</h3>
                                    <p className="text-red-100 text-sm">Stok bahan baku akan dikembalikan</p>
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
                            <p className="text-gray-800 text-center">Apakah Anda yakin ingin membatalkan resep pakan ini? Stok bahan baku yang terpakai akan dikembalikan.</p>
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
                                Tutup
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
                                        Membatalkan...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Cancel
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

const DetailResepPakanModal = ({ isOpen, onClose, item, detail, loading, formatCurrency, formatDate }) => {
    if (!isOpen) return null;

    const details = detail?.detail || [];
    const totalHarga = Array.isArray(details)
        ? details.reduce((sum, d) => sum + (Number(d.subtotal || (Number(d.harga || 0) * Number(d.jumlah || 0))) || 0), 0)
        : 0;
    const totalJumlah = Array.isArray(details)
        ? details.reduce((sum, d) => sum + (Number(d.jumlah || 0)), 0)
        : 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Detail Resep Pakan</h3>
                                    <p className="text-sky-100 text-sm">{item?.name || ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                                <span className="ml-2 text-sm text-slate-500">Memuat detail...</span>
                            </div>
                        ) : !Array.isArray(details) || details.length === 0 ? (
                            <div className="text-center py-10 text-sm text-slate-500">Tidak ada bahan baku tercatat</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Tanggal Aktif</div>
                                        <div className="text-sm font-bold text-slate-800">{item?.tgl_aktif ? formatDate(item.tgl_aktif) : '-'}</div>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Bahan</div>
                                        <div className="text-sm font-bold text-slate-800">{totalJumlah} item</div>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Jenis Bahan</div>
                                        <div className="text-sm font-bold text-slate-800">{details.length} bahan</div>
                                    </div>
                                    <div className="rounded-lg bg-emerald-50 px-3 py-2">
                                        <div className="text-[10px] font-semibold text-emerald-600 uppercase">Harga Total</div>
                                        <div className="text-sm font-bold text-emerald-700">{formatCurrency(totalHarga)}</div>
                                    </div>
                                </div>

                                {item?.keterangan && (
                                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                                        <div className="text-[10px] font-semibold text-amber-600 uppercase">Keterangan</div>
                                        <div className="text-sm text-slate-700 mt-0.5">{item.keterangan}</div>
                                    </div>
                                )}

                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide">No</th>
                                                <th className="px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide">Bahan Baku</th>
                                                <th className="px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide">Jumlah</th>
                                                <th className="px-3 py-2 text-right font-semibold text-xs uppercase tracking-wide">Harga</th>
                                                <th className="px-3 py-2 text-right font-semibold text-xs uppercase tracking-wide">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {details.map((d, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                                                    <td className="px-3 py-2.5 font-semibold text-slate-800">{d.nama_produk || '-'}</td>
                                                    <td className="px-3 py-2.5 text-center text-slate-700">{Number(d.jumlah || 0)}</td>
                                                    <td className="px-3 py-2.5 text-right text-slate-700">{formatCurrency(d.harga)}</td>
                                                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{formatCurrency(d.subtotal || (Number(d.harga || 0) * Number(d.jumlah || 0)))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50">
                                            <tr>
                                                <td colSpan={3} className="px-3 py-2.5 text-right font-semibold text-slate-600">Total</td>
                                                <td className="px-3 py-2.5 text-right font-bold text-emerald-700" colSpan={2}>{formatCurrency(totalHarga)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Tutup
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
    const [detailItem, setDetailItem] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [copyItem, setCopyItem] = useState(null);

    // Advanced filter state
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [filterInput, setFilterInput] = useState({
        kode: '',
        name: '',
        bahan: '',
        status: '',
        tglAktifStart: '',
        tglAktifEnd: '',
    });
    const [appliedFilters, setAppliedFilters] = useState(null);

    const navigate = useNavigate();

    const {
        persediaanData,
        loading,
        searchTerm,
        searchError,
        serverPagination,
        setServerPagination,
        updateParams,
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

    // Handle lihat detail
    const handleDetailClick = async (item) => {
        setOpenMenuId(null);
        setDetailItem(item);
        setDetailData(null);
        setIsLoadingDetail(true);
        try {
            const response = await PersediaanPakanService.showResep(item.pid);
            if (response.success && response.data) {
                setDetailData(response.data);
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal memuat detail resep' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan saat memuat detail' });
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // Handle cancel resep pakan — stok bahan baku dikembalikan
    const handleDeleteClick = (item) => {
        setDeleteItem(item);
        setOpenMenuId(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;

        setIsDeleting(true);
        try {
            setNotification({ type: 'info', message: 'Membatalkan resep pakan...' });
            
            const response = await PersediaanPakanService.deleteResep(deleteItem.pid);
            
            if (response.success) {
                setNotification({ type: 'success', message: response.message || 'Resep pakan berhasil dibatalkan, stok bahan baku dikembalikan' });
                setDeleteItem(null);
                refresh();
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal membatalkan resep pakan' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle copy resep ke tanggal lain
    const handleCopyClick = (item) => {
        setCopyItem(item);
        setOpenMenuId(null);
    };

    const handleCopySuccess = () => {
        setCopyItem(null);
        refresh();
        setNotification({ type: 'success', message: 'Resep pakan berhasil disalin ke tanggal lain' });
    };

    // Handle beri makan sapi — navigate to dedicated page
    const handleBeriMakanClick = useCallback((item) => {
        navigate(`/rph/persediaan-ovk/beri-makan/${item.pid}`);
        setOpenMenuId(null);
    }, [navigate]);

    // Handle riwayat pemberian — navigate to dedicated page
    const handleRiwayatPemberianClick = useCallback((item) => {
        navigate(`/rph/persediaan-ovk/riwayat-pemberian/${item.pid}`);
        setOpenMenuId(null);
    }, [navigate]);

    // Advanced filter handlers
    const hasActiveFilters = useMemo(() => {
        if (!appliedFilters) return false;
        return Object.values(appliedFilters).some(v => v !== '' && v !== null && v !== undefined);
    }, [appliedFilters]);

    const activeFilterCount = useMemo(() => {
        if (!appliedFilters) return 0;
        return Object.values(appliedFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
    }, [appliedFilters]);

    const handleApplyFilter = useCallback(() => {
        setAppliedFilters({ ...filterInput });
        updateParams({
            start: 0,
            ...filterInput,
        });
        setServerPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [filterInput, updateParams, setServerPagination]);

    const handleResetFilter = useCallback(() => {
        setFilterInput({
            kode: '',
            name: '',
            bahan: '',
            status: '',
            tglAktifStart: '',
            tglAktifEnd: '',
        });
        setAppliedFilters(null);
        updateParams({
            start: 0,
            kode: '',
            name: '',
            bahan: '',
            status: '',
            tglAktifStart: '',
            tglAktifEnd: '',
        });
        setServerPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [updateParams, setServerPagination]);

    const handleFilterInputChange = useCallback((field, value) => {
        setFilterInput(prev => ({ ...prev, [field]: value }));
    }, []);

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
            width: '48px',
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
            width: '52px',
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
                        onDetail={handleDetailClick}
                        onCopy={handleCopyClick}
                        onBeriMakan={handleBeriMakanClick}
                        onRiwayatPemberian={handleRiwayatPemberianClick}
                        isActive={openMenuId === (row.pid || row.id)}
                    />
                </div>
            ),
        },
        {
            name: 'Kode Pakan',
            selector: row => row.kode,
            sortable: true,
            width: '170px',
            cell: row => (
                <div className="text-left w-full py-1">
                    <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-700 border border-indigo-100">
                        {row.kode || '-'}
                    </span>
                </div>
            ),
        },
        {
            name: 'Tanggal & Resep',
            selector: row => row.name,
            sortable: true,
            minWidth: '180px',
            cell: row => (
                <div className="text-left w-full py-1" title={row.keterangan || row.name}>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{row.name || '-'}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-flex items-center rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                            {formatDate(row.tgl_aktif)}
                        </span>
                        {row.satuan && (
                            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                {row.satuan}
                            </span>
                        )}
                        {row.keterangan && (
                            <span className="text-xs text-slate-400 line-clamp-1 leading-snug">{row.keterangan}</span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            name: 'Komposisi Bahan',
            selector: row => row.daftar_bahan,
            sortable: true,
            minWidth: '180px',
            cell: row => (
                <div className="text-left w-full py-1" title={row.daftar_bahan || ''}>
                    <div className="text-sm text-slate-700 leading-snug line-clamp-2">
                        {row.daftar_bahan || <span className="text-slate-400">-</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                            {row.jumlah_bahan_distinct || 0} bahan
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                            {row.total_jumlah || 0} item
                        </span>
                    </div>
                </div>
            ),
        },
        {
            name: 'Status',
            selector: row => row.jumlah_pemakaian,
            sortable: true,
            width: '140px',
            center: true,
            cell: row => {
                const isUsed = (row.jumlah_pemakaian || 0) > 0;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isUsed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUsed ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
                    </span>
                );
            },
        },
        {
            name: 'Pemakaian',
            selector: row => row.jumlah_pemakaian,
            sortable: true,
            width: '180px',
            center: true,
            cell: row => (
                <div className="flex flex-col items-center justify-center w-full py-1 gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-md text-sm font-bold ${(row.jumlah_pemakaian || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                            {row.jumlah_pemakaian || 0}x
                        </span>
                        {(row.jumlah_ekor_pakan || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {row.jumlah_ekor_pakan} ekor
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {row.tgl_pemakaian_terakhir ? `Terakhir ${formatDate(row.tgl_pemakaian_terakhir)}` : 'Belum pernah'}
                    </span>
                </div>
            ),
        },
        {
            name: 'Harga Total',
            selector: row => row.harga_total,
            sortable: true,
            width: '180px',
            right: true,
            cell: row => (
                <div className="text-right w-full whitespace-nowrap py-1">
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(row.harga_total)}</div>
                </div>
            ),
        },
    ], [openMenuId, serverPagination, handleBeriMakanClick, handleRiwayatPemberianClick]);

    return (
        <div className="space-y-3">
            <Notification notification={notification} onClose={() => setNotification(null)} />

            {!searchError && persediaanData && persediaanData.length > 0 && <ResepSummaryCard data={persediaanData} />}

            {/* Search & Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAdvancedFilter(prev => !prev)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold rounded-lg border-2 transition-all active:scale-95 whitespace-nowrap ${hasActiveFilters ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filter Lanjutan
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                        {showAdvancedFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleOpenModal}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Resep
                    </button>
                </div>
            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilter && (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-slate-700">Filter Lanjutan</h4>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilter}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Hapus semua filter
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Kode Pakan */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Kode Pakan</label>
                            <input
                                type="text"
                                placeholder="Cari kode pakan..."
                                value={filterInput.kode}
                                onChange={(e) => handleFilterInputChange('kode', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            />
                        </div>
                        {/* Nama Resep */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Nama Resep</label>
                            <input
                                type="text"
                                placeholder="Cari nama resep..."
                                value={filterInput.name}
                                onChange={(e) => handleFilterInputChange('name', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            />
                        </div>
                        {/* Bahan */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Bahan</label>
                            <input
                                type="text"
                                placeholder="Cari bahan pakan..."
                                value={filterInput.bahan}
                                onChange={(e) => handleFilterInputChange('bahan', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilter(); }}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            />
                        </div>
                        {/* Status */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Status</label>
                            <select
                                value={filterInput.status}
                                onChange={(e) => handleFilterInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            >
                                <option value="">Semua status</option>
                                <option value="1">Aktif</option>
                                <option value="0">Tidak Aktif</option>
                            </select>
                        </div>
                        {/* Tgl Aktif Start */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Tgl Aktif Dari</label>
                            <input
                                type="date"
                                value={filterInput.tglAktifStart}
                                onChange={(e) => handleFilterInputChange('tglAktifStart', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            />
                        </div>
                        {/* Tgl Aktif End */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Tgl Aktif Sampai</label>
                            <input
                                type="date"
                                value={filterInput.tglAktifEnd}
                                onChange={(e) => handleFilterInputChange('tglAktifEnd', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={handleResetFilter}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all active:scale-95"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleApplyFilter}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95"
                        >
                            <Search className="w-4 h-4" />
                            Cari
                        </button>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Filter aktif:</span>
                    {appliedFilters.kode && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                            Kode: "{appliedFilters.kode}"
                            <button onClick={() => { setFilterInput(prev => ({...prev, kode: ''})); setAppliedFilters(prev => ({...prev, kode: ''})); updateParams({ start: 0, kode: '' }); }} className="ml-0.5 rounded-full hover:bg-indigo-100 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {appliedFilters.name && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                            Nama: "{appliedFilters.name}"
                            <button onClick={() => { setFilterInput(prev => ({...prev, name: ''})); setAppliedFilters(prev => ({...prev, name: ''})); updateParams({ start: 0, name: '' }); }} className="ml-0.5 rounded-full hover:bg-sky-100 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {appliedFilters.bahan && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            Bahan: "{appliedFilters.bahan}"
                            <button onClick={() => { setFilterInput(prev => ({...prev, bahan: ''})); setAppliedFilters(prev => ({...prev, bahan: ''})); updateParams({ start: 0, bahan: '' }); }} className="ml-0.5 rounded-full hover:bg-amber-100 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {appliedFilters.status !== '' && appliedFilters.status !== null && appliedFilters.status !== undefined && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            Status: {appliedFilters.status === '1' ? 'Aktif' : 'Tidak Aktif'}
                            <button onClick={() => { setFilterInput(prev => ({...prev, status: ''})); setAppliedFilters(prev => ({...prev, status: ''})); updateParams({ start: 0, status: '' }); }} className="ml-0.5 rounded-full hover:bg-emerald-100 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {appliedFilters.tglAktifStart && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            Dari: {appliedFilters.tglAktifStart}
                            <button onClick={() => { setFilterInput(prev => ({...prev, tglAktifStart: ''})); setAppliedFilters(prev => ({...prev, tglAktifStart: ''})); updateParams({ start: 0, tglAktifStart: '' }); }} className="ml-0.5 rounded-full hover:bg-slate-200 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                    {appliedFilters.tglAktifEnd && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            Sampai: {appliedFilters.tglAktifEnd}
                            <button onClick={() => { setFilterInput(prev => ({...prev, tglAktifEnd: ''})); setAppliedFilters(prev => ({...prev, tglAktifEnd: ''})); updateParams({ start: 0, tglAktifEnd: '' }); }} className="ml-0.5 rounded-full hover:bg-slate-200 p-0.5"><X className="h-3 w-3" /></button>
                        </span>
                    )}
                </div>
            )}

            {/* Data Table — desktop */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-700">Daftar Resep Pakan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Resep pakan harian RPH — stok bahan baku dikonsumsi via FIFO saat produksi. Klik aksi untuk beri makan sapi, copy ke tanggal lain, edit, atau hapus.
                    </p>
                </div>
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
                                    onDetail={handleDetailClick}
                                    onCopy={handleCopyClick}
                                    onBeriMakan={handleBeriMakanClick}
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
                                </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${(row.jumlah_pemakaian || 0) > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${(row.jumlah_pemakaian || 0) > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    {(row.jumlah_pemakaian || 0) > 0 ? 'Sudah Digunakan' : 'Belum Digunakan'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${(row.jumlah_pemakaian || 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {row.jumlah_pemakaian || 0}x
                                    </span>
                                    {(row.jumlah_ekor_pakan || 0) > 0 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                                            {row.jumlah_ekor_pakan} ekor
                                        </span>
                                    )}
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

            <CancelConfirmationModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConfirm}
                itemName={deleteItem?.name}
                isDeleting={isDeleting}
            />

            <DetailResepPakanModal
                isOpen={!!detailItem}
                onClose={() => { setDetailItem(null); setDetailData(null); }}
                item={detailItem}
                detail={detailData}
                loading={isLoadingDetail}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
            />

            <CopyResepPakanModal
                isOpen={!!copyItem}
                onClose={() => setCopyItem(null)}
                onSuccess={handleCopySuccess}
                sourceItem={copyItem}
            />
        </div>
    );
};

export default PersediaanPakanTab;
