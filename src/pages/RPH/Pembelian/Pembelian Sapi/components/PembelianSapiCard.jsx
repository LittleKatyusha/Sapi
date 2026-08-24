import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Calendar,
    FileText,
    Hash,
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
                return 'Menunggu';
            case 2:
            case '2':
                return 'Disetujui';
            case 3:
            case '3':
                return 'Ditolak';
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
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColorClass(data.status || data.persetujuan)}`}>
                            {getStatusText(data.status || data.persetujuan)}
                        </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">{data.no_po || '-'}</h3>
                    <p className="text-xs text-gray-500 truncate">Nota: {data.nota || '-'}</p>
                    <p className="text-xs text-gray-500 truncate">RPH: {data.nama_rph || '-'}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-500">Tanggal</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(data.tgl_pesanan)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Jumlah</p>
                            <p className="text-sm font-medium text-gray-900">{data.jumlah || 0} ekor</p>
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-semibold text-emerald-700">
                            {formatCurrency ? formatCurrency(data.harga || data.biaya_total || 0) : `Rp ${(data.harga || data.biaya_total || 0).toLocaleString('id-ID')}`}
                        </p>
                    </div>
                </div>
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                                <button
                                    onClick={handleDetail}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <Eye className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-700">Detail</span>
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <Edit className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-700">Edit</span>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-sm"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    <span className="text-red-600">Hapus</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PembelianSapiCard;