import React from 'react';
import { X, FileText, Receipt, Truck, CreditCard, Download } from 'lucide-react';

const UnduhBerkasModal = ({ isOpen, onClose, item }) => {
    if (!isOpen || !item) return null;

    const documents = [
        { id: 'pesanan', label: 'Pesanan Pembelian', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', description: 'Dokumen pesanan pembelian sapi qurban' },
        { id: 'tanda_terima', label: 'Tanda Terima', icon: Receipt, color: 'bg-green-50 text-green-700 hover:bg-green-100', description: 'Bukti tanda terima barang' },
        { id: 'surat_jalan', label: 'Surat Jalan', icon: Truck, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', description: 'Surat jalan pengiriman sapi' },
        { id: 'kwitansi', label: 'Kwitansi', icon: CreditCard, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', description: 'Kwitansi pembayaran' },
    ];

    const handleDownload = (docType) => {
        const itemId = item.pid || item.encryptedPid || item.pubid;
        // Trigger download — adjust URL to match your API
        const url = `/api/rph/po/download/${itemId}/${docType}`;
        window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Unduh Berkas</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Item info */}
                {item.no_po && (
                    <div className="px-6 pt-4">
                        <div className="bg-gray-50 rounded-xl p-3 text-sm">
                            <span className="text-gray-500">No. Pesanan:</span>{' '}
                            <span className="font-mono font-semibold text-gray-800">{item.no_po || item.nota}</span>
                        </div>
                    </div>
                )}

                {/* Document list */}
                <div className="p-6 space-y-3">
                    {documents.map((doc, index) => (
                        <button
                            key={doc.id}
                            onClick={() => handleDownload(doc.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 ${doc.color} transition-all duration-200 group`}
                        >
                            <div className="flex-shrink-0 p-2.5 bg-white/60 rounded-lg">
                                <doc.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-sm">{index + 1}. {doc.label}</p>
                                <p className="text-xs opacity-70 mt-0.5">{doc.description}</p>
                            </div>
                            <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button onClick={onClose} className="w-full px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnduhBerkasModal;