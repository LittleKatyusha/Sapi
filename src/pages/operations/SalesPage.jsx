import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Edit, Trash2, X, MoreVertical, Eye, Printer, PackageCheck, CreditCard, AlertCircle, AlertTriangle } from 'lucide-react';

// --- UTILITY FUNCTION ---
const getPaymentStatus = (total, amountPaid) => {
    if (amountPaid >= total) return 'Lunas';
    if (amountPaid > 0 && amountPaid < total) return 'Kurang Bayar';
    return 'Hutang';
};

// --- DATA & LOGIC HOOK ---
const useSales = (initialData = []) => {
    const [sales, setSales] = useState(() => 
        initialData.map(sale => ({
            ...sale,
            paymentStatus: getPaymentStatus(sale.total, sale.amountPaid)
        }))
    );
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

    const addSale = useCallback(async (newItemData) => {
        await simulateApiCall(() => {
            const newItem = {
                ...newItemData,
                id: `TXN-S-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                paymentStatus: getPaymentStatus(newItemData.total, newItemData.amountPaid),
            };
            setSales(prev => [newItem, ...prev]);
        });
    }, []);

    const updateSale = useCallback(async (updatedItemData) => {
        await simulateApiCall(() => {
            const updatedItem = {
                ...updatedItemData,
                paymentStatus: getPaymentStatus(updatedItemData.total, updatedItemData.amountPaid),
            };
            setSales(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        });
    }, []);

    const deleteSale = useCallback(async (itemId) => {
        await simulateApiCall(() => {
            setSales(prev => prev.filter(item => item.id !== itemId));
        });
    }, []);

    return { sales, loading, addSale, updateSale, deleteSale };
};


// --- UI COMPONENTS ---

const PaymentStatusBadge = ({ status }) => {
    const config = useMemo(() => {
        switch (status) {
            case 'Lunas': return { C: 'bg-green-100 text-green-800', I: PackageCheck };
            case 'Kurang Bayar': return { C: 'bg-yellow-100 text-yellow-800', I: AlertCircle };
            case 'Hutang': return { C: 'bg-red-100 text-red-800', I: CreditCard };
            default: return { C: 'bg-gray-100 text-gray-800', I: null };
        }
    }, [status]);

    return (
        <span className={`flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.C}`}>
            {config.I && <config.I size={12} className="mr-1.5" />}
            {status}
        </span>
    );
};

const ActionMenu = ({ row, onAction, onClose }) => {
    const menuRef = useRef(null);
    // Inisialisasi dengan posisi default, useEffect akan memperbaikinya jika perlu.
    const [positionClass, setPositionClass] = useState('top-full mt-2');

    useEffect(() => {
        // Kita gunakan timeout singkat untuk memastikan menu telah dirender dan diposisikan
        // oleh browser, sehingga kita bisa mendapatkan dimensi dan lokasinya yang benar.
        const timer = setTimeout(() => {
            if (menuRef.current) {
                // Cari container terdekat yang dapat di-scroll yang mungkin memotong menu.
                // Ini lebih baik daripada hanya memeriksa terhadap window, terutama untuk tabel di dalam div yang bisa di-scroll.
                let scrollParent = menuRef.current.parentElement;
                while (scrollParent) {
                    const style = window.getComputedStyle(scrollParent);
                    // Periksa semua jenis overflow yang akan menyebabkan pemotongan
                    if (style.overflow !== 'visible' && style.overflow !== '') {
                        break; // Menemukan container yang memotong
                    }
                    // Berhenti jika kita mencapai bagian atas dokumen
                    if (scrollParent.tagName === 'BODY') {
                        scrollParent = null; 
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                const menuRect = menuRef.current.getBoundingClientRect();
                
                // Jika container yang memotong ditemukan, gunakan batasannya. Jika tidak, gunakan batasan window.
                const containerRect = scrollParent 
                    ? scrollParent.getBoundingClientRect() 
                    : { top: 0, bottom: window.innerHeight };

                // Periksa apakah bagian bawah menu melewati bagian bawah containernya.
                const isClippedBottom = menuRect.bottom > containerRect.bottom;
                
                if (isClippedBottom) {
                    // Jika terpotong di bagian bawah, balikkan agar terbuka ke atas.
                    // 'bottom-full' menempatkan bagian bawah menu di bagian atas dari parent relatifnya.
                    setPositionClass('bottom-full mb-2');
                } else {
                    // Jika tidak, gunakan posisi default ke bawah.
                    setPositionClass('top-full mt-2');
                }
            }
        }, 0);

        // Bagian ini menangani penutupan menu jika pengguna mengklik di tempat lain di halaman.
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        
        // Fungsi cleanup untuk menghapus event listener dan timeout saat komponen di-unmount.
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]); // Jalankan kembali efek ini jika callback onClose berubah.

    const actions = [
        { label: 'Lihat Detail', icon: Eye, action: 'view' },
        { label: 'Cetak Kwitansi', icon: Printer, action: 'print' },
        { label: 'Edit Data', icon: Edit, action: 'edit' },
        { label: 'Hapus Data', icon: Trash2, action: 'delete', className: 'text-red-600' },
    ];

    return (
        <div ref={menuRef} className={`absolute right-0 ${positionClass} w-48 bg-white rounded-md shadow-lg z-30 border`}>
            {actions.map(({ label, icon: Icon, action, className }) => (
                <button key={action} onClick={() => { onAction(action, row); onClose(); }} className={`w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className || ''}`}>
                    <Icon size={14} className="mr-3" /> {label}
                </button>
            ))}
        </div>
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
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Detail Transaksi Penjualan</h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-600" /></button>
                </div>
                <div className="p-6 space-y-4 text-sm">
                    {details.map(d => (
                        <div key={d.label} className="flex justify-between items-center">
                            <span className="font-semibold text-gray-500">{d.label}</span>
                            <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''} ${d.bold ? 'font-bold' : ''} ${d.className || ''}`}>{d.value}</span>
                        </div>
                    ))}
                    <hr/>
                    <div>
                        <span className="font-semibold text-gray-500">Detail Item</span>
                        <p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">{item.item}</p>
                    </div>
                    <hr/>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">Status Pembayaran</span>
                        <PaymentStatusBadge status={item.paymentStatus} />
                    </div>
                </div>
                <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">Tutup</button>
                </div>
            </div>
        </div>
    );
};

