import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, FileText,
    Building2, User, StickyNote, X, Info, Beef, Scale, Tag,
} from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import useParameterSelect from '../Pembelian Sapi/hooks/useParameterSelect';
import usePersetujuanRphSelect from '../Pembelian Sapi/hooks/usePersetujuanRphSelect';
import PoRphService from '../../../../services/poRphService';
import PilihNotaModal from './modals/PilihNotaModal';

const NOTIFICATION_TIMEOUT = 5000;

const formatRupiah = (v) => {
    const n = Number(v || 0);
    return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 2) => {
    const n = Number(v || 0);
    return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const Field = ({ label, icon: Icon, required, error, children, hint }) => (
    <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        {error && (
            <p className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
            </p>
        )}
    </div>
);

const inputClass = (error) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
        error ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
    }`;

const AddPoRphPage = () => {
    const navigate = useNavigate();
    const { officePoOptions } = useParameterSelect(false, {}, [], null, ['officepo']);
    const { persetujuanOptions, loading: persetujuanLoading } = usePersetujuanRphSelect();

    const [formData, setFormData] = useState({
        id_office: '1',
        nota: '',
        id_persetujuan_rph: '',
        catatan: '',
    });
    const [selectedNota, setSelectedNota] = useState(null);
    const [notaDetail, setNotaDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT);
            return () => clearTimeout(t);
        }
    }, [notification]);

    const officeOptions = useMemo(
        () => (officePoOptions || []).map(o => ({ value: String(o.value), label: o.label })),
        [officePoOptions]
    );
    const persetujuanOpts = useMemo(
        () => (persetujuanOptions || []).map(o => ({ value: String(o.value), label: o.label })),
        [persetujuanOptions]
    );

    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => (prev[field] ? { ...prev, [field]: null } : prev));
    }, []);

    const fetchNotaDetail = useCallback(async (idNota) => {
        if (!idNota) {
            setNotaDetail(null);
            return;
        }
        setLoadingDetail(true);
        try {
            const res = await PoRphService.getNotaDetail(idNota);
            if (res.success) {
                setNotaDetail(res.data);
            } else {
                setNotaDetail(null);
                setNotification({ type: 'error', message: res.message || 'Gagal memuat detail nota' });
            }
        } catch (err) {
            setNotaDetail(null);
            setNotification({ type: 'error', message: err.message || 'Gagal memuat detail nota' });
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const handleSelectNota = useCallback((notaItem) => {
        setSelectedNota(notaItem);
        handleChange('nota', notaItem?.nota || '');
        setIsNotaModalOpen(false);
        if (notaItem?.id) {
            fetchNotaDetail(notaItem.id);
        } else {
            setNotaDetail(null);
        }
    }, [handleChange, fetchNotaDetail]);

    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.nota) newErrors.nota = 'Nota wajib dipilih';
        if (!formData.id_persetujuan_rph) newErrors.id_persetujuan_rph = 'Persetujuan RPH wajib dipilih';
        if (!formData.catatan?.trim()) newErrors.catatan = 'Catatan wajib diisi';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setNotification({ type: 'info', message: 'Menyimpan PO RPH...' });
        try {
            const result = await PoRphService.create({
                id_office: parseInt(formData.id_office),
                nota: formData.nota,
                id_persetujuan_rph: parseInt(formData.id_persetujuan_rph),
                catatan: formData.catatan.trim(),
            });
            if (result.success) {
                setNotification({ type: 'success', message: 'PO RPH berhasil ditambahkan' });
                setTimeout(() => navigate('/rph/pembelian-sapi', { state: { fromEdit: true } }), 600);
            } else {
                throw new Error(result.message || 'Gagal menyimpan PO RPH');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
            setErrors(prev => ({ ...prev, submit: err.message }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return d; }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 left-4 sm:left-auto z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${
                        notification.type === 'success' ? 'border-green-500' :
                        notification.type === 'info' ? 'border-blue-500' : 'border-red-500'
                    }`}>
                        <div className="p-4 flex items-start gap-3">
                            <div className="flex-shrink-0">
                                {notification.type === 'success' ? (
                                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                ) : notification.type === 'info' ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                    {notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500 break-words">{notification.message}</p>
                            </div>
                            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => navigate('/rph/pembelian-sapi')}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Kembali"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-lg font-semibold text-gray-900 truncate">Tambah PO RPH</h1>
                                <p className="text-xs text-gray-500 mt-0.5">Buat Purchase Order RPH baru dari nota HO</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <form id="po-rph-form" onSubmit={handleSubmit} className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Gagal menyimpan</p>
                            <p className="text-xs text-red-600 mt-0.5">{errors.submit}</p>
                        </div>
                    </div>
                )}

                {/* Section: Nota Selection */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 rounded-md">
                                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Pilih Nota HO</h2>
                                <p className="text-[11px] text-gray-500">Pilih nota pembelian dari HO yang belum masuk RPH</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5">
                        <Field label="Nota HO" icon={FileText} required error={errors.nota} hint="Klik untuk memilih nota dari daftar yang tersedia">
                            <button
                                type="button"
                                onClick={() => setIsNotaModalOpen(true)}
                                className={`w-full px-3 py-2.5 text-left rounded-lg border transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/30 flex items-center justify-between gap-3 ${
                                    errors.nota ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                                }`}
                            >
                                {selectedNota ? (
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {selectedNota.nota_sistem || selectedNota.nota || '-'}
                                        </span>
                                        <span className="text-[11px] text-gray-500 truncate">
                                            {selectedNota.nama_supplier || '-'} • {formatDate(selectedNota.tgl_masuk)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">Pilih nota dari daftar...</span>
                                )}
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium whitespace-nowrap">
                                    Pilih Nota
                                </span>
                            </button>
                        </Field>

                        {/* Nota Info Card */}
                        {selectedNota && (
                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Supplier</p>
                                    <p className="text-xs font-medium text-gray-900 truncate max-w-[200px]" title={selectedNota.nama_supplier}>
                                        {selectedNota.nama_supplier || '-'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Tgl Masuk HO</p>
                                    <p className="text-xs font-medium text-gray-900">{formatDate(selectedNota.tgl_masuk)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Jumlah Ekor</p>
                                    <p className="text-xs font-medium text-gray-900">{selectedNota.jumlah || 0} ekor</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Jenis Pembelian</p>
                                    <p className="text-xs font-medium text-gray-900">{selectedNota.jenis_pembelian || '-'}</p>
                                </div>
                            </div>
                        )}

                        {/* Detail Item Nota — tampil setelah nota dipilih */}
                        {selectedNota && (
                            <div className="mt-3 rounded-lg border border-emerald-100 overflow-hidden">
                                <div className="px-3 py-2 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
                                    <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                                        <Beef className="w-3.5 h-3.5" />
                                        Detail Item Nota (Sapi)
                                    </p>
                                    {notaDetail && !loadingDetail && (
                                        <div className="flex items-center gap-3 text-[11px] text-emerald-700">
                                            <span>{notaDetail.total_ekor} ekor</span>
                                            <span className="text-emerald-300">•</span>
                                            <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{formatNumber(notaDetail.total_berat)} kg</span>
                                            <span className="text-emerald-300">•</span>
                                            <span>{formatRupiah(notaDetail.total_nilai)}</span>
                                        </div>
                                    )}
                                </div>

                                {loadingDetail ? (
                                    <div className="flex items-center justify-center py-8 bg-white">
                                        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                        <span className="ml-2 text-xs text-gray-500">Memuat detail item...</span>
                                    </div>
                                ) : !notaDetail || !notaDetail.details || notaDetail.details.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 bg-white text-center">
                                        <FileText className="w-7 h-7 text-gray-300 mb-1.5" />
                                        <p className="text-xs font-medium text-gray-700">Tidak ada detail item</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Nota ini belum memiliki data sapi detail</p>
                                    </div>
                                ) : (
                                    <div className="max-h-72 overflow-auto bg-white">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase w-8">#</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Eartag</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Jenis Hewan</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Klasifikasi</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Kandang</th>
                                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Berat (kg)</th>
                                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Harga/kg</th>
                                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {notaDetail.details.map((d, idx) => (
                                                    <tr key={d.id || idx} className="hover:bg-gray-50/60">
                                                        <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-mono font-semibold text-gray-900">{d.eartag || '-'}</span>
                                                                {d.eartag_supplier && (
                                                                    <span className="font-mono text-[10px] text-gray-400">{d.eartag_supplier}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {d.nama_jenis_hewan ? (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                                                                    <Tag className="w-2.5 h-2.5" />
                                                                    {d.nama_jenis_hewan}
                                                                </span>
                                                            ) : <span className="text-gray-400">-</span>}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700">{d.nama_klasifikasi || '-'}</td>
                                                        <td className="px-3 py-2 text-gray-700">
                                                            {d.kode_kandang ? (
                                                                <span className="font-mono text-[11px]">{d.kode_kandang}</span>
                                                            ) : <span className="text-gray-400">-</span>}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatNumber(d.berat, 2)}</td>
                                                        <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga)}</td>
                                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatRupiah(d.total_harga)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50/80 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan={5} className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Total</td>
                                                    <td className="px-3 py-2 text-right font-bold text-gray-900">{formatNumber(notaDetail.total_berat, 2)}</td>
                                                    <td className="px-3 py-2"></td>
                                                    <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatRupiah(notaDetail.total_nilai)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: Detail PO */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                <Info className="w-3.5 h-3.5 text-blue-700" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Detail PO RPH</h2>
                                <p className="text-[11px] text-gray-500">Informasi persetujuan dan catatan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Office" icon={Building2} hint="Office otomatis diisi dengan HO">
                            <SearchableSelect
                                options={officeOptions}
                                value={formData.id_office}
                                onChange={(v) => handleChange('id_office', v ?? '')}
                                placeholder="HO"
                                isSearchable={false}
                                isDisabled={true}
                                accentColor="green"
                                className="text-sm"
                            />
                        </Field>

                        <Field label="Persetujuan RPH" icon={User} required error={errors.id_persetujuan_rph}>
                            <SearchableSelect
                                options={persetujuanOpts}
                                value={formData.id_persetujuan_rph}
                                onChange={(v) => handleChange('id_persetujuan_rph', v ?? '')}
                                placeholder="Pilih persetujuan..."
                                isSearchable={true}
                                isClearable={true}
                                isLoading={persetujuanLoading}
                                accentColor="green"
                                className="text-sm"
                            />
                        </Field>

                        <div className="sm:col-span-2">
                            <Field label="Catatan" icon={StickyNote} required error={errors.catatan} hint="Catatan untuk PO ini (wajib diisi)">
                                <textarea
                                    value={formData.catatan}
                                    onChange={(e) => handleChange('catatan', e.target.value)}
                                    rows={3}
                                    className={`${inputClass(errors.catatan)} resize-none`}
                                    placeholder="Masukkan catatan untuk PO RPH..."
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700">
                        <p className="font-medium">Informasi</p>
                        <p className="mt-0.5 text-blue-600">
                            Hanya nota HO dengan <strong>id_rph kosong</strong> dan <strong>tgl_masuk_rph kosong</strong> yang tersedia untuk dipilih.
                        </p>
                    </div>
                </div>

                {/* Action Buttons - Bottom */}
                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/rph/pembelian-sapi')}
                        className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Simpan</>
                        )}
                    </button>
                </div>
            </form>

            {/* Pilih Nota Modal */}
            <PilihNotaModal
                isOpen={isNotaModalOpen}
                onClose={() => setIsNotaModalOpen(false)}
                onSelect={handleSelectNota}
                idOffice={formData.id_office}
            />
        </div>
    );
};

export default AddPoRphPage;
