import React from 'react';
import { X, Calendar, Building2, User, Wallet, FileImage, ExternalLink } from 'lucide-react';
import BankDepositService from '../../../../services/bankDepositService';

const BankDepositDetailModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const statusInfo = BankDepositService.getProofStatusInfo(data.proof_status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Detail Setoran Kas
                            </h2>
                            <p className="text-sm text-blue-50 mt-1">
                                Informasi lengkap setoran kas ke bank
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-6">
                        {/* Tanggal Setor */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Tanggal Setor</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {BankDepositService.formatDate(data.deposit_date)}
                                </p>
                            </div>
                        </div>

                        {/* Bank */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Bank Tujuan</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {data.nama_bank || data.bank?.nama || '-'}
                                </p>
                                {data.bank?.kode && (
                                    <p className="text-sm text-gray-500">Kode: {data.bank.kode}</p>
                                )}
                            </div>
                        </div>

                        {/* Nama Penyetor */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Nama Penyetor</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {data.depositor_name || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Jumlah */}
                        <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Wallet className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Jumlah Setoran</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {BankDepositService.formatCurrency(data.amount)}
                                </p>
                            </div>
                        </div>

                        {/* Bukti Setor */}
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <FileImage className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 font-medium">Bukti Setor</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgClass} ${statusInfo.textClass} border ${statusInfo.borderClass}`}>
                                        {statusInfo.label}
                                    </span>
                                    {data.proof_of_deposit_url && data.proof_status === 1 && (
                                        <a
                                            href={data.proof_of_deposit_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Lihat Bukti
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        {(data.created_at || data.updated_at) && (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {data.created_at && (
                                        <div>
                                            <p className="text-gray-500">Dibuat pada</p>
                                            <p className="font-medium text-gray-700">
                                                {new Date(data.created_at).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                    {data.updated_at && (
                                        <div>
                                            <p className="text-gray-500">Terakhir diubah</p>
                                            <p className="font-medium text-gray-700">
                                                {new Date(data.updated_at).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 flex items-center justify-end border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BankDepositDetailModal;