const AddEditModal = ({ item, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState(
        item || { customer: '', date: new Date().toISOString().split('T')[0], type: 'Olahan', item: '', total: '', amountPaid: '' }
    );
    const isEditMode = !!item;

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || '' : value }));
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
                        <h3 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-600" /></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan</label><input type="text" name="customer" value={formData.customer || ''} onChange={handleChange} placeholder="Nama Pelanggan" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full input-field"/></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipe Penjualan</label><select name="type" value={formData.type || ''} onChange={handleChange} className="w-full input-field"><option>Hidup</option><option>Potong</option><option>Olahan</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Item</label><textarea name="item" value={formData.item || ''} onChange={handleChange} rows="2" placeholder="Contoh: 1 Ekor Sapi Limousin..." className="w-full input-field"></textarea></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Harga (Rp)</label><input type="number" name="total" value={formData.total || ''} onChange={handleChange} placeholder="32000000" className="w-full input-field"/></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dibayar (Rp)</label><input type="number" name="amountPaid" value={formData.amountPaid || ''} onChange={handleChange} placeholder="0" className="w-full input-field"/></div>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 border-t rounded-b-xl">
                        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                        <button type="submit" disabled={loading} className="px-5 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ item, onConfirm, onCancel, loading }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Hapus Transaksi?</h3>
                <p className="text-gray-600 mt-2">Anda yakin ingin menghapus transaksi <strong className="font-mono">{item.id}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center mt-8 space-x-4">
                    <button onClick={onCancel} disabled={loading} className="px-8 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Tidak, Batal</button>
                    <button onClick={onConfirm} disabled={loading} className="px-8 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center">
                        {loading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CardView = ({ data, onAction, openMenuId, setOpenMenuId }) => {
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    
    return (
        <div className="space-y-4">
            {data.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-semibold text-gray-800">{item.customer}</p>
                            <p className="text-sm text-gray-500 font-mono">{item.id}</p>
                        </div>
                        <div className="relative">
                            <button onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)} className="p-2 -mr-2 -mt-2 text-gray-500 hover:bg-gray-200 rounded-full">
                                <MoreVertical size={18} />
                            </button>
                            {openMenuId === item.id && (
                                <ActionMenu row={item} onAction={onAction} onClose={() => setOpenMenuId(null)} />
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Tipe:</span> {item.type}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                        <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-semibold text-gray-800">{formatCurrency(item.total)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Dibayar</p>
                            <p className="font-semibold text-green-600">{formatCurrency(item.amountPaid)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Sisa</p>
                            <p className="font-semibold text-red-600">{formatCurrency(item.total - item.amountPaid)}</p>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-center items-center">
                        <PaymentStatusBadge status={item.paymentStatus} />
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
const SalesPage = () => {
    const initialData = useMemo(() => [
        { id: 'TXN-S-7402', customer: 'Restoran Steak Enak', date: '2025-06-26', item: 'Daging Sirloin', total: 7500000, amountPaid: 7500000, type: 'Olahan' },
        { id: 'TXN-S-7400', customer: 'Hotel Bintang Lima', date: '2025-06-25', item: 'Daging Ribeye', total: 15000000, amountPaid: 10000000, type: 'Olahan' },
        { id: 'TXN-S-7399', customer: 'Catering Berkah', date: '2025-06-25', item: '1 Ekor Sapi Limousin', total: 32000000, amountPaid: 0, type: 'Hidup' },
        { id: 'TXN-S-7398', customer: 'Pelanggan Retail 1', date: '2025-06-24', item: 'Daging Cincang 5kg', total: 750000, amountPaid: 750000, type: 'Olahan' },
        { id: 'TXN-S-7397', customer: 'Pelanggan Retail 2', date: '2025-06-23', item: 'Tulang Iga 2kg', total: 300000, amountPaid: 300000, type: 'Olahan' },
        { id: 'TXN-S-7396', customer: 'Acara Qurban', date: '2025-06-22', item: '1 Ekor Sapi Brahman', total: 25000000, amountPaid: 15000000, type: 'Hidup' },
    ], []);

    const { sales, loading, addSale, updateSale, deleteSale } = useSales(initialData);
    
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ paymentStatus: 'Semua', type: 'Semua' });
    const [modalState, setModalState] = useState({ type: null, item: null });
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const filteredData = useMemo(() => 
        sales.filter(item =>
            (item.customer.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filters.paymentStatus === 'Semua' || item.paymentStatus === filters.paymentStatus) &&
            (filters.type === 'Semua' || item.type === filters.type)
        ), [sales, searchTerm, filters]
    );

    const handleAction = useCallback((action, item) => {
        setModalState({ type: action, item });
    }, []);

    const handleSave = useCallback(async (formData) => {
        if (formData.id) {
            await updateSale(formData);
        } else {
            await addSale(formData);
        }
        setModalState({ type: null, item: null });
    }, [addSale, updateSale]);
    
    const handleConfirmDelete = useCallback(async () => {
        if(modalState.item) {
            await deleteSale(modalState.item.id);
            setModalState({ type: null, item: null });
        }
    }, [deleteSale, modalState.item]);

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    const columns = useMemo(() => [
        { name: 'Pelanggan', selector: row => row.customer, sortable: true, grow: 2, cell: row => <div><p className="font-semibold">{row.customer}</p><p className="text-xs text-gray-500 font-mono">{row.id}</p></div> },
        { name: 'Tipe', selector: row => row.type, sortable: true },
        { name: 'Total Harga', selector: row => row.total, sortable: true, right: true, cell: row => formatCurrency(row.total) },
        { name: 'Dibayar', selector: row => row.amountPaid, sortable: true, right: true, cell: row => formatCurrency(row.amountPaid) },
        { name: 'Sisa', selector: row => row.total - row.amountPaid, sortable: true, right: true, cell: row => formatCurrency(row.total - row.amountPaid) },
        { name: 'Status Bayar', selector: row => row.paymentStatus, sortable: true, center: true, cell: row => <PaymentStatusBadge status={row.paymentStatus} /> },
        {
            name: 'Aksi',
            cell: (row) => (
                <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" aria-label="Aksi">
                        <MoreVertical size={18} />
                    </button>
                    {openMenuId === row.id && (
                        <ActionMenu row={row} onAction={handleAction} onClose={() => setOpenMenuId(null)} />
                    )}
                </div>
            ),
            ignoreRowClick: true, allowOverflow: true, button: true, center: true,
        },
    ], [handleAction, openMenuId]);

    const customTableStyles = {
        headCells: {
            style: {
                backgroundColor: '#f9fafb',
                fontWeight: '600',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
            },
        },
        rows: {
            style: {
                // Pastikan overflow terlihat agar menu aksi tidak terpotong
                overflow: 'visible',
            },
        },
        cells: {
            style: {
                // Pastikan overflow terlihat agar menu aksi tidak terpotong
                overflow: 'visible',
            },
        },
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Penjualan</h2>
                <button onClick={() => setModalState({ type: 'add', item: null })} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm w-full sm:w-auto justify-center">
                    <PlusCircle size={20} className="mr-2" />
                    <span>Tambah Penjualan</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-full sm:max-w-xs">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Cari pelanggan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full input-field pl-10" /></div>
                </div>
                <div className="w-full sm:w-auto"><select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value}))} className="input-field w-full"><option value="Semua">Semua Tipe</option><option>Hidup</option><option>Potong</option><option>Olahan</option></select></div>
                <div className="w-full sm:w-auto"><select value={filters.paymentStatus} onChange={e => setFilters(f => ({...f, paymentStatus: e.target.value}))} className="input-field w-full"><option value="Semua">Semua Status Bayar</option><option>Lunas</option><option>Kurang Bayar</option><option>Hutang</option></select></div>
            </div>

            {isMobile ? (
                <CardView data={filteredData} onAction={handleAction} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
            ) : (
                // PERUBAHAN: Wrapper div ditambahkan di sini untuk membuat tabel scrollable
                <div className="overflow-x-auto border rounded-lg">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        progressPending={loading}
                        pagination
                        paginationPerPage={10}
                        customStyles={customTableStyles}
                        noDataComponent={<div className="py-10 text-center text-gray-500">Tidak ada data untuk ditampilkan.</div>}
                    />
                </div>
            )}

            {(modalState.type === 'add' || modalState.type === 'edit') && (
                <AddEditModal item={modalState.item} onClose={() => setModalState({ type: null, item: null })} onSave={handleSave} loading={loading} />
            )}
            {modalState.type === 'view' && (
                <SalesDetailModal item={modalState.item} onClose={() => setModalState({ type: null, item: null })} />
            )}
            {modalState.type === 'delete' && (
                <DeleteConfirmationModal 
                    item={modalState.item} 
                    onConfirm={handleConfirmDelete} 
                    onCancel={() => setModalState({ type: null, item: null })} 
                    loading={loading}
                />
            )}
        </div>
    );
};

export default SalesPage;
