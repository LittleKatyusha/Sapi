// src/components/PenjualanSapiCard.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  User,
  Calendar,
  Truck,
  Hash,
  Package,
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Loader2
} from 'lucide-react';
import LaporanPembelianService from '../../../../../services/laporanPembelianService';
import { API_ENDPOINTS, API_BASE_URL } from '../../../../../config/api';

const PenjualanSapiCard = ({
    data,
    onDetail,
    onProcess,
    onReject,
    onDownloadOrder,
    index,
    getJenisPenjualanLabel
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
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

    const handleProcess = () => {
        onProcess(data);
        setShowMenu(false);
    };

    const handleReject = () => {
        onReject(data);
        setShowMenu(false);
    };

    const handleDownloadOrder = () => {
        onDownloadOrder(data);
        setShowMenu(false);
    };


    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
             {/* Background Accent (Opsional untuk efek visual) */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>
             
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
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="Menu"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {showMenu && (
                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20 min-w-[180px]">
                            <button
                                onClick={handleDetail}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <Eye className="w-4 h-4 text-blue-500" />
                                Lihat Detail
                            </button>
                            <button
                                onClick={handleProcess}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Proses
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <XCircle className="w-4 h-4 text-red-500" />
                                Tolak
                            </button>
                            <button
                                onClick={handleDownloadOrder}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                                <Download className="w-4 h-4 text-purple-500" />
                                Unduh Lembar Pesanan
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
                            {data.jumlah || 0} ekor
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
                            {data.nama_supplier || '-'}
                        </span>
                    </div>
                </div>

                {/* Nama Office */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-gray-100">
                            <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Office</span>
                    </div>
                    <span className="text-gray-900 font-medium text-base">
                        {data.nama_office || '-'}
                    </span>
                </div>

                {/* Nilai Belanja */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-green-100">
                            <Package className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nilai</span>
                    </div>
                    <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-inner">
                        {data.total_belanja ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(data.total_belanja) : 'Rp 0'}
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

                {/* Biaya Truk */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-blue-100">
                            <Truck className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Biaya Truk</span>
                    </div>
                    <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 shadow-inner">
                        {data.biaya_truk ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(data.biaya_truk) : 'Rp 0'}
                    </span>
                </div>

                {/* Jenis Pembelian */}
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-purple-100">
                            <Hash className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis Penjualan</span>
                    </div>
                    <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                        {getJenisPenjualanLabel ? getJenisPenjualanLabel(data.jenis_penjualan) : (data.jenis_penjualan || '-')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PenjualanSapiCard;