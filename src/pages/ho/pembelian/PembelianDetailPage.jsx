import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Plus } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';

import customTableStyles, { detailPageTableStyles } from './constants/tableStyles';
import DataTable from 'react-data-table-component';
import DetailActionButton from './components/DetailActionButton';
import DetailActionMenu from './components/DetailActionMenu';
import AddEditDetailModal from './modals/AddEditDetailModal';
import DeleteDetailModal from './modals/DeleteDetailModal';

const PembelianDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        createDetail,
        updateDetail,
        deleteDetail,
        loading,
        error
    } = usePembelianHO();
    
    // Get classification data for fallback lookup
    const { klasifikasiHewanOptions, parameterData } = useParameterSelect();
    

    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [mappedDetailData, setMappedDetailData] = useState([]);
    
    // Detail CRUD states
    const [openDetailMenuIndex, setOpenDetailMenuIndex] = useState(null);
    const [activeButtonRef, setActiveButtonRef] = useState(null);
    const [activeRowData, setActiveRowData] = useState(null);
    const [isAddDetailModalOpen, setIsAddDetailModalOpen] = useState(false);
    const [isEditDetailModalOpen, setIsEditDetailModalOpen] = useState(false);
    const [isDeleteDetailModalOpen, setIsDeleteDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success) {
                        // Assuming the response contains header and detail data
                        if (Array.isArray(result.data) && result.data.length > 0) {
                            // Get header info from first detail record
                            const firstDetail = result.data[0];
                            setPembelianData({
                                pubid: firstDetail.pubid_header || id,
                                nota: firstDetail.nota || '',
                                nama_supplier: firstDetail.nama_supplier || '',
                                nama_office: firstDetail.nama_office || '',
                                tgl_masuk: firstDetail.tgl_masuk || '',
                                nama_supir: firstDetail.nama_supir || '',
                                plat_nomor: firstDetail.plat_nomor || '',
                                biaya_lain: firstDetail.biaya_lain || 0,
                                biaya_truk: firstDetail.biaya_truk || 0,
                                jumlah: firstDetail.jumlah_total || result.data.length
                            });
                            setDetailData(result.data);
                        }
                    }
                } catch (err) {
                    // Handle error silently
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail]);

    // Map detail data with eartag names whenever data changes
    useEffect(() => {
        if (detailData.length > 0) {
            // Create a simple mapping using parameter data if available
            const eartagMap = new Map();
            if (parameterData.eartag && Array.isArray(parameterData.eartag)) {
                parameterData.eartag.forEach(eartag => {
                    if (eartag.id) eartagMap.set(String(eartag.id), eartag);
                    if (eartag.pubid) eartagMap.set(String(eartag.pubid), eartag);
                });
            }
            
            console.log('🔍 Parameter eartag data:', parameterData.eartag?.slice(0, 3));
            console.log('🔍 Eartag map keys:', Array.from(eartagMap.keys()));
            
            const mapped = detailData.map(detail => {
                const eartagInfo = eartagMap.get(String(detail.eartag));
                const eartagName = eartagInfo ? (eartagInfo.name || eartagInfo.nama || eartagInfo.kode) : null;
                
                console.log(`📋 Mapping eartag ${detail.eartag}:`, {
                    found: !!eartagInfo,
                    name: eartagName,
                    info: eartagInfo
                });
                
                return {
                    ...detail,
                    eartagInfo,
                    eartagName: eartagName || `Eartag ${detail.eartag}`,
                    eartagId: detail.eartag
                };
            });
            
            setMappedDetailData(mapped);
        } else {
            setMappedDetailData(detailData);
        }
    }, [detailData, parameterData.eartag]);

    const handleBack = () => {
        navigate('/ho/pembelian');
    };

    // Detail CRUD handlers
    const handleOpenMenu = (rowIndex, buttonRef, rowData) => {
        setOpenDetailMenuIndex(rowIndex);
        setActiveButtonRef(buttonRef);
        setActiveRowData(rowData);
    };

    const handleCloseMenu = () => {
        setOpenDetailMenuIndex(null);
        setActiveButtonRef(null);
        setActiveRowData(null);
    };

    const handleAddDetail = () => {
        setIsAddDetailModalOpen(true);
        handleCloseMenu();
    };

    const handleEditDetail = (detail) => {
        setSelectedDetail(detail);
        setIsEditDetailModalOpen(true);
        handleCloseMenu();
    };

    const handleDeleteDetail = (detail) => {
        setSelectedDetail(detail);
        setIsDeleteDetailModalOpen(true);
        handleCloseMenu();
    };

    const handleCloneDetail = (detail) => {
        // Create cloned data with modified fields
        const clonedData = {
            ...detail,
            eartag: `${detail.eartag}_COPY`,
            eartag_supplier: `${detail.eartag_supplier || ''}_COPY`,
            // Remove ID fields so it will be treated as new record
            pubid: undefined,
            id: undefined
        };
        setSelectedDetail(clonedData);
        setIsAddDetailModalOpen(true);
        handleCloseMenu();
    };

    const handleSaveDetail = async (detailFormData, isEdit) => {
        try {
            let result;
            
            if (isEdit) {
                // For edit mode, we need to pass the encrypted PID and detail data
                const editData = {
                    pid: selectedDetail.pubid, // This should be the encrypted PID
                    ...detailFormData
                };
                result = await updateDetail(selectedDetail.pubid, detailFormData);
            } else {
                // For add mode, we need to include the pembelian ID
                const addData = {
                    ...detailFormData,
                    id_pembelian: pembelianData?.pubid || id // Use the pembelian ID
                };
                result = await createDetail(addData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Refresh detail data
                const refreshResult = await getPembelianDetail(id);
                if (refreshResult.success) {
                    setDetailData(refreshResult.data);
                }
                
                // Close modals
                setIsAddDetailModalOpen(false);
                setIsEditDetailModalOpen(false);
                setSelectedDetail(null);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan data'
            });
        }
    };

    const handleConfirmDeleteDetail = async (detail) => {
        try {
            const result = await deleteDetail(detail.pubid);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Refresh detail data
                const refreshResult = await getPembelianDetail(id);
                if (refreshResult.success) {
                    setDetailData(refreshResult.data);
                }
                
                setIsDeleteDetailModalOpen(false);
                setSelectedDetail(null);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menghapus data'
            });
        }
    };

    const handleCloseAddDetailModal = () => {
        setIsAddDetailModalOpen(false);
        setSelectedDetail(null);
    };

    const handleCloseEditDetailModal = () => {
        setIsEditDetailModalOpen(false);
        setSelectedDetail(null);
    };

    const handleCloseDeleteDetailModal = () => {
        setIsDeleteDetailModalOpen(false);
        setSelectedDetail(null);
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

    // Optimized columns for detail table with perfect UX
    const detailColumns = [
        {
            name: 'No',
            width: '80px',
            cell: (row, index) => (
                <div className="font-semibold text-gray-600 text-center">
                    {index + 1}
                </div>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Eartag',
            selector: row => row.eartagName || row.eartag,
            sortable: true,
            width: '200px',
            cell: row => (
                <div className="text-center">
                    <div className="flex flex-col gap-1">
                        <span className="inline-block font-mono text-sm bg-blue-50 px-3 py-1 rounded-md text-blue-700 border border-blue-200">
                            {row.eartagName || row.eartag || '-'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            name: 'Code Eartag',
            selector: row => row.code_eartag,
            sortable: true,
            width: '180px',
            cell: row => (
                <div className="text-center">
                    <span className="inline-block font-mono text-sm bg-purple-50 px-3 py-1 rounded-md text-purple-700 border border-purple-200">
                        {row.code_eartag || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Berat\n(kg)',
            selector: row => row.berat,
            sortable: true,
            width: '140px',
            cell: row => (
                <div className="text-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.berat ? `${row.berat} kg` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Harga\nSatuan',
            selector: row => row.harga,
            sortable: true,
            width: '200px',
            cell: row => (
                <div className="text-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.harga ? `Rp ${Number(row.harga).toLocaleString('id-ID')}` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'HPP\nper Unit',
            selector: row => row.hpp,
            sortable: true,
            width: '200px',
            cell: row => (
                <div className="text-center">
                    <span className="text-purple-600 font-medium text-sm">
                        {row.hpp ? `Rp ${Number(row.hpp).toLocaleString('id-ID')}` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Total\nHarga',
            selector: row => row.total_harga,
            sortable: true,
            width: '220px',
            cell: row => (
                <div className="text-center">
                    <span className="text-red-600 font-semibold text-sm">
                        {row.total_harga ? `Rp ${Number(row.total_harga).toLocaleString('id-ID')}` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Persentase\nBiaya',
            selector: row => row.persentase,
            sortable: true,
            width: '140px',
            cell: row => (
                <div className="text-center">
                    <span className="inline-block bg-green-50 px-3 py-1 rounded-md text-green-700 font-medium text-sm border border-green-200">
                        {row.persentase ? `${row.persentase}%` : '-'}
                    </span>
                </div>
            )
        },

        {
            name: 'Aksi',
            width: '120px',
            cell: (row, index) => (
                <div className="flex justify-center">
                    <DetailActionButton
                        row={row}
                        rowIndex={index}
                        openMenuIndex={openDetailMenuIndex}
                        onOpenMenu={handleOpenMenu}
                        onEdit={null} // Disabled edit functionality
                        onDelete={handleDeleteDetail}
                        onClone={handleCloneDetail}
                    />
                </div>
            ),
            ignoreRowClick: true,
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian...</p>
                </div>
            </div>
        );
    }

    if (error || !pembelianData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <Package size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-0">
            <div className="w-full space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
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
                                    <Eye size={28} />
                                    Detail Pembelian
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian dan detail ternak
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nota || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_supplier || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_office || 'Head Office (HO)'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.tgl_masuk ? new Date(pembelianData.tgl_masuk).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Nama Supir
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_supir || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor
                            </label>
                            <p className="text-lg font-bold text-gray-900 font-mono">
                                {pembelianData.plat_nomor || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Biaya Lain
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_lain ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_lain) : 'Rp 0'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Biaya Truk
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_truk ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_truk) : 'Rp 0'}
                            </p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-100 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" />
                            Ringkasan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-indigo-600">
                                    {mappedDetailData.length}
                                </p>
                                <p className="text-sm text-gray-600">Total Detail</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">
                                    {mappedDetailData.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0).toFixed(1)} kg
                                </p>
                                <p className="text-sm text-gray-600">Total Berat</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">
                                    Rp {mappedDetailData.reduce((sum, item) => sum + (parseFloat(item.total_harga) || 0), 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">Total Harga</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Detail Table Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Table Instructions for Better UX */}
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <Package className="w-6 h-6 text-purple-600" />
                                    Detail Ternak
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian lengkap setiap ternak dalam pembelian ini dengan informasi harga dan biaya
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium text-sm">
                                        {mappedDetailData.length} Item
                                    </span>
                                </div>
                                {mappedDetailData.length > 0 && (
                                    <div className="text-right text-xs text-gray-500">
                                        <div>Total Berat: <span className="font-medium">{mappedDetailData.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0).toFixed(1)} kg</span></div>
                                        <div>Total Nilai: <span className="font-medium">Rp {mappedDetailData.reduce((sum, item) => sum + (parseFloat(item.total_harga) || 0), 0).toLocaleString('id-ID')}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Enhanced Detail Table with Optimal UX */}
                    <div className="w-full overflow-hidden relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Memuat data...</p>
                                </div>
                            </div>
                        )}
                        <DataTable
                            columns={detailColumns}
                            data={mappedDetailData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[5, 10, 15, 20, 25]}
                            paginationComponentOptions={{
                                rowsPerPageText: 'Baris per halaman:',
                                rangeSeparatorText: 'dari',
                                noRowsPerPage: false,
                                selectAllRowsItem: false,
                                selectAllRowsItemText: 'Semua',
                            }}
                            customStyles={detailPageTableStyles}
                            noDataComponent={
                                <div className="text-center py-20">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-gray-100 rounded-full p-6 mb-6">
                                            <Package className="w-16 h-16 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada detail ternak</h3>
                                        <p className="text-gray-500 text-base max-w-md">
                                            Belum ada data detail ternak untuk pembelian ini. Data akan muncul setelah detail ternak ditambahkan.
                                        </p>
                                    </div>
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                            striped={false}
                            dense={false}
                            progressPending={loading}
                            progressComponent={
                                <div className="flex flex-col items-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                                    <p className="text-gray-600">Memuat detail ternak...</p>
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
                        notification.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                )}



                {/* Modals */}
                <AddEditDetailModal
                    isOpen={isAddDetailModalOpen || isEditDetailModalOpen}
                    onClose={isAddDetailModalOpen ? handleCloseAddDetailModal : handleCloseEditDetailModal}
                    onSave={handleSaveDetail}
                    editData={isEditDetailModalOpen ? selectedDetail : (isAddDetailModalOpen ? selectedDetail : null)}
                    loading={loading}
                    pembelianHeaderId={pembelianData?.pubid}
                    officeId={pembelianData?.id_office}
                />

                <DeleteDetailModal
                    isOpen={isDeleteDetailModalOpen}
                    onClose={handleCloseDeleteDetailModal}
                    onConfirm={handleConfirmDeleteDetail}
                    data={selectedDetail}
                    loading={loading}
                />

                {/* Single Action Menu */}
                {openDetailMenuIndex !== null && activeButtonRef && activeRowData && (
                    <DetailActionMenu
                        row={activeRowData}
                        onEdit={null} // Edit disabled - detail page is read-only for editing
                        onDelete={handleDeleteDetail}
                        onClone={handleCloneDetail}
                        onClose={handleCloseMenu}
                        buttonRef={activeButtonRef}
                        openMenuIndex={openDetailMenuIndex}
                    />
                )}
            </div>
        </div>
    );
};

export default PembelianDetailPage;