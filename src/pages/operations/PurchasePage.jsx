import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import {
    PlusCircle,
    MoreVertical,
    RotateCcw,
    Search,
} from 'lucide-react';

// Import modular components
import { 
    PURCHASE_STATUSES, 
    ACTION_TYPES,
    NOTIFICATION_TYPES,
    CURRENCY_CONFIG
} from './purchase/constants';
import { usePurchases } from './purchase/hooks';
import { 
    PurchaseStatusBadge, 
    ActionMenu, 
    TableSkeletonLoader, 
    EmptyState, 
    Notification 
} from './purchase/components';
import { 
    AddEditPurchaseModal, 
    PurchaseDetailModal, 
    DeleteConfirmationModal 
} from './purchase/modals';

/**
 * PurchasePage - Main component for managing purchase transactions
 * Handles both table and grid views with responsive design
 */
const PurchasePage = () => {
    // ===== STATE MANAGEMENT =====
    const [isMobile, setIsMobile] = useState(false);
    const [modalState, setModalState] = useState({ 
        view: null, 
        edit: null, 
        delete: null, 
        add: false 
    });
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: PURCHASE_STATUSES.ALL });
    const [notification, setNotification] = useState(null);

    // ===== RESPONSIVE HANDLING =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== MOCK DATA =====
    const initialPurchasesData = useMemo(() => [
        { 
            id: 'TXN-P-8812', 
            supplier: 'Peternakan Maju Jaya', 
            date: '2025-06-25', 
            item: '5 Ekor Sapi Brahman', 
            total: 110000000, 
            status: PURCHASE_STATUSES.RECEIVED 
        },
        { 
            id: 'TXN-P-8811', 
            supplier: 'Supplier Pakan Ternak', 
            date: '2025-06-24', 
            item: 'Pakan Konsentrat 1 Ton', 
            total: 8500000, 
            status: PURCHASE_STATUSES.RECEIVED 
        },
        { 
            id: 'TXN-P-8810', 
            supplier: 'Peternakan Sumber Rejeki', 
            date: '2025-06-22', 
            item: '2 Ekor Sapi Limousin', 
            total: 45000000, 
            status: PURCHASE_STATUSES.ORDERED 
        },
        { 
            id: 'TXN-P-8809', 
            supplier: 'Distributor Obat Hewan Nasional', 
            date: '2025-06-21', 
            item: 'Vitamin Ternak', 
            total: 1500000, 
            status: PURCHASE_STATUSES.CANCELLED 
        },
        { 
            id: 'TXN-P-8808', 
            supplier: 'Peternakan Sejahtera', 
            date: '2025-06-20', 
            item: '10 Ekor Sapi Simental', 
            total: 220000000, 
            status: PURCHASE_STATUSES.RECEIVED 
        },
        { 
            id: 'TXN-P-8807', 
            supplier: 'CV Pakan Abadi', 
            date: '2025-06-19', 
            item: 'Dedak Padi 500kg', 
            total: 2500000, 
            status: PURCHASE_STATUSES.RECEIVED 
        },
    ], []);

    // ===== CUSTOM HOOKS =====
    const { purchases, addPurchase, updatePurchase, deletePurchase, loading, error } = usePurchases(initialPurchasesData);

    // ===== UTILITY FUNCTIONS =====
    const formatCurrency = (value) => new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, { 
        style: 'currency', 
        currency: CURRENCY_CONFIG.CURRENCY, 
        minimumFractionDigits: CURRENCY_CONFIG.MIN_FRACTION_DIGITS 
    }).format(value);

    // ===== DATA FILTERING =====
    const filteredPurchases = useMemo(() => {
        const filtered = purchases.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === PURCHASE_STATUSES.ALL || item.status === filters.status;
            return searchMatch && statusMatch;
        });
        
        // Reset to page 1 when filters change
        setCurrentPage(1);
        return filtered;
    }, [purchases, searchTerm, filters]);

    // ===== MOBILE CARD VIEW COMPONENT =====
    const CardView = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = filteredPurchases.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

        return (
            <>
                <div className="space-y-4">
                    {paginatedData.length === 0 ? (
                        <EmptyState onClearFilters={resetFilters} />
                    ) : (
                        paginatedData.map(item => (
                            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                                {/* Header dengan ID dan Status */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="font-mono font-medium text-red-600 text-sm">
                                            {item.id}
                                        </div>
                                        <div className="font-semibold text-gray-800 mt-1 pr-8">
                                            {item.supplier}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <PurchaseStatusBadge status={item.status} />
                                        <button 
                                            onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} 
                                            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                                            aria-label={`Menu aksi untuk ${item.id}`}
                                            aria-expanded={openActionMenuId === item.id}
                                            aria-haspopup="true"
                                        >
                                            <MoreVertical size={16}/>
                                        </button>
                                        {openActionMenuId === item.id && (
                                            <ActionMenu 
                                                item={item} 
                                                onClose={() => setOpenActionMenuId(null)} 
                                                onAction={handleAction} 
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Item:</span> {item.item}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-500">
                                            {new Date(item.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="font-semibold text-gray-800">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            Halaman {currentPage} dari {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // ===== EVENT HANDLERS =====
    const handleAction = useCallback((action, item) => {
        switch (action) {
            case ACTION_TYPES.VIEW:
                setModalState(s => ({ ...s, view: item }));
                break;
            case ACTION_TYPES.EDIT:
                setModalState(s => ({ ...s, edit: item }));
                break;
            case ACTION_TYPES.DELETE:
                setModalState(s => ({ ...s, delete: item }));
                break;
            default:
                break;
        }
    }, []);

    const handleSave = useCallback(async (data) => {
        const isEdit = !!data.id;
        
        try {
            if (isEdit) {
                await updatePurchase(data);
                setNotification({ 
                    type: NOTIFICATION_TYPES.SUCCESS, 
                    message: 'Transaksi berhasil diperbarui!' 
                });
            } else {
                await addPurchase(data);
                setNotification({ 
                    type: NOTIFICATION_TYPES.SUCCESS, 
                    message: 'Transaksi baru berhasil ditambahkan!' 
                });
            }
            setModalState({ view: null, edit: null, delete: null, add: false });
        } catch (error) {
            setNotification({ 
                type: NOTIFICATION_TYPES.ERROR, 
                message: 'Terjadi kesalahan saat menyimpan data.' 
            });
        }
    }, [addPurchase, updatePurchase]);

    const handleConfirmDelete = useCallback(async (id) => {
        try {
            await deletePurchase(id);
            setNotification({ 
                type: NOTIFICATION_TYPES.SUCCESS, 
                message: 'Transaksi berhasil dihapus.' 
            });
            setModalState(s => ({ ...s, delete: null }));
        } catch (error) {
            setNotification({ 
                type: NOTIFICATION_TYPES.ERROR, 
                message: 'Terjadi kesalahan saat menghapus data.' 
            });
        }
    }, [deletePurchase]);
    
    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({ status: PURCHASE_STATUSES.ALL });
        setCurrentPage(1);
    }, []);

    // ===== TABLE CONFIGURATION =====
    const columns = [
        { 
            name: 'ID Transaksi', 
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
            name: 'Pemasok', 
            selector: row => row.supplier, 
            sortable: true, 
            wrap: true 
        },
        { 
            name: 'Tanggal', 
            selector: row => row.date, 
            sortable: true 
        },
        { 
            name: 'Total', 
            selector: row => row.total, 
            sortable: true, 
            cell: row => (
                <span className="text-right">
                    {formatCurrency(row.total)}
                </span>
            ), 
            right: true 
        },
        { 
            name: 'Status', 
            selector: row => row.status, 
            sortable: true, 
            cell: row => <PurchaseStatusBadge status={row.status} />, 
            center: true 
        },
        { 
            name: 'Aksi', 
            button: true, 
            cell: (row) => (
                <div className="relative flex justify-center">                        <button 
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
                            item={row} 
                            onClose={() => setOpenActionMenuId(null)} 
                            onAction={handleAction} 
                        />
                    )}
                </div>
            ), 
            center: true, 
            width: '100px'
        },
    ];

    // ===== SEARCH AND FILTER HEADER =====
    const subHeaderComponent = (
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3 mb-4 w-full">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari ID, pemasok, item..."
                    value={searchTerm}
                    onChange={e => { 
                        setSearchTerm(e.target.value); 
                    }}
                    className="w-full input-field pl-10 text-sm sm:text-base"
                    aria-label="Pencarian transaksi pembelian"
                />
            </div>
            <select 
                value={filters.status} 
                onChange={e => { 
                    setFilters(f => ({...f, status: e.target.value})); 
                }} 
                className="input-field w-full md:w-56 text-sm sm:text-base"
                aria-label="Filter berdasarkan status"
            >
                <option value={PURCHASE_STATUSES.ALL}>Semua Status</option>
                <option value={PURCHASE_STATUSES.ORDERED}>Dipesan</option>
                <option value={PURCHASE_STATUSES.RECEIVED}>Diterima</option>
                <option value={PURCHASE_STATUSES.CANCELLED}>Dibatalkan</option>
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
                        Manajemen Pembelian
                    </h2>
                    
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        {/* Add Button */}
                        <button 
                            onClick={() => setModalState(s => ({ ...s, add: true }))} 
                            className="flex-grow sm:flex-grow-0 flex items-center justify-center bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm sm:text-base"
                        >
                            <PlusCircle size={20} className="mr-2"/> 
                            Tambah Pembelian
                        </button>
                    </div>
                </div>
                
                {/* Data Display */}
                <div className="border rounded-lg">
                    {isMobile ? (
                        <div className="p-4">
                            {/* Mobile Search and Filter */}
                            <div className="mb-4">
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cari ID, pemasok, item..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full input-field pl-10 text-sm"
                                            aria-label="Pencarian transaksi pembelian"
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <select 
                                            value={filters.status} 
                                            onChange={e => setFilters(f => ({...f, status: e.target.value}))} 
                                            className="flex-1 input-field text-sm"
                                            aria-label="Filter berdasarkan status"
                                        >
                                            <option value={PURCHASE_STATUSES.ALL}>Semua Status</option>
                                            <option value={PURCHASE_STATUSES.ORDERED}>Dipesan</option>
                                            <option value={PURCHASE_STATUSES.RECEIVED}>Diterima</option>
                                            <option value={PURCHASE_STATUSES.CANCELLED}>Dibatalkan</option>
                                        </select>
                                        <button 
                                            onClick={resetFilters} 
                                            title="Reset Filter" 
                                            className="p-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Loading State */}
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                <CardView />
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={columns}
                                data={filteredPurchases}
                                progressPending={loading}
                                progressComponent={<TableSkeletonLoader rows={5} cols={6} />}
                                noDataComponent={<EmptyState onClearFilters={resetFilters} />}
                                pagination
                                paginationPerPage={itemsPerPage}
                                paginationRowsPerPageOptions={[5, 10, 20]}
                                paginationTotalRows={filteredPurchases.length}
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
                        </div>
                    )}
                </div>
            </div>
            
            {/* ===== MODAL COMPONENTS ===== */}
            <AddEditPurchaseModal 
                isOpen={modalState.add || !!modalState.edit}
                item={modalState.edit}
                onClose={() => setModalState({ 
                    view: null, 
                    edit: null, 
                    delete: null, 
                    add: false 
                })}
                onSave={handleSave}
                loading={loading}
            />
            
            <PurchaseDetailModal 
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

export default PurchasePage;
