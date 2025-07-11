import React from 'react';
import { 
    PlusCircle, Eye, Edit, Trash2, X as CloseIcon, MoreVertical, AlertTriangle, 
    ChevronLeft, ChevronRight, RotateCcw, Search, Info, PackageCheck,
    Mail, Phone, MapPin, Calendar, User
} from 'lucide-react';

// --- HOOKS (Logika Terpusat) ---

// Hook kustom untuk mengelola state dan logika data karyawan.
const useEmployees = (initialEmployees = []) => {
    const [employees, setEmployees] = React.useState(initialEmployees);
    const [loading, setLoading] = React.useState(false);

    const addEmployee = React.useCallback((newItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const newItem = {
                    ...newItemData,
                    id: `KRY-${String(Math.floor(Math.random() * 900) + 100)}`,
                    photoUrl: `https://placehold.co/100x100/E2E8F0/4A5568?text=${newItemData.name.charAt(0).toUpperCase()}`
                };
                setEmployees(prev => [newItem, ...prev]);
                setLoading(false);
                resolve(newItem);
            }, 500);
        });
    }, []);

    const updateEmployee = React.useCallback((updatedItemData) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setEmployees(prev => prev.map(item => item.id === updatedItemData.id ? updatedItemData : item));
                setLoading(false);
                resolve(updatedItemData);
            }, 500);
        });
    }, []);

    const deleteEmployee = React.useCallback((employeeId) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setEmployees(prev => prev.filter(item => item.id !== employeeId));
                setLoading(false);
                resolve();
            }, 500);
        });
    }, []);

    return { employees, addEmployee, updateEmployee, deleteEmployee, loading };
};


// --- Komponen UI (Presentational) ---

const TableSkeletonLoader = ({ rows = 5, cols = 5 }) => (
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
        <h3 className="mt-4 text-lg font-semibold text-gray-800">Tidak Ada Karyawan Ditemukan</h3>
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

const AddEditEmployeeModal = ({ isOpen, onClose, item, onSave, loading }) => {
    const isEditMode = !!item;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode 
            ? { ...item } 
            : { name: '', gender: 'Laki-laki', position: '', email: '', phone: '', address: '', provinsi: '', kabupaten: '', kecamatan: '', joinDate: new Date().toISOString().split('T')[0] };
        setFormData(initialData);
    }, [item, isOpen]);

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
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Masukkan nama" className="w-full input-field"/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label><select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full input-field"><option>Laki-laki</option><option>Perempuan</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jabatan</label><input type="text" name="position" value={formData.position || ''} onChange={handleChange} placeholder="Posisi di perusahaan" className="w-full input-field"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="contoh@email.com" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="08xxxxxxxxxx" className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label><textarea name="address" value={formData.address || ''} onChange={handleChange} rows="2" placeholder="Jalan, nomor rumah, RT/RW..." className="w-full input-field"></textarea></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label><input type="text" name="provinsi" value={formData.provinsi || ''} onChange={handleChange} placeholder="Jawa Barat" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label><input type="text" name="kabupaten" value={formData.kabupaten || ''} onChange={handleChange} placeholder="Bekasi" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label><input type="text" name="kecamatan" value={formData.kecamatan || ''} onChange={handleChange} placeholder="Cikarang" className="w-full input-field"/></div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bergabung</label><input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className="w-full input-field"/></div>
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

const EmployeeDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const details = [
        { label: 'ID Karyawan', value: item.id, icon: User, mono: true },
        { label: 'Jenis Kelamin', value: item.gender, icon: User },
        { label: 'Email', value: item.email, icon: Mail },
        { label: 'No. Telepon', value: item.phone, icon: Phone },
        { label: 'Alamat', value: `${item.address}, ${item.kecamatan}, ${item.kabupaten}, ${item.provinsi}`, icon: MapPin },
        { label: 'Tanggal Bergabung', value: item.joinDate, icon: Calendar },
    ];
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="p-8">
                <div className="flex justify-end"><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button></div>
                <div className="flex flex-col items-center text-center -mt-8">
                    <img src={item.photoUrl} alt={`Foto ${item.name}`} className="w-24 h-24 rounded-full object-cover ring-4 ring-red-200 mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
                    <p className="text-md text-red-600 font-semibold">{item.position}</p>
                </div>
                <div className="mt-6 pt-6 border-t space-y-4 text-sm">
                    {details.map(d => (
                        <div key={d.label} className="flex items-start">
                            <d.icon size={16} className="text-gray-500 mr-4 mt-1 flex-shrink-0"/>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-500">{d.label}</span>
                                <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''}`}>{d.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
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
                <h2 className="text-xl font-bold text-gray-800">Hapus Karyawan?</h2>
                <p className="text-gray-600 mt-2">Apakah Anda yakin ingin menghapus data karyawan <strong className="text-gray-900">{item?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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
const EmployeePage = () => {
    const initialEmployeeData = React.useMemo(() => [
        { id: 'KRY-001', name: 'Ahmad Subarjo', gender: 'Laki-laki', position: 'Manajer Peternakan', email: 'ahmad.subarjo@example.com', phone: '0812-1111-2222', address: 'Jl. Merdeka No. 1, RT 01/RW 02', provinsi: 'DKI Jakarta', kabupaten: 'Jakarta Pusat', kecamatan: 'Gambir', joinDate: '2020-01-15', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AS' },
        { id: 'KRY-002', name: 'Siti Aminah', gender: 'Perempuan', position: 'Staf Administrasi', email: 'siti.aminah@example.com', phone: '0812-3333-4444', address: 'Jl. Mawar No. 2, RT 03/RW 01', provinsi: 'Jawa Barat', kabupaten: 'Bogor', kecamatan: 'Bogor Tengah', joinDate: '2021-03-20', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SA' },
        { id: 'KRY-003', name: 'Joko Widodo', gender: 'Laki-laki', position: 'Kepala Penjualan', email: 'joko.widodo@example.com', phone: '0812-5555-6666', address: 'Jl. Kenanga No. 3, RT 05/RW 04', provinsi: 'Jawa Barat', kabupaten: 'Depok', kecamatan: 'Pancoran Mas', joinDate: '2019-11-10', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JW' },
        { id: 'KRY-004', name: 'Dewi Lestari', gender: 'Perempuan', position: 'Dokter Hewan', email: 'dewi.lestari@example.com', phone: '0812-7777-8888', address: 'Jl. Anggrek No. 4, RT 02/RW 07', provinsi: 'Jawa Barat', kabupaten: 'Bekasi', kecamatan: 'Bekasi Timur', joinDate: '2022-02-01', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=DL' },
        { id: 'KRY-005', name: 'Bambang Susanto', gender: 'Laki-laki', position: 'Staf Kandang', email: 'bambang.s@example.com', phone: '0812-9999-0000', address: 'Jl. Melati No. 5, RT 01/RW 03', provinsi: 'Banten', kabupaten: 'Tangerang', kecamatan: 'Cipondoh', joinDate: '2023-01-05', photoUrl: 'https://placehold.co/100x100/E2E8F0/4A5568?text=BS' },
    ], []);

    const { employees, addEmployee, updateEmployee, deleteEmployee, loading } = useEmployees(initialEmployeeData);
    const [modalState, setModalState] = React.useState({ view: null, edit: null, delete: null, add: false });
    const [openActionMenuId, setOpenActionMenuId] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const allPositions = React.useMemo(() => [...new Set(initialEmployeeData.map(e => e.position))], [initialEmployeeData]);
    const [filters, setFilters] = React.useState({ position: 'Semua' });
    const [notification, setNotification] = React.useState(null);

    const filteredEmployees = React.useMemo(() => {
        return employees.filter(item => {
            const searchMatch = searchTerm === '' || 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                );
            const positionMatch = filters.position === 'Semua' || item.position === filters.position;
            return searchMatch && positionMatch;
        });
    }, [employees, searchTerm, filters]);

    const currentEmployees = React.useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredEmployees, currentPage, itemsPerPage]);
    
    const handleAction = React.useCallback((action, item) => {
        if (action === 'view') setModalState(s => ({ ...s, view: item }));
        if (action === 'edit') setModalState(s => ({ ...s, edit: item }));
        if (action === 'delete') setModalState(s => ({ ...s, delete: item }));
    }, []);

    const handleSave = React.useCallback(async (data) => {
        const isEdit = !!data.id;
        if (isEdit) {
            await updateEmployee(data);
            setNotification({ type: 'success', message: 'Data karyawan berhasil diperbarui!' });
        } else {
            await addEmployee(data);
            setNotification({ type: 'success', message: 'Karyawan baru berhasil ditambahkan!' });
        }
    }, [addEmployee, updateEmployee]);

    const handleConfirmDelete = React.useCallback(async (id) => {
        await deleteEmployee(id);
        setNotification({ type: 'success', message: 'Data karyawan berhasil dihapus.' });
    }, [deleteEmployee]);
    
    const resetFilters = () => {
        setSearchTerm('');
        setFilters({ position: 'Semua' });
        setCurrentPage(1);
    };

    return (
        <>
            {notification && <Notification {...notification} onDismiss={() => setNotification(null)} />}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Manajemen Karyawan</h2>
                    <button onClick={() => setModalState(s => ({ ...s, add: true }))} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        <PlusCircle size={20} className="mr-2"/> Tambah Karyawan
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari nama, jabatan, email..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full input-field pl-10"
                        />
                    </div>
                    <select value={filters.position} onChange={e => { setFilters(f => ({...f, position: e.target.value})); setCurrentPage(1); }} className="input-field w-full md:w-56">
                        <option value="Semua">Semua Jabatan</option>
                        {allPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                     <button onClick={resetFilters} title="Reset Filter" className="p-2.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
                        <RotateCcw size={16} />
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 min-w-[250px] sticky left-0 z-20 bg-gray-50 border-r">Karyawan</th>
                                <th className="px-6 py-3 min-w-[180px]">Jabatan</th>
                                <th className="px-6 py-3 min-w-[220px]">Kontak</th>
                                <th className="px-6 py-3 min-w-[150px]">Tgl Bergabung</th>
                                <th className="px-6 py-3 text-center min-w-[100px] sticky right-0 z-20 bg-gray-50 border-l">Aksi</th>
                            </tr>
                        </thead>
                        {loading && currentEmployees.length === 0 ? (
                            <TableSkeletonLoader cols={5} rows={itemsPerPage} />
                        ) : currentEmployees.length > 0 ? (
                             <tbody>
                                {currentEmployees.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50 group">
                                        <td className="px-6 py-4 sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r">
                                            <div className="flex items-center">
                                                <img src={item.photoUrl} alt={`Foto ${item.name}`} className="w-10 h-10 rounded-full mr-4 object-cover"/>
                                                <div>
                                                    <div className="font-semibold text-gray-800">{item.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{item.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{item.position}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs mb-1"><Mail size={12} className="mr-2 text-gray-400"/>{item.email}</div>
                                            <div className="flex items-center text-xs"><Phone size={12} className="mr-2 text-gray-400"/>{item.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">{item.joinDate}</td>
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
                            <tbody><tr><td colSpan="5"><EmptyState onClearFilters={resetFilters} /></td></tr></tbody>
                        )}
                    </table>
                </div>
                
                <Pagination 
                    totalItems={filteredEmployees.length} 
                    itemsPerPage={itemsPerPage} 
                    currentPage={currentPage} 
                    onPageChange={setCurrentPage}
                />
            </div>
            
            {/* --- Modals --- */}
            <AddEditEmployeeModal 
                isOpen={modalState.add || !!modalState.edit}
                item={modalState.edit}
                onClose={() => setModalState({ view: null, edit: null, delete: null, add: false })}
                onSave={handleSave}
                loading={loading}
            />
            <EmployeeDetailModal 
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

export default EmployeePage;
