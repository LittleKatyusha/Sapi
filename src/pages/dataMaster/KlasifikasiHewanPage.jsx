import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Edit, Trash2, X, MoreVertical } from 'lucide-react';

// --- DATA & LOGIC HOOK ---
const useClassifications = (initialData = []) => {
    const [classifications, setClassifications] = useState(initialData);
    const [loading, setLoading] = useState(false);

    const simulateApiCall = (action) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                action();
                setLoading(false);
                resolve();
            }, 500);
        });
    };

    const addClassification = useCallback(async (newItemData) => {
        await simulateApiCall(() => {
            const newItem = {
                ...newItemData,
                id: `KL-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            };
            setClassifications(prev => [newItem, ...prev]);
        });
    }, []);

    const updateClassification = useCallback(async (updatedItemData) => {
        await simulateApiCall(() => {
            setClassifications(prev => 
                prev.map(item => item.id === updatedItemData.id ? updatedItemData : item)
            );
        });
    }, []);

    const deleteClassification = useCallback(async (itemId) => {
        await simulateApiCall(() => {
            setClassifications(prev => prev.filter(item => item.id !== itemId));
        });
    }, []);

    return { classifications, loading, addClassification, updateClassification, deleteClassification };
};


// --- UI COMPONENTS ---

const ActionMenu = ({ row, onEdit, onDelete, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute right-0 top-full mt-2 w-40 bg-white rounded-md shadow-lg z-20 border">
            <button onClick={() => { onEdit(row); onClose(); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Edit size={14} className="mr-3" /> Edit
            </button>
            <button onClick={() => { onDelete(row); onClose(); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                <Trash2 size={14} className="mr-3" /> Hapus
            </button>
        </div>
    );
};

const AddEditModal = ({ item, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState(
        item || { name: '', jenis: 'Sapi', description: '' }
    );
    const isEditMode = !!item;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Klasifikasi' : 'Tambah Klasifikasi Baru'}</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Klasifikasi</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field w-full" placeholder="Contoh: Sapi Limousin" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Hewan</label>
                            <select name="jenis" value={formData.jenis} onChange={handleChange} className="input-field w-full">
                                <option>Sapi</option> <option>Domba</option> <option>Kambing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="input-field w-full" placeholder="Deskripsi singkat..."/>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-xl">
                        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                        <button type="submit" disabled={loading} className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center">
                            {loading ? 'Menyimpan...' : (isEditMode ? 'Simpan' : 'Tambah')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Komponen Card untuk tampilan mobile
const CardView = ({ data, onEdit, onDelete, openMenuId, setOpenMenuId }) => (
    <div className="space-y-4">
        {data.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{item.id}</p>
                    </div>
                    <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                            <MoreVertical size={18} />
                        </button>
                        {openMenuId === item.id && (
                            <ActionMenu row={item} onEdit={onEdit} onDelete={onDelete} onClose={() => setOpenMenuId(null)} />
                        )}
                    </div>
                </div>
                <div className="mt-2 text-sm">
                    <p><span className="font-medium text-gray-600">Jenis:</span> {item.jenis}</p>
                    <p className="mt-1 text-gray-700">{item.description}</p>
                </div>
            </div>
        ))}
    </div>
);


// --- MAIN PAGE COMPONENT ---
const KlasifikasiHewanPage = () => {
    const initialData = useMemo(() => [
        { id: 'KL-001', name: 'Sapi Brahman', jenis: 'Sapi', description: 'Jenis sapi potong hasil persilangan.' },
        { id: 'KL-002', name: 'Sapi Limousin', jenis: 'Sapi', description: 'Sapi potong dengan warna bulu emas-merah.' },
        { id: 'KL-003', name: 'Domba Garut', jenis: 'Domba', description: 'Domba aduan dan pedaging asli Garut.' },
    ], []);

    const { classifications, loading, addClassification, updateClassification, deleteClassification } = useClassifications(initialData);
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, item: null });
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredData = useMemo(() => 
        classifications.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        ), [classifications, searchTerm]
    );

    const handleSave = useCallback(async (formData) => {
        if (formData.id) {
            await updateClassification(formData);
        } else {
            await addClassification(formData);
        }
        setModalState({ isOpen: false, item: null });
    }, [addClassification, updateClassification]);

    const handleDelete = useCallback(async (item) => {
        if (window.confirm(`Yakin ingin menghapus "${item.name}"?`)) {
            await deleteClassification(item.id);
        }
    }, [deleteClassification]);

    const columns = useMemo(() => [
        { name: 'ID', selector: row => row.id, sortable: true, width: '120px', cell: row => <span className="font-mono">{row.id}</span> },
        { name: 'Nama Klasifikasi', selector: row => row.name, sortable: true, style: { fontWeight: 600 } },
        { name: 'Jenis Hewan', selector: row => row.jenis, sortable: true },
        { name: 'Deskripsi', selector: row => row.description, grow: 2, wrap: true },
        {
            name: 'Aksi',
            cell: (row) => (
                <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" aria-label="Aksi">
                        <MoreVertical size={18} />
                    </button>
                    {openMenuId === row.id && (
                        <ActionMenu row={row} onEdit={() => setModalState({ isOpen: true, item: row })} onDelete={handleDelete} onClose={() => setOpenMenuId(null)} />
                    )}
                </div>
            ),
            ignoreRowClick: true, allowOverflow: true, button: true, center: true,
        },
    ], [handleDelete, openMenuId]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Klasifikasi Hewan</h2>
                <button onClick={() => setModalState({ isOpen: true, item: null })} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto justify-center">
                    <PlusCircle size={20} className="mr-2" />
                    <span>Tambah Klasifikasi</span>
                </button>
            </div>

            <div className="mb-4">
                <div className="w-full max-w-xs">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full input-field pl-10" />
                    </div>
                </div>
            </div>

            {isMobile ? (
                <CardView data={filteredData} onEdit={(item) => setModalState({ isOpen: true, item })} onDelete={handleDelete} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    progressPending={loading}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50]}
                    customStyles={{ headCells: { style: { backgroundColor: '#f9fafb', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}}}
                    noDataComponent={<div className="py-10 text-center text-gray-500">Tidak ada data untuk ditampilkan.</div>}
                />
            )}

            {modalState.isOpen && (
                <AddEditModal item={modalState.item} onClose={() => setModalState({ isOpen: false, item: null })} onSave={handleSave} loading={loading} />
            )}
        </div>
    );
};

export default KlasifikasiHewanPage;
