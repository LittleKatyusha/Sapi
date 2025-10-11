import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  User,
  Calendar,
  CreditCard,
  Hash,
  DollarSign,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';

const PembayaranCard = ({
    data,
    onEdit,
    onDetail,
    index
}) => {
    const [showMenu, setShowMenu] = useState(false);
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

    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
             {/* Background Accent */}
             <div className={`absolute top-0 left-0 w-full h-1 ${
                 data.payment_status === 1 
                     ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                     : 'bg-gradient-to-r from-red-500 to-orange-600'
             }`}></div>
             
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
                        </div>
                    )}
                </div>
            </div>

            {/* Card Content Grid */}
            <div className="space-y-4">
                 {/* ID Pembayaran */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ID Pembayaran</span>
                    </div>
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg break-words block">
                        #{data.id || '-'}
                    </span>
                </div>

                {/* Nota */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Hash className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota</span>
                    </div>
                    <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg break-words block">
                        {data.nota || data.id_pembelian || '-'}
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

                {/* Nota HO */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                            <Hash className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nota HO</span>
                    </div>
                    <span className="font-mono text-sm bg-blue-100 px-3 py-1.5 rounded-lg break-words block">
                        {data.nota_ho || '-'}
                    </span>
                </div>

                {/* Supplier */}
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
                            {data.nama_supplier || '-'}
                        </span>
                    </div>
                </div>

                {/* Tanggal Jatuh Tempo & Tanggal Pelunasan (Sebaris) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg bg-orange-100">
                                <Calendar className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jatuh Tempo</span>
                        </div>
                        <span className="text-gray-900 font-medium text-sm">
                            {data.due_date ? new Date(data.due_date).toLocaleDateString('id-ID') : '-'}
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1.5 rounded-lg bg-green-100">
                                <Calendar className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelunasan</span>
                        </div>
                        <span className="text-gray-900 font-medium text-sm">
                            {data.settlement_date ? new Date(data.settlement_date).toLocaleDateString('id-ID') : '-'}
                        </span>
                    </div>
                </div>

                {/* Status Pembayaran */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <CreditCard className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {data.payment_status === 1 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg ${
                            data.payment_status === 1 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {data.payment_status === 1 ? 'Lunas' : 'Belum Lunas'}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PembayaranCard;