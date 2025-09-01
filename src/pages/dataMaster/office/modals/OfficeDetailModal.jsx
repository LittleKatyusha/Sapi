import React from 'react';
import { Building2, Hash, MapPin, FileText, Activity, Info, X } from 'lucide-react';


import { useEffect } from 'react';

const OfficeDetailModal = ({ isOpen, onClose, data, getKategoriName }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // getKategoriName sekarang dikirim sebagai props dari parent
    // yang menggunakan data dari database kategori_office
    const getKategoriNameSafe = (id_kategori) => {
        if (getKategoriName && typeof getKategoriName === 'function') {
            return getKategoriName(id_kategori);
        }
        // Fallback jika function tidak tersedia
        return 'Kategori tidak tersedia';
    };

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mr-4">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detail Office</h3>
                            <p className="text-sm text-gray-500">Informasi lengkap office/kandang</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-2xl border border-red-100">
                        <div className="flex items-center mb-2">
                            <Building2 className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-sm font-semibold text-red-700">Nama Office</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{data.name}</p>
                    </div>




                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center">
                            <Info className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-sm font-semibold text-gray-700">Kategori</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 bg-white px-3 py-1 rounded-full border">
                            {getKategoriNameSafe(data.id_kategori)}
                        </span>
                    </div>



                    {data.location && (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                            <div className="flex items-center">
                                <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                                <span className="text-sm font-semibold text-blue-700">Lokasi</span>
                            </div>
                            <span className="text-sm text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-200">
                                {data.location}
                            </span>
                        </div>
                    )}

                    {data.description && (
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                                <span className="text-sm font-semibold text-gray-700">Deskripsi</span>
                            </div>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {data.description}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                        <h4 className="font-semibold text-blue-800 mb-2">Ringkasan</h4>
                        <div className="text-sm text-blue-700">
                            <p>Office <span className="font-bold">{data.name}</span></p>
                            <p>Kategori: <span className="font-medium">{getKategoriNameSafe(data.id_kategori)}</span></p>

                            {data.location && (
                                <p>Lokasi: <span className="font-medium">{data.location}</span></p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfficeDetailModal;