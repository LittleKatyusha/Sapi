import React from 'react';
import { 
    PlusCircle, Eye, Edit, Trash2, X as CloseIcon, MoreVertical, AlertTriangle, 
    ChevronLeft, ChevronRight, RotateCcw, Search, Info, PackageCheck,
    CreditCard, AlertCircle, Printer
} from 'lucide-react';
// --- HOOKS (Logika Terpusat) ---

// Hook kustom untuk mengelola state dan logika data penjualan.
const useSales = (initialSales = []) => {
    const [sales, setSales] = React.useState(initialSales);
    const [loading, setLoading] = React.useState(false);

    // Fungsi untuk menentukan status pembayaran secara otomatis
    const getPaymentStatus = (total, amountPaid) => {
        if (amountPaid >= total) return 'Lunas';
        if (amountPaid > 0) return 'Kurang Bayar';
        return 'Hutang';
    };

    const addSale = React.useCallback((newItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    ...newItemData,
                    id: `TXN-S-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                    paymentStatus: getPaymentStatus(newItemData.total, newItemData.amountPaid),
                };
                setSales(prev => [newItem, ...prev]);
                setLoading(false);
                resolve(newItem);
            }, 500);
        });
    }, []);

    const updateSale = React.useCallback((updatedItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const updatedItem = {
                    ...updatedItemData,
                    paymentStatus: getPaymentStatus(updatedItemData.total, updatedItemData.amountPaid),
                };
                setSales(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                setLoading(false);
                resolve(updatedItem);
            }, 500);
        });
    }, []);

    const deleteSale = React.useCallback((saleId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setSales(prev => prev.filter(item => item.id !== saleId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { sales, addSale, updateSale, deleteSale, loading };
};


// --- Komponen UI (Presentational) ---

const PaymentStatusBadge = ({ status }) => {
    const config = React.useMemo(() => {
        switch (status) {
            case 'Lunas': return { C: 'bg-green-100 text-green-800', I: <PackageCheck size={12} /> };
            case 'Kurang Bayar': return { C: 'bg-yellow-100 text-yellow-800', I: <AlertCircle size={12} /> };
            case 'Hutang': return { C: 'bg-red-100 text-red-800', I: <CreditCard size={12} /> };
            default: return { C: 'bg-gray-100 text-gray-800', I: null };
        }
    }, [status]);

    return (
        <span className={`flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.C}`}>
            {config.I && <span className="mr-1.5">{config.I}</span>}
            {status}
        </span>
    );
};

const TableSkeletonLoader = ({ rows = 5, cols = 7 }) => (
    <tbody>
        {[...Array(rows)].map((_, i) => (
            <tr key={i} className="border-b">
                {[...Array(cols)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                ))}
            </tr>
        ))}
    </tbody>
);

const EmptyState = ({ onClearFilters }) => (
    <div className="text-center py-16 px-6">
        <Search size={48} className="mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-800">Tidak Ada Transaksi Ditemukan</h3>
        <p className="mt-1 text-sm text-gray-500">Coba sesuaikan filter Anda atau reset untuk melihat semua data.</p>
        <button 
            onClick={onClearFilters} 
            className="mt-6 flex items-center mx-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold">
            <RotateCcw size={14} className="mr-2"/> Reset Filter
        </button>
    </div>
);

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t">
            <span className="text-sm text-gray-700 mb-4 sm:mb-0">
                Menampilkan {startItem}-{endItem} dari <span className="font-semibold">{totalItems}</span> entri
            </span>
            <div className="flex space-x-1">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={16}/></button>
            </div>
        </div>
    );
};

const ActionMenu = ({ item, onAction, onClose }) => {
    const menuRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const actions = [
        { label: 'Lihat Detail', icon: Eye, action: 'view' },
        { label: 'Cetak Kwitansi', icon: Printer, action: 'print' },
        { label: 'Edit Data', icon: Edit, action: 'edit' },
        { label: 'Hapus Data', icon: Trash2, action: 'delete', className: 'text-red-600' },
    ];

    return (
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-30 border animate-fade-in-up-sm">
            {actions.map(({ label, icon: Icon, action, className }) => (
                <button 
                    key={action}
                    onClick={() => { onAction(action, item); onClose(); }} 
                    className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className || ''}`}
                >
                    <Icon size={14} className="mr-3"/> {label}
                </button>
            ))}
        </div>
    );
};


// --- Komponen Modal ---

const BaseModal = ({ isOpen, onClose, children, maxWidth = 'max-w-2xl', loading }) => {
    if (!isOpen) return null;
    const handleOverlayClick = loading ? () => {} : onClose;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={handleOverlayClick}>
            <div className={`bg-white rounded-2xl shadow-2xl w-full m-4 relative animate-fade-in-up ${maxWidth}`} onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const AddEditSalesModal = ({ isOpen, onClose, item, onSave, loading }) => {
    const isEditMode = !!item;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode 
            ? { ...item } 
            : { customer: '', date: new Date().toISOString().split('T')[0], type: 'Olahan', item: '', total: '', amountPaid: '' };
        setFormData(initialData);
    }, [item, isOpen]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || '' : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        await onSave(formData);
        onClose();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg" loading={loading}>
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan</label><input type="text" name="customer" value={formData.customer || ''} onChange={handleChange} placeholder="Nama Pelanggan" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe Penjualan</label><select name="type" value={formData.type || ''} onChange={handleChange} className="w-full input-field"><option>Hidup</option><option>Potong</option><option>Olahan</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Item</label><textarea name="item" value={formData.item || ''} onChange={handleChange} rows="2" placeholder="Contoh: 1 Ekor Sapi Limousin..." className="w-full input-field"></textarea></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Harga Jual (Rp)</label><input type="number" name="total" value={formData.total || ''} onChange={handleChange} placeholder="32000000" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Dibayar (Rp)</label><input type="number" name="amountPaid" value={formData.amountPaid || ''} onChange={handleChange} placeholder="0" className="w-full input-field"/></div>
                    </div>
                </div>
                <div className="flex justify-end p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                    <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-44 text-center" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
                                Menyimpan...
                            </span>
                        ) : isEditMode ? 'Simpan' : 'Tambah Transaksi'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

const SalesDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    const debt = item.total - item.amountPaid;
    const details = [
        { label: 'ID Transaksi', value: item.id, mono: true },
        { label: 'Pelanggan', value: item.customer },
        { label: 'Tanggal', value: item.date },
        { label: 'Tipe Penjualan', value: item.type },
        { label: 'Total Harga', value: formatCurrency(item.total), bold: true },
        { label: 'Dibayar', value: formatCurrency(item.amountPaid), bold: true, className: 'text-green-600' },
        { label: 'Sisa Hutang', value: formatCurrency(debt), bold: true, className: 'text-red-600' },
    ];

    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Detail Transaksi Penjualan</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">{d.label}</span>
                        <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''} ${d.bold ? 'font-semibold' : ''} ${d.className || ''}`}>{d.value}</span>
                    </div>
                ))}
                <hr/>
                <div><span className="font-semibold text-gray-500">Detail Item</span><p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">{item.item}</p></div>
                <hr/>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500">Status Pembayaran</span>
                    <PaymentStatusBadge status={item.paymentStatus} />
                </div>
            </div>
            <div className="p-6 border-t text-right bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button>
            </div>
        </BaseModal>
    );
};

const DeleteConfirmationModal = ({ item, onConfirm, onCancel, loading }) => {
    const handleConfirmClick = async () => {
        if (loading) return;
        await onConfirm(item.id);
        onCancel();
    };

    return (
        <BaseModal isOpen={!!item} onClose={onCancel} maxWidth="max-w-md" loading={loading}>
            <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4"><AlertTriangle className="h-8 w-8 text-red-600" /></div>
                <h2 className="text-xl font-bold text-gray-800">Hapus Transaksi?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus transaksi <strong className="font-mono">{item?.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-8 space-x-4">
                    <button onClick={onCancel} disabled={loading} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Tidak, Batal</button>
                    <button onClick={handleConfirmClick} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
                                Menghapus...
                            </span>
                        ) : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};

const Notification = ({ message, type, onDismiss }) => {
    React.useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const isSuccess = type === 'success';
    return (
        <div className={`fixed top-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-blue-500'} animate-fade-in-down z-[100]`}>
            {isSuccess ? <PackageCheck size={20} className="mr-3"/> : <Info size={20} className="mr-3"/>}
            <span>{message}</span>
        </div>
    );
};


const SalesPage = () => {
    const initialSalesData = React.useMemo(() => [
        { id: 'TXN-S-7402', customer: 'Restoran Steak Enak', date: '2025-06-26', item: 'Daging Sirloin', total: 7500000, amountPaid: 7500000, type: 'Olahan', paymentStatus: 'Lunas' },
        { id: 'TXN-S-7400', customer: 'Hotel Bintang Lima', date: '2025-06-25', item: 'Daging Ribeye', total: 15000000, amountPaid: 10000000, type: 'Olahan', paymentStatus: 'Kurang Bayar' },
        { id: 'TXN-S-7399', customer: 'Catering Berkah', date: '2025-06-25', item: '1 Ekor Sapi Limousin', total: 32000000, amountPaid: 0, type: 'Hidup', paymentStatus: 'Hutang' },
        { id: 'TXN-S-7397', customer: 'Supermarket Segar', date: '2025-06-24', item: 'Karkas Sapi', total: 12500000, amountPaid: 12500000, type: 'Potong', paymentStatus: 'Lunas' },
        { id: 'TXN-S-7395', customer: 'Ibu Rumah Tangga', date: '2025-06-23', item: 'Iga Sapi', total: 2500000, amountPaid: 2500000, type: 'Olahan', paymentStatus: 'Lunas' },
        { id: 'TXN-S-7394', customer: 'Warung Sate Pak Budi', date: '2025-06-22', item: 'Daging Has Dalam', total: 4500000, amountPaid: 2000000, type: 'Olahan', paymentStatus: 'Kurang Bayar' },
    ], []);

    const { sales, addSale, updateSale, deleteSale, loading } = useSales(initialSalesData);
    const [modalState, setModalState] = React.useState({ view: null, edit: null, delete: null, add: false });
    const [openActionMenuId, setOpenActionMenuId] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState({ paymentStatus: 'Semua', type: 'Semua' });
    const [notification, setNotification] = React.useState(null);

    const filteredSales = React.useMemo(() => {
        return sales.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.paymentStatus === 'Semua' || item.paymentStatus === filters.paymentStatus;
            const typeMatch = filters.type === 'Semua' || item.type === filters.type;
            return searchMatch && statusMatch && typeMatch;
        });
    }, [sales, searchTerm, filters]);

    const currentSales = React.useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredSales.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredSales, currentPage, itemsPerPage]);
    
    const handleAction = React.useCallback((action, item) => {
        if (action === 'view') setModalState(s => ({ ...s, view: item }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: item }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: item }));
        if (action === 'print') setNotification({ type: 'info', message: `Mencetak kwitansi ${item.id}...` });
    }, []);

    const handleSave = React.useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updateSale(data);
            setNotification({ type: 'success', message: 'Transaksi berhasil diperbarui!' });
        } else {
            await addSale(data);
            setNotification({ type: 'success', message: 'Transaksi baru berhasil ditambahkan!' });
        }
    }, [addSale, updateSale]);

    const handleConfirmDelete = React.useCallback(async (id) => {
        await deleteSale(id);
        setNotification({ type: 'success', message: 'Transaksi berhasil dihapus.' });
    }, [deleteSale]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ paymentStatus: 'Semua', type: 'Semua' });
        setCurrentPage(1);
    };
    
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  return (
    <>
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Penjualan</h2>
                    <button onClick={() => setModalState(s => ({ ...s, add: true }))} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        <PlusCircle size={20} className="mr-2"/> Tambah Penjualan
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari ID, pelanggan, item..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full input-field pl-10"
                        />
                    </div>
                    <select value={filters.type} onChange={e => { setFilters(f => ({...f, type: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-48">
                        <option value="Semua">Semua Tipe</option>
                        <option>Hidup</option>
                        <option>Potong</option>
                        <option>Olahan</option>
                    </select>
                    <select value={filters.paymentStatus} onChange={e => { setFilters(f => ({...f, paymentStatus: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-56">
                        <option value="Semua">Semua Status Bayar</option>
                        <option>Lunas</option>
                        <option>Kurang Bayar</option>
                        <option>Hutang</option>
                    </select>
                     <button onClick={resetFilters} title="Reset Filter" className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                        <RotateCcw size={16} />
                    </button>
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 min-w-[200px] sticky left-0 z-20 bg-gray-50 border-r">Pelanggan</th>
                                <th className="px-6 py-3 min-w-[120px]">Tipe</th>
                                <th className="px-6 py-3 text-right min-w-[150px]">Harga Jual</th>
                                <th className="px-6 py-3 text-right min-w-[150px]">Dibayar</th>
                                <th className="px-6 py-3 text-right min-w-[150px]">Sisa</th>
                                <th className="px-6 py-3 text-center min-w-[150px]">Status Bayar</th>
                                <th className="px-6 py-3 text-center min-w-[100px] sticky right-0 z-20 bg-gray-50 border-l">Aksi</th>
                            </tr>
                        </thead>
                        {loading && currentSales.length === 0 ? (
                            <TableSkeletonLoader cols={7} rows={itemsPerPage} />
                        ) : currentSales.length > 0 ? (
                             <tbody>
                                {currentSales.map(item => {
                                    const debt = item.total - item.amountPaid;
                                    return (
                                    <tr key={item.id} className="border-b hover:bg-gray-50 group">
                                        <td className="px-6 py-4 sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r">
                                            <div className="font-semibold text-gray-800">{item.customer}</div>
                                            <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                                        </td>
                                        <td className="px-6 py-4">{item.type}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.total)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-green-600">{formatCurrency(item.amountPaid)}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${debt > 0 ? 'text-red-600' : 'text-gray-500'}`}>{formatCurrency(debt)}</td>
                                        <td className="px-6 py-4 text-center"><PaymentStatusBadge status={item.paymentStatus} /></td>
                                        <td className="px-6 py-4 text-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 border-l">
                                            <div className="relative flex justify-center">
                                                <button onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><MoreVertical size={18}/></button>
                                                {openActionMenuId === item.id && (
                                                    <ActionMenu item={item} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        ) : (
                            <tbody><tr><td colSpan="7"><EmptyState onClearFilters={resetFilters} /></td></tr></tbody>
                        )}
                    </table>
                </div>
                
                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                    {loading && currentSales.length === 0 ? (
                        [...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow border animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j}>
                                            <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : currentSales.length > 0 ? (
                        currentSales.map(item => {
                            const debt = item.total - item.amountPaid;
                            return (
                                <div key={item.id} className="bg-white p-4 rounded-lg shadow border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-gray-800">{item.customer}</div>
                                            <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                                        </div>
                                        <div className="relative">
                                            <button onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
                                                <MoreVertical size={18}/>
                                            </button>
                                            {openActionMenuId === item.id && (
                                                <ActionMenu item={item} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 text-sm">
                                        <span className="text-gray-500">Tipe:</span> {item.type}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <div className="text-xs text-gray-500">Total</div>
                                            <div className="font-semibold">{formatCurrency(item.total)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Dibayar</div>
                                            <div className="font-semibold text-green-600">{formatCurrency(item.amountPaid)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Sisa</div>
                                            <div className={`font-semibold ${debt > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                {formatCurrency(debt)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Status</div>
                                            <PaymentStatusBadge status={item.paymentStatus} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <EmptyState onClearFilters={resetFilters} />
                    )}
                </div>
                
                <Pagination 
                    totalItems={filteredSales.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage}
                />
            </div>
            
            {/* --- Modals --- */}
            <AddEditSalesModal 
                isOpen={modalState.add || !!modalState.edit}
                item={modalState.edit}
                onClose={() => setModalState({ view: null, edit: null, delete: null, add: false })}
                onSave={handleSave}
                loading={loading}
            />
            <SalesDetailModal 
                item={modalState.view} 
                onClose={() => setModalState(s => ({ ...s, view: null }))} 
            />
            <DeleteConfirmationModal 
                item={modalState.delete} 
                onCancel={() => setModalState(s => ({ ...s, delete: null }))} 
                onConfirm={handleConfirmDelete} 
                loading={loading}
            />
        </>
  );
};

export default SalesPage;
