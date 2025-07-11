import React from 'react';
import { 
    PlusCircle, Printer, Truck, PackageCheck, ShieldQuestion, ShieldCheck, 
    X as CloseIcon, MoreVertical, Eye, Edit, Trash2, AlertTriangle, 
    ChevronLeft, ChevronRight, RotateCcw, Search, Info
} from 'lucide-react';

// --- HOOKS (Logika Terpusat) ---

// Hook kustom untuk mengelola state dan logika data surat jalan.
const useDeliveryOrders = (initialOrders = []) => {
    const [orders, setOrders] = React.useState(initialOrders);
    const [loading, setLoading] = React.useState(false);

    // Fungsi untuk menambah order baru (simulasi API call)
    const addOrder = React.useCallback((newOrderData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newOrder = {
                    ...newOrderData,
                    id: `SJ-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
                    status: 'Menunggu Persetujuan',
                    completionDate: null,
                };
                setOrders(prev => [newOrder, ...prev]);
                setLoading(false);
                resolve(newOrder);
            }, 500);
        });
    }, []);

    // Fungsi untuk memperbarui order (simulasi API call)
    const updateOrder = React.useCallback((updatedOrderData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                let finalOrder = { ...updatedOrderData };
                if (finalOrder.status === 'Selesai' && !finalOrder.completionDate) {
                    finalOrder.completionDate = new Date().toISOString().split('T')[0];
                } else if (finalOrder.status !== 'Selesai') {
                    finalOrder.completionDate = null;
                }

                setOrders(prev => prev.map(o => o.id === finalOrder.id ? finalOrder : o));
                setLoading(false);
                resolve(finalOrder);
            }, 500);
        });
    }, []);

    // Fungsi untuk menghapus order (simulasi API call)
    const deleteOrder = React.useCallback((orderId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { orders, addOrder, updateOrder, deleteOrder, loading };
};


// --- Komponen UI (Presentational) ---

const DeliveryStatusBadge = ({ status }) => {
    const config = React.useMemo(() => {
        switch (status) {
            case 'Selesai': return { C: 'bg-green-100 text-green-800', I: <PackageCheck size={12} /> };
            case 'Dalam Pengantaran': return { C: 'bg-blue-100 text-blue-800', I: <Truck size={12} /> };
            case 'Disetujui': return { C: 'bg-cyan-100 text-cyan-800', I: <ShieldCheck size={12} /> };
            case 'Menunggu Persetujuan': return { C: 'bg-yellow-100 text-yellow-800', I: <ShieldQuestion size={12} /> };
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
        <h3 className="mt-4 text-lg font-semibold text-gray-800">Tidak Ada Hasil Ditemukan</h3>
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

const ActionMenu = ({ order, onAction, onClose }) => {
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
        { label: 'Edit Data', icon: Edit, action: 'edit' },
        { label: 'Hapus Data', icon: Trash2, action: 'delete', className: 'text-red-600' },
        { label: 'Cetak', icon: Printer, action: 'print' },
    ];

    return (
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-30 border animate-fade-in-up-sm">
            {actions.map(({ label, icon: Icon, action, className }) => (
                <button 
                    key={action}
                    onClick={() => { onAction(action, order); onClose(); }} 
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

const AddEditDeliveryOrderModal = ({ isOpen, onClose, order, onSave, loading }) => {
    const isEditMode = !!order;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode 
            ? { ...order } 
            : { type: 'Penjualan', date: new Date().toISOString().split('T')[0], origin: '', destination: '', items: '' };
        setFormData(initialData);
    }, [order, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; 
        await onSave(formData); 
        onClose(); 
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" loading={loading}>
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat Jalan</label><select name="type" value={formData.type || ''} onChange={handleChange} className="w-full input-field"><option>Penjualan</option><option>Pembelian</option><option>Antar Kandang</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full input-field"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Asal</label><input type="text" name="origin" value={formData.origin || ''} onChange={handleChange} placeholder="Kandang A / Pemasok" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label><input type="text" name="destination" value={formData.destination || ''} onChange={handleChange} placeholder="Kandang B / Pelanggan" className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Barang</label><textarea rows="3" name="items" value={formData.items || ''} onChange={handleChange} placeholder="Contoh: 5 Ekor Sapi Limousin..." className="w-full input-field"></textarea></div>
                    {isEditMode && (
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label><select name="status" value={formData.status || ''} onChange={handleChange} className="w-full input-field"><option>Menunggu Persetujuan</option><option>Disetujui</option><option>Dalam Pengantaran</option><option>Selesai</option></select></div>
                    )}
                </div>
                <div className="flex justify-end p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                    <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-44 text-center" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
                                Menyimpan...
                            </span>
                        ) : isEditMode ? 'Simpan Perubahan' : 'Buat Surat Jalan'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

const DeliveryOrderDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const details = [
        { label: 'ID Surat Jalan', value: item.id, mono: true },
        { label: 'Jenis', value: item.type },
        { label: 'Tanggal Kirim', value: item.date },
        { label: 'Tanggal Sampai', value: item.status === 'Selesai' && item.completionDate ? item.completionDate : '-', bold: true },
        { label: 'Asal', value: item.origin },
        { label: 'Tujuan', value: item.destination },
    ];
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Detail Surat Jalan</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">{d.label}</span>
                        <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''} ${d.bold ? 'font-semibold' : ''}`}>{d.value}</span>
                    </div>
                ))}
                <hr/>
                <div><span className="font-semibold text-gray-500">Detail Barang</span><p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">{item.items}</p></div>
                <hr/>
                <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><DeliveryStatusBadge status={item.status} /></div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Surat Jalan?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus surat jalan <strong className="font-mono">{item?.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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


// --- Komponen Utama Halaman ---
const DeliveryOrderPage = () => {
    const initialDeliveryOrders = React.useMemo(() => [
        { id: 'SJ-202507-001', type: 'Penjualan', origin: 'Gudang Pusat', destination: 'Restoran Steak Enak', date: '2025-07-01', completionDate: '2025-07-02', status: 'Selesai', items: '20kg Daging Sirloin, 15kg Ribeye' },
        { id: 'SJ-202507-002', type: 'Antar Kandang', origin: 'Kandang A', destination: 'Kandang C (Karantina)', date: '2025-07-02', completionDate: null, status: 'Dalam Pengantaran', items: '1 Ekor Sapi Angus (A-004)' },
        { id: 'SJ-202507-003', type: 'Pembelian', origin: 'Peternakan Maju Jaya', destination: 'Gudang Pusat', date: '2025-07-02', completionDate: null, status: 'Disetujui', items: '5 Ekor Sapi Brahman' },
        { id: 'SJ-202507-004', type: 'Penjualan', origin: 'Gudang Pusat', destination: 'Hotel Bintang Lima', date: '2025-07-03', completionDate: null, status: 'Menunggu Persetujuan', items: '50kg Daging Giling' },
    ], []);

    const { orders, addOrder, updateOrder, deleteOrder, loading } = useDeliveryOrders(initialDeliveryOrders);
    const [modalState, setModalState] = React.useState({ view: null, edit: null, delete: null, add: false });
    const [openActionMenuId, setOpenActionMenuId] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState({ status: 'Semua', type: 'Semua' });
    const [notification, setNotification] = React.useState(null);

    const filteredOrders = React.useMemo(() => {
        return orders.filter(order => {
            const searchMatch = searchTerm === '' || 
                Object.values(order).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === 'Semua' || order.status === filters.status;
            const typeMatch = filters.type === 'Semua' || order.type === filters.type;
            return searchMatch && statusMatch && typeMatch;
        });
    }, [orders, searchTerm, filters]);

    const currentOrders = React.useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredOrders, currentPage, itemsPerPage]);
    
    const handleAction = React.useCallback((action, order) => {
        if (action === 'view') setModalState(s => ({ ...s, view: order }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: order }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: order }));
        if (action === 'print') setNotification({ type: 'info', message: `Mencetak surat jalan ${order.id}...` });
    }, []);

    const handleSave = React.useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updateOrder(data);
            setNotification({ type: 'success', message: 'Data berhasil diperbarui!' });
        } else {
            await addOrder(data);
            setNotification({ type: 'success', message: 'Surat jalan baru berhasil dibuat!' });
        }
    }, [addOrder, updateOrder]);

    const handleConfirmDelete = React.useCallback(async (id) => {
        await deleteOrder(id);
        setNotification({ type: 'success', message: 'Data berhasil dihapus.' });
    }, [deleteOrder]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ status: 'Semua', type: 'Semua' });
        setCurrentPage(1);
    };

    return (
        <>
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Data Surat Jalan</h2>
                    <button onClick={() => setModalState(s => ({ ...s, add: true }))} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        <PlusCircle size={20} className="mr-2"/> Buat Surat Jalan
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari ID, asal, tujuan, barang..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full input-field pl-10"
                        />
                    </div>
                    <select value={filters.type} onChange={e => { setFilters(f => ({...f, type: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-48">
                        <option value="Semua">Semua Jenis</option>
                        <option value="Penjualan">Penjualan</option>
                        <option value="Pembelian">Pembelian</option>
                        <option value="Antar Kandang">Antar Kandang</option>
                    </select>
                    <select value={filters.status} onChange={e => { setFilters(f => ({...f, status: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-56">
                        <option value="Semua">Semua Status</option>
                        <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                        <option value="Disetujui">Disetujui</option>
                        <option value="Dalam Pengantaran">Dalam Pengantaran</option>
                        <option value="Selesai">Selesai</option>
                    </select>
                     <button onClick={resetFilters} title="Reset Filter" className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                        <RotateCcw size={16} />
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 min-w-[180px] sticky left-0 z-20 bg-gray-50 border-r">ID Surat Jalan</th>
                                <th className="px-6 py-3 min-w-[120px]">Jenis</th>
                                <th className="px-6 py-3 min-w-[150px]">Asal</th>
                                <th className="px-6 py-3 min-w-[150px]">Tujuan</th>
                                <th className="px-6 py-3 min-w-[120px]">Tgl Kirim</th>
                                <th className="px-6 py-3 text-center min-w-[180px]">Status</th>
                                <th className="px-6 py-3 text-center min-w-[100px] sticky right-0 z-20 bg-gray-50 border-l">Aksi</th>
                            </tr>
                        </thead>
                        {loading && currentOrders.length === 0 ? (
                            <TableSkeletonLoader cols={7} rows={itemsPerPage} />
                        ) : currentOrders.length > 0 ? (
                             <tbody>
                                {currentOrders.map(order => (
                                    <tr key={order.id} className="border-b hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-medium text-red-600 sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r">{order.id}</td>
                                        <td className="px-6 py-4">{order.type}</td>
                                        <td className="px-6 py-4">{order.origin}</td>
                                        <td className="px-6 py-4">{order.destination}</td>
                                        <td className="px-6 py-4">{order.date}</td>
                                        <td className="px-6 py-4 text-center"><DeliveryStatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 text-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 border-l">
                                            <div className="relative flex justify-center">
                                                <button onClick={() => setOpenActionMenuId(openActionMenuId === order.id ? null : order.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><MoreVertical size={18}/></button>
                                                {openActionMenuId === order.id && (
                                                    <ActionMenu order={order} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody><tr><td colSpan="7"><EmptyState onClearFilters={resetFilters} /></td></tr></tbody>
                        )}
                    </table>
                </div>
                
                <Pagination 
                    totalItems={filteredOrders.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage}
                />
            </div>
            
            {/* --- Modals --- */}
            <AddEditDeliveryOrderModal 
                isOpen={modalState.add || !!modalState.edit}
                order={modalState.edit}
                onClose={() => setModalState({ view: null, edit: null, delete: null, add: false })}
                onSave={handleSave}
                loading={loading}
            />
            <DeliveryOrderDetailModal 
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

export default DeliveryOrderPage;
