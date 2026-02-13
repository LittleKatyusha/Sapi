import React, { useCallback } from 'react';
import { ArrowLeft, ShoppingCart, Save } from 'lucide-react';
import Select from 'react-select';
import { selectStyles } from './constants/selectStyles';
import usePembeli from './hooks/usePembeli';
import useTipePembayaran from './hooks/useTipePembayaran';
import usePenjualanForm from './hooks/usePenjualanForm';
import PriceInfoPanel from './components/PriceInfoPanel';
import ProdukDetailTable from './components/ProdukDetailTable';
import ProdukSelectionModal from './modals/ProdukSelectionModal';
import Notification from '../../../components/shared/NotificationComponent';

const jenisPenjualanOptions = [
    { value: 1, label: 'Feedmil', id_jenis: 1 },
    { value: 2, label: 'OVK', id_jenis: 2 },
];

const AddEditPenjualanPage = () => {
    const { pembeliOptions, pembeliLoading } = usePembeli();
    const { tipePembayaranOptions, tipePembayaranLoading } = useTipePembayaran();

    const {
        formData,
        detailProduk,
        loading,
        notification,
        isProdukModalOpen,
        isEditMode,
        priceInfo,
        handleSelectChange,
        handleInputChange,
        handleProdukSelect,
        handleQtyChange,
        handleRemoveDetail,
        handleSubmit,
        handleBack,
        openProdukModal,
        closeProdukModal,
        setNotification,
    } = usePenjualanForm();

    const onQtyChange = useCallback((index, value) => {
        handleQtyChange(index, value);
    }, [handleQtyChange]);

    const onRemove = useCallback((index) => {
        handleRemoveDetail(index);
    }, [handleRemoveDetail]);

    const onAddProduk = useCallback(() => {
        openProdukModal();
    }, [openProdukModal]);

    const onCloseNotification = useCallback(() => {
        setNotification(null);
    }, [setNotification]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100">
            <div className="w-full space-y-0">
                <div className="bg-white p-6 shadow-sm border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:shadow-md">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <ShoppingCart size={32} className="text-emerald-500" />
                                {isEditMode ? 'Edit Penjualan' : 'Tambah Penjualan'}
                            </h1>
                            <p className="text-gray-600 mt-1">{isEditMode ? 'Perbarui data penjualan' : 'Buat file penjualan baru'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-0">
                    <div className="bg-white p-6 shadow-sm border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">Informasi Penjualan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Jenis Penjualan <span className="text-red-500">*</span></label>
                                <Select value={formData.jenisPenjualan} onChange={(v) => handleSelectChange('jenisPenjualan', v)} options={jenisPenjualanOptions} placeholder="Pilih jenis penjualan..." isClearable isSearchable styles={selectStyles} noOptionsMessage={() => 'Tidak ada opsi'} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pembeli <span className="text-red-500">*</span></label>
                                <Select value={formData.pembeli} onChange={(v) => handleSelectChange('pembeli', v)} options={pembeliOptions} placeholder="Cari dan pilih pembeli..." isClearable isSearchable isLoading={pembeliLoading} loadingMessage={() => 'Memuat data pembeli...'} styles={selectStyles} noOptionsMessage={() => 'Pembeli tidak ditemukan'} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Supir <span className="text-red-500">*</span></label>
                                <input type="text" name="namaSupir" value={formData.namaSupir} onChange={handleInputChange} placeholder="Masukkan nama supir..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Plat Nomor <span className="text-red-500">*</span></label>
                                <input type="text" name="platNomor" value={formData.platNomor} onChange={handleInputChange} placeholder="Masukkan plat nomor kendaraan..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-800 uppercase" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Pembayaran <span className="text-red-500">*</span></label>
                                <Select value={formData.tipePembayaran} onChange={(v) => handleSelectChange('tipePembayaran', v)} options={tipePembayaranOptions} placeholder="Pilih tipe pembayaran..." isClearable isSearchable isLoading={tipePembayaranLoading} loadingMessage={() => 'Memuat data tipe pembayaran...'} styles={selectStyles} noOptionsMessage={() => 'Tidak ada opsi'} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Penerima</label>
                                <input type="text" name="namaPenerima" value={formData.namaPenerima} onChange={handleInputChange} placeholder="Masukkan nama penerima..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-800" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                                <input type="text" name="keterangan" value={formData.keterangan} onChange={handleInputChange} placeholder="Masukkan keterangan (opsional)..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-gray-800" />
                            </div>
                        </div>
                    </div>

                    <ProdukDetailTable
                        detailProduk={detailProduk}
                        onQtyChange={onQtyChange}
                        onRemove={onRemove}
                        onAddProduk={onAddProduk}
                        isJenisPenjualanSelected={!!formData.jenisPenjualan}
                    />

                    <PriceInfoPanel priceInfo={priceInfo} />

                    <div className="flex justify-end p-6 bg-white">
                        <button type="submit" disabled={loading} className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save size={22} />
                                    {isEditMode ? 'Perbarui Penjualan' : 'Buat File Penjualan'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <Notification
                notification={notification}
                onClose={onCloseNotification}
            />

            <ProdukSelectionModal
                isOpen={isProdukModalOpen}
                onClose={closeProdukModal}
                jenisPenjualan={formData.jenisPenjualan?.label}
                idJenis={formData.jenisPenjualan?.id_jenis}
                onSelectProduk={handleProdukSelect}
            />
        </div>
    );
};

export default AddEditPenjualanPage;