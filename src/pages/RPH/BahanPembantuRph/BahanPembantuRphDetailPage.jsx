import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, FileText, MapPin, Hash, Ruler, DollarSign, Truck, Users, CreditCard, Building2, MessageSquare, Calendar } from 'lucide-react';
import BahanPembantuRphService from '../../../services/bahanPembantuRphService';

const BahanPembantuRphDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // Auto hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Load detail data
    useEffect(() => {
        if (id) loadDetail();
    }, [id]);

    const showNotification = (type, message) => {
        setNotification({ type, message });
    };

    const loadDetail = async () => {
        setLoading(true);
        try {
            const result = await BahanPembantuRphService.show(id);
            if (result.success && result.data) {
                // Handle if data is array (take first element)
                const item = Array.isArray(result.data) ? result.data[0] : result.data;
                setData(item);
            } else {
                showNotification('error', 'Data tidak ditemukan');
                setTimeout(() => navigate('/rph/bahan-pembantu-rph'), 2000);
            }
        } catch (error) {
            showNotification('error', 'Gagal memuat data');
            setTimeout(() => navigate('/rph/bahan-pembantu-rph'), 2000);
        } finally {
            setLoading(false);
        }
    };

    // Currency formatting
    const formatCurrency = (value) => {
        if (!value && value !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Date formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Access fields with fallback for both snake_case and camelCase
    const getField = (field) => data?.[field] || data?.[field.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] || '';

    // Resolve jenis pembelian display value
    const getJenisPembelian = () => {
        const jenis = getField('jenis_pembelian');
        if (!jenis) return '-';
        if (jenis === 1 || jenis === '1' || String(jenis).toLowerCase() === 'bank') return 'Bank';
        if (jenis === 2 || jenis === '2' || String(jenis).toLowerCase() === 'kas') return 'Kas';
        return String(jenis);
    };

    // Resolve bank pengirim display value
    const getBankPengirim = () => {
        // Try relation object first
        if (data?.bank_pengirim?.nama) return data.bank_pengirim.nama;
        // Try flat field
        if (data?.nama_bank) return data.nama_bank;
        // Try bankPengirim camelCase relation
        if (data?.bankPengirim?.nama) return data.bankPengirim.nama;
        // If jenis is Kas, show dash
        const jenis = getJenisPembelian();
        if (jenis === 'Kas') return '-';
        // Fallback: show the raw bank_pengirim value if it's a string
        const raw = getField('bank_pengirim');
        if (raw && typeof raw === 'string') return raw;
        return '-';
    };

    // Reusable InfoCard component
    const InfoCard = ({ icon: Icon, label, value, colorFrom, colorTo, fullWidth = false }) => (
        <div className={`bg-gradient-to-r from-${colorFrom} to-${colorTo} p-4 rounded-2xl ${fullWidth ? 'md:col-span-3' : ''}`}>
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 break-words">{value || '-'}</p>
        </div>
    );

    const handleBack = () => {
        navigate('/rph/bahan-pembantu-rph');
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail bahan pembantu RPH...</p>
                </div>
            </div>
        );
    }

    // Error / no data state
    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <Package size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">Detail bahan pembantu RPH tidak dapat dimuat</p>
                    <button
                        onClick={handleBack}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 p-4 sm:p-8">
            <div className="w-full max-w-full space-y-6 sm:space-y-8">
                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
                        notification.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                Detail Bahan Pembantu RPH
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Informasi lengkap data bahan pembantu RPH
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Row 1: Nota Sistem | Nama Produk | Peruntukkan */}
                        <InfoCard
                            icon={FileText}
                            label="Nota Sistem"
                            value={getField('nota_sistem')}
                            colorFrom="blue-50"
                            colorTo="indigo-50"
                        />
                        <InfoCard
                            icon={Package}
                            label="Nama Produk"
                            value={getField('nama_produk')}
                            colorFrom="emerald-50"
                            colorTo="teal-50"
                        />
                        <InfoCard
                            icon={MapPin}
                            label="Peruntukkan"
                            value={getField('peruntukkan')}
                            colorFrom="purple-50"
                            colorTo="violet-50"
                        />

                        {/* Row 2: Qty | Satuan | Harga Satuan */}
                        <InfoCard
                            icon={Hash}
                            label="Qty"
                            value={getField('qty') ? `${getField('qty')} ${getField('satuan') || ''}`.trim() : '-'}
                            colorFrom="amber-50"
                            colorTo="yellow-50"
                        />
                        <InfoCard
                            icon={Ruler}
                            label="Satuan"
                            value={getField('satuan')}
                            colorFrom="cyan-50"
                            colorTo="sky-50"
                        />
                        <InfoCard
                            icon={DollarSign}
                            label="Harga Satuan"
                            value={formatCurrency(getField('harga_satuan'))}
                            colorFrom="green-50"
                            colorTo="emerald-50"
                        />

                        {/* Row 3: Pemasok | Biaya Kirim | Biaya Lain */}
                        <InfoCard
                            icon={Users}
                            label="Pemasok"
                            value={getField('pemasok')}
                            colorFrom="rose-50"
                            colorTo="pink-50"
                        />
                        <InfoCard
                            icon={Truck}
                            label="Biaya Kirim"
                            value={formatCurrency(getField('biaya_kirim'))}
                            colorFrom="orange-50"
                            colorTo="amber-50"
                        />
                        <InfoCard
                            icon={DollarSign}
                            label="Biaya Lain"
                            value={formatCurrency(getField('biaya_lain'))}
                            colorFrom="slate-50"
                            colorTo="gray-50"
                        />

                        {/* Row 4: Biaya Total | Jenis Pembelian | Bank Pengirim */}
                        <InfoCard
                            icon={DollarSign}
                            label="Biaya Total"
                            value={formatCurrency(getField('biaya_total'))}
                            colorFrom="emerald-50"
                            colorTo="green-50"
                        />
                        <InfoCard
                            icon={CreditCard}
                            label="Jenis Pembelian"
                            value={getJenisPembelian()}
                            colorFrom="indigo-50"
                            colorTo="blue-50"
                        />
                        <InfoCard
                            icon={Building2}
                            label="Bank Pengirim"
                            value={getBankPengirim()}
                            colorFrom="teal-50"
                            colorTo="cyan-50"
                        />

                        {/* Row 5: Keterangan (full width) */}
                        <InfoCard
                            icon={MessageSquare}
                            label="Keterangan"
                            value={getField('keterangan')}
                            colorFrom="gray-50"
                            colorTo="slate-50"
                            fullWidth
                        />

                        {/* Row 6: Tanggal Dibuat (full width) */}
                        <InfoCard
                            icon={Calendar}
                            label="Tanggal Dibuat"
                            value={formatDate(data?.created_at || data?.createdAt)}
                            colorFrom="sky-50"
                            colorTo="blue-50"
                            fullWidth
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BahanPembantuRphDetailPage;
