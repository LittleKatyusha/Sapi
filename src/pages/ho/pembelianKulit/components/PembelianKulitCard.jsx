import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  Truck, 
  Hash, 
  Package, 
  Edit, 
  Trash2, 
  Eye,
  File,
  Loader2,
  MoreVertical 
} from 'lucide-react';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../config/api';

const PembelianKulitCard = ({
    data,
    onEdit,
    onDelete,
    onDetail,
    index
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);
    const menuRef = useRef(null);

    // Menangani klik di luar menu untuk menutupnya
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleMenuToggle = () => {
        setShowMenu(!showMenu);
    };

    const handleDetail = () => {
        onDetail(data);
        setShowMenu(false);
    };

    const handleEdit = () => {
        onEdit(data);
        setShowMenu(false);
    };

    const handleDelete = () => {
        onDelete(data);
        setShowMenu(false);
    };

    // Handle view file functionality - USING DIRECT URL ACCESS
    const handleViewFile = async (data) => {
        if (!data.file) {
            alert('File tidak tersedia untuk pembelian ini');
            return;
        }

        setFileLoading(true);
        try {
            // Debug: Log the original path
            console.log('PembelianKulitCard - Original file path:', data.file);
            
            let fileUrl = data.file;
            
            // Check if it's already a complete pre-signed URL from database
            if (fileUrl.includes('X-Amz-Signature') || fileUrl.includes('?')) {
                // It's already a complete pre-signed URL from the database
                console.log('PembelianKulitCard - Using pre-signed URL directly:', fileUrl);
            } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
                // It's a complete URL without signature - use as is
                console.log('PembelianKulitCard - Using complete URL:', fileUrl);
            } else {
                // It's a relative path - this should not happen with new approach
                console.warn('PembelianKulitCard - Unexpected relative path, using as is:', fileUrl);
                // If it's still a relative path, construct full URL (fallback)
                if (!fileUrl.startsWith('http')) {
                    fileUrl = `https://assets.ternasys.com/${fileUrl}`;
                }
            }
            
            // Open file directly in new window using the complete URL
            const newWindow = window.open(fileUrl, '_blank');
            
            if (!newWindow) {
                alert('Pop-up blocker mencegah pembukaan file. Silakan izinkan pop-up untuk situs ini.');
            }
            
            setShowMenu(false);
            
        } catch (error) {
            console.error('Error viewing file:', error);
            alert('Gagal membuka file. Silakan coba lagi.');
        } finally {
            setFileLoading(false);
        }
    };


    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
             {/* Background Accent (Opsional untuk efek visual) */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-600"></div>
             
            {/* Header with Index and Action Menu */}
            <div className="flex justify-between items-start mb-4">
                {/* Index Badge */}
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-indigo-800">{index + 1}</span>
                </div>
                
                {/* Action Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={handleMenuToggle}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-label="Menu"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {showMenu && (
                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 min-w-[160px]">
                            <button
                                onClick={handleDetail}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-150"
                            >
                                <Eye className="w-4 h-4 text-blue-500" />
                                Detail
                            </button>
                            {data.file && (
                                <button
                                    onClick={() => handleViewFile(data)}
                                    disabled={fileLoading}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors duration-150 ${
                                        fileLoading 
                                            ? 'text-gray-400 cursor-not-allowed' 
                                            : 'text-gray-700 hover:bg-green-50'
                                    }`}
                                >
                                    {fileLoading ? (
                                        <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                                    ) : (
                                        <File className="w-4 h-4 text-green-500" />
                                    )}
                                    {fileLoading ? 'Membuka...' : 'Lihat File'}
                                </button>
                            )}
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <Edit className="w-4 h-4 text-amber-500" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Card Content Grid */}
            <div className="space-y-4">
                 {/* Nota */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota</span>
                    </div>
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg break-words block">
                        {data.nota || '-'}
                    </span>
                </div>

                {/* Nota Sistem */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                            <Hash className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota Sistem</span>
                    </div>
                    <span className="font-mono text-sm bg-blue-50 px-3 py-1.5 rounded-lg break-words block text-blue-700">
                        {data.nota_sistem || '-'}
                    </span>
                </div>

                {/* Tanggal Masuk & Jumlah (Sebaris) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg bg-gray-100">
                                <Calendar className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</span>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {data.tgl_masuk ? new Date(data.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg bg-gray-100">
                                <Package className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jumlah</span>
                        </div>
                        <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-indigo-100 text-indigo-800">
                            {data.jumlah || 0} {data.satuan || 'item'}
                        </span>
                    </div>
                </div>

                {/* Nama Supir */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-green-100">
                            <User className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supir</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <User className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-base truncate">
                            {data.nama_supir || '-'}
                        </span>
                    </div>
                </div>

                {/* Plat Nomor */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Truck className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plat Nomor</span>
                    </div>
                    <span className="font-mono text-base font-medium">
                        {data.plat_nomor || '-'}
                    </span>
                </div>

                {/* Jenis Pembelian */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-purple-100">
                            <Hash className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis Pembelian</span>
                    </div>
                    <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                        {data.jenis_pembelian || '-'}
                    </span>
                </div>

                {/* Nama Supplier */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-base truncate">
                            {data.nama_supplier || data.supplier || '-'}
                        </span>
                    </div>
                </div>

                {/* Berat Total */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Package className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Berat Total</span>
                    </div>
                    <span className="text-gray-900 font-medium text-base">
                        {data.berat_total ? `${parseFloat(data.berat_total).toFixed(1)} kg` : '-'}
                    </span>
                </div>

                {/* Biaya Total */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-green-100">
                            <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Biaya Total</span>
                    </div>
                    <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-inner">
                        {data.biaya_total ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(data.biaya_total) : 'Rp 0'}
                    </span>
                </div>

                {/* Biaya Lain */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-orange-100">
                            <Package className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Biaya Lain</span>
                    </div>
                    <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 shadow-inner">
                        {data.biaya_lain ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(data.biaya_lain) : 'Rp 0'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PembelianKulitCard;
