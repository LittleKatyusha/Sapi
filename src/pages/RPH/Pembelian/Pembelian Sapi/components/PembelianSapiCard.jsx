import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Calendar,
    FileText,
    Building2,
    Package,
    DollarSign,
    Hash,
    User,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

const PembelianSapiCard = ({
    data,
    index,
    onEdit,
    onDelete,
    onDetail,
    formatCurrency,
    getStatusBadge,
    getPersetujuanBadge
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit(data);
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        onDelete(data);
    };

    const handleDetail = () => {
        setIsMenuOpen(false);
        // Navigate to detail page instead of opening modal
        const itemId = data.pid || data.encryptedPid || data.pubid;
        navigate(`/rph/pembelian-sapi/detail/${itemId}`, {
            state: { item: data }
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 1:
            case '1':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 2:
            case '2':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 3:
            case '3':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 1:
            case '1':
                return 'Pending';
            case 2:
            case '2':
                return 'Approved';
            case 3:
            case '3':
                return 'Rejected';
            default:
                return 'Unknown';
        }
    };

    // Get status color class
    const getStatusColorClass = (status) => {
        switch (status) {
            case 1:
            case '1':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 2:
            case '2':
                return 'bg-green-50 text-green-700 border-green-200';
            case 3:
            case '3':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    // Get persetujuan text
    const getPersetujuanText = (persetujuan) => {
        const persetujuanStr = String(persetujuan).toLowerCase();
        
        if (persetujuanStr === 'disetujui' || persetujuanStr === 'approved' || persetujuanStr === '1') {
            return 'Disetujui';
        } else if (persetujuanStr === 'ditolak' || persetujuanStr === 'rejected' || persetujuanStr === '2') {
            return 'Ditolak';
        } else if (persetujuanStr === 'menunggu' || persetujuanStr === 'pending' || persetujuanStr === '0') {
            return 'Menunggu';
        } else {
            return persetujuan || 'Menunggu';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            {/* Card Header with Status Strip */}
            <div className={`px-4 py-2 ${getStatusColorClass(data.status)} border-b`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">No. {index + 1}</span>
                        <span className="text-xs">•</span>
                        <div className="flex items-center gap-1">
                            {getStatusIcon(data.status)}
                            <span className="text-xs font-semibold">{getStatusText(data.status)}</span>
                        </div>
                    </div>
                    
                    {/* Action Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors duration-200"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {isMenuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                                    <button
                                        onClick={handleDetail}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
                                    >
                                        <Eye className="h-4 w-4 text-blue-600" />
                                        <span className="text-gray-700">Lihat Detail</span>
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition-colors duration-200"
                                    >
                                        <Edit className="h-4 w-4 text-green-600" />
                                        <span className="text-gray-700">Edit</span>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-sm transition-colors duration-200"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                        <span className="text-red-700">Hapus</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
                {/* PO Number and Date */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500 font-medium">No. PO</span>
                        </div>
                        <p className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                            {data.no_po || '-'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 mb-1 justify-end">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500 font-medium">Tanggal</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                            {formatDate(data.tgl_pesanan)}
                        </p>
                    </div>
                </div>

                {/* Nota and Supplier */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Hash className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium">Nota</span>
                        </div>
                        <p className="text-sm font-semibold text-purple-900 truncate">
                            {data.nota || '-'}
                        </p>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-xs text-indigo-600 font-medium">Supplier</span>
                        </div>
                        <p className="text-sm font-semibold text-indigo-900 truncate">
                            {data.nama_supplier || 'RPH'}
                        </p>
                    </div>
                </div>

                {/* Office Info */}
                {data.nama_office && (
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Building2 className="h-3.5 w-3.5 text-gray-600" />
                            <span className="text-xs text-gray-600 font-medium">Office</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                            {data.nama_office}
                        </p>
                    </div>
                )}

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Jumlah</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900">
                            {data.jumlah || 0}
                        </p>
                        <span className="text-xs text-blue-600">ekor</span>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Total</span>
                        </div>
                        <p className="text-lg font-bold text-green-900">
                            {formatCurrency ? formatCurrency(data.harga || data.biaya_total || 0) : `Rp ${(data.harga || data.biaya_total || 0).toLocaleString('id-ID')}`}
                        </p>
                    </div>
                </div>

                {/* Persetujuan Status */}
                <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600 font-medium">Persetujuan:</span>
                        </div>
                        {getPersetujuanBadge ? (
                            getPersetujuanBadge(data.persetujuan)
                        ) : (
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                getPersetujuanText(data.persetujuan) === 'Disetujui' 
                                    ? 'bg-green-50 text-green-700'
                                    : getPersetujuanText(data.persetujuan) === 'Ditolak'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-yellow-50 text-yellow-700'
                            }`}>
                                {getPersetujuanText(data.persetujuan)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Additional Info if exists */}
                {data.catatan && (
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Catatan:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                            {data.catatan}
                        </p>
                    </div>
                )}

                {/* Quick Actions Bar */}
                <div className="pt-3 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={handleDetail}
                        className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Eye className="h-4 w-4" />
                        Detail
                    </button>
                    <button
                        onClick={handleEdit}
                        className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PembelianSapiCard;