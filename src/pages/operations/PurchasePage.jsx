import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import {
    PlusCircle,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    RotateCcw,
    Search,
    Info,
    PackageCheck,
} from 'lucide-react';

// ===== PURCHASE COMPONENTS IMPORTS =====
import {
    AddEditPurchaseModal,
    PurchaseDetailModal,
    DeleteConfirmationModal,
    PurchaseStatusBadge
} from './purchase';

// ========================================================================================
// CUSTOM HOOKS
// ========================================================================================

/**
 * Custom hook for managing purchase data and operations
 * @param {Array} initialPurchases - Initial purchase data
 * @returns {Object} Purchase operations and state
 */
const usePurchases = (initialPurchases = []) => {
    const [purchases, setPurchases] = useState(initialPurchases);
    const [loading, setLoading] = useState(false);

    const addPurchase = useCallback((newItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    ...newItemData,
                    id: `TXN-P-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                };
                setPurchases(prev => [newItem, ...prev]);
                setLoading(false);
                resolve(newItem);
            }, 500);
        });
    }, []);

    const updatePurchase = useCallback((updatedItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setPurchases(prev => 
                    prev.map(item => 
                        item.id === updatedItemData.id ? updatedItemData : item
                    )
                );
                setLoading(false);
                resolve(updatedItemData);
            }, 500);
        });
    }, []);

    const deletePurchase = useCallback((purchaseId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setPurchases(prev => prev.filter(item => item.id !== purchaseId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { 
        purchases, 
        addPurchase, 
        updatePurchase, 
        deletePurchase, 
        loading 
    };
};

// ========================================================================================
// UI COMPONENTS
// ========================================================================================

const TableSkeletonLoader = ({ rows = 5, cols = 6 }) => (
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
        <Search size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Tidak Ada Transaksi Ditemukan
        </h3>
        <p className="text-sm text-gray-500 mb-6">
            Coba sesuaikan filter Anda atau reset untuk melihat semua data.
        </p>
        <button
            onClick={onClearFilters}
            className="flex items-center mx-auto bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
        >
            <RotateCcw size={14} className="mr-2" /> 
            Reset Filter
        </button>
    </div>
);

const ActionMenu = ({ item, onAction, onClose }) => {
    const menuRef = useRef(null);
    const [positionClass, setPositionClass] = useState('top-full mt-2');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (menuRef.current) {
                // Find the nearest scrollable container that might clip the menu
                let scrollParent = menuRef.current.parentElement;
                
                while (scrollParent) {
                    const style = window.getComputedStyle(scrollParent);
                    if (style.overflow !== 'visible' && style.overflow !== '') {
                        break;
                    }
                    if (scrollParent.tagName === 'BODY') {
                        scrollParent = null; 
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                const menuRect = menuRef.current.getBoundingClientRect();
                const containerRect = scrollParent 
                    ? scrollParent.getBoundingClientRect() 
                    : { top: 0, bottom: window.innerHeight };

                const isClippedBottom = menuRect.bottom > containerRect.bottom;
                
                if (isClippedBottom) {
                    setPositionClass('bottom-full mb-2');
                } else {
                    setPositionClass('top-full mt-2');
                }
            }
        }, 0);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const actions = [
        { 
            label: 'Lihat Detail', 
            icon: Eye, 
            action: 'view',
            className: 'text-gray-700'
        },
        { 
            label: 'Edit Data', 
            icon: Edit, 
            action: 'edit',
            className: 'text-gray-700'
        },
        { 
            label: 'Hapus Data', 
            icon: Trash2, 
            action: 'delete', 
            className: 'text-red-600' 
        },
    ];

    return (
        <div 
            ref={menuRef} 
            className={`absolute right-0 ${positionClass} w-48 bg-white rounded-md shadow-lg z-30 border animate-fade-in-up-sm`}
        >
            {actions.map(({ label, icon: Icon, action, className }) => (
                <button
                    key={action}
                    onClick={() => { 
                        onAction(action, item); 
                        onClose(); 
                    }}
                    className={`w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${className}`}
                >
                    <Icon size={14} className="mr-3" /> 
                    {label}
                </button>
            ))}
        </div>
    );
};

/**
 * Notification component for displaying temporary messages
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, info, etc.)
 * @param {function} onDismiss - Callback to dismiss notification
 */
const Notification = ({ message, type, onDismiss }) => {
    useEffect(() => {
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

// ===== MAIN COMPONENT =====

/**
 * PurchasePage - Main component for managing purchase transactions
 * Handles both table and grid views with responsive design
 */
const PurchasePage = () => {
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
    const [filters, setFilters] = useState({ status: 'Semua' });
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
    const initialPurchasesData = useMemo(() => [
        { 
            id: 'TXN-P-8812', 
            supplier: 'Peternakan Maju Jaya', 
            date: '2025-06-25', 
            item: '5 Ekor Sapi Brahman', 
            total: 110000000, 
            status: 'Diterima' 
        },
        { 
            id: 'TXN-P-8811', 
            supplier: 'Supplier Pakan Ternak', 
            date: '2025-06-24', 
            item: 'Pakan Konsentrat 1 Ton', 
            total: 8500000, 
            status: 'Diterima' 
        },
        { 
            id: 'TXN-P-8810', 
            supplier: 'Peternakan Sumber Rejeki', 
            date: '2025-06-22', 
            item: '2 Ekor Sapi Limousin', 
            total: 45000000, 
            status: 'Dipesan' 
        },
        { 
            id: 'TXN-P-8809', 
            supplier: 'Distributor Obat Hewan Nasional', 
            date: '2025-06-21', 
            item: 'Vitamin Ternak', 
            total: 1500000, 
            status: 'Dibatalkan' 
        },
        { 
            id: 'TXN-P-8808', 
            supplier: 'Peternakan Sejahtera', 
            date: '2025-06-20', 
            item: '10 Ekor Sapi Simental', 
            total: 220000000, 
            status: 'Diterima' 
        },
        { 
            id: 'TXN-P-8807', 
            supplier: 'CV Pakan Abadi', 
            date: '2025-06-19', 
            item: 'Dedak Padi 500kg', 
            total: 2500000, 
            status: 'Diterima' 
        },
    ], []);

    // ===== CUSTOM HOOKS =====
    const { purchases, addPurchase, updatePurchase, deletePurchase, loading } = usePurchases(initialPurchasesData);

    // ===== UTILITY FUNCTIONS =====
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(value);

    // ===== DATA FILTERING =====
    const filteredPurchases = useMemo(() => {
        return purchases.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === 'Semua' || item.status === filters.status;
            return searchMatch && statusMatch;
        });
    }, [purchases, searchTerm, filters]);

    // ===== MOBILE GRID VIEW COMPONENT =====
    const GridView = () => (
        <div className="grid grid-cols-1 gap-4">
            {filteredPurchases.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-mono font-medium text-red-600">
                                {item.id}
                            </div>
                            <div className="font-semibold mt-1 pr-12">
                                {item.supplier}
                            </div>
                            <div className="text-sm text-gray-500">
                                {item.date}
                            </div>
                        </div>
                        <PurchaseStatusBadge status={item.status} />
                    </div>
                    
                    <div className="mt-3">
                        <div className="text-sm text-gray-700">
                            {item.item}
                        </div>
                        <div className="font-semibold mt-1 text-right">
                            {formatCurrency(item.total)}
                        </div>
                    </div>
                    
                    <div className="absolute top-2 right-2">
                        <button 
                            onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} 
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <MoreVertical size={18}/>
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
            ))}
        </div>
    );

    // ===== EVENT HANDLERS =====
    const handleAction = useCallback((action, item) => {
        if (action === 'view') setModalState(s => ({ ...s, view: item }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: item }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: item }));
    }, []);

    const handleSave = useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updatePurchase(data);
            setNotification({ 
                type: 'success', 
                message: 'Transaksi berhasil diperbarui!' 
            });
        } else {
            await addPurchase(data);
            setNotification({ 
                type: 'success', 
                message: 'Transaksi baru berhasil ditambahkan!' 
            });
        }
    }, [addPurchase, updatePurchase]);

    const handleConfirmDelete = useCallback(async (id) => {
        await deletePurchase(id);
        setNotification({ 
            type: 'success', 
            message: 'Transaksi berhasil dihapus.' 
        });
    }, [deletePurchase]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ status: 'Semua' });
    };

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
                <div className="relative flex justify-center">
                    <button 
                        onClick={() => setOpenActionMenuId(openActionMenuId === row.id ? null : row.id)} 
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
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
                />
            </div>
            <select 
                value={filters.status} 
                onChange={e => { 
                    setFilters(f => ({...f, status: e.target.value})); 
                }} 
                className="input-field w-full md:w-56 text-sm sm:text-base"
            >
                <option value="Semua">Semua Status</option>
                <option>Dipesan</option>
                <option>Diterima</option>
                <option>Dibatalkan</option>
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

            {/* Main Content */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mx-2 sm:mx-0">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
                        Manajemen Pembelian
                    </h2>
                    
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        {/* View Mode Toggle (Desktop Only) */}
                        {!isMobile && (
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                    onClick={() => setViewMode('table')} 
                                    className={`px-3 py-1 rounded-md text-sm ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                                >
                                    Tabel
                                </button>
                                <button 
                                    onClick={() => setViewMode('grid')} 
                                    className={`px-3 py-1 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                                >
                                    Grid
                                </button>
                            </div>
                        )}

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
                <div className="overflow-x-auto border rounded-lg">
                    {viewMode === 'grid' && isMobile ? (
                        <GridView />
                    ) : (
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
