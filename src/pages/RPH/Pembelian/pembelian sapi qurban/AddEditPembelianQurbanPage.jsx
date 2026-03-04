
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Loader2, ShoppingCart, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import useParameterSelect from '../Pembelian Sapi/hooks/useParameterSelect';
import usePersetujuanRphSelect from '../Pembelian Sapi/hooks/usePersetujuanRphSelect';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import QurbanService from '../../../../services/qurban/qurbanService';
import PilihSapiModal from './modals/PilihSapiModal';

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
    const { officeOptions, loading: paramLoading } = useParameterSelect();
    const { persetujuanOptions, loading: persetujuanLoading } = usePersetujuanRphSelect();
    const pemasokOptions = useMemo(() => officeOptions || [], [officeOptions]);
    const jenisPembelianOpts = useMemo(() => [{ value: 1, label: 'Import' }, { value: 2, label: 'Lokal' }], []);
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

    const [availableNota, setAvailableNota] = useState([]);
    const [notaLoading, setNotaLoading] = useState(false);
    const fetchNota = useCallback(async (pid) => {
        if (!pid) { setAvailableNota([]); return; }
        setNotaLoading(true);
        try {
            const r = await QurbanService.getNota({ id_pemasok: pid });
            setAvailableNota(r.success ? r.data : []);
        } catch { setAvailableNota([]); }
        finally { setNotaLoading(false); }
    }, []);
    const notaOptions = useMemo(() => (availableNota || []).map(n => ({
        value: n.id || n.pubid, label: n.no_po || n.nota || n.name || `Nota #${n.id}`,
    })), [availableNota]);

    const [formData, setFormData] = useState({
        id_pemasok: '', jenis_pembelian: '', nama_penerima: '',
        tanggal_pemesanan: new Date().toISOString().split('T')[0],
        id_nota: '', id_persetujuan_rph: '', tipe_pembayaran: '1',
        id_syarat_pembayaran: 1, note: '',
    });
    const [selectedSapi, setSelectedSapi] = useState([]);
    const [isPilihSapiOpen, setIsPilihSapiOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const isBank = String(formData.tipe_pembayaran) === '2';

    useEffect(() => { formData.id_pemasok ? fetchNota(formData.id_pemasok) : setAvailableNota([]); }, [formData.id_pemasok, fetchNota]);

    useEffect(() => {
        if (!isEditMode || !id) return;
        (async () => {
            setIsLoadingDetail(true);
            try {
                const r = await QurbanService.getDetail(id);
                if (r.success && r.data) {
                    const d = Array.isArray(r.data) ? r.data[0] || r.data : r.data;
                    setFormData({
                        id_pemasok: d.id_pemasok || '', jenis_pembelian: d.jenis_pembelian || '',
                        nama_penerima: d.nama_penerima || '',
                        tanggal_pemesanan: d.tanggal_pemesanan ? d.tanggal_pemesanan.split(' ')[0] : '',
                        id_nota: d.id_nota || '', id_persetujuan_rph: d.id_persetujuan_rph || '',
                        tipe_pembayaran: d.tipe_pembayaran ? String(d.tipe_pembayaran) : '1',
                        id_syarat_pembayaran: d.id_syarat_pembayaran || '', note: d.note || '',
                    });
                    if (d.details && Array.isArray(d.details)) {
                        setSelectedSapi(d.details.map(x => ({
                            id_hewan: x.id_hewan,
                            eartag: x.hewan_details?.eartag || '-',
                            code_eartag: x.hewan_details?.code_eartag || '-',
                            eartag_supplier: x.hewan_details?.eartag_supplier || '-',
                            berat: x.hewan_details?.berat || 0,
                            harga_beli: parseFloat(x.harga_beli) || 0,
                        })));
                    }
                    if (d.id_pemasok) fetchNota(d.id_pemasok);
                } else {
                    setNotification({ type: 'error', message: r.message || 'Gagal memuat data detail' });
                }
            } catch (e) {
                console.error('Error loading edit detail:', e);
                setNotification({ type: 'error', message: 'Gagal memuat data untuk edit' });
            } finally { setIsLoadingDetail(false); }
        })();
    }, [isEditMode, id, fetchNota]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => {
            const u = { ...prev, [field]: value };
            if (field === 'id_pemasok') { u.id_nota = ''; setSelectedSapi([]); }
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
            return [...prev, {
                id_hewan: hid, eartag: item.eartag || '-', code_eartag: item.code_eartag || '-',
                eartag_supplier: item.eartag_supplier || '-', berat: parseFloat(item.berat || 0),
                harga_beli: parseFloat(item.total_harga || item.harga_beli || 0),
            }];
        });
    }, []);

    const handleRemoveSapi = useCallback((hid) => { setSelectedSapi(prev => prev.filter(s => s.id_hewan !== hid)); }, []);
    const handleHargaChange = useCallback((hid, val) => { setSelectedSapi(prev => prev.map(s => s.id_hewan === hid ? { ...s, harga_beli: parseFloat(val) || 0 } : s)); }, []);

    const excludeIds = useMemo(() => selectedSapi.map(s => s.id_hewan), [selectedSapi]);
    const filteredBankOptions = useMemo(() => bankOptions.filter(o => o.value !== 1), [bankOptions]);

    const handleSubmit = async () => {
        const checks = [
            [!formData.id_pemasok, 'Pemasok harus dipilih'],
            [!formData.jenis_pembelian, 'Jenis Pembelian harus dipilih'],
            [!formData.nama_penerima?.trim(), 'Nama Penerima harus diisi'],
            [!formData.tanggal_pemesanan, 'Tanggal Pemesanan harus diisi'],
            [!formData.id_persetujuan_rph, 'Persetujuan RPH harus dipilih'],
            [!formData.tipe_pembayaran, 'Tipe Pembayaran harus dipilih'],
            [selectedSapi.length === 0, 'Minimal harus memilih 1 sapi'],
        ];
        for (const [cond, msg] of checks) { if (cond) { setNotification({ type: 'error', message: msg }); return; } }
        setIsSubmitting(true);
        setNotification({ type: 'info', message: isEditMode ? 'Memperbarui data...' : 'Menyimpan data...' });
        try {
            const totalHarga = selectedSapi.reduce((s, x) => s + Number(x.harga_beli || 0), 0);
            const payload = {
                id_pemasok: parseInt(formData.id_pemasok), jenis_pembelian: parseInt(formData.jenis_pembelian),
                nama_penerima: formData.nama_penerima.trim(), tanggal_pemesanan: formData.tanggal_pemesanan,
                id_nota: formData.id_nota ? parseInt(formData.id_nota) : null,
                id_persetujuan_rph: parseInt(formData.id_persetujuan_rph),
                tipe_pembayaran: parseInt(formData.tipe_pembayaran),
                id_syarat_pembayaran: formData.id_syarat_pembayaran ? parseInt(formData.id_syarat_pembayaran) : null,
                total_harga: totalHarga, note: formData.note || null,
                details: selectedSapi.map(s => ({ id_hewan: parseInt(s.id_hewan), harga_beli: parseFloat(s.harga_beli) })),
            };
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

    const renderSapiRow = (sapi, idx) => (
        <tr key={sapi.id_hewan} className="border-b border-gray-100">
            <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{sapi.code_eartag || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{sapi.eartag || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">{sapi.eartag_supplier || '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-700 text-right">{parseFloat(sapi.berat || 0).toLocaleString('id-ID')}</td>
            <td className="px-4 py-3 text-right">
                <input type="text" value={formatNumber(sapi.harga_beli)} onChange={e => { const raw = parseNumber(e.target.value); handleHargaChange(sapi.id_hewan, raw); }} className="w-32 sm:w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </td>
            <td className="px-4 py-3 text-center">
                <button onClick={() => handleRemoveSapi(sapi.id_hewan)} className="p-1.5 text-gray-400 hover:text-red-500" title="Hapus sapi">
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <ShoppingCart className="w-8 h-8 text-green-600" />
                                {isEditMode ? 'Edit Pembelian Sapi Qurban' : 'Tambah Pembelian Sapi Qurban'}
                            </h1>
                            <p className="text-gray-500 mt-1">{isEditMode ? 'Perbarui data pembelian sapi qurban' : 'Tambahkan data pembelian sapi qurban baru'}</p>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Data Pembelian</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pemasok <span className="text-red-500">*</span></label>
                            <SearchableSelect value={formData.id_pemasok} onChange={v => handleChange('id_pemasok', v)} options={pemasokOptions} placeholder={paramLoading ? 'Loading...' : 'Pilih Pemasok'} isLoading={paramLoading} isDisabled={paramLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Pembelian <span className="text-red-500">*</span></label>
                            <SearchableSelect value={formData.jenis_pembelian} onChange={v => handleChange('jenis_pembelian', v)} options={jenisPembelianOpts} placeholder="Pilih Jenis Pembelian" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penerima <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.nama_penerima} onChange={e => handleChange('nama_penerima', e.target.value)} maxLength={50} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all" placeholder="Masukkan nama penerima" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pemesanan <span className="text-red-500">*</span></label>
                            <input type="date" value={formData.tanggal_pemesanan} onChange={e => handleChange('tanggal_pemesanan', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Nota</label>
                            <SearchableSelect value={formData.id_nota} onChange={v => handleChange('id_nota', v)} options={notaOptions} placeholder={!formData.id_pemasok ? 'Pilih pemasok terlebih dahulu' : notaLoading ? 'Loading...' : 'Pilih Nota'} isLoading={notaLoading} isDisabled={!formData.id_pemasok || notaLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Persetujuan RPH <span className="text-red-500">*</span></label>
                            <SearchableSelect value={formData.id_persetujuan_rph} onChange={v => handleChange('id_persetujuan_rph', v)} options={persetujuanOptions.filter(o => o.value !== '')} placeholder={persetujuanLoading ? 'Loading...' : 'Pilih Persetujuan RPH'} isLoading={persetujuanLoading} isDisabled={persetujuanLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Pembayaran <span className="text-red-500">*</span></label>
                            <SearchableSelect value={formData.tipe_pembayaran ? parseInt(formData.tipe_pembayaran) : ''} onChange={v => handleChange('tipe_pembayaran', String(v))} options={tipePembayaranOpts} placeholder="Pilih Tipe Pembayaran" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Syarat Pembayaran {isBank && <span className="text-red-500">*</span>}</label>
                            {renderSyaratPembayaran()}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
                            <textarea value={formData.note} onChange={e => handleChange('note', e.target.value)} rows={3} maxLength={255} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none transition-all" placeholder="Catatan tambahan (opsional, maks 255 karakter)" />
                        </div>
                    </div>
                </div>

                {/* Sapi Detail Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h2 className="text-lg font-bold text-gray-900">Daftar Sapi ({selectedSapi.length})</h2>
                            <button onClick={() => setIsPilihSapiOpen(true)} disabled={!formData.id_nota} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                <Plus className="w-4 h-4" /> Tambah Sapi
                            </button>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        {selectedSapi.length === 0 ? (
                            <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingCart className="w-8 h-8 text-gray-300" /></div>
                                <p className="text-gray-500 font-semibold text-base">Belum ada sapi dipilih</p>
                                <p className="text-gray-400 text-sm mt-1.5 max-w-xs mx-auto">{!formData.id_nota ? 'Pilih nota terlebih dahulu untuk menambahkan sapi' : 'Klik "Tambah Sapi" untuk memilih sapi dari nota'}</p>
                            </div>
                        ) : (
                            <React.Fragment>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-green-50">
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-14">No</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code Eartag</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Eartag</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden sm:table-cell">Eartag Supplier</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Berat (Kg)</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 min-w-[200px]">Harga Beli</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-20">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>{selectedSapi.map((sapi, idx) => renderSapiRow(sapi, idx))}</tbody>
                                    </table>
                                </div>
                            </React.Fragment>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button onClick={handleBack} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">Batal</button>
                        <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui Data' : 'Simpan Data')}
                        </button>
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
        </div>
    );
};

export default AddEditPembelianQurbanPage;