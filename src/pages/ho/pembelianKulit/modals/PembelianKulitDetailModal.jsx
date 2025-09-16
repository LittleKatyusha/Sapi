import React from 'react';
import { X, Eye, Building2, User, Calendar, Truck, Hash, Package } from 'lucide-react';

const PembelianKulitDetailModal = ({ isOpen, onClose, pembelian }) => {
    if (!isOpen || !pembelian) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 10001 }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Eye className="w-6 h-6 text-blue-600" />
                        Detail Pembelian Kulit
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Header Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Informasi Pembelian
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Nomor Nota
                                </label>
                                <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border">
                                    {pembelian.nota || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Tanggal Masuk
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.tgl_masuk ? new Date(pembelian.tgl_masuk).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <Building2 className="w-4 h-4 inline mr-1" />
                                    Supplier
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.nama_supplier || pembelian.supplier || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Jenis Pembelian
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                        {pembelian.jenis_pembelian || '-'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transport Information */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-green-600" />
                            Informasi Transport
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Nama Supir
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.nama_supir || '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    <Truck className="w-4 h-4 inline mr-1" />
                                    Plat Nomor
                                </label>
                                <p className="text-gray-900 font-mono bg-white px-3 py-2 rounded border">
                                    {pembelian.plat_nomor || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Product Information */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            Informasi Produk
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Jumlah
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.jumlah || 0} {pembelian.satuan || 'item'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Berat Total
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.berat_total ? `${parseFloat(pembelian.berat_total).toFixed(1)} kg` : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Satuan
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.satuan || 'item'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-600" />
                            Informasi Keuangan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Biaya Total
                                </label>
                                <p className="text-gray-900 font-bold text-lg bg-white px-3 py-2 rounded border">
                                    {pembelian.biaya_total ? new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(pembelian.biaya_total) : 'Rp 0'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Biaya Lain
                                </label>
                                <p className="text-gray-900 bg-white px-3 py-2 rounded border">
                                    {pembelian.biaya_lain ? new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(pembelian.biaya_lain) : 'Rp 0'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Ringkasan</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{pembelian.jumlah || 0}</p>
                                <p className="text-sm text-gray-300">Total {pembelian.satuan || 'Item'}</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {pembelian.berat_total ? `${parseFloat(pembelian.berat_total).toFixed(0)}` : '0'}
                                </p>
                                <p className="text-sm text-gray-300">Kg</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {pembelian.biaya_total ? new Intl.NumberFormat('id-ID', {
                                        notation: 'compact',
                                        compactDisplay: 'short',
                                        maximumFractionDigits: 1
                                    }).format(pembelian.biaya_total) : '0'}
                                </p>
                                <p className="text-sm text-gray-300">Total Biaya</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {pembelian.biaya_lain ? new Intl.NumberFormat('id-ID', {
                                        notation: 'compact',
                                        compactDisplay: 'short',
                                        maximumFractionDigits: 1
                                    }).format(pembelian.biaya_lain) : '0'}
                                </p>
                                <p className="text-sm text-gray-300">Biaya Lain</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PembelianKulitDetailModal;
