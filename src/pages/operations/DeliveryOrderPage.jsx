import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, MoreVertical, Search, RotateCcw } from 'lucide-react';

// Import modular components
import { 
    DELIVERY_TYPES, 
    DELIVERY_STATUSES, 
    ACTION_TYPES,
    NOTIFICATION_TYPES 
} from './delivery/constants';
import { useDeliveryOrders } from './delivery/hooks';
import { 
    DeliveryStatusBadge, 
    ActionMenu, 
    TableSkeletonLoader, 
    EmptyState, 
    Notification 
} from './delivery/components';
import { 
    AddEditDeliveryOrderModal, 
    DeliveryOrderDetailModal, 
    DeleteConfirmationModal 
} from './delivery/modals';

/**
 * DeliveryOrderPage - Main component for managing delivery orders
 * Handles both table and grid views with responsive design
 */
const DeliveryOrderPage = () => {
    // ===== STATE MANAGEMENT =====
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [isMobile, setIsMobile] = useState(false);
    const [modalState, setModalState] = useState({ 
        view: null, 
        edit: null, 
        delete: null, 
        add: false 
    });
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ 
        status: DELIVERY_STATUSES.ALL, 
        type: DELIVERY_TYPES.ALL 
    });
    const [notification, setNotification] = useState(null);

    // ===== RESPONSIVE HANDLING =====
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Default to grid view when switching to mobile
            if (mobile) {
                setViewMode('grid');
            } else {
                setViewMode('table');
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== MOCK DATA =====
    const initialDeliveryOrders = useMemo(() => [
        { 
            id: 'SJ-202507-001', 
            type: DELIVERY_TYPES.SALE, 
            origin: 'Gudang Pusat', 
            destination: 'Restoran Steak Enak', 
            date: '2025-07-01', 
            completionDate: '2025-07-02', 
            status: DELIVERY_STATUSES.COMPLETED, 
            items: '20kg Daging Sirloin, 15kg Ribeye' 
        },
        { 
            id: 'SJ-202507-002', 
            type: DELIVERY_TYPES.TRANSFER, 
            origin: 'Kandang A', 
            destination: 'Kandang C (Karantina)', 
            date: '2025-07-02', 
            completionDate: null, 
            status: DELIVERY_STATUSES.IN_TRANSIT, 
            items: '1 Ekor Sapi Angus (A-004)' 
        },
        { 
            id: 'SJ-202507-003', 
            type: DELIVERY_TYPES.PURCHASE, 
            origin: 'Peternakan Maju Jaya', 
            destination: 'Gudang Pusat', 
            date: '2025-07-02', 
            completionDate: null, 
            status: DELIVERY_STATUSES.APPROVED, 
            items: '5 Ekor Sapi Brahman' 
        },
        { 
            id: 'SJ-202507-004', 
            type: DELIVERY_TYPES.SALE, 
            origin: 'Gudang Pusat', 
            destination: 'Hotel Bintang Lima', 
            date: '2025-07-03', 
            completionDate: null, 
            status: DELIVERY_STATUSES.PENDING, 
            items: '50kg Daging Giling' 
        },
    ], []);

    // ===== CUSTOM HOOKS =====
    const { orders, addOrder, updateOrder, deleteOrder, loading, error } = useDeliveryOrders(initialDeliveryOrders);

    // ===== DATA FILTERING =====
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const searchMatch = searchTerm === '' || 
                Object.values(order).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === DELIVERY_STATUSES.ALL || order.status === filters.status;
            const typeMatch = filters.type === DELIVERY_TYPES.ALL || order.type === filters.type;
            
            return searchMatch && statusMatch && typeMatch;
        });
    }, [orders, searchTerm, filters]);

    // ===== EVENT HANDLERS =====
    const handleAction = useCallback((action, order) => {
        switch (action) {
            case ACTION_TYPES.VIEW:
                setModalState(s => ({ ...s, view: order }));
                break;
            case ACTION_TYPES.EDIT:
                setModalState(s => ({ ...s, edit: order }));
                break;
            case ACTION_TYPES.DELETE:
                setModalState(s => ({ ...s, delete: order }));
                break;
            case ACTION_TYPES.PRINT:
                setNotification({ 
                    type: NOTIFICATION_TYPES.INFO, 
                    message: `Mencetak surat jalan ${order.id}...` 
                });
                break;
            default:
                break;
        }
    }, []);

    // ===== MOBILE GRID VIEW COMPONENT =====
    const GridView = useMemo(() => (
        <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-mono font-medium text-red-600">
                                {order.id}
                            </div>
                            <div className="font-semibold mt-1 pr-12">
                                {order.type} - {order.origin} → {order.destination}
                            </div>
                            <div className="text-sm text-gray-500">
                                {order.date}
                            </div>
                        </div>
                        <DeliveryStatusBadge status={order.status} />
                    </div>
                    
                    <div className="mt-3">
                        <div className="text-sm text-gray-700">
                            {order.items}
                        </div>
                    </div>
                    
                    <div className="absolute top-2 right-2">
                        <button 
                            onClick={() => setOpenActionMenuId(openActionMenuId === order.id ? null : order.id)} 
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                            aria-label={`Menu aksi untuk ${order.id}`}
                            aria-expanded={openActionMenuId === order.id}
                            aria-haspopup="true"
                        >
                            <MoreVertical size={18}/>
                        </button>
                        {openActionMenuId === order.id && (
                            <ActionMenu 
                                order={order} 
                                onClose={() => setOpenActionMenuId(null)} 
                                onAction={handleAction} 
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    ), [filteredOrders, openActionMenuId, handleAction]);

    const handleSave = useCallback(async (data) => {
        const isEdit = !!data.id;
        
        try {
            if (isEdit) {
                await updateOrder(data);
                setNotification({ 
                    type: NOTIFICATION_TYPES.SUCCESS, 
                    message: 'Surat jalan berhasil diperbarui!' 
                });
            } else {
                await addOrder(data);
                setNotification({ 
                    type: NOTIFICATION_TYPES.SUCCESS, 
                    message: 'Surat jalan baru berhasil dibuat!' 
                });
            }
            setModalState({ view: null, edit: null, delete: null, add: false });
        } catch (error) {
            setNotification({ 
                type: NOTIFICATION_TYPES.ERROR, 
                message: 'Terjadi kesalahan saat menyimpan data.' 
            });
        }
    }, [addOrder, updateOrder]);

    const handleConfirmDelete = useCallback(async (id) => {
        try {
            await deleteOrder(id);
            setNotification({ 
                type: NOTIFICATION_TYPES.SUCCESS, 
                message: 'Surat jalan berhasil dihapus.' 
            });
            setModalState(s => ({ ...s, delete: null }));
        } catch (error) {
            setNotification({ 
                type: NOTIFICATION_TYPES.ERROR, 
                message: 'Terjadi kesalahan saat menghapus data.' 
            });
        }
    }, [deleteOrder]);
    
    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({ status: DELIVERY_STATUSES.ALL, type: DELIVERY_TYPES.ALL });
    }, []);

    // ===== TABLE CONFIGURATION =====
    const columns = useMemo(() => [
        {
            name: 'ID Surat Jalan',
            selector: row => row.id,
            sortable: true,
            cell: row => (
                <span className="font-mono font-medium text-red-600">
                    {row.id}
                </span>
            ),
            width: '150px'
        },
        { 
            name: 'Jenis', 
            selector: row => row.type, 
            sortable: true,
            wrap: true
        },
        { 
            name: 'Asal', 
            selector: row => row.origin, 
            sortable: true,
            wrap: true
        },
        { 
            name: 'Tujuan', 
            selector: row => row.destination, 
            sortable: true,
            wrap: true
        },
        { 
            name: 'Tgl Kirim', 
            selector: row => row.date, 
            sortable: true 
        },
        {
            name: 'Status',
            sortable: true,
            sortField: 'status',
            cell: row => <DeliveryStatusBadge status={row.status} />,
            center: true
        },
        {
            name: 'Aksi',
            button: true,
            cell: (row) => (
                <div className="relative flex justify-center">
                    <button 
                        onClick={() => setOpenActionMenuId(openActionMenuId === row.id ? null : row.id)} 
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                        aria-label={`Menu aksi untuk ${row.id}`}
                        aria-expanded={openActionMenuId === row.id}
                        aria-haspopup="true"
                    >
                        <MoreVertical size={18}/>
                    </button>
                    {openActionMenuId === row.id && (
                        <ActionMenu 
                            order={row} 
                            onClose={() => setOpenActionMenuId(null)} 
                            onAction={handleAction} 
                        />
                    )}
                </div>
            ),
            center: true,
            width: '100px'
        },
    ], [handleAction, openActionMenuId]);

    // ===== SEARCH AND FILTER HEADER =====
    const subHeaderComponent = (
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3 mb-4 w-full">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari ID, asal, tujuan, barang..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full input-field pl-10 text-sm sm:text-base"
                    aria-label="Pencarian surat jalan"
                />
            </div>
            <select 
                value={filters.type} 
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} 
                className="input-field w-full md:w-48 text-sm sm:text-base"
                aria-label="Filter berdasarkan jenis"
            >
                <option value={DELIVERY_TYPES.ALL}>Semua Jenis</option>
                <option value={DELIVERY_TYPES.SALE}>Penjualan</option>
                <option value={DELIVERY_TYPES.PURCHASE}>Pembelian</option>
                <option value={DELIVERY_TYPES.TRANSFER}>Antar Kandang</option>
            </select>
            <select 
                value={filters.status} 
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} 
                className="input-field w-full md:w-56 text-sm sm:text-base"
                aria-label="Filter berdasarkan status"
            >
                <option value={DELIVERY_STATUSES.ALL}>Semua Status</option>
                <option value={DELIVERY_STATUSES.PENDING}>Menunggu Persetujuan</option>
                <option value={DELIVERY_STATUSES.APPROVED}>Disetujui</option>
                <option value={DELIVERY_STATUSES.IN_TRANSIT}>Dalam Pengantaran</option>
                <option value={DELIVERY_STATUSES.COMPLETED}>Selesai</option>
            </select>
            <button 
                onClick={resetFilters} 
                title="Reset Filter" 
                className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
                <RotateCcw size={16} />
            </button>
        </div>
    );

    // ===== MAIN RENDER =====
    return (
        <>
            {/* Notification */}
            {notification && (
                <Notification 
                    {...notification} 
                    onDismiss={() => setNotification(null)} 
                />
            )}
            
            {/* Error Display */}
            {error && (
                <div className="fixed top-5 right-5 bg-red-500 text-white p-4 rounded-lg shadow-lg z-[100]" role="alert">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mx-2 sm:mx-0">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
                        Data Surat Jalan
                    </h2>
                    
                    {/* Add Button */}
                    <button 
                        onClick={() => setModalState(s => ({ ...s, add: true }))} 
                        className="w-full sm:w-auto flex items-center justify-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm sm:text-base"
                    >
                        <PlusCircle size={20} className="mr-2"/> 
                        Buat Surat Jalan
                    </button>
                </div>
                
                {/* Data Display */}
                <div className="overflow-x-auto border rounded-lg">
                    {viewMode === 'grid' && isMobile ? 
                        GridView : (
                        <DataTable
                            columns={columns}
                            data={filteredOrders}
                            progressPending={loading}
                            progressComponent={<TableSkeletonLoader rows={5} cols={7} />}
                            noDataComponent={<EmptyState onClearFilters={resetFilters} />}
                            pagination
                            paginationPerPage={itemsPerPage}
                            paginationRowsPerPageOptions={[5, 10, 20]}
                            paginationTotalRows={filteredOrders.length}
                            onChangeRowsPerPage={perPage => setItemsPerPage(perPage)}
                            subHeader
                            subHeaderComponent={subHeaderComponent}
                            responsive
                            customStyles={{
                                headCells: { 
                                    style: { 
                                        backgroundColor: '#f9fafb', 
                                        fontWeight: '600', 
                                        textTransform: 'uppercase', 
                                        fontSize: '0.75rem' 
                                    } 
                                },
                                rows: { 
                                    style: { 
                                        minHeight: '60px', 
                                        overflow: 'visible' 
                                    } 
                                },
                                cells: { 
                                    style: { 
                                        overflow: 'visible' 
                                    } 
                                }
                            }}
                        />
                    )}
                </div>
            </div>
            
            {/* ===== MODAL COMPONENTS ===== */}
            <AddEditDeliveryOrderModal 
                isOpen={modalState.add || !!modalState.edit}
                order={modalState.edit}
                onClose={() => setModalState({ 
                    view: null, 
                    edit: null, 
                    delete: null, 
                    add: false 
                })}
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
