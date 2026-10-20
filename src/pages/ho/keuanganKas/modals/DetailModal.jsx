import React, { useState, useEffect } from 'react';
import {
    X,
    FileText,
    Calendar,
    DollarSign,
    User,
    Building2,
    Tag,
    CheckCircle2,
    Hash,
    Clock,
    CreditCard,
    Eye,
    Banknote,
    AlertCircle,
    Loader2
} from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import { openPaymentProofInNewTab } from '../../../../services/paymentProof';

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

const StatusBadge = ({ status, statusText }) => {
    const text = (statusText || status || '').toString();
    const textLower = text.toLowerCase();

    let bgClass = 'bg-yellow-50';
    let borderClass = 'border-yellow-300';
    let textClass = 'text-yellow-700';
    let Icon = Clock;
    let label = text || 'Pending';

    if (textLower.includes('lunas') && !textLower.includes('belum')) {
        bgClass = 'bg-green-50';
        borderClass = 'border-green-300';
        textClass = 'text-green-700';
        Icon = CheckCircle2;
        label = 'Lunas';
    } else if (textLower.includes('belum bayar') || textLower.includes('belum dibayar')) {
        bgClass = 'bg-red-50';
        borderClass = 'border-red-300';
        textClass = 'text-red-700';
        Icon = AlertCircle;
        label = 'Belum Bayar';
    } else if (textLower.includes('belum lunas')) {
        bgClass = 'bg-amber-50';
        borderClass = 'border-amber-300';
        textClass = 'text-amber-700';
        Icon = Clock;
        label = 'Belum Lunas';
    } else if (textLower.includes('disetujui') && !textLower.includes('sebagian')) {
        bgClass = 'bg-green-50';
        borderClass = 'border-green-300';
        textClass = 'text-green-700';
        Icon = CheckCircle2;
        label = 'Disetujui';
    } else if (textLower.includes('sebagian')) {
        bgClass = 'bg-blue-50';
        borderClass = 'border-blue-300';
        textClass = 'text-blue-700';
        Icon = Clock;
        label = 'Disetujui Sebagian';
    } else if (textLower.includes('ditolak')) {
        bgClass = 'bg-red-50';
        borderClass = 'border-red-300';
        textClass = 'text-red-700';
        Icon = AlertCircle;
        label = 'Ditolak';
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${bgClass} ${borderClass} ${textClass}`}>
            <Icon size={16} />
            <span>{label}</span>
        </div>
    );
};

const DetailModal = ({ isOpen, onClose, data, onBayar, historyOverride }) => {
    const [fetchedHistory, setFetchedHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const providedHistory = Array.isArray(historyOverride) ? historyOverride : null;
    const paymentHistory = providedHistory || fetchedHistory;

    const isPengajuan = Boolean(
        data && (data.nomor_pengajuan || data.yang_mengajukan || (data.purchase_type === 7 && !data.nota && !data.nota_sistem))
    );

    const handleViewProof = async (item) => {
        const source = item?.bukti_pembayaran_url || item?.bukti_url || item?.bukti_pembayaran;
        if (!source) return;
        try {
            await openPaymentProofInNewTab(source);
        } catch (err) {
            console.error('Gagal membuka bukti pembayaran:', err);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            if (providedHistory) {
                return;
            }
            if (!isOpen || !data?.id_pembayaran || isPengajuan) {
                setFetchedHistory([]);
                return;
            }
            setLoadingHistory(true);
            try {
                const res = await HttpClient.get(
                    `${API_ENDPOINTS.HO.PAYMENT.DETAILS}?id_pembayaran=${data.id_pembayaran}`,
                    { cache: false }
                );
                if (isMounted && res && (res.success || res.status === 'ok')) {
                    const raw = res.data;
                    const items = Array.isArray(raw)
                        ? raw
                        : Array.isArray(raw?.data)
                            ? raw.data
                            : Array.isArray(raw?.details)
                                ? raw.details
                                : [];
                    setFetchedHistory(items);
                }
            } catch (err) {
                console.error('Error fetching payment history for detail modal:', err);
            } finally {
                if (isMounted) setLoadingHistory(false);
            }
        };

        fetchHistory();
        return () => {
            isMounted = false;
        };
    }, [isOpen, data?.id_pembayaran, isPengajuan, providedHistory]);

    if (!isOpen || !data) return null;

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === '') return 'Rp 0';
        const num = Number(value);
        if (isNaN(num)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
            const [dd, mm, yyyy] = dateString.split('-');
            const d = new Date(`${yyyy}-${mm}-${dd}`);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }
        const d = new Date(dateString);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        return dateString;
    };

    const totalTagihan = Number(data.total_tagihan ?? data.nominal) || 0;
    const totalTerbayar = Number(data.total_terbayar) || 0;
    const sisa = Number(data.sisa) !== undefined && !isNaN(Number(data.sisa))
        ? Number(data.sisa)
        : Math.max(0, totalTagihan - totalTerbayar);
    const notaDisplay = data.nota || data.nota_sistem || '-';

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
                            <h2 className="text-2xl font-bold text-white">
                                {isPengajuan ? 'Detail Pengajuan Biaya' : 'Detail Pengeluaran'}
                            </h2>
                            <p className="text-sm text-blue-100 font-medium mt-1">
                                {isPengajuan
                                    ? (data.nomor_pengajuan ? `No. ${data.nomor_pengajuan}` : '-')
                                    : (notaDisplay !== '-' ? `No. ${notaDisplay}` : '-')}
                            </p>
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
                <div className="flex-grow p-6 sm:p-8 overflow-y-auto bg-gray-50">
                    <div className="space-y-6">
                        {/* Status Section */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Status</h3>
                                <StatusBadge
                                    status={isPengajuan ? data.status : data.payment_status}
                                    statusText={isPengajuan ? data.status : data.payment_status_text}
                                />
                            </div>
                        </div>

                        {isPengajuan ? (
                            <>
                                {/* Main Information Pengajuan */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200">
                                        Informasi Pengajuan
                                    </h3>
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
                                                    {formatCurrency(data.nominal || data.nominal_pengajuan)}
                                                </span>
                                            }
                                            highlight={true}
                                        />
                                        <DetailItem
                                            icon={<DollarSign size={20} />}
                                            label="Nominal Disetujui"
                                            value={
                                                <span className="text-xl font-bold text-blue-600">
                                                    {formatCurrency(data.nominal_disetujui || data.nominal)}
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
                                            value={data.yang_mengajukan || data.nama_pengaju}
                                        />
                                        <DetailItem
                                            icon={<CheckCircle2 size={20} />}
                                            label="Disetujui Oleh"
                                            value={data.persetujuan_ho || data.disetujui_oleh || '-'}
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
                            </>
                        ) : (
                            <>
                                {/* Main Information Pengeluaran */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200">
                                        Informasi Pengeluaran
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DetailItem
                                            icon={<Hash size={20} />}
                                            label="Nomor Nota"
                                            value={data.nota || '-'}
                                        />
                                        <DetailItem
                                            icon={<Hash size={20} />}
                                            label="Nomor Nota Sistem / PO"
                                            value={data.nota_sistem || '-'}
                                        />
                                        <DetailItem
                                            icon={<Tag size={20} />}
                                            label="Jenis Pengeluaran"
                                            value={data.purchase_type_name || data.kategori || '-'}
                                        />
                                        {(data.penerima || data.nama_supplier) && (
                                            <DetailItem
                                                icon={<User size={20} />}
                                                label="Penerima / Supplier"
                                                value={data.penerima || data.nama_supplier}
                                            />
                                        )}
                                        <DetailItem
                                            icon={<CreditCard size={20} />}
                                            label="Metode Pembayaran"
                                            value={data.payment_type_name || (data.payment_type === 1 ? 'KAS' : data.payment_type === 2 ? 'BANK' : data.metode || '-')}
                                        />
                                        <DetailItem
                                            icon={<Calendar size={20} />}
                                            label="Tanggal Masuk"
                                            value={formatDate(data.tgl_masuk || data.tgl_pengeluaran)}
                                        />
                                        <DetailItem
                                            icon={<Calendar size={20} />}
                                            label="Jatuh Tempo"
                                            value={formatDate(data.due_date)}
                                        />
                                        {data.settlement_date && (
                                            <DetailItem
                                                icon={<Calendar size={20} />}
                                                label="Tanggal Pelunasan"
                                                value={formatDate(data.settlement_date)}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Ringkasan Tagihan */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-200">
                                        Ringkasan Pembayaran
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Tagihan</p>
                                            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalTagihan)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Sudah Dibayar</p>
                                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalTerbayar)}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${sisa > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                            <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${sisa > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Sisa Tagihan</p>
                                            <p className={`text-lg font-bold ${sisa > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatCurrency(sisa)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Riwayat Pembayaran */}
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <Clock size={18} className="text-blue-600" />
                                            Riwayat Pembayaran
                                        </h3>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                            {paymentHistory.length} record
                                        </span>
                                    </div>
                                    {loadingHistory ? (
                                        <div className="py-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span>Memuat riwayat pembayaran...</span>
                                        </div>
                                    ) : paymentHistory.length === 0 ? (
                                        <div className="py-6 text-center text-sm text-gray-400">
                                            Belum ada riwayat pembayaran yang dicatat.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-3 py-2 text-center w-12">No</th>
                                                        <th className="px-3 py-2">Tanggal</th>
                                                        <th className="px-3 py-2 text-right">Nominal</th>
                                                        <th className="px-3 py-2">Catatan</th>
                                                        <th className="px-3 py-2 text-center w-20">Bukti</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {paymentHistory.map((item, idx) => (
                                                        <tr key={item.id || idx} className="hover:bg-gray-50/50">
                                                            <td className="px-3 py-2.5 text-center text-xs text-gray-400">{idx + 1}</td>
                                                            <td className="px-3 py-2.5 text-gray-700 font-medium">
                                                                {formatDate(item.payment_date || item.tanggal_pembayaran || item.created_at)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                                                                {formatCurrency(item.amount || item.nominal)}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-600">
                                                                {item.note || item.description || item.catatan || '-'}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                {(item.bukti_pembayaran_url || item.bukti_url) ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleViewProof(item)}
                                                                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                                        title="Lihat Bukti"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-xs text-gray-300">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
                    {onBayar && !isPengajuan && sisa > 0 && (
                        <button
                            onClick={() => {
                                onClose();
                                onBayar(data);
                            }}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-sm"
                        >
                            <Banknote size={16} />
                            Bayar Sekarang
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailModal;
