import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Receipt, Truck, CreditCard, Download } from 'lucide-react';
import QurbanService from '../../../../../services/qurban/qurbanService';

const UnduhBerkasModal = ({ isOpen, onClose, item, onNotification }) => {
    const dialogRef = useRef(null);
    const downloading = useRef(false);
    const [pending, setPending] = useState(null);
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (!isOpen || !item) return;
        const previous = document.activeElement;
        const dialog = dialogRef.current;
        setMessage('');
        dialog?.showModal();
        return () => {
            dialog?.close();
            previous?.focus();
        };
    }, [isOpen, item]);
    if (!isOpen || !item) return null;
    const close = () => { if (!downloading.current) onClose(); };

    const documents = [
        { id: 'pesanan', label: 'Pesanan Pembelian', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', description: 'Dokumen pesanan pembelian sapi qurban' },
        { id: 'tanda_terima', label: 'Tanda Terima', icon: Receipt, color: 'bg-green-50 text-green-700 hover:bg-green-100', description: 'Bukti tanda terima barang' },
        { id: 'surat_jalan', label: 'Surat Jalan', icon: Truck, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', description: 'Surat jalan pengiriman sapi' },
        { id: 'kwitansi', label: 'Kwitansi', icon: CreditCard, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', description: 'Kwitansi pembayaran' },
    ];

    const handleDownload = async (docType) => {
        if (downloading.current) return;
        const itemId = item.pid || item.encryptedPid;
        if (!itemId) return onNotification?.({ type: 'error', message: 'ID transaksi tidak tersedia.' });
        downloading.current = true;
        setPending(docType);
        setMessage('Memproses dokumen qurban...');
        onNotification?.({ type: 'info', message: 'Memproses dokumen qurban...' });
        try {
            const blob = await QurbanService.downloadDocument(itemId, docType);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${docType}_qurban_${String(item.nota_sistem || 'transaksi').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            setMessage('Dokumen qurban berhasil diunduh.');
            onNotification?.({ type: 'success', message: 'Dokumen qurban berhasil diunduh.' });
        } catch (error) {
            setMessage(error.message || 'Gagal mengunduh dokumen qurban.');
            onNotification?.({ type: 'error', message: error.message || 'Gagal mengunduh dokumen qurban.' });
        } finally {
            downloading.current = false;
            setPending(null);
        }
    };

    return (
        <dialog ref={dialogRef} aria-labelledby="qurban-documents-title" aria-busy={!!pending} onCancel={e => { e.preventDefault(); close(); }} className="p-0 rounded-2xl w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto backdrop:bg-black/50">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <h2 id="qurban-documents-title" className="text-lg font-bold">Unduh Berkas</h2>
                    </div>
                    <button onClick={close} disabled={!!pending} aria-label="Tutup unduh berkas" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
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
                    <p role="status" className="text-sm text-gray-700">{message}</p>
                    {!(Number(item.total_terbayar) > 0) && <p className="text-xs text-gray-600">Kwitansi tersedia setelah ada pembayaran.</p>}
                    {documents.map((doc, index) => (
                        <button
                            key={doc.id}
                            disabled={!!pending || !(item.pid || item.encryptedPid) || (doc.id === 'kwitansi' && !(Number(item.total_terbayar) > 0))}
                            onClick={() => handleDownload(doc.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 ${doc.color} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group`}
                        >
                            <div className="flex-shrink-0 p-2.5 bg-white/60 rounded-lg">
                                <doc.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-sm">{index + 1}. {doc.label}{pending === doc.id ? ' (Memproses...)' : ''}</p>
                                <p className="text-xs opacity-70 mt-0.5">{doc.description}</p>
                            </div>
                            <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button onClick={close} disabled={!!pending} className="w-full px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default UnduhBerkasModal;
