import React from 'react';
import { Package, Wallet, Boxes, PlusCircle, Download, Receipt, FileText, Truck, Tag, Building, Calendar, User, Box } from 'lucide-react';
import PembelianFilterPanel from './PembelianFilterPanel';
import ModernPembelianLainLainTable from './ModernPembelianLainLainTable';
import ModernDataTable from './ModernDataTable';

const PembelianLainLainTabs = ({
    activeTab,
    setActiveTab,
    // Aset props
    asetData,
    asetLoading,
    asetError,
    asetPagination,
    asetFilters,
    onAsetFilterApply,
    onAsetFilterReset,
    onAsetPageChange,
    onAsetPerPageChange,
    onAsetEdit,
    onAsetDelete,
    onAsetDetail,
    getFarmName,
    getBankName,
    bankOptions,
    onAsetAdd,
    onAsetReport,
    isDownloadingReport,
    // Biaya props
    biayaData,
    biayaLoading,
    biayaError,
    biayaPagination,
    biayaFilters,
    onBiayaFilterApply,
    onBiayaFilterReset,
    onBiayaPageChange,
    onBiayaPerPageChange,
    onBiayaAdd,
    onBiayaReport,
    biayaColumns,
    // Bahan props
    bahanData,
    bahanLoading,
    bahanError,
    bahanPagination,
    bahanFilters,
    onBahanFilterApply,
    onBahanFilterReset,
    onBahanPageChange,
    onBahanPerPageChange,
    onBahanAdd,
    onBahanReport,
    bahanColumns
}) => {
    const tabs = [
        { id: 'aset', label: 'Pembelian Aset', icon: Package, color: 'blue' },
        { id: 'biaya', label: 'Pembelian Biaya-Biaya', icon: Wallet, color: 'emerald' },
        { id: 'bahan', label: 'Pembelian Bahan Pembantu', icon: Boxes, color: 'amber' }
    ];

    const tabColorStyles = {
        aset: {
            active: 'bg-blue-600 text-white shadow-sm',
            inactive: 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
        },
        biaya: {
            active: 'bg-emerald-600 text-white shadow-sm',
            inactive: 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
        },
        bahan: {
            active: 'bg-amber-600 text-white shadow-sm',
            inactive: 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
        }
    };

    const asetFields = [
        { key: 'nota_sistem', label: 'Nota Sistem', icon: Receipt, placeholder: 'Cari nota sistem' },
        { key: 'nota', label: 'Nota', icon: FileText, placeholder: 'Cari nota' },
        { key: 'nama_supplier', label: 'Supplier', icon: Truck, placeholder: 'Cari supplier' },
        { key: 'plat_nomor', label: 'Plat Nomor', icon: Tag, placeholder: 'Cari plat nomor' },
        { key: 'jenis_pembelian', label: 'Jenis Pembelian', icon: Package, placeholder: 'Pilih jenis', type: 'select', options: [{ value: 'Internal', label: 'Internal' }, { value: 'External', label: 'External' }] },
        { key: 'startDate', label: 'Tanggal Mulai', icon: Calendar, placeholder: 'Tanggal mulai', type: 'date' },
        { key: 'endDate', label: 'Tanggal Akhir', icon: Calendar, placeholder: 'Tanggal akhir', type: 'date' }
    ];

    const biayaFields = [
        { key: 'nama_office', label: 'Office', icon: Building, placeholder: 'Cari office' },
        { key: 'peruntukan', label: 'Peruntukan', icon: Tag, placeholder: 'Cari peruntukan' },
        { key: 'nama_pembayar', label: 'Pembayar', icon: User, placeholder: 'Cari pembayar' },
        { key: 'tipe_pembayaran', label: 'Tipe Pembayaran', icon: Wallet, placeholder: 'Cari tipe pembayaran' },
        { key: 'nama_item', label: 'Item', icon: Package, placeholder: 'Cari item' },
        { key: 'startDate', label: 'Tanggal Mulai', icon: Calendar, placeholder: 'Tanggal mulai', type: 'date' },
        { key: 'endDate', label: 'Tanggal Akhir', icon: Calendar, placeholder: 'Tanggal akhir', type: 'date' }
    ];

    const bahanFields = [
        { key: 'nama_office', label: 'Office', icon: Building, placeholder: 'Cari office' },
        { key: 'nama_produk', label: 'Produk', icon: Box, placeholder: 'Cari produk' },
        { key: 'peruntukan', label: 'Peruntukan', icon: Tag, placeholder: 'Cari peruntukan' },
        { key: 'pemasok', label: 'Pemasok', icon: Truck, placeholder: 'Cari pemasok' },
        { key: 'tipe_pembayaran', label: 'Tipe Pembayaran', icon: Wallet, placeholder: 'Cari tipe pembayaran' },
        { key: 'startDate', label: 'Tanggal Mulai', icon: Calendar, placeholder: 'Tanggal mulai', type: 'date' },
        { key: 'endDate', label: 'Tanggal Akhir', icon: Calendar, placeholder: 'Tanggal akhir', type: 'date' }
    ];

    return (
        <div className="space-y-4">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                <div className="flex flex-wrap gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? tabColorStyles[tab.id].active
                                    : tabColorStyles[tab.id].inactive
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aset Tab */}
            {activeTab === 'aset' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onAsetReport}
                                disabled={isDownloadingReport}
                                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Laporan
                            </button>
                            <button
                                onClick={onAsetAdd}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tambah Pembelian Aset
                            </button>
                        </div>
                    </div>

                    <PembelianFilterPanel
                        title="Filter Pembelian Aset"
                        filters={asetFilters}
                        fields={asetFields}
                        onApply={onAsetFilterApply}
                        onReset={onAsetFilterReset}
                    />

                    {asetError && (
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 flex items-center gap-3 text-red-700">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold">Gagal memuat data</div>
                                <div className="text-xs text-red-600">{asetError}</div>
                            </div>
                        </div>
                    )}

                    <ModernPembelianLainLainTable
                        data={asetData}
                        loading={asetLoading}
                        serverPagination={{
                            currentPage: asetPagination.currentPage,
                            perPage: asetPagination.perPage,
                            totalRecords: asetPagination.totalItems || asetPagination.totalRecords || 0
                        }}
                        onPageChange={onAsetPageChange}
                        onPerPageChange={onAsetPerPageChange}
                        onEdit={onAsetEdit}
                        onDelete={onAsetDelete}
                        onDetail={onAsetDetail}
                        getFarmName={getFarmName}
                        getBankName={getBankName}
                        bankOptions={bankOptions}
                    />
                </div>
            )}

            {/* Biaya Tab */}
            {activeTab === 'biaya' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onBiayaReport}
                                disabled={isDownloadingReport}
                                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Laporan
                            </button>
                            <button
                                onClick={onBiayaAdd}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tambah Pembelian Biaya-Biaya
                            </button>
                        </div>
                    </div>

                    <PembelianFilterPanel
                        title="Filter Pembelian Biaya-Biaya"
                        filters={biayaFilters}
                        fields={biayaFields}
                        onApply={onBiayaFilterApply}
                        onReset={onBiayaFilterReset}
                    />

                    <ModernDataTable
                        columns={biayaColumns}
                        data={biayaData}
                        loading={biayaLoading}
                        error={biayaError}
                        emptyMessage="Tidak ada data pembelian biaya-biaya ditemukan"
                        pagination={biayaPagination}
                        onPageChange={onBiayaPageChange}
                        onPerPageChange={onBiayaPerPageChange}
                        color="emerald"
                    />
                </div>
            )}

            {/* Bahan Tab */}
            {activeTab === 'bahan' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onBahanReport}
                                disabled={isDownloadingReport}
                                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                Laporan
                            </button>
                            <button
                                onClick={onBahanAdd}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tambah Pembelian Bahan Pembantu
                            </button>
                        </div>
                    </div>

                    <PembelianFilterPanel
                        title="Filter Pembelian Bahan Pembantu"
                        filters={bahanFilters}
                        fields={bahanFields}
                        onApply={onBahanFilterApply}
                        onReset={onBahanFilterReset}
                    />

                    <ModernDataTable
                        columns={bahanColumns}
                        data={bahanData}
                        loading={bahanLoading}
                        error={bahanError}
                        emptyMessage="Tidak ada data pembelian bahan pembantu ditemukan"
                        pagination={bahanPagination}
                        onPageChange={onBahanPageChange}
                        onPerPageChange={onBahanPerPageChange}
                        color="amber"
                    />
                </div>
            )}
        </div>
    );
};

export default PembelianLainLainTabs;
