import React from 'react';
import { 
    PlusCircle, Eye, Edit, Trash2, X as CloseIcon, MoreVertical, AlertTriangle, 
    Home, ChevronLeft, ChevronRight, RotateCcw, Search, Info, PackageCheck,
    ShieldCheck, ShoppingCart
} from 'lucide-react';

// --- HOOKS (Logika Terpusat) ---

// Hook kustom untuk mengelola state dan logika data ternak.
const useLivestock = (initialLivestock = []) => {
    const [livestock, setLivestock] = React.useState(initialLivestock);
    const [loading, setLoading] = React.useState(false);

    const addLivestock = React.useCallback((newItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    ...newItemData,
                    // Membuat ID unik berdasarkan jenis dan angka acak
                    id: `${newItemData.breed.charAt(0).toUpperCase()}-${String(Math.floor(Math.random() * 900) + 100)}`,
                };
                setLivestock(prev => [newItem, ...prev]);
                setLoading(false);
                resolve(newItem);
            }, 500);
        });
    }, []);

    const updateLivestock = React.useCallback((updatedItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setLivestock(prev => prev.map(item => item.id === updatedItemData.id ? updatedItemData : item));
                setLoading(false);
                resolve(updatedItemData);
            }, 500);
        });
    }, []);

    const deleteLivestock = React.useCallback((livestockId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setLivestock(prev => prev.filter(item => item.id !== livestockId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { livestock, addLivestock, updateLivestock, deleteLivestock, loading };
};


// --- Komponen UI (Presentational) ---

const LivestockStatusBadge = ({ status }) => {
    const config = React.useMemo(() => {
        switch (status) {
            case 'Tersedia': return { C: 'bg-green-100 text-green-800', I: <PackageCheck size={12} /> };
            case 'Karantina': return { C: 'bg-yellow-100 text-yellow-800', I: <ShieldCheck size={12} /> };
            case 'Terjual': return { C: 'bg-purple-100 text-purple-800', I: <ShoppingCart size={12} /> };
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
        <h3 className="mt-4 text-lg font-semibold text-gray-800">Tidak Ada Data Ternak Ditemukan</h3>
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

const AddEditLivestockModal = ({ isOpen, onClose, item, onSave, loading }) => {
    const isEditMode = !!item;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode 
            ? { ...item } 
            : { kandang: 'Kandang A', breed: 'Limousin', age: '', weight: '', entryDate: new Date().toISOString().split('T')[0], status: 'Tersedia' };
        setFormData(initialData);
    }, [item, isOpen]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
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
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Data Ternak' : 'Tambah Data Ternak Baru'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    {isEditMode && <div><label className="block text-sm font-medium text-gray-700 mb-1">ID Ternak</label><input type="text" value={formData.id || ''} readOnly className="w-full input-field bg-gray-100 cursor-not-allowed"/></div>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Ternak</label><select name="breed" value={formData.breed || ''} onChange={handleChange} className="w-full input-field"><option>Limousin</option><option>Brahman</option><option>Simental</option><option>Angus</option><option>Peranakan Ongole</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Kandang</label><select name="kandang" value={formData.kandang || ''} onChange={handleChange} className="w-full input-field"><option>Kandang A</option><option>Kandang B</option><option>Kandang C (Karantina)</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Umur</label><input type="text" name="age" value={formData.age || ''} onChange={handleChange} placeholder="Contoh: 1.5 tahun" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Bobot (kg)</label><input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} step="1" placeholder="650" className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label><input type="date" name="entryDate" value={formData.entryDate || ''} onChange={handleChange} className="w-full input-field"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select name="status" value={formData.status || ''} onChange={handleChange} className="w-full input-field"><option>Tersedia</option><option>Karantina</option><option>Terjual</option></select></div>
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

const LivestockDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const details = [
        { label: 'ID Ternak', value: item.id, mono: true },
        { label: 'Lokasi Kandang', value: item.kandang },
        { label: 'Jenis', value: item.breed },
        { label: 'Umur', value: item.age },
        { label: 'Bobot', value: `${item.weight} kg` },
        { label: 'Tanggal Masuk', value: item.entryDate },
    ];
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Detail Stok Ternak</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">{d.label}</span>
                        <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''}`}>{d.value}</span>
                    </div>
                ))}
                <hr/>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500">Status</span>
                    <LivestockStatusBadge status={item.status} />
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Data Ternak?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus data ternak <strong className="font-mono">{item?.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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
const LivestockStockPage = () => {
    const initialLivestockData = React.useMemo(() => [
        { id: 'L-001', breed: 'Limousin', age: '2 tahun', weight: 750, entryDate: '2025-04-15', status: 'Tersedia', kandang: 'Kandang A' },
        { id: 'B-012', breed: 'Brahman', age: '1.5 tahun', weight: 600, entryDate: '2025-05-01', status: 'Tersedia', kandang: 'Kandang B' },
        { id: 'S-005', breed: 'Simental', age: '2.5 tahun', weight: 800, entryDate: '2025-03-20', status: 'Terjual', kandang: 'Kandang A' },
        { id: 'A-003', breed: 'Angus', age: '2 tahun', weight: 720, entryDate: '2025-05-10', status: 'Karantina', kandang: 'Kandang C (Karantina)' },
        { id: 'P-007', breed: 'Peranakan Ongole', age: '2.2 tahun', weight: 650, entryDate: '2025-05-20', status: 'Tersedia', kandang: 'Kandang B' },
        { id: 'L-008', breed: 'Limousin', age: '3 tahun', weight: 820, entryDate: '2025-05-21', status: 'Tersedia', kandang: 'Kandang A' },
    ], []);

    const { livestock, addLivestock, updateLivestock, deleteLivestock, loading } = useLivestock(initialLivestockData);
    const [modalState, setModalState] = React.useState({ view: null, edit: null, delete: null, add: false });
    const [openActionMenuId, setOpenActionMenuId] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState({ status: 'Semua', kandang: 'Semua' });
    const [notification, setNotification] = React.useState(null);

    const filteredLivestock = React.useMemo(() => {
        return livestock.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const statusMatch = filters.status === 'Semua' || item.status === filters.status;
            const kandangMatch = filters.kandang === 'Semua' || item.kandang === filters.kandang;
            return searchMatch && statusMatch && kandangMatch;
        });
    }, [livestock, searchTerm, filters]);

    const currentLivestock = React.useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredLivestock.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredLivestock, currentPage, itemsPerPage]);
    
    const handleAction = React.useCallback((action, item) => {
        if (action === 'view') setModalState(s => ({ ...s, view: item }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: item }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: item }));
    }, []);

    const handleSave = React.useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updateLivestock(data);
            setNotification({ type: 'success', message: 'Data ternak berhasil diperbarui!' });
        } else {
            await addLivestock(data);
            setNotification({ type: 'success', message: 'Ternak baru berhasil ditambahkan!' });
        }
    }, [addLivestock, updateLivestock]);

    const handleConfirmDelete = React.useCallback(async (id) => {
        await deleteLivestock(id);
        setNotification({ type: 'success', message: 'Data ternak berhasil dihapus.' });
    }, [deleteLivestock]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ status: 'Semua', kandang: 'Semua' });
        setCurrentPage(1);
    };

    return (
        <>
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Stok Ternak</h2>
                    <button onClick={() => setModalState(s => ({ ...s, add: true }))} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        <PlusCircle size={20} className="mr-2"/> Tambah Ternak
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari ID, jenis, kandang..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full input-field pl-10"
                        />
                    </div>
                    <select value={filters.kandang} onChange={e => { setFilters(f => ({...f, kandang: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-48">
                        <option value="Semua">Semua Kandang</option>
                        <option>Kandang A</option>
                        <option>Kandang B</option>
                        <option>Kandang C (Karantina)</option>
                    </select>
                    <select value={filters.status} onChange={e => { setFilters(f => ({...f, status: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-56">
                        <option value="Semua">Semua Status</option>
                        <option>Tersedia</option>
                        <option>Karantina</option>
                        <option>Terjual</option>
                    </select>
                     <button onClick={resetFilters} title="Reset Filter" className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                        <RotateCcw size={16} />
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 min-w-[120px] sticky left-0 z-20 bg-gray-50 border-r">ID Ternak</th>
                                <th className="px-6 py-3 min-w-[150px]">Jenis</th>
                                <th className="px-6 py-3 min-w-[180px]">Kandang</th>
                                <th className="px-6 py-3 text-right min-w-[120px]">Bobot (kg)</th>
                                <th className="px-6 py-3 text-center min-w-[150px]">Status</th>
                                <th className="px-6 py-3 text-center min-w-[100px] sticky right-0 z-20 bg-gray-50 border-l">Aksi</th>
                            </tr>
                        </thead>
                        {loading && currentLivestock.length === 0 ? (
                            <TableSkeletonLoader cols={6} rows={itemsPerPage} />
                        ) : currentLivestock.length > 0 ? (
                             <tbody>
                                {currentLivestock.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-mono font-medium text-red-600 sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r">{item.id}</td>
                                        <td className="px-6 py-4">{item.breed}</td>
                                        <td className="px-6 py-4">{item.kandang}</td>
                                        <td className="px-6 py-4 text-right">{item.weight}</td>
                                        <td className="px-6 py-4 text-center"><LivestockStatusBadge status={item.status} /></td>
                                        <td className="px-6 py-4 text-center sticky right-0 z-10 bg-white group-hover:bg-gray-50 border-l">
                                            <div className="relative flex justify-center">
                                                <button onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><MoreVertical size={18}/></button>
                                                {openActionMenuId === item.id && (
                                                    <ActionMenu item={item} onClose={() => setOpenActionMenuId(null)} onAction={handleAction} />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody><tr><td colSpan="6"><EmptyState onClearFilters={resetFilters} /></td></tr></tbody>
                        )}
                    </table>
                </div>
                
                <Pagination 
                    totalItems={filteredLivestock.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage}
                />
            </div>
            
            {/* --- Modals --- */}
            <AddEditLivestockModal 
                isOpen={modalState.add || !!modalState.edit}
                item={modalState.edit}
                onClose={() => setModalState({ view: null, edit: null, delete: null, add: false })}
                onSave={handleSave}
                loading={loading}
            />
            <LivestockDetailModal 
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

export default LivestockStockPage;
