import React, { useCallback } from 'react';
import { ArrowLeft, ShoppingCart, Save } from 'lucide-react';
import Select from 'react-select';
import { selectStyles } from './constants/selectStyles';
import usePembeli from './hooks/usePembeli';
import useTipePembayaran from './hooks/useTipePembayaran';
import useSyaratPembayaran from './hooks/useSyaratPembayaran';
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

    // Determine filter type based on selected tipePembayaran
    // tipe_pembayaran: '1' = KAS, '2' = BANK
    const filterType = formData.tipePembayaran?.value === '1' ? 'KAS' : (formData.tipePembayaran?.value === '2' ? 'BANK' : null);
    const { syaratPembayaranOptions, syaratPembayaranLoading } = useSyaratPembayaran(filterType);

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
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 h-14">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Kembali"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-semibold text-gray-900 truncate">
                                {isEditMode ? 'Edit Penjualan' : 'Penjualan Baru'}
                            </h1>
                            <p className="text-xs text-gray-500 truncate">
                                {isEditMode ? 'Perbarui data transaksi' : 'Buat transaksi penjualan HO'}
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                            <ShoppingCart size={14} />
                            <span>{detailProduk.length} item</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 sm:px-6 lg:px-8 py-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Informasi Penjualan */}
                    <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm">
                        <div className="px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900">Informasi Penjualan</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Isi informasi utama transaksi penjualan.</p>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
                            <Field label="Jenis Penjualan" required>
                                <Select
                                    value={formData.jenisPenjualan}
                                    onChange={(v) => handleSelectChange('jenisPenjualan', v)}
                                    options={jenisPenjualanOptions}
                                    placeholder="Pilih jenis..."
                                    isClearable
                                    isSearchable
                                    styles={selectStyles}
                                    noOptionsMessage={() => 'Tidak ada opsi'}
                                />
                            </Field>
                            <Field label="Pembeli" required>
                                <Select
                                    value={formData.pembeli}
                                    onChange={(v) => handleSelectChange('pembeli', v)}
                                    options={pembeliOptions}
                                    placeholder="Cari pembeli..."
                                    isClearable
                                    isSearchable
                                    isLoading={pembeliLoading}
                                    loadingMessage={() => 'Memuat data pembeli...'}
                                    styles={selectStyles}
                                    noOptionsMessage={() => 'Pembeli tidak ditemukan'}
                                />
                            </Field>
                            <Field label="Tipe Pembayaran" required>
                                <Select
                                    value={formData.tipePembayaran}
                                    onChange={(v) => handleSelectChange('tipePembayaran', v)}
                                    options={tipePembayaranOptions}
                                    placeholder="Pilih tipe..."
                                    isClearable
                                    isSearchable
                                    isLoading={tipePembayaranLoading}
                                    loadingMessage={() => 'Memuat data...'}
                                    styles={selectStyles}
                                    noOptionsMessage={() => 'Tidak ada opsi'}
                                />
                            </Field>
                            <Field label="Syarat Pembayaran" required>
                                <Select
                                    value={formData.syaratPembayaran}
                                    onChange={(v) => handleSelectChange('syaratPembayaran', v)}
                                    options={syaratPembayaranOptions}
                                    placeholder={filterType === 'KAS' ? 'Pilih kas...' : (filterType === 'BANK' ? 'Pilih bank...' : 'Pilih syarat...')}
                                    isClearable
                                    isSearchable
                                    isLoading={syaratPembayaranLoading}
                                    loadingMessage={() => 'Memuat data...'}
                                    styles={selectStyles}
                                    noOptionsMessage={() => 'Syarat tidak ditemukan'}
                                    isDisabled={!formData.tipePembayaran}
                                />
                            </Field>
                            <Field label="Nama Supir" required>
                                <input
                                    type="text"
                                    name="namaSupir"
                                    value={formData.namaSupir}
                                    onChange={handleInputChange}
                                    placeholder="Nama supir"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                                />
                            </Field>
                            <Field label="Plat Nomor" required>
                                <input
                                    type="text"
                                    name="platNomor"
                                    value={formData.platNomor}
                                    onChange={handleInputChange}
                                    placeholder="Plat nomor"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors uppercase"
                                />
                            </Field>
                            <Field label="Nama Penerima" required>
                                <input
                                    type="text"
                                    name="namaPenerima"
                                    value={formData.namaPenerima}
                                    onChange={handleInputChange}
                                    placeholder="Nama penerima"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                                />
                            </Field>
                            <Field label="Keterangan">
                                <input
                                    type="text"
                                    name="keterangan"
                                    value={formData.keterangan}
                                    onChange={handleInputChange}
                                    placeholder="Keterangan (opsional)"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                                />
                            </Field>
                        </div>
                    </section>

                    <ProdukDetailTable
                        detailProduk={detailProduk}
                        onQtyChange={onQtyChange}
                        onRemove={onRemove}
                        onAddProduk={onAddProduk}
                        isJenisPenjualanSelected={!!formData.jenisPenjualan}
                    />

                    <PriceInfoPanel priceInfo={priceInfo} />
                </form>
            </main>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <div className="px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Total Penjualan</p>
                            <p className="text-lg font-bold text-gray-900 tabular-nums">
                                {priceInfo.hargaJual.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {isEditMode ? 'Simpan Perubahan' : 'Simpan Penjualan'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
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

const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default AddEditPenjualanPage;