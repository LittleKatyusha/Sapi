import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Plus } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import customTableStyles from './constants/tableStyles';
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
    const { klasifikasiHewanOptions } = useParameterSelect();
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    
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
                                jumlah: firstDetail.jumlah_total || result.data.length
                            });
                            setDetailData(result.data);
                        }
                    }
                } catch (err) {
                    // console.error('Error fetching detail:', err);
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail]);

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
        // console.log('Clone detail:', detail);
        // Create cloned data with modified fields
        const clonedData = {
            ...detail,
            eartag: `${detail.eartag}_COPY`,
            code_eartag: `${detail.code_eartag}_COPY`,
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
                result = await updateDetail(selectedDetail.pubid, detailFormData);
            } else {
                result = await createDetail(detailFormData);
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
                message: 'Terjadi kesalahan saat menyimpan data'
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
                message: 'Terjadi kesalahan saat menghapus data'
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

    // Columns for detail table
    const detailColumns = [
        {
            name: 'No',
            cell: (row, index) => (
                <div className="font-semibold text-gray-700">
                    {index + 1}
                </div>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Eartag',
            selector: row => row.eartag,
            sortable: true,
            cell: row => (
                <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded text-blue-800">
                    {row.eartag || '-'}
                </span>
            )
        },
        {
            name: 'Code Eartag',
            selector: row => row.code_eartag,
            sortable: true,
            cell: row => (
                <span className="font-mono text-[11px] bg-gray-100 px-2 py-1 rounded">
                    {row.code_eartag || '-'}
                </span>
            )
        },
        {
            name: 'Klasifikasi',
            selector: row => 'N/A',
            sortable: true,
            cell: row => (
                <span className="inline-flex px-2 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600">
                    N/A
                </span>
            )
        },
        {
            name: 'Berat (kg)',
            selector: row => row.berat,
            sortable: true,
            cell: row => (
                <span className="text-gray-900 font-medium text-xs">
                    {row.berat ? `${row.berat} kg` : '-'}
                </span>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            cell: row => (
                <span className="text-gray-900 font-medium text-xs">
                    {row.harga ? `Rp ${Number(row.harga).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Markup',
            selector: row => {
                // Calculate markup percentage from harga and hpp
                const harga = parseFloat(row.harga) || 0;
                const hpp = parseFloat(row.hpp) || 0;
                if (harga > 0 && hpp > harga) {
                    return ((hpp - harga) / harga * 100).toFixed(1);
                }
                return 0;
            },
            sortable: true,
            cell: row => {
                // Calculate markup percentage from harga and hpp
                const harga = parseFloat(row.harga) || 0;
                const hpp = parseFloat(row.hpp) || 0;
                let markupPercentage = 0;
                
                if (harga > 0 && hpp > harga) {
                    markupPercentage = ((hpp - harga) / harga * 100).toFixed(1);
                }
                
                return (
                    <span className="text-green-600 font-medium text-xs">
                        {markupPercentage > 0 ? `${markupPercentage}%` : '-'}
                    </span>
                );
            }
        },
        {
            name: 'HPP',
            selector: row => row.hpp,
            sortable: true,
            cell: row => (
                <span className="text-purple-600 font-medium text-xs">
                    {row.hpp ? `Rp ${Number(row.hpp).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            cell: row => (
                <span className="text-red-600 font-bold text-xs">
                    {row.total_harga ? `Rp ${Number(row.total_harga).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Aksi',
            width: 'fit-content',
            cell: (row, index) => (
                <DetailActionButton
                    row={row}
                    rowIndex={index}
                    openMenuIndex={openDetailMenuIndex}
                    onOpenMenu={handleOpenMenu}
                    onEdit={null} // Disabled edit functionality
                    onDelete={handleDeleteDetail}
                    onClone={handleCloneDetail}
                />
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
                                {pembelianData.nama_office || '-'}
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
                                    {detailData.length}
                                </p>
                                <p className="text-sm text-gray-600">Total Detail</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">
                                    {detailData.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0).toFixed(1)} kg
                                </p>
                                <p className="text-sm text-gray-600">Total Berat</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">
                                    Rp {detailData.reduce((sum, item) => sum + (parseFloat(item.total_harga) || 0), 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">Total Harga</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative w-full">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-purple-600" />
                                    Detail Ternak
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian setiap ternak dalam pembelian ini
                                </p>
                            </div>
                            {/* Button Tambah Detail dihilangkan sesuai permintaan */}
                        </div>
                    </div>
                    
                    {/* Tabel Detail Ternak - Diperbarui untuk Estetika dan Konsistensi */}
                    <div className="w-full"> {/* Tambahkan wrapper untuk konsistensi */}
                        <DataTable
                            title="Daftar Detail Ternak" // Opsional: Tambahkan judul
                            columns={detailColumns}
                            data={detailData}
                            pagination
                            // --- PERUBAHAN/KONSISTENSI DIMULAI DI SINI ---
                            // 1. Gunakan customStyles yang lengkap dan disesuaikan
                            customStyles={{
                                // Mulai dengan gaya dasar yang ada
                                ...customTableStyles,
                                // Timpa atau tambahkan gaya spesifik untuk tabel ini
                                table: {
                                    ...customTableStyles.table,
                                    style: {
                                        ...customTableStyles.table.style,
                                        // Sesuaikan minWidth dengan jumlah dan lebar kolom
                                        // Gunakan nilai yang konsisten dengan halaman lain, misalnya 800px
                                        // atau sesuaikan dengan breakpoint jika perlu (lihat Pasted_Text_1753621272467.txt)
                                        minWidth: '800px', // Misalnya, sesuaikan jika diperlukan
                                        width: '100%',
                                        tableLayout: 'fixed', // Kritis untuk kontrol lebar kolom
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                    }
                                },
                                tableWrapper: {
                                    style: {
                                        overflowX: 'auto', // Aktifkan scroll horizontal
                                        overflowY: 'auto', // Aktifkan scroll vertikal jika perlu
                                        maxHeight: '500px', // Sesuaikan tinggi maksimal
                                        maxWidth: '100%',
                                        width: '100%',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px', // Sesuaikan border radius
                                        WebkitOverflowScrolling: 'touch',
                                        // Tambahkan boxShadow ringan jika diinginkan (opsional)
                                        // boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.05)',
                                    }
                                },
                                headRow: {
                                    style: {
                                        position: 'sticky',
                                        top: 0,
                                        // --- PERBAIKAN Z-INDEX ---
                                        // Pastikan z-index headRow lebih tinggi dari sel data sticky
                                        zIndex: 1000,
                                        // --------------------------
                                        backgroundColor: '#ffffff',
                                        fontWeight: 'bold',
                                        // Sesuaikan boxShadow untuk konsistensi
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)', // Bayangan lebih halus
                                    }
                                },
                                // --- TAMBAHKAN headCells untuk styling header sticky ---
                                headCells: {
                                    style: {
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'inherit',
                                        padding: '8px 12px', // Sesuaikan padding
                                        // --- PERBAIKAN/PASTIKAN STYLING KOLOM "NO" DI HEADER ---
                                        '&:first-child': { // Target header kolom pertama ("No")
                                            position: 'sticky',
                                            left: 0,
                                            // --- PERBAIKAN Z-INDEX ---
                                            // z-index header kolom "No" harus > headRow dan > sel data sticky
                                            zIndex: 1002,
                                            // --------------------------
                                            backgroundColor: '#ffffff', // Latar belakang header
                                            borderRight: '2px solid #e2e8f0', // Border kanan
                                            // Tambahkan bayangan vertikal untuk efek pemisahan
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                        // ------------------------------
                                    },
                                },
                                // --- AKHIR TAMBAHAN headCells ---
                                cells: {
                                    style: {
                                        wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'normal',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        // Sesuaikan padding untuk konsistensi
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        // --- PERBAIKAN/PASTIKAN STYLING KOLOM "NO" DI DATA ---
                                        '&:first-child': { // Target sel data kolom pertama ("No")
                                            position: 'sticky',
                                            left: 0,
                                            // --- PERBAIKAN Z-INDEX ---
                                            // z-index sel data kolom "No" harus < headRow
                                            zIndex: 999,
                                            // --------------------------
                                            backgroundColor: '#fff', // Latar belakang sel
                                            borderRight: '2px solid #e2e8f0', // Border kanan
                                            // Tambahkan bayangan vertikal untuk efek pemisahan
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                        // ------------------------------
                                    }
                                }
                                // --- PERBAIKAN HOVER UNTUK BARIS ---
                                // Jika ingin hover menyeluruh termasuk kolom sticky (kecuali "No")
                                // rows: {
                                //     style: {
                                //         '&:hover': {
                                //             backgroundColor: 'rgba(243, 244, 246, 0.7)', // Contoh warna hover
                                //         },
                                //     },
                                // },
                                // -----------------------------------
                            }}
                            // --- AKHIR PERUBAHAN/KONSISTENSI customStyles ---
                            noDataComponent={
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">Tidak ada detail ternak ditemukan</p>
                                    {/* Tambahkan tombol jika perlu */}
                                    {/* <button ...>Tambah Detail Ternak</button> */}
                                </div>
                            }
                            responsive={false} // Konsisten dengan halaman utama untuk kontrol penuh scrolling
                            highlightOnHover
                            pointerOnHover
                        />
                    </div>
                    {/* Akhir Tabel Detail Ternak - Diperbarui */}
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