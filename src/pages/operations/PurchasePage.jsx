import React from 'react';
import DataTable from 'react-data-table-component';
import {
    PlusCircle, Eye, Edit, Trash2, X as CloseIcon, MoreVertical, AlertTriangle,
    ChevronLeft, ChevronRight, RotateCcw, Search, Info, PackageCheck,
    ClipboardList, XCircle
} from 'lucide-react';

// --- HOOKS (Logika Terpusat) ---

// Hook kustom untuk mengelola state dan logika data pembelian.
const usePurchases = (initialPurchases = []) => {
    const [purchases, setPurchases] = React.useState(initialPurchases);
    const [loading, setLoading] = React.useState(false);

    const addPurchase = React.useCallback((newItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    // diperbaiki: Menghapus karakter "极好极好" dari spread operator
                    ...newItemData,
                    id: `TXN-P-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                };
                setPurchases(prev => [newItem, ...prev]);
                setLoading(false);
                resolve(newItem);
            }, 500);
        });
    }, []);

    const updatePurchase = React.useCallback((updatedItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setPurchases(prev => prev.map(item => item.id === updatedItemData.id ? updatedItemData : item));
                setLoading(false);
                resolve(updatedItemData);
            }, 500);
        });
    }, []);

    const deletePurchase = React.useCallback((purchaseId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setPurchases(prev => prev.filter(item => item.id !== purchaseId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { purchases, addPurchase, updatePurchase, deletePurchase, loading };
};

// --- Komponen UI (Presentational) ---

const PurchaseStatusBadge = ({ status }) => {
    const config = React.useMemo(() => {
        switch (status) {
            case 'Diterima': return { C: 'bg-green-100 text-green-800', I: <PackageCheck size={12} /> };
            case 'Dipesan': return { C: 'bg-blue-100 text-blue-800', I: <ClipboardList size={12} /> };
            // diperbaiki: Menghapus "极好极好" dari class name text-red-800
            case 'Dibatalkan': return { C: 'bg-red-100 text-red-800', I: <XCircle size={12} /> };
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

const AddEditPurchaseModal = ({ isOpen, onClose, item, onSave, loading }) => {
    const isEditMode = !!item;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode
            ? { ...item }
            : { supplier: '', item: '', total: '', date: new Date().toISOString().split('T')[0], status: 'Dipesan' };
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
            {/* diperbaiki: Mengubah "justify between" menjadi "justify-between" */}
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi Pembelian' : 'Tambah Transaksi Pembelian'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Pemasok</label><input type="text" name="supplier" value={formData.supplier || ''} onChange={handleChange} placeholder="Nama Pemasok" className="w-full input-field"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Item yang Dibeli</label><textarea name="item" value={formData.item || ''} onChange={handleChange} rows="2" placeholder="Contoh: 5 Ekor Sapi Brahman" className="w-full input-field"></textarea></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Biaya (Rp)</label><input type="number" name="total" value={formData.total || ''} onChange={handleChange} placeholder="110000000" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" value={formData.status || ''} onChange={handleChange} className="w-full input-field"><option>Dipesan</option><option>Diterima</option><option>Dibatalkan</option></select></div>
                </div>
                <div className="flex justify-end p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                    <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-40 text-center" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
                                Menyimpan...
                            </span>
                        ) : isEditMode ? 'Simpan' : 'Tambah'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

const PurchaseDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    const details = [
        { label: 'ID Transaksi', value: item.id, mono: true },
        { label: 'Pemasok', value: item.supplier },
        { label: 'Tanggal', value: item.date },
        { label: 'Total Biaya', value: formatCurrency(item.total), bold: true },
    ];
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Detail Transaksi Pembelian</h2>
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
                <div><span className="font-semibold text-gray-500">Item yang Dibeli</span><p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">{item.item}</p></div>
                <hr/>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500">Status</span>
                    <PurchaseStatusBadge status={item.status} />
                </div>
            </div>
            {/* diperbaiki: Menghapus "极好极好" dari class name rounded-b-2xl */}
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

// --- Komponen Utama Halaman ---
const PurchasePage = () => {
    const [viewMode, setViewMode] = React.useState('table'); // 'table' atau 'grid'
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // Default ke grid view jika beralih ke mobile
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

    const initialPurchasesData = React.useMemo(() => [
        { id: 'TXN-P-8812', supplier: 'Peternakan Maju Jaya', date: '2025-06-25', item: '5 Ekor Sapi Brahman', total: 110000000, status: 'Diterima' },
        { id: 'TXN-P-8811', supplier: 'Supplier Pakan Ternak', date: '2025-06-24', item: 'Pakan Konsentrat 1 Ton', total: 8500000, status: 'Diterima' },
        { id: 'TXN-P-8810', supplier: 'Peternakan Sumber Rejeki', date: '2025-06-22', item: '2 Ekor Sapi Limousin', total: 45000000, status: 'Dipesan' },
        { id: 'TXN-P-8809', supplier: 'Distributor Obat Hewan Nasional', date: '2025-06-21', item: 'Vitamin Ternak', total: 1500000, status: 'Dibatalkan' },
        { id: 'TXN-P-8808', supplier: 'Peternakan Sejahtera', date: '2025-06-20', item: '10 Ekor Sapi Simental', total: 220000000, status: 'Diterima' },
        // diperbaiki: Menghapus "极好极好" dari data
        { id: 'TXN-P-8807', supplier: 'CV Pakan Abadi', date: '2025-06-19', item: 'Dedak Padi 500kg', total: 2500000, status: 'Diterima' },
    ], []);

    const { purchases, addPurchase, updatePurchase, deletePurchase, loading } = usePurchases(initialPurchasesData);
    const [modalState, setModalState] = React.useState({ view: null, edit: null, delete: null, add: false });
    const [openActionMenuId, setOpenActionMenuId] = React.useState(null);

    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState({ status: 'Semua' });
    const [notification, setNotification] = React.useState(null);
    
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const filteredPurchases = React.useMemo(() => {
        return purchases.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === 'Semua' || item.status === filters.status;
            return searchMatch && statusMatch;
        });
    }, [purchases, searchTerm, filters]);

    // Komponen untuk tampilan grid (mobile)
    // Didefinisikan di dalam karena bergantung pada banyak state dan handler dari parent
    const GridView = () => (
        <div className="grid grid-cols-1 gap-4">
            {filteredPurchases.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-mono font-medium text-red-600">{item.id}</div>
                            <div className="font-semibold mt-1 pr-12">{item.supplier}</div>
                            <div className="text-sm text-gray-500">{item.date}</div>
                        </div>
                        <PurchaseStatusBadge status={item.status} />
                    </div>
                    
                    <div className="mt-3">
                        <div className="text-sm text-gray-700">{item.item}</div>
                        <div className="font-semibold mt-1 text-right">{formatCurrency(item.total)}</div>
                    </div>
                    
                    <div className="absolute top-2 right-2">
                         <button 
                            onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} 
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <MoreVertical size={18}/>
                        </button>
                        {openActionMenuId === item.id && (
                            <ActionMenu item={item} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const handleAction = React.useCallback((action, item) => {
        if (action === 'view') setModalState(s => ({ ...s, view: item }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: item }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: item }));
    }, []);

    const handleSave = React.useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updatePurchase(data);
            setNotification({ type: 'success', message: 'Transaksi berhasil diperbarui!' });
        } else {
            await addPurchase(data);
            setNotification({ type: 'success', message: 'Transaksi baru berhasil ditambahkan!' });
        }
    }, [addPurchase, updatePurchase]);

    const handleConfirmDelete = React.useCallback(async (id) => {
        await deletePurchase(id);
        setNotification({ type: 'success', message: 'Transaksi berhasil dihapus.' });
    }, [deletePurchase]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ status: 'Semua' });
        setCurrentPage(1);
    };

    const columns = [
        { name: 'ID Transaksi', selector: row => row.id, sortable: true, cell: row => <span className="font-mono font-medium text-red-600">{row.id}</span>, width: '150px' },
        { name: 'Pemasok', selector: row => row.supplier, sortable: true, wrap: true },
        { name: 'Tanggal', selector: row => row.date, sortable: true },
        { name: 'Total', selector: row => row.total, sortable: true, cell: row => <span className="text-right">{formatCurrency(row.total)}</span>, right: true },
        { name: 'Status', selector: row => row.status, sortable: true, cell: row => <PurchaseStatusBadge status={row.status} />, center: true },
        { name: 'Aksi', button: true, cell: (row) => (
            <div className="relative flex justify-center">
                <button onClick={() => setOpenActionMenuId(openActionMenuId === row.id ? null : row.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><MoreVertical size={18}/></button>
                {openActionMenuId === row.id && (
                    <ActionMenu item={row} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                )}
            </div>
        ), center: true, width: '100px'},
    ];

    const subHeaderComponent = (
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3 mb-4 w-full">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Cari ID, pemasok, item..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full input-field pl-10 text-sm sm:text-base"
                />
            </div>
            <select value={filters.status} onChange={e => { setFilters(f => ({...f, status: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-56 text-sm sm:text-base">
                <option value="Semua">Semua Status</option>
                <option>Dipesan</option>
                <option>Diterima</option>
                <option>Dibatalkan</option>
            </select>
            <button onClick={resetFilters} title="Reset Filter" className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                <RotateCcw size={16} />
            </button>
        </div>
    );

    return (
        <>
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mx-2 sm:mx-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Pembelian</h2>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        {!isMobile && (
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button onClick={() => setViewMode('table')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'table' ? 'bg-white shadow' : ''}`}>Tabel</button>
                                <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>Grid</button>
                            </div>
                        )}
                        <button onClick={() => setModalState(s => ({ ...s, add: true }))} className="flex-grow sm:flex-grow-0 flex items-center justify-center bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm sm:text-base">
                            <PlusCircle size={20} className="mr-2"/> Tambah Pembelian
                        </button>
                    </div>
                </div>
                
                {/* Logic tampilan Tabel vs Grid */}
                <div className="overflow-x-auto">
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
                            onChangePage={page => setCurrentPage(page)}
                            onChangeRowsPerPage={perPage => setItemsPerPage(perPage)}
                            subHeader
                            subHeaderComponent={subHeaderComponent}
                            responsive
                            customStyles={{
                                headCells: { style: { backgroundColor: '#f9fafb', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' } },
                                rows: { style: { minHeight: '60px' } }
                            }}
                        />
                    )}
                </div>
            </div>
            
            {/* --- Modals --- */}
            <AddEditPurchaseModal 
                isOpen={modalState.add || !!modalState.edit}
                item={modalState.edit}
                onClose={() => setModalState({ view: null, edit: null, delete: null, add: false })}
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