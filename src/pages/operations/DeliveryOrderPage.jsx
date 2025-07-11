import React from 'react';
// Impor DataTable
import DataTable from 'react-data-table-component';
import { 
    PlusCircle, Printer, Truck, PackageCheck, ShieldQuestion, ShieldCheck, 
    X as CloseIcon, MoreVertical, Eye, Edit, Trash2, AlertTriangle, 
    RotateCcw, Search, Info
} from 'lucide-react';
import BaseModal from '../../components/shared/modals/BaseModal';
import AddEditDeliveryOrderModal from './DeliveryOrderPage/modals/AddEditDeliveryOrderModal';
import DeliveryOrderDetailModal from './DeliveryOrderPage/modals/DeliveryOrderDetailModal';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';
import Notification from '../../components/shared/modals/Notification';


// --- HOOKS (Logika Terpusat) ---
const useDeliveryOrders = (initialOrders = []) => {
    const [orders, setOrders] = React.useState(initialOrders);
    const [loading, setLoading] = React.useState(false);

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

const ActionMenu = ({ order, onAction, onClose }) => {
    const menuRef = React.useRef(null);
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
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
    };

    const ActionMenuComponent = React.memo(({ row }) => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
            <div className="relative flex justify-center">
                <button onClick={() => setIsOpen(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                    <MoreVertical size={18} />
                </button>
                {isOpen && (
                    <ActionMenu 
                        order={row} 
                        onClose={() => setIsOpen(false)} 
                        onAction={handleAction} 
                    />
                )}
            </div>
        );
    });

    const columns = React.useMemo(() => [
        {
            name: 'ID Surat Jalan',
            selector: row => row.id,
            sortable: true,
            cell: row => <span className="font-medium text-red-600">{row.id}</span>
        },
        { name: 'Jenis', selector: row => row.type, sortable: true },
        { name: 'Asal', selector: row => row.origin, sortable: true },
        { name: 'Tujuan', selector: row => row.destination, sortable: true },
        { name: 'Tgl Kirim', selector: row => row.date, sortable: true },
        {
            name: 'Status',
            sortable: true,
            sortField: 'status',
            cell: row => <DeliveryStatusBadge status={row.status} />,
        },
        {
            name: 'Aksi',
            cell: row => <ActionMenuComponent row={row} />,
            ignoreRowClick: true
        },
    ], [handleAction]);

    const customStyles = {
        header: { style: { display: 'none' } },
        headRow: {
            style: {
                backgroundColor: '#F9FAFB',
                minHeight: '52px',
                borderBottomWidth: '1px',
            },
        },
        headCells: {
            style: {
                color: '#374151',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
            },
        },
        rows: {
            style: { minHeight: '60px' },
            highlightOnHoverStyle: { backgroundColor: '#F9FAFB' },
        },
        pagination: {
            style: {
                borderTopStyle: 'solid',
                borderTopWidth: '1px',
                borderTopColor: '#e5e7eb',
            },
        },
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
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full input-field pl-10"
                        />
                    </div>
                    <select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value}))} className="input-field w-full md:w-48">
                        <option value="Semua">Semua Jenis</option>
                        <option value="Penjualan">Penjualan</option>
                        <option value="Pembelian">Pembelian</option>
                        <option value="Antar Kandang">Antar Kandang</option>
                    </select>
                    <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="input-field w-full md:w-56">
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

                <div className="border rounded-lg overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        customStyles={customStyles}
                        pagination
                        progressPending={loading}
                        progressComponent={<div className="py-16">Memuat data...</div>}
                        noDataComponent={<EmptyState onClearFilters={resetFilters} />}
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => handleAction('view', row)}
                    />
                </div>
            </div>
            
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
