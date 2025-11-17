import React, { useState, useEffect } from 'react';
import { X, FileText, MapPin, User, Truck, CheckCircle, FileStack, Calendar, Package, Hash, Building2, Loader2, AlertCircle } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const TandaTerimaDetailModal = ({ isOpen, onClose, data }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [headerData, setHeaderData] = useState(null);
    const [detailData, setDetailData] = useState([]);

    // Fetch detail data when modal opens
    useEffect(() => {
        if (isOpen && data) {
            fetchDetailData();
        }
    }, [isOpen, data]);

    const fetchDetailData = async () => {
        setLoading(true);
        setError(null);

        try {
            const pid = data.pid || data.id;
            if (!pid) {
                throw new Error('ID tidak tersedia');
            }

            const response = await HttpClient.post(
                API_ENDPOINTS.HO.TANDA_TERIMA.SHOW,
                { pid }
            );

            console.log('Detail Modal Response:', response);

            // Extract data array from response
            let dataArray;
            if (Array.isArray(response.data)) {
                dataArray = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                dataArray = response.data.data;
            } else {
                throw new Error('Format response tidak valid');
            }

            if (!dataArray || dataArray.length === 0) {
                throw new Error('Data tidak ditemukan');
            }

            // Extract header from first item (all items share same header)
            const firstItem = dataArray[0];
            setHeaderData({
                id_barang: firstItem.id_barang,
                nama_barang: firstItem.nama_barang,
                lokasi_penerimaan: firstItem.lokasi_penerimaan,
                pemasok: firstItem.pemasok,
                nota: firstItem.nota,
                tgl_terima: firstItem.tgl_terima,
                nama_pengirim: firstItem.nama_pengirim,
                plat_nomor: firstItem.plat_nomor,
                satuan: firstItem.satuan,
                penerima: firstItem.penerima,
                id_tanda_terima: firstItem.id_tanda_terima
            });

            // Transform detail items
            setDetailData(dataArray.map((item, index) => ({
                id: item.id || index,
                jenis_barang: item.jenis_barang,
                jumlah: item.jumlah,
                kondisi: item.kondisi
            })));

        } catch (err) {
            console.error('Error fetching detail:', err);
            setError(err.message || 'Gagal memuat detail data');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getKondisiColor = (kondisi) => {
        const kondisiLower = kondisi?.toLowerCase() || '';
        if (kondisiLower === 'baik') {
            return 'bg-green-100 text-green-800 border-green-300';
        } else if (kondisiLower === 'rusak') {
            return 'bg-red-100 text-red-800 border-red-300';
        } else {
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        }
    };

    const getKondisiLabel = (kondisi) => {
        const kondisiLower = kondisi?.toLowerCase() || '';
        if (kondisiLower === 'baik') return 'Baik';
        if (kondisiLower === 'rusak') return 'Rusak';
        if (kondisiLower === 'kurang_baik') return 'Kurang Baik';
        return kondisi || '-';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Detail Tanda Terima
                        </h2>
                        <p className="text-sm text-blue-100">
                            Informasi lengkap header dan detail items
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors duration-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-600">Memuat detail data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-red-600 font-medium mb-2">Gagal memuat data</p>
                            <p className="text-gray-600 text-sm">{error}</p>
                            <button
                                onClick={fetchDetailData}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : headerData ? (
                        <div className="space-y-6">
                            {/* Header Information */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                <h3 className="text-lg font-bold text-blue-800 mb-4">
                                    Informasi Header
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nama Barang */}
                                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium mb-1">Nama Barang</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.nama_barang || '-'}
                                        </p>
                                    </div>

                                    {/* Tanggal Terima */}
                                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                                        <p className="text-xs text-purple-600 font-medium mb-1">Tanggal Terima</p>
                                        <p className="text-base font-bold text-gray-800">
                                            {headerData.tgl_terima ? new Date(headerData.tgl_terima).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            }) : '-'}
                                        </p>
                                    </div>

                                    {/* Lokasi Penerimaan */}
                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                        <p className="text-xs text-green-600 font-medium mb-1">Lokasi Penerimaan</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.lokasi_penerimaan || '-'}
                                        </p>
                                    </div>

                                    {/* Pemasok */}
                                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                                        <p className="text-xs text-orange-600 font-medium mb-1">Pemasok</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.pemasok || '-'}
                                        </p>
                                    </div>

                                    {/* Nota */}
                                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                                        <p className="text-xs text-indigo-600 font-medium mb-1">Nota</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.nota || '-'}
                                        </p>
                                    </div>

                                    {/* Nama Pengirim */}
                                    <div className="bg-white rounded-lg p-4 border border-cyan-200">
                                        <p className="text-xs text-cyan-600 font-medium mb-1">Nama Pengirim</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.nama_pengirim || '-'}
                                        </p>
                                    </div>

                                    {/* Plat Nomor */}
                                    <div className="bg-white rounded-lg p-4 border border-red-200">
                                        <p className="text-xs text-red-600 font-medium mb-1">Plat Nomor</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.plat_nomor || '-'}
                                        </p>
                                    </div>

                                    {/* Penerima */}
                                    <div className="bg-white rounded-lg p-4 border border-teal-200">
                                        <p className="text-xs text-teal-600 font-medium mb-1">Penerima</p>
                                        <p className="text-base font-bold text-gray-800 break-words">
                                            {headerData.penerima || '-'}
                                        </p>
                                    </div>

                                    {/* Satuan */}
                                    {headerData.satuan && (
                                        <div className="bg-white rounded-lg p-4 border border-pink-200">
                                            <p className="text-xs text-pink-600 font-medium mb-1">Satuan</p>
                                            <p className="text-base font-bold text-gray-800 break-words">
                                                {headerData.satuan}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail Items Table */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                                <h3 className="text-lg font-bold text-green-800 mb-4">
                                    Detail Items ({detailData.length})
                                </h3>
                                
                                {detailData.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Tidak ada detail item</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full bg-white">
                                            <thead className="bg-gradient-to-r from-green-500 to-emerald-600">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-16">
                                                        No
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                        Jenis Barang
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-32">
                                                        Jumlah
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-40">
                                                        Kondisi
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {detailData.map((item, index) => (
                                                    <tr key={item.id} className="hover:bg-green-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                                                            {item.jenis_barang || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-center">
                                                            <span className="font-semibold text-gray-800">
                                                                {item.jumlah || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getKondisiColor(item.kondisi)}`}>
                                                                {getKondisiLabel(item.kondisi)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TandaTerimaDetailModal;