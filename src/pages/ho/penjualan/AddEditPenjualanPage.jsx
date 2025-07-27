import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Building2, User, Calendar, Hash, Package, X, AlertCircle } from 'lucide-react';
import usePenjualanHO from './hooks/usePenjualanHO';
import useParameterSelect from '../pembelian/hooks/useParameterSelect';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const AddEditPenjualanPage = () => {
    const { id } = useParams(); // ID untuk edit mode
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const cloneData = location.state?.cloneData;
    
    const {
        getPenjualanDetail,
        createPenjualan,
        updatePenjualan,
        getNotaBySupplier,
        loading,
        error
    } = usePenjualanHO();

    // Get master data from centralized parameter endpoint
    const {
        parameterData,
        supplierOptions,
        officeOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect();


    // Available nota options (should be fetched from pembelian data)
    const [notaOptions, setNotaOptions] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    // Form state - simpler than purchase since sales just moves existing purchase data
    const [formData, setFormData] = useState({
        idOffice: '', // Destination office (not fixed like in purchase)
        nota: '',
        idSupplier: '',
        tglMasukRph: new Date().toISOString().split('T')[0]
    });

    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch available nota based on selected supplier
    const fetchNotaBySupplier = async (supplierId) => {
        if (!supplierId) {
            setNotaOptions([]);
            return;
        }

        try {
            const result = await getNotaBySupplier(supplierId);
            
            if (result.success && result.data && Array.isArray(result.data)) {
                const options = result.data.map(item => ({
                    value: item.nota || item.id,
                    label: item.nota || `Nota ${item.id}`,
                    id: item.id
                }));
                setNotaOptions(options);
            } else {
                console.error('Failed to fetch nota options:', result.message);
                setNotaOptions([]);
            }
        } catch (error) {
            console.error('Error fetching nota options:', error);
            setNotaOptions([]);
        }
    };

    // Load data for edit mode
    useEffect(() => {
        if (isEdit && id) {
            const loadEditData = async () => {
                try {
                    const decodedId = decodeURIComponent(id);
                    const result = await getPenjualanDetail(decodedId);
                    
                    if (result.success && result.data.length > 0) {
                        const firstDetail = result.data[0];
                        
                        // Load form data
                        setFormData({
                            idOffice: firstDetail.id_office || '',
                            nota: firstDetail.nota || '',
                            idSupplier: firstDetail.id_supplier || '',
                            tglMasukRph: firstDetail.tgl_masuk_rph || new Date().toISOString().split('T')[0]
                        });

                        // Set selected supplier and fetch nota
                        if (firstDetail.id_supplier) {
                            setSelectedSupplier(firstDetail.id_supplier);
                            await fetchNotaBySupplier(firstDetail.id_supplier);
                        }
                    }
                } catch (err) {
                    console.error('Error loading edit data:', err);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat data untuk edit'
                    });
                }
            };

            loadEditData();
        } else if (cloneData) {
            // Clone mode - populate with clone data
            setFormData({
                idOffice: cloneData.id_office || '',
                nota: cloneData.nota || '',
                idSupplier: cloneData.id_supplier || '',
                tglMasukRph: new Date().toISOString().split('T')[0] // Always use today for clone
            });
            
            if (cloneData.id_supplier) {
                setSelectedSupplier(cloneData.id_supplier);
                fetchNotaBySupplier(cloneData.id_supplier);
            }
        }
    }, [isEdit, id, cloneData, getPenjualanDetail]);

    // Handle form changes
    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // When supplier changes, fetch available nota
        if (field === 'idSupplier') {
            setSelectedSupplier(value);
            fetchNotaBySupplier(value);
            // Reset nota when supplier changes
            setFormData(prev => ({
                ...prev,
                nota: ''
            }));
        }
    };

    // Validation
    const validateForm = () => {
        const errors = [];

        if (!formData.idOffice) errors.push('Office tujuan harus dipilih');
        if (!formData.nota) errors.push('Nota harus dipilih');
        if (!formData.idSupplier) errors.push('Supplier harus dipilih');
        if (!formData.tglMasukRph) errors.push('Tanggal masuk RPH harus diisi');

        return errors;
    };

    // Handle submit
    const handleSubmit = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setNotification({
                type: 'error',
                message: validationErrors.join(', ')
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            let result;
            if (isEdit) {
                result = await updatePenjualan(id, formData);
            } else {
                result = await createPenjualan(formData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Navigate back after success
                setTimeout(() => {
                    navigate('/ho/penjualan');
                }, 1500);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan data'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back
    const handleBack = () => {
        if (window.confirm('Apakah Anda yakin ingin kembali? Data yang belum disimpan akan hilang.')) {
            navigate('/ho/penjualan');
        }
    };

    // Auto hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                    <Package size={28} />
                                    {isEdit ? 'Edit Penjualan' : 'Tambah Penjualan'}
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {isEdit ? 'Ubah data penjualan' : 'Pindahkan data pembelian ke penjualan (RPH)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Penjualan
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Office Tujuan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office Tujuan *
                            </label>
                            <SearchableSelect
                                value={formData.idOffice}
                                onChange={(value) => handleFormChange('idOffice', value)}
                                options={officeOptions}
                                placeholder={parameterLoading ? 'Loading offices...' : 'Pilih Office Tujuan'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Pilih office tujuan untuk penjualan (biasanya RPH)
                            </p>
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Supplier *
                            </label>
                            <SearchableSelect
                                value={formData.idSupplier}
                                onChange={(value) => handleFormChange('idSupplier', value)}
                                options={supplierOptions}
                                placeholder={parameterLoading ? 'Loading suppliers...' : 'Pilih Supplier'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Pilih supplier untuk melihat nota yang tersedia
                            </p>
                        </div>

                        {/* Nota */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nota Pembelian *
                            </label>
                            <SearchableSelect
                                value={formData.nota}
                                onChange={(value) => handleFormChange('nota', value)}
                                options={notaOptions}
                                placeholder={
                                    !selectedSupplier 
                                        ? 'Pilih supplier terlebih dahulu' 
                                        : notaOptions.length === 0
                                        ? 'Tidak ada nota tersedia'
                                        : 'Pilih Nota'
                                }
                                isLoading={false}
                                isDisabled={!selectedSupplier || notaOptions.length === 0}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Hanya nota dari supplier yang dipilih yang akan ditampilkan
                            </p>
                        </div>

                        {/* Tanggal Masuk RPH */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk RPH *
                            </label>
                            <input
                                type="date"
                                value={formData.tglMasukRph}
                                onChange={(e) => handleFormChange('tglMasukRph', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Tanggal ternak masuk ke RPH untuk penjualan
                            </p>
                        </div>
                    </div>

                    {/* Parameter Loading/Error State */}
                    {parameterLoading && (
                        <div className="mt-6 bg-blue-50 p-4 rounded-lg flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="text-blue-700">Memuat data parameter...</span>
                        </div>
                    )}
                    
                    {parameterError && (
                        <div className="mt-6 bg-red-50 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-red-700">Error loading parameters: {parameterError}</span>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Informasi Penjualan</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Data penjualan akan mengambil detail dari data pembelian yang dipilih</li>
                            <li>• Setelah dipindah ke penjualan, data akan tersedia di office tujuan</li>
                            <li>• Tanggal masuk RPH menandai kapan ternak siap untuk dijual</li>
                            <li>• Pastikan memilih office tujuan yang sesuai (biasanya RPH)</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleBack}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 font-medium disabled:opacity-50 shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                            notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
                        }`}>
                            <div className="p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        {notification.type === 'success' ? (
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3 w-0 flex-1 pt-0.5">
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex">
                                        <button
                                            onClick={() => setNotification(null)}
                                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddEditPenjualanPage;