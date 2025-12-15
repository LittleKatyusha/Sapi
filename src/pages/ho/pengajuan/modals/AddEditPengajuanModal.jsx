
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import Select from 'react-select';
import useMasterData from '../hooks/useMasterData';
import useOfficeData from '../../tandaTerima/hooks/useOfficeData';
import PengajuanBiayaService from '../../../../services/pengajuanBiayaService';
import useItemBebanBiayaAPI from '../../pembelianLainLain/hooks/useItemBebanBiayaAPI';

/**
 * Modal untuk Add/Edit Pengajuan Biaya sesuai dengan backend requirements
 * Backend fields:
 * - id_jenis_biaya (required, integer)
 * - nominal (required, numeric)
 * - tgl_pengajuan (required, date)
 * - keperluan (required, string, max:150)
 * - nama_pengaju (required, string, max:50)
 * - id_metode_bayar (required, integer)
 * - id_persetujuan_ho (required, integer)
 * - catatan (required, string)
 * - id_office (required, integer)
 */
const AddEditPengajuanModal = ({ isOpen, onClose, onSave, editingItem }) => {
    // Form state
    const [formData, setFormData] = useState({
        id_jenis_biaya: null,
        nominal: '',
        tgl_pengajuan: '',
        keperluan: '',
        nama_pengaju: '',
        id_metode_bayar: null,
        id_persetujuan_ho: null,
        catatan: '',
        id_office: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detailData, setDetailData] = useState(null);

    // Fetch master data using custom hook
    const {
        metodeBayarData,
        metodeBayarLoading,
        metodeBayarError,
        persetujuanHoData,
        persetujuanHoLoading,
        persetujuanHoError,
        fetchAllMasterData
    } = useMasterData();

    // Fetch office data using custom hook
    const {
        officeOptions,
        loading: officeLoading,
        error: officeError
    } = useOfficeData();

    // Fetch item beban biaya (jenis biaya) from new endpoint - same as AddEditBebanModal
    const {
        itemBebanBiayaOptions: jenisBiayaOptions,
        loading: jenisBiayaLoading,
        error: jenisBiayaError,
        refetch: refetchJenisBiaya
    } = useItemBebanBiayaAPI();

    // Fetch master data when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchAllMasterData();
            refetchJenisBiaya(); // Fetch jenis biaya from parameter/data endpoint
        }
    }, [isOpen, fetchAllMasterData, refetchJenisBiaya]);

    // All master data already in correct format {value, label, id} from useMasterData hook
    // No need to transform
    const metodeBayarOptions = metodeBayarData;

    const persetujuanHoOptions = useMemo(() => {
        if (!Array.isArray(persetujuanHoData) || persetujuanHoData.length === 0) {
            return [];
        }
        return persetujuanHoData.map(item => ({
            value: item.id,
            label: item.name || item.nama || item.persetujuan || item.label,
            id: item.id
        }));
    }, [persetujuanHoData]);

    // Custom styles for react-select
    const selectStyles = {
        control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#3b82f6' : errors[state.selectProps.name] ? '#ef4444' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
            },
            borderRadius: '0.5rem',
            padding: '0.25rem'
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer'
        })
    };

    // Fetch detail data when editing
    useEffect(() => {
        const fetchDetail = async () => {
            if (!isOpen || !editingItem?.pid) return;

            setIsLoadingDetail(true);
            try {
                const response = await PengajuanBiayaService.getDetail(editingItem.pid);
                if (response.success) {
                    setDetailData(response.data);
                }
            } catch (error) {
                console.error('Error fetching detail:', error);
                setDetailData(editingItem);
            } finally {
                setIsLoadingDetail(false);
            }
        };

        if (editingItem) {
            fetchDetail();
        } else {
            setDetailData(null);
        }
    }, [isOpen, editingItem]);

    // Initialize form data for edit mode
    useEffect(() => {
        if (editingItem && detailData && !isLoadingDetail) {
            const today = new Date().toISOString().split('T')[0];
            
            // Find jenis biaya by ID or label (name) - now using string comparison since value is string
            const jeniBiayaOption = detailData.id_jenis_biaya
                ? jenisBiayaOptions.find(opt => opt.value === String(detailData.id_jenis_biaya))
                : jenisBiayaOptions.find(opt => opt.label.toUpperCase() === (detailData.jenis_biaya || '').toUpperCase());
            
            // Find metode bayar by ID or label (name)
            const metodeBayarOption = detailData.id_metode_bayar
                ? metodeBayarOptions.find(opt => opt.value === detailData.id_metode_bayar)
                : metodeBayarOptions.find(opt => opt.label.toUpperCase() === (detailData.metode_bayar || '').toUpperCase());
            
            // Find persetujuan HO by ID or label (name)
            const persetujuanHoOption = detailData.id_persetujuan_ho
                ? persetujuanHoOptions.find(opt => opt.value === detailData.id_persetujuan_ho)
                : persetujuanHoOptions.find(opt => opt.label.toUpperCase() === (detailData.persetujuan_ho || '').toUpperCase());
            
            // Find office by ID
            const officeOption = detailData.id_office
                ? officeOptions.find(opt => opt.value === detailData.id_office)
                : null;
            
            setFormData({
                id_jenis_biaya: jeniBiayaOption || null,
                nominal: detailData.nominal ? String(detailData.nominal) : '',
                tgl_pengajuan: detailData.tgl_pengajuan || today,
                keperluan: detailData.keperluan || '',
                nama_pengaju: detailData.nama_pengaju || detailData.yang_mengajukan || '',
                id_metode_bayar: metodeBayarOption || null,
                id_persetujuan_ho: persetujuanHoOption || null,
                catatan: detailData.catatan || '',
                id_office: officeOption || null
            });
        } else if (!editingItem) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                id_jenis_biaya: null,
                nominal: '',
                tgl_pengajuan: today,
                keperluan: '',
                nama_pengaju: '',
                id_metode_bayar: null,
                id_persetujuan_ho: null,
                catatan: '',
                id_office: null
            });
        }
        setErrors({});
    }, [editingItem, detailData, isLoadingDetail, jenisBiayaOptions, metodeBayarOptions, persetujuanHoOptions, officeOptions]);

    // Handle select change
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Apply max length constraints
        let finalValue = value;
        if (name === 'keperluan' && value.length > 150) {
            finalValue = value.substring(0, 150);
        }
        if (name === 'nama_pengaju' && value.length > 50) {
            finalValue = value.substring(0, 50);
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    // Format rupiah for display
    const formatRupiah = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        const stringValue = String(value);
        const number = parseInt(stringValue.replace(/[^0-9]/g, ''), 10);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('id-ID').format(number);
    };

    // Handle nominal input
    const handleNominalChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, nominal: numericValue }));
        if (errors.nominal) {
            setErrors(prev => ({ ...prev, nominal: null }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.id_jenis_biaya) {
            newErrors.id_jenis_biaya = 'Jenis biaya harus dipilih';
        }

        if (!formData.nominal || parseFloat(formData.nominal) <= 0) {
            newErrors.nominal = 'Nominal harus lebih dari 0';
        }

        if (!formData.tgl_pengajuan) {
            newErrors.tgl_pengajuan = 'Tanggal pengajuan harus diisi';
        }

        if (!formData.keperluan.trim()) {
            newErrors.keperluan = 'Keperluan harus diisi';
        } else if (formData.keperluan.length > 150) {
            newErrors.keperluan = 'Keperluan maksimal 150 karakter';
        }

        if (!formData.nama_pengaju.trim()) {
            newErrors.nama_pengaju = 'Nama pengaju harus diisi';
        } else if (formData.nama_pengaju.length > 50) {
            newErrors.nama_pengaju = 'Nama pengaju maksimal 50 karakter';
        }

        if (!formData.id_metode_bayar) {
            newErrors.id_metode_bayar = 'Metode bayar harus dipilih';
        }

        if (!formData.id_persetujuan_ho) {
            newErrors.id_persetujuan_ho = 'Persetujuan HO harus dipilih';
        }

        if (!formData.catatan.trim()) {
            newErrors.catatan = 'Catatan harus diisi';
        }

        if (!formData.id_office) {
            newErrors.id_office = 'Office/Divisi harus dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Transform data for backend - exact format as required
            const dataToSave = {
                id_jenis_biaya: formData.id_jenis_biaya?.value || formData.id_jenis_biaya?.id,
                nominal: parseInt(String(formData.nominal).replace(/[^0-9]/g, ''), 10) || 0,
                tgl_pengajuan: formData.tgl_pengajuan,
                keperluan: formData.keperluan.trim(),
                nama_pengaju: formData.nama_pengaju.trim(),
                id_metode_bayar: formData.id_metode_bayar?.value || formData.id_metode_bayar?.id,
                id_persetujuan_ho: formData.id_persetujuan_ho?.value || formData.id_persetujuan_ho?.id,
                catatan: formData.catatan.trim(),
                id_office: formData.id_office?.value || formData.id_office?.id
            };

            await onSave(dataToSave);
        } catch (error) {
            console.error('Error saving pengajuan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle close
    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {editingItem ? 'Edit Pengajuan Biaya' : 'Tambah Pengajuan Biaya'}
                        </h2>
                        <p className="text-sm text-blue-100">
                            {editingItem ? 'Perbarui informasi pengajuan biaya' : 'Lengkapi form pengajuan biaya baru'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {isLoadingDetail ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">Memuat data...</p>
                            </div>
                        </div>
                    ) : (
                    <div className="space-y-5">
                        {/* Row 1: Jenis Biaya & Nominal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Jenis Biaya */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jenis Biaya <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="id_jenis_biaya"
                                    value={formData.id_jenis_biaya}
                                    onChange={(option) => handleSelectChange('id_jenis_biaya', option)}
                                    options={jenisBiayaOptions}
                                    styles={selectStyles}
                                    placeholder={jenisBiayaLoading ? 'Memuat...' : jenisBiayaError ? 'Error memuat data' : 'Pilih jenis biaya...'}
                                    isDisabled={isSubmitting || jenisBiayaLoading}
                                    isLoading={jenisBiayaLoading}
                                    isClearable
                                    isSearchable
                                />
                                {errors.id_jenis_biaya && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.id_jenis_biaya}
                                    </p>
                                )}
                                {jenisBiayaError && (
                                    <p className="text-orange-500 text-xs mt-1">
                                        ⚠️ Error: {jenisBiayaError}
                                    </p>
                                )}
                                {jenisBiayaLoading && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        🔄 Memuat data jenis biaya...
                                    </p>
                                )}
                            </div>

                            {/* Nominal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominal (Rp) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nominal"
                                    value={formatRupiah(formData.nominal)}
                                    onChange={handleNominalChange}
                                    className={`w-full px-4 py-2 border ${errors.nominal ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    inputMode="numeric"
                                />
                                {errors.nominal && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.nominal}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Tanggal Pengajuan & Nama Pengaju */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tanggal Pengajuan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Pengajuan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tgl_pengajuan"
                                    value={formData.tgl_pengajuan}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.tgl_pengajuan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    disabled={isSubmitting}
                                />
                                {errors.tgl_pengajuan && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.tgl_pengajuan}
                                    </p>
                                )}
                            </div>

                            {/* Nama Pengaju */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nama Pengaju <span className="text-red-500">*</span>
                                    <span className="text-gray-400 text-xs ml-1">
                                        ({formData.nama_pengaju.length}/50)
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    name="nama_pengaju"
                                    value={formData.nama_pengaju}
                                    onChange={handleChange}
                                    maxLength={50}
                                    className={`w-full px-4 py-2 border ${errors.nama_pengaju ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Masukkan nama pengaju"
                                    disabled={isSubmitting}
                                />
                                {errors.nama_pengaju && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.nama_pengaju}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Metode Bayar & Persetujuan HO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Metode Bayar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Metode Bayar <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="id_metode_bayar"
                                    value={formData.id_metode_bayar}
                                    onChange={(option) => handleSelectChange('id_metode_bayar', option)}
                                    options={metodeBayarOptions}
                                    styles={selectStyles}
                                    placeholder={metodeBayarLoading ? 'Memuat...' : metodeBayarError ? 'Error memuat data' : 'Pilih metode bayar...'}
                                    isDisabled={isSubmitting || metodeBayarLoading}
                                    isLoading={metodeBayarLoading}
                                    isClearable
                                    isSearchable
                                />
                                {errors.id_metode_bayar && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.id_metode_bayar}
                                    </p>
                                )}
                                {metodeBayarError && (
                                    <p className="text-orange-500 text-xs mt-1">
                                        ⚠️ {metodeBayarError}
                                    </p>
                                )}
                            </div>

                            {/* Persetujuan HO */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Persetujuan HO <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    name="id_persetujuan_ho"
                                    value={formData.id_persetujuan_ho}
                                    onChange={(option) => handleSelectChange('id_persetujuan_ho', option)}
                                    options={persetujuanHoOptions}
                                    styles={selectStyles}
                                    placeholder={persetujuanHoLoading ? 'Memuat...' : persetujuanHoError ? 'Error memuat data' : 'Pilih persetujuan HO...'}
                                    isDisabled={isSubmitting || persetujuanHoLoading}
                                    isLoading={persetujuanHoLoading}
                                    isClearable
                                    isSearchable
                                />
                                {errors.id_persetujuan_ho && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.id_persetujuan_ho}
                                    </p>
                                )}
                                {persetujuanHoError && (
                                    <p className="text-orange-500 text-xs mt-1">
                                        ⚠️ {persetujuanHoError}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Office/Divisi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Office/Divisi <span className="text-red-500">*</span>
                            </label>
                            <Select
                                name="id_office"
                                value={formData.id_office}
                                onChange={(option) => handleSelectChange('id_office', option)}
                                options={officeOptions}
                                styles={selectStyles}
                                placeholder={officeLoading ? 'Memuat...' : officeError ? 'Error memuat data' : 'Pilih office/divisi...'}
                                isDisabled={isSubmitting || officeLoading}
                                isLoading={officeLoading}
                                isClearable
                                isSearchable
                            />
                            {errors.id_office && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.id_office}
                                </p>
                            )}
                            {officeError && (
                                <p className="text-orange-500 text-xs mt-1">
                                    ⚠️ {officeError}
                                </p>
                            )}
                        </div>

                        {/* Keperluan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Keperluan <span className="text-red-500">*</span>
                                <span className="text-gray-400 text-xs ml-1">
                                    ({formData.keperluan.length}/150)
                                </span>
                            </label>
                            <textarea
                                name="keperluan"
                                value={formData.keperluan}
                                onChange={handleChange}
                                maxLength={150}
                                rows={3}
                                className={`w-full px-4 py-2 border ${errors.keperluan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none`}
                                placeholder="Jelaskan keperluan pengajuan ini..."
                                disabled={isSubmitting}
                            />
                            {errors.keperluan && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.keperluan}
                                </p>
                            )}
                        </div>

                        {/* Catatan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catatan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-4 py-2 border ${errors.catatan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none`}
                                placeholder="Tambahkan catatan..."
                                disabled={isSubmitting}
                            />
                            {errors.catatan && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.catatan}
                                </p>
                            )}
                        </div>
                    </div>
                    )}
                </form>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 transition-colors duration-200 font-medium disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoadingDetail}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Simpan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEditPengajuanModal;