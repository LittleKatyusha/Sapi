import React from 'react';
import { X, FileText, Calendar, DollarSign, User, Building2, Tag, CheckCircle2, MessageSquare, Hash } from 'lucide-react';

const DetailItem = ({ icon, label, value, className = '', highlight = false }) => (
    <div className={`flex items-start space-x-3 ${className}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <div className={`w-5 h-5 ${highlight ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <div className="text-base font-semibold text-gray-900">{value || '-'}</div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const statusLower = (status || '').toLowerCase();
    
    let config = {
        bgClass: 'bg-yellow-50',
        borderClass: 'border-yellow-300',
        textClass: 'text-yellow-700',
        label: status || 'Pending'
    };
    
    if (statusLower.includes('disetujui') && !statusLower.includes('sebagian')) {
        config = {
            bgClass: 'bg-green-50',
            borderClass: 'border-green-300',
            textClass: 'text-green-700',
            label: 'Disetujui'
        };
    } else if (statusLower.includes('sebagian')) {
        config = {
            bgClass: 'bg-blue-50',
            borderClass: 'border-blue-300',
            textClass: 'text-blue-700',
            label: 'Disetujui Sebagian'
        };
    } else if (statusLower.includes('ditolak')) {
        config = {
            bgClass: 'bg-red-50',
            borderClass: 'border-red-300',
            textClass: 'text-red-700',
            label: 'Ditolak'
        };
    }

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 ${config.bgClass} ${config.borderClass} ${config.textClass}`}>
            <CheckCircle2 size={18} />
            <span>{config.label}</span>
        </div>
    );
};

const DetailModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Detail Keuangan Kas</h2>
                            {data.nomor_pengajuan && (
                                <p className="text-sm text-blue-100 font-medium mt-1">
                                    No. {data.nomor_pengajuan}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-8 overflow-y-auto bg-gray-50">
                    <div className="space-y-6">
                        {/* Status Section */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Status</h3>
                                <StatusBadge status={data.status} />
                            </div>
                        </div>

                        {/* Main Information */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200">Informasi Pengajuan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.nomor_pengajuan && (
                                    <DetailItem 
                                        icon={<Hash size={20} />} 
                                        label="Nomor Pengajuan" 
                                        value={data.nomor_pengajuan}
                                    />
                                )}

                                <DetailItem 
                                    icon={<Calendar size={20} />} 
                                    label="Tanggal Pengajuan" 
                                    value={formatDate(data.tgl_pengajuan)}
                                />

                                <DetailItem 
                                    icon={<DollarSign size={20} />} 
                                    label="Nominal Pengajuan" 
                                    value={
                                        <span className="text-xl font-bold text-green-600">
                                            {formatCurrency(data.nominal_pengajuan)}
                                        </span>
                                    }
                                    highlight={true}
                                />

                                <DetailItem 
                                    icon={<DollarSign size={20} />} 
                                    label="Nominal Disetujui" 
                                    value={
                                        <span className="text-xl font-bold text-blue-600">
                                            {formatCurrency(data.nominal_disetujui)}
                                        </span>
                                    }
                                    highlight={true}
                                />

                                <DetailItem 
                                    icon={<Building2 size={20} />} 
                                    label="Divisi" 
                                    value={data.divisi}
                                />

                                <DetailItem 
                                    icon={<Tag size={20} />} 
                                    label="Jenis Biaya" 
                                    value={data.jenis_biaya}
                                />

                                <DetailItem 
                                    icon={<User size={20} />} 
                                    label="Yang Mengajukan" 
                                    value={data.yang_mengajukan}
                                />

                                <DetailItem 
                                    icon={<CheckCircle2 size={20} />} 
                                    label="Disetujui Oleh" 
                                    value={data.disetujui_oleh || '-'}
                                />
                            </div>
                        </div>

                        {/* Keperluan Section */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">Keperluan</h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {data.keperluan || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Catatan Section */}
                        {data.catatan && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-200">Catatan</h3>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {data.catatan}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex justify-end rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;