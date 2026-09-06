
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2, ShoppingCart, X, AlertCircle, CheckCircle2, Upload, Hash } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import useParameterSelect from '../Pembelian Sapi/hooks/useParameterSelect';
import usePersetujuanRphSelect from '../Pembelian Sapi/hooks/usePersetujuanRphSelect';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import QurbanService from '../../../../services/qurban/qurbanService';
import PilihSapiModal from './modals/PilihSapiModal';
import PilihNotaModal from './modals/PilihNotaModal';
import { FileText, Search } from 'lucide-react';

const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    return Number(num).toLocaleString('id-ID');
};

const parseNumber = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(/,/g, '.')) || 0;
};

const AddEditPembelianQurbanPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const { officeOptions, loading: paramLoading } = useParameterSelect(false, {}, [], null, ['office']);
    const { persetujuanOptions, loading: persetujuanLoading } = usePersetujuanRphSelect();
    const pemasokOptions = useMemo(() => officeOptions || [], [officeOptions]);
    const defaultPemasokId = useMemo(() => {
        const opt = pemasokOptions.find(o => String(o.label || '').toUpperCase().includes('PUPUT BERSAUDARA'));
        return opt ? opt.value : '';
    }, [pemasokOptions]);
    const [selectedNotaInfo, setSelectedNotaInfo] = useState(null);
    const tipePembayaranOpts = useMemo(() => [{ value: 1, label: 'Kas' }, { value: 2, label: 'Bank' }], []);

    const [bankOptions, setBankOptions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setBankLoading(true);
            try {
                const r = await HttpClient.get(`${API_ENDPOINTS.MASTER.BANK}/all`);
                const d = r?.data && Array.isArray(r.data) ? r.data : Array.isArray(r) ? r : [];
                setBankOptions(d.map(b => ({ value: b.id, label: b.display_name || b.nama || b.name })));
            } catch { setBankOptions([]); }
            finally { setBankLoading(false); }
        })();
    }, []);

    // F-20: Window periode Qurban aktif (dari sys_ms_parameter grup 'periode_qurban').
    // Default kosong = fallback aman (validasi dilewati), selaras dengan gate backend.
    const [periodeQurban, setPeriodeQurban] = useState({ start: '', end: '' });
    useEffect(() => {
        (async () => {
            try {
                const r = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`, { params: { groups: 'periode_qurban' } });
                const list = r?.data?.[0]?.periode_qurban || [];
                const start = list.find(x => x.name === 'start_date')?.value || '';
                const end = list.find(x => x.name === 'end_date')?.value || '';
                setPeriodeQurban({ start, end });
                // Default tanggal ke awal periode Qurban (bukan hari ini) saat mode tambah.
                if (!isEditMode && start) {
                    setFormData(prev => ({
                        ...prev,
                        tanggal_pemesanan: prev.tanggal_pemesanan || start,
                        tanggal_kedatangan_sapi: prev.tanggal_kedatangan_sapi || start,
                    }));
                }
            } catch (err) {
                console.error('Gagal memuat periode Qurban:', err);
                setPeriodeQurban({ start: '', end: '' });
            }
        })();
    }, [isEditMode]);

    const [isPilihNotaOpen, setIsPilihNotaOpen] = useState(false);

    const [formData, setFormData] = useState({
        id_pemasok: '', nama_penerima: '',
        tanggal_pemesanan: '',
        tanggal_kedatangan_sapi: '',
        id_nota: '', id_persetujuan_rph: '', tipe_pembayaran: '1',
        id_syarat_pembayaran: 1, note: '',
    });
    const [selectedSapi, setSelectedSapi] = useState([]);
    const [isPilihSapiOpen, setIsPilihSapiOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const isBank = String(formData.tipe_pembayaran) === '2';

    // Default Pemasok: HO CV. PUPUT BERSAUDARA (readonly, only on add mode)
    useEffect(() => {
        if (!isEditMode && defaultPemasokId && !formData.id_pemasok) {
            setFormData(prev => ({ ...prev, id_pemasok: defaultPemasokId }));
        }
    }, [isEditMode, defaultPemasokId, formData.id_pemasok]);

    // Nota fetching now happens inside PilihNotaModal with server-side pagination

    useEffect(() => {
        if (!isEditMode || !id) return;
        (async () => {
            setIsLoadingDetail(true);
            try {
                const r = await QurbanService.getDetail(id);
                if (r.success && r.data) {
                    const d = Array.isArray(r.data) ? r.data[0] || r.data : r.data;
                    setFormData({
                        id_pemasok: d.id_pemasok || '',
                        nama_penerima: d.nama_penerima || '',
                        tanggal_pemesanan: d.tanggal_pemesanan ? d.tanggal_pemesanan.split(' ')[0] : '',
                        tanggal_kedatangan_sapi: d.tanggal_kedatangan_sapi ? d.tanggal_kedatangan_sapi.split(' ')[0] : '',
                        id_nota: d.id_nota || '', id_persetujuan_rph: d.id_persetujuan_rph || '',
                        tipe_pembayaran: d.tipe_pembayaran ? String(d.tipe_pembayaran) : '1',
                        id_syarat_pembayaran: d.id_syarat_pembayaran || '', note: d.note || '',
                    });
                    setFilePreview(d.file || null);
                    setSelectedFile(null);
                    if (d.id_nota) {
                        const ho = d.pembelian_ho || d.pembelianHo || {};
                        const sup = ho.supplier || {};
                        setSelectedNotaInfo({
                            id_pembelian_ho: d.id_nota,
                            nota: ho.nota || ho.nota_sistem || d.nota || '-',
                            nama_supplier: sup.name || d.nama_supplier || '-',
                            jenis_supplier: sup.jenis_supplier ?? d.jenis_supplier ?? null,
                        });
                    }
                    if (d.details && Array.isArray(d.details)) {
                        setSelectedSapi(d.details.map(x => {
                            const berat = parseFloat(x.hewan_details?.berat || 0);
                            const totalBeli = parseFloat(x.harga_beli) || 0;
                            return {
                                id_hewan: x.id_hewan,
                                eartag: x.hewan_details?.eartag || '-',
                                code_eartag: x.hewan_details?.code_eartag || '-',
                                eartag_supplier: x.hewan_details?.eartag_supplier || '-',
                                berat,
                                harga_beli: berat > 0 ? totalBeli / berat : 0,
                            };
                        }));
                    }
                } else {
                    setNotification({ type: 'error', message: r.message || 'Gagal memuat data detail' });
                }
            } catch (e) {
                console.error('Error loading edit detail:', e);
                setNotification({ type: 'error', message: 'Gagal memuat data untuk edit' });
            } finally { setIsLoadingDetail(false); }
        })();
    }, [isEditMode, id]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => {
            const u = { ...prev, [field]: value };
            if (field === 'id_pemasok') { u.id_nota = ''; setSelectedSapi([]); setSelectedNotaInfo(null); }
            if (field === 'id_nota') setSelectedSapi([]);
            if (field === 'tipe_pembayaran') {
                if (String(value) === '1') {
                    u.id_syarat_pembayaran = 1;
                } else {
                    u.id_syarat_pembayaran = '';
                }
            }
            return u;
        });
    }, []);

    const handleSelectSapi = useCallback((item) => {
        setSelectedSapi(prev => {
            const hid = item.id || item.id_hewan;
            if (prev.some(s => s.id_hewan === hid)) return prev;
            const berat = parseFloat(item.berat || 0);
            const totalHarga = parseFloat(item.total_harga || item.harga_beli || 0);
            const perKilo = berat > 0 ? totalHarga / berat : 0;
            return [...prev, {
                id_hewan: hid, eartag: item.eartag || '-', code_eartag: item.code_eartag || '-',
                eartag_supplier: item.eartag_supplier || '-', berat,
                harga_beli: perKilo,
            }];
        });
    }, []);

    const handleRemoveSapi = useCallback((hid) => { setSelectedSapi(prev => prev.filter(s => s.id_hewan !== hid)); }, []);
    const handleSelectNota = useCallback((nota) => {
        setFormData(prev => ({ ...prev, id_nota: nota.id_pembelian_ho }));
        setSelectedNotaInfo({
            id_pembelian_ho: nota.id_pembelian_ho,
            nota: nota.nota || nota.nota_sistem || '-',
            nama_supplier: nota.nama_supplier || '-',
            jenis_supplier: nota.jenis_supplier,
        });
        setSelectedSapi([]);
    }, []);

    const handleHargaChange = useCallback((hid, val) => { setSelectedSapi(prev => prev.map(s => s.id_hewan === hid ? { ...s, harga_beli: parseFloat(val) || 0 } : s)); }, []);

    const handleFileChange = useCallback((e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) {
            setNotification({ type: 'error', message: 'Ukuran file maksimal 2MB' });
            e.target.value = '';
            return;
        }
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowed.includes(f.type)) {
            setNotification({ type: 'error', message: 'Format file harus JPG, JPEG, PNG, atau PDF' });
            e.target.value = '';
            return;
        }
        setSelectedFile(f);
        setFilePreview(null);
    }, []);

    const handleRemoveFile = useCallback(() => {
        setSelectedFile(null);
        setFilePreview(null);
    }, []);

    const excludeIds = useMemo(() => selectedSapi.map(s => s.id_hewan), [selectedSapi]);
    const filteredBankOptions = useMemo(() => bankOptions.filter(o => o.value !== 1), [bankOptions]);

    const handleSubmit = async () => {
        // F-20: rentang aktif; string comparison aman untuk format YYYY-MM-DD.
        const { start: pqStart, end: pqEnd } = periodeQurban;
        const outOfRange = (d) => (pqStart && pqEnd) ? (d < pqStart || d > pqEnd) : false;
        const checks = [
            [!formData.id_pemasok, 'Pemasok harus dipilih'],
            [!formData.id_nota, 'Nota harus dipilih'],
            [!formData.nama_penerima?.trim(), 'Nama Penerima harus diisi'],
            [!formData.tanggal_pemesanan, 'Tanggal Pemesanan harus diisi'],
            [!formData.tanggal_kedatangan_sapi, 'Tanggal Kedatangan Sapi harus diisi'],
            [outOfRange(formData.tanggal_pemesanan), `Tanggal Pemesanan harus berada dalam periode Qurban aktif (${pqStart} s/d ${pqEnd})`],
            [outOfRange(formData.tanggal_kedatangan_sapi), `Tanggal Kedatangan Sapi harus berada dalam periode Qurban aktif (${pqStart} s/d ${pqEnd})`],
            [!formData.id_persetujuan_rph, 'Persetujuan RPH harus dipilih'],
            [!formData.tipe_pembayaran, 'Tipe Pembayaran harus dipilih'],
            [selectedSapi.length === 0, 'Minimal harus memilih 1 sapi'],
        ];
        for (const [cond, msg] of checks) { if (cond) { setNotification({ type: 'error', message: msg }); return; } }
        setIsSubmitting(true);
        setNotification({ type: 'info', message: isEditMode ? 'Memperbarui data...' : 'Menyimpan data...' });
        try {
            const totalHarga = selectedSapi.reduce((s, x) => s + (Number(x.harga_beli || 0) * Number(x.berat || 0)), 0);
            const payload = {
                id_pemasok: parseInt(formData.id_pemasok),
                jenis_pembelian: selectedNotaInfo?.jenis_supplier ? (parseInt(selectedNotaInfo.jenis_supplier) === 1 ? 1 : 2) : null,
                nama_penerima: formData.nama_penerima.trim(),
                tanggal_pemesanan: formData.tanggal_pemesanan,
                tanggal_kedatangan_sapi: formData.tanggal_kedatangan_sapi,
                id_nota: formData.id_nota ? parseInt(formData.id_nota) : null,
                id_persetujuan_rph: parseInt(formData.id_persetujuan_rph),
                tipe_pembayaran: parseInt(formData.tipe_pembayaran),
                id_syarat_pembayaran: formData.id_syarat_pembayaran ? parseInt(formData.id_syarat_pembayaran) : null,
                total_harga: totalHarga, note: formData.note || null,
                details: selectedSapi.map(s => ({ id_hewan: parseInt(s.id_hewan), harga_beli: parseFloat(s.harga_beli) * parseFloat(s.berat || 0) })),
            };
            if (selectedFile) payload.file = selectedFile;
            if (isEditMode) payload.pid = id;
            const result = isEditMode ? await QurbanService.update(payload) : await QurbanService.create(payload);
            if (result.success) {
                setNotification({ type: 'success', message: result.message || 'Data berhasil disimpan!' });
                setTimeout(() => navigate('/rph/pembelian-sapi-qurban'), 1200);
            } else { setNotification({ type: 'error', message: result.message || 'Gagal menyimpan data' }); }
        } catch (err) { setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' }); }
        finally { setIsSubmitting(false); }
    };

    const handleBack = () => navigate('/rph/pembelian-sapi-qurban');
    useEffect(() => { if (notification) { const t = setTimeout(() => setNotification(null), 5000); return () => clearTimeout(t); } }, [notification]);

    if (isLoadingDetail) {
        return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center"><div className="text-center"><Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-3" /><p className="text-gray-500 font-medium">Memuat data...</p></div></div>);
    }

    const renderSyaratPembayaran = () => {
        if (isBank) {
            return (<SearchableSelect value={formData.id_syarat_pembayaran} onChange={v => handleChange('id_syarat_pembayaran', v)} options={filteredBankOptions} placeholder={bankLoading ? 'Loading...' : 'Pilih Bank / Syarat Pembayaran'} isLoading={bankLoading} isDisabled={bankLoading} />);
        }
        return (
            <div className="relative">
                <input type="text" value="[001] KAS" readOnly disabled className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 cursor-not-allowed" />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                .table-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
                .table-scroll::-webkit-scrollbar-track { background: transparent; }
                .table-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .table-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .table-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
            `}</style>

            <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
                {/* === Sticky Header === */}
                <header className="shrink-0 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={handleBack} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                                    <ShoppingCart className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
                                        {isEditMode ? 'Edit Pembelian Sapi Qurban' : 'Tambah Pembelian Sapi Qurban'}
                                    </h1>
                                    <p className="text-xs text-slate-500 truncate hidden sm:block">
                                        {isEditMode ? 'Perbarui data pembelian sapi qurban' : 'Tambahkan data pembelian sapi qurban baru'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={handleBack} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* === Main Content === */}
                <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
                    <div className="flex flex-col gap-4">
                        {/* Header Form */}
                        <section className="rounded-xl border border-slate-200 bg-white">
                            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                    <Hash className="h-3.5 w-3.5 text-emerald-600" />
                                    Data Pembelian
                                </h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pemasok *</label>
                                    <SearchableSelect value={formData.id_pemasok} onChange={v => handleChange('id_pemasok', v)} options={pemasokOptions} placeholder={paramLoading ? '...' : 'Pilih Pemasok'} isLoading={paramLoading} isDisabled={true} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Nota *</label>
                                    {selectedNotaInfo ? (
                                        <div className="flex items-center justify-between gap-2 px-2.5 py-2 border border-emerald-200 bg-emerald-50 rounded-lg">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-xs font-medium text-slate-900 truncate">{selectedNotaInfo.nota}</div>
                                                    <div className="text-[10px] text-slate-500 truncate">
                                                        {selectedNotaInfo.nama_supplier}
                                                        {selectedNotaInfo.jenis_supplier && (
                                                            <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium border ${parseInt(selectedNotaInfo.jenis_supplier) === 1 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                                {parseInt(selectedNotaInfo.jenis_supplier) === 1 ? 'Import' : 'Lokal'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setIsPilihNotaOpen(true)} className="text-[10px] text-emerald-700 hover:text-emerald-800 font-medium whitespace-nowrap">Ubah</button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setIsPilihNotaOpen(true)} disabled={!formData.id_pemasok} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            <Search className="h-3.5 w-3.5" />
                                            {!formData.id_pemasok ? 'Pilih pemasok dulu' : 'Cari & Pilih Nota'}
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Penerima *</label>
                                    <input type="text" value={formData.nama_penerima} onChange={e => handleChange('nama_penerima', e.target.value)} maxLength={50} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none" placeholder="Masukkan nama penerima" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tgl Pemesanan *</label>
                                    <input type="date" value={formData.tanggal_pemesanan} min={periodeQurban.start || undefined} max={periodeQurban.end || undefined} onChange={e => handleChange('tanggal_pemesanan', e.target.value)} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tgl Kedatangan *</label>
                                    <input type="date" value={formData.tanggal_kedatangan_sapi} min={periodeQurban.start || undefined} max={periodeQurban.end || undefined} onChange={e => handleChange('tanggal_kedatangan_sapi', e.target.value)} className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Persetujuan RPH *</label>
                                    <SearchableSelect value={formData.id_persetujuan_rph} onChange={v => handleChange('id_persetujuan_rph', v)} options={persetujuanOptions.filter(o => o.value !== '')} placeholder={persetujuanLoading ? '...' : 'Pilih Persetujuan'} isLoading={persetujuanLoading} isDisabled={persetujuanLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Pembayaran *</label>
                                    <SearchableSelect value={formData.tipe_pembayaran ? parseInt(formData.tipe_pembayaran) : ''} onChange={v => handleChange('tipe_pembayaran', String(v))} options={tipePembayaranOpts} placeholder="Pilih Tipe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Syarat Pembayaran {isBank && '*'}</label>
                                    {renderSyaratPembayaran()}
                                </div>
                                {/* Catatan */}
                                <div className="col-span-full md:col-span-2 xl:col-span-2 xl:row-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan</label>
                                    <textarea value={formData.note} onChange={e => handleChange('note', e.target.value)} rows="4" maxLength={255} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none resize-none" placeholder="Catatan tambahan (opsional, maks 255 karakter)" />
                                </div>
                                {/* File Upload */}
                                <div className="col-span-full md:col-span-2 xl:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Upload File</label>
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer">
                                            <Upload className="h-4 w-4" />
                                            Upload
                                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
                                        </label>
                                        {selectedFile && (
                                            <>
                                                <span className="flex-1 min-w-0 truncate text-xs text-slate-600">{selectedFile.name}</span>
                                                <button type="button" onClick={handleRemoveFile} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors" title="Hapus file">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {!selectedFile && filePreview && (
                                            <>
                                                <a href={filePreview} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-xs text-blue-700 hover:underline">Lihat file existing</a>
                                                <button type="button" onClick={handleRemoveFile} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors" title="Hapus file">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {!selectedFile && !filePreview && (
                                            <span className="text-[10px] text-slate-400">JPG/PNG/PDF (maks 2MB)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                {/* Sapi Detail Table */}
                <section className="rounded-xl border border-slate-200 bg-white flex flex-col">
                    <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                            Daftar Sapi
                            <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {selectedSapi.length}
                            </span>
                        </h3>
                        <button onClick={() => setIsPilihSapiOpen(true)} disabled={!formData.id_nota} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Sapi
                        </button>
                    </div>
                    {selectedSapi.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-600">Belum ada sapi dipilih</p>
                            <p className="text-xs text-slate-400 mt-1">{!formData.id_nota ? 'Pilih nota terlebih dahulu' : 'Klik "Tambah Sapi" untuk memilih'}</p>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-x-auto table-scroll">
                            <table className="min-w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600 w-10">No</th>
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[120px]">Code Eartag</th>
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[120px]">Eartag</th>
                                        <th className="px-2 py-2 text-left font-semibold text-slate-600 hidden sm:table-cell min-w-[120px]">Eartag Supplier</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600 w-20">Berat (Kg)</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-[140px]">Harga/Kg</th>
                                        <th className="px-2 py-2 text-right font-semibold text-slate-600 min-w-[120px]">Subtotal</th>
                                        <th className="px-2 py-2 text-center font-semibold text-slate-600 w-14">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSapi.map((sapi, idx) => {
                                        const subtotal = (Number(sapi.harga_beli || 0) * Number(sapi.berat || 0));
                                        return (
                                            <tr key={sapi.id_hewan} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-2 py-1.5 text-slate-600">{idx + 1}</td>
                                                <td className="px-2 py-1.5 text-slate-700">{sapi.code_eartag || '-'}</td>
                                                <td className="px-2 py-1.5 text-slate-700">{sapi.eartag || '-'}</td>
                                                <td className="px-2 py-1.5 text-slate-700 hidden sm:table-cell">{sapi.eartag_supplier || '-'}</td>
                                                <td className="px-2 py-1.5 text-slate-700 text-right tabular-nums">{parseFloat(sapi.berat || 0).toLocaleString('id-ID')}</td>
                                                <td className="px-2 py-1.5 text-right">
                                                    <input type="text" value={formatNumber(sapi.harga_beli)} onChange={e => { const raw = parseNumber(e.target.value); handleHargaChange(sapi.id_hewan, raw); }} className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none" />
                                                </td>
                                                <td className="px-2 py-1.5 text-right font-semibold text-emerald-700 tabular-nums">{formatNumber(subtotal)}</td>
                                                <td className="px-2 py-1.5 text-center">
                                                    <button onClick={() => handleRemoveSapi(sapi.id_hewan)} className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors" title="Hapus sapi">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {selectedSapi.length > 0 && (
                        <div className="shrink-0 grid grid-cols-3 gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Sapi</p>
                                <p className="text-sm font-bold text-slate-900 tabular-nums">{selectedSapi.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Berat</p>
                                <p className="text-sm font-bold text-slate-900 tabular-nums">{formatNumber(selectedSapi.reduce((s, x) => s + Number(x.berat || 0), 0))} kg</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Harga</p>
                                <p className="text-sm font-bold text-emerald-700 tabular-nums">Rp {formatNumber(selectedSapi.reduce((s, x) => s + (Number(x.harga_beli || 0) * Number(x.berat || 0)), 0))}</p>
                            </div>
                        </div>
                    )}
                </section>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${notification.type === 'success' ? 'border-green-500' : notification.type === 'info' ? 'border-blue-500' : 'border-red-500'}`}>
                        <div className="p-4 flex items-start">
                            <div className="flex-shrink-0">
                                {notification.type === 'success' ? (
                                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                ) : notification.type === 'info' ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Memproses...' : 'Error!'}</p>
                                <p className="mt-0.5 text-sm text-gray-500">{notification.message}</p>
                            </div>
                            <button onClick={() => setNotification(null)} className="ml-3 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pilih Sapi Modal */}
            <PilihSapiModal isOpen={isPilihSapiOpen} onClose={() => setIsPilihSapiOpen(false)} onSelect={handleSelectSapi} notaId={formData.id_nota} excludeIds={excludeIds} onClearAll={() => setSelectedSapi([])} />

            {/* Pilih Nota Modal */}
            <PilihNotaModal isOpen={isPilihNotaOpen} onClose={() => setIsPilihNotaOpen(false)} onSelect={handleSelectNota} idPemasok={formData.id_pemasok} selectedNotaId={formData.id_nota} />
        </>
    );
};

export default AddEditPembelianQurbanPage;