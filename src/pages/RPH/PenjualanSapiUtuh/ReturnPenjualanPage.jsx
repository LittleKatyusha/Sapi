import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Check,
    ChevronDown,
    AlertCircle,
    Calendar,
    Package,
    RotateCcw,
    Tag
} from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import useReturnPenjualan from './hooks/useReturnPenjualan';

/**
 * Page untuk Return Penjualan Sapi Utuh
 * Menggantikan modal dengan page baru yang lebih luas
 */
const ReturnPenjualanPage = () => {
    const navigate = useNavigate();
    const { pid } = useParams();
    const { createReturn, loading } = useReturnPenjualan();
    
    const [penjualanData, setPenjualanData] = useState(null);
    const [kondisiOptions, setKondisiOptions] = useState([]);
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRefs = useRef({});
    const [notif, setNotif] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        tanggal_return: new Date().toISOString().split('T')[0],
        alasan_return: '',
        selected_cattle: [],
    });
    
    const [cattleDetails, setCattleDetails] = useState({});
    const [errors, setErrors] = useState({});

    // Fetch kondisi options on mount
    useEffect(() => {
        fetchKondisiOptions();
        if (pid) fetchPenjualanDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pid]);

    const fetchPenjualanDetail = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/rph/penjualan-sapi-utuh/show`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ pid }),
            });
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    setPenjualanData(result.data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch penjualan detail:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Close kondisi dropdowns
            Object.values(dropdownRefs.current).forEach(ref => {
                if (ref && !ref.contains(e.target)) {
                    const cattleId = Object.keys(dropdownRefs.current).find(
                        key => dropdownRefs.current[key] === ref
                    );
                    if (cattleId && openDropdown === parseInt(cattleId)) {
                        setOpenDropdown(null);
                    }
                }
            });
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const fetchKondisiOptions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/system/parameter/dataByGroup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ group: 'kondisi_hewan' }),
            });
            if (response.ok) {
                const result = await response.json();
                const data = result.data || result;
                if (Array.isArray(data)) {
                    setKondisiOptions(data.map(item => ({
                        value: item.value,
                        label: item.name || item.label,
                    })));
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to fetch kondisi options:', err);
        }
        // Fallback
        setKondisiOptions([
            { value: 1, label: 'SEHAT' },
            { value: 2, label: 'SAKIT' },
            { value: 3, label: 'SUDAH SEMBUH' },
        ]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectCattle = (cattleId) => {
        setFormData(prev => {
            const isSelected = prev.selected_cattle.includes(cattleId);
            return {
                ...prev,
                selected_cattle: isSelected
                    ? prev.selected_cattle.filter(id => id !== cattleId)
                    : [...prev.selected_cattle, cattleId],
            };
        });
    };

    const handleSelectAll = () => {
        const allSelected = formData.selected_cattle.length === (penjualanData?.details?.length || 0);
        setFormData(prev => ({
            ...prev,
            selected_cattle: allSelected ? [] : (penjualanData?.details || []).map(c => c.id),
        }));
    };

    const handleCattleDetailChange = (cattleId, field, value) => {
        setCattleDetails(prev => ({
            ...prev,
            [cattleId]: {
                ...prev[cattleId],
                [field]: value,
            },
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.tanggal_return) newErrors.tanggal_return = 'Tanggal return harus diisi';
        if (!formData.alasan_return.trim()) newErrors.alasan_return = 'Alasan return harus diisi';
        if (formData.selected_cattle.length === 0) {
            newErrors.selected_cattle = 'Minimal harus memilih 1 sapi untuk di-return';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const cattleDetailsArray = formData.selected_cattle.map(cattleId => ({
            id_hewan: cattleId,
            kondisi_sapi: cattleDetails[cattleId]?.kondisi_sapi || '',
            catatan_detail: cattleDetails[cattleId]?.catatan_detail || '',
        }));

        const payload = {
            tanggal_return: formData.tanggal_return,
            tipe_return: 'PEMBELI',
            alasan_return: formData.alasan_return,
            id_penjualan: penjualanData?.id,
            cattle_details: cattleDetailsArray,
        };

        const result = await createReturn(payload);
        if (result) {
            setNotif({ type: 'success', message: 'Return berhasil dibuat' });
            setTimeout(() => {
                navigate('/rph/penjualan-sapi-utuh');
            }, 1500);
        } else {
            setNotif({ type: 'error', message: 'Gagal membuat return' });
        }
    };

    const handleBack = () => {
        navigate('/rph/penjualan-sapi-utuh');
    };

    // Calculate totals — only cattle that are not already returned (status !== 2)
    const allCattle = penjualanData?.details || [];
    const cattleList = allCattle.filter(c => Number(c.status) !== 2);
    const returnedCattle = allCattle.filter(c => Number(c.status) === 2);
    const selectedCount = formData.selected_cattle.length;
    const totalCattle = cattleList.length;
    const grandTotal = penjualanData?.total_harga || 0;
    const totalBerat = penjualanData?.total_berat || 0;
    
    // Calculate selected return amount
    const selectedReturnAmount = formData.selected_cattle.reduce((sum, cattleId) => {
        const cattle = cattleList.find(c => c.id === cattleId);
        return sum + (cattle?.harga_jual || cattle?.harga || 0);
    }, 0);
    const selectedReturnBerat = formData.selected_cattle.reduce((sum, cattleId) => {
        const cattle = cattleList.find(c => c.id === cattleId);
        return sum + (cattle?.berat || 0);
    }, 0);
    const remainingTotal = Math.max(0, grandTotal - selectedReturnAmount);

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
            {/* Notification */}
            {notif && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm ${
                    notif.type === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                }`}>
                    {notif.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <span className="font-semibold">{notif.message}</span>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="max-w-[1400px] mx-auto space-y-5">
                    {/* Header Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-48 bg-white/20 rounded animate-pulse"></div>
                                <div className="h-3 w-64 bg-white/10 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse"></div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="h-2.5 w-16 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cattle Selection Skeleton */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse"></div>
                                <div className="h-3 w-56 bg-slate-100 rounded animate-pulse"></div>
                            </div>
                            <div className="h-7 w-24 bg-slate-100 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="p-4 space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3 rounded-xl border-2 border-slate-100">
                                    <div className="col-span-1 h-6 w-6 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-2 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-2 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-1 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-2 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-2 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                    <div className="col-span-2 h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detail & Summary Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                                    <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                                    <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"></div>
                            </div>
                            <div className="p-5 space-y-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (

            <div className="max-w-[1400px] mx-auto space-y-5">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all flex-shrink-0"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <RotateCcw size={20} className="text-emerald-100" />
                                Return Penjualan Sapi
                            </h1>
                            <p className="text-emerald-50/90 text-xs mt-1 truncate">
                                {penjualanData?.no_transaksi || 'Loading...'} · {penjualanData?.nama_pembeli || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {penjualanData && (
                        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                                    <Package size={18} className="text-sky-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tersedia</p>
                                    <p className="text-base font-bold text-slate-900">{totalCattle} <span className="text-xs font-medium text-slate-500">ekor</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCount > 0 ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                    <Check size={18} className={selectedCount > 0 ? 'text-emerald-600' : 'text-slate-400'} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dipilih</p>
                                    <p className={`text-base font-bold ${selectedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {selectedCount} <span className="text-xs font-medium text-slate-500">ekor</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={18} className="text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Berat</p>
                                    <p className="text-base font-bold text-slate-900">{totalBerat.toLocaleString('id-ID')} <span className="text-xs font-medium text-slate-500">kg</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCount > 0 ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                    <span className="text-[10px] font-bold text-emerald-600">Rp</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sisa Setelah Return</p>
                                    <p className={`text-base font-bold truncate ${selectedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        Rp {remainingTotal.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Cattle Selection */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Package size={18} className="text-emerald-600" />
                                    Pilih Sapi untuk Return
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Centang sapi & isi kondisi/catatan secara inline
                                </p>
                            </div>
                            {totalCattle > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                >
                                    {selectedCount === totalCattle ? 'Hapus Semua' : 'Pilih Semua'}
                                </button>
                            )}
                        </div>

                        <div className="p-4">
                            {errors.selected_cattle && (
                                <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle size={15} />
                                    {errors.selected_cattle}
                                </div>
                            )}

                            {/* Already returned cattle */}
                            {returnedCattle.length > 0 && (
                                <div className="mb-4 bg-red-50/60 border border-red-200 rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-2 text-red-700 text-xs font-semibold uppercase tracking-wider">
                                        <RotateCcw size={14} /> Sudah Return ({returnedCattle.length} ekor)
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {returnedCattle.map(c => (
                                            <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-red-200 text-red-700 text-xs font-medium">
                                                <Tag size={12} />
                                                <span className="font-mono">{c.no_eartag || '-'}</span>
                                                {c.tgl_return && <span className="text-red-400">• {c.tgl_return}</span>}
                                                {c.kondisi_return && <span className="text-red-500">• {c.kondisi_return}</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cattleList.length === 0 ? (
                                <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-300">
                                    <Package size={40} className="text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm font-medium">
                                        {returnedCattle.length > 0
                                            ? 'Semua sapi dalam transaksi ini sudah direturn'
                                            : 'Tidak ada sapi dalam transaksi ini'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Table Header */}
                                    <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60 rounded-lg">
                                        <div className="col-span-1">Pilih</div>
                                        <div className="col-span-2">Eartag</div>
                                        <div className="col-span-2">Merk</div>
                                        <div className="col-span-1">Berat</div>
                                        <div className="col-span-2">Harga</div>
                                        <div className="col-span-2">Kondisi</div>
                                        <div className="col-span-2">Catatan</div>
                                    </div>

                                    {cattleList.map((cattle) => {
                                        const isSelected = formData.selected_cattle.includes(cattle.id);
                                        return (
                                            <div
                                                key={cattle.id}
                                                className={`grid grid-cols-1 lg:grid-cols-12 gap-3 px-4 py-3 rounded-xl border-2 transition-all items-center ${
                                                    isSelected
                                                        ? 'bg-emerald-50/40 border-emerald-300'
                                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <div className="lg:col-span-1 flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectCattle(cattle.id)}
                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                            isSelected
                                                                ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200'
                                                                : 'border-slate-300 hover:border-emerald-400 bg-white'
                                                        }`}
                                                    >
                                                        {isSelected && <Check size={15} className="text-white" strokeWidth={3} />}
                                                    </button>
                                                </div>

                                                {/* Eartag */}
                                                <div className="lg:col-span-2 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                        <Tag size={14} className="text-emerald-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="lg:hidden text-[10px] text-slate-400 font-medium block">Eartag</span>
                                                        <span className="text-sm font-semibold text-slate-900 truncate block">
                                                            {cattle.no_eartag || cattle.eartag || '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Merk */}
                                                <div className="lg:col-span-2 flex items-center gap-1.5">
                                                    <span className="lg:hidden text-[10px] text-slate-400 font-medium">Merk:</span>
                                                    <span className="text-sm text-slate-700 truncate">
                                                        {cattle.merk || cattle.klasifikasi || '-'}
                                                    </span>
                                                </div>

                                                {/* Berat */}
                                                <div className="lg:col-span-1 flex items-center gap-1.5">
                                                    <span className="lg:hidden text-[10px] text-slate-400 font-medium">Berat:</span>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {cattle.berat || '-'}<span className="text-xs text-slate-400 ml-0.5">kg</span>
                                                    </span>
                                                </div>

                                                {/* Harga */}
                                                <div className="lg:col-span-2 flex items-center gap-1.5">
                                                    <span className="lg:hidden text-[10px] text-slate-400 font-medium">Harga:</span>
                                                    <span className="text-sm font-bold text-blue-600">
                                                        Rp {(cattle.harga_jual || cattle.harga || 0).toLocaleString('id-ID')}
                                                    </span>
                                                </div>

                                                {/* Kondisi Dropdown */}
                                                <div className="lg:col-span-2 relative" ref={el => dropdownRefs.current[cattle.id] = el}>
                                                    <span className="lg:hidden text-[10px] text-slate-400 font-medium block mb-1">Kondisi:</span>
                                                    <button
                                                        type="button"
                                                        disabled={!isSelected}
                                                        onClick={() => isSelected && setOpenDropdown(openDropdown === cattle.id ? null : cattle.id)}
                                                        className={`w-full px-3 py-2 text-left border rounded-lg transition-all bg-white flex items-center justify-between text-xs ${
                                                            !isSelected
                                                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                                                : openDropdown === cattle.id
                                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                                                                    : 'border-slate-300 hover:border-slate-400 cursor-pointer'
                                                        }`}
                                                    >
                                                        <span className={`font-medium truncate ${
                                                            cattleDetails[cattle.id]?.kondisi_sapi !== undefined && cattleDetails[cattle.id]?.kondisi_sapi !== ''
                                                                ? 'text-slate-900' : 'text-slate-400'
                                                        }`}>
                                                            {(() => {
                                                                const selected = cattleDetails[cattle.id]?.kondisi_sapi;
                                                                if (selected === undefined || selected === '') return 'Pilih...';
                                                                const found = kondisiOptions.find(opt => String(opt.value) === String(selected));
                                                                return found ? found.label : 'Pilih...';
                                                            })()}
                                                        </span>
                                                        <ChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${openDropdown === cattle.id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {openDropdown === cattle.id && isSelected && (
                                                        <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto left-0 right-0">
                                                            {kondisiOptions.length === 0 ? (
                                                                <div className="px-3 py-2 text-slate-400 text-center text-xs">Memuat...</div>
                                                            ) : (
                                                                kondisiOptions.map(option => {
                                                                    const isOptSelected = String(cattleDetails[cattle.id]?.kondisi_sapi) === String(option.value);
                                                                    return (
                                                                        <button
                                                                            key={option.value}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleCattleDetailChange(cattle.id, 'kondisi_sapi', option.value);
                                                                                setOpenDropdown(null);
                                                                            }}
                                                                            className={`w-full px-3 py-2 text-left flex items-center gap-2 transition-colors border-b border-slate-50 last:border-b-0 text-xs ${
                                                                                isOptSelected
                                                                                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                                                                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                                                                            }`}
                                                                        >
                                                                            {isOptSelected && <Check size={13} className="text-emerald-600" />}
                                                                            {option.label}
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Catatan Input */}
                                                <div className="lg:col-span-2">
                                                    <span className="lg:hidden text-[10px] text-slate-400 font-medium block mb-1">Catatan:</span>
                                                    <input
                                                        type="text"
                                                        disabled={!isSelected}
                                                        value={cattleDetails[cattle.id]?.catatan_detail || ''}
                                                        onChange={(e) => handleCattleDetailChange(cattle.id, 'catatan_detail', e.target.value)}
                                                        placeholder={isSelected ? "Catatan..." : "—"}
                                                        className={`w-full px-3 py-2 text-xs font-medium border rounded-lg transition-all bg-white ${
                                                            !isSelected
                                                                ? 'border-slate-200 text-slate-300 cursor-not-allowed placeholder:text-slate-300'
                                                                : 'border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 hover:border-slate-400'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detail Return & Summary — 2 column */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Left: Return Info */}
                        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <AlertCircle size={18} className="text-emerald-600" />
                                <h2 className="text-base font-bold text-slate-900">Detail Return</h2>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Tanggal Return */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                        <Calendar size={13} className="inline mr-1" />
                                        Tanggal Return <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="tanggal_return"
                                        value={formData.tanggal_return}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-slate-900 hover:border-slate-400"
                                    />
                                    {errors.tanggal_return && (
                                        <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.tanggal_return}
                                        </p>
                                    )}
                                </div>

                                {/* Alasan Return */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                                        Alasan Return <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="alasan_return"
                                        value={formData.alasan_return}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Jelaskan alasan return..."
                                        className="w-full px-4 py-3 text-sm font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-slate-900 placeholder:text-slate-400 hover:border-slate-400 resize-none"
                                    />
                                    {errors.alasan_return && (
                                        <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            {errors.alasan_return}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary Card */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                <h2 className="text-base font-bold text-slate-900">Ringkasan Return</h2>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Summary Items */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Sapi Dipilih</span>
                                        <span className="font-semibold text-slate-900">{selectedCount} ekor</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Total Berat Return</span>
                                        <span className="font-semibold text-slate-900">{selectedReturnBerat.toLocaleString('id-ID')} kg</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Nilai Return</span>
                                        <span className="font-semibold text-red-600">- Rp {selectedReturnAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-dashed border-slate-200 pt-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grand Total Awal</span>
                                        <span className="text-sm font-semibold text-slate-700">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sisa Setelah Return</span>
                                        <span className="text-lg font-bold text-emerald-600">Rp {remainingTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Info Note */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                                    <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Grand total & sisa pembayaran akan otomatis berkurang sesuai sapi yang direturn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons - Sticky */}
                    <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-200 -mx-4 px-4 py-3 flex items-center justify-end gap-3 sm:-mx-6 sm:px-6 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedCount === 0}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Submit Return ({selectedCount})
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            )}
        </div>
    );
};

export default ReturnPenjualanPage;
