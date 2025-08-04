import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Send } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import customTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';
import DetailActionButton from './components/DetailActionButton';
import DeleteDetailModal from './modals/DeleteDetailModal';

const DistribusiPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        deleteDetail,
        loading,
        error
    } = usePembelianHO();
    
    // Get parameter select options
    const {
        officeOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect();
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    
    // Detail action states (only for delete functionality)
    const [openDetailMenuId, setOpenDetailMenuId] = useState(null);
    const [isDeleteDetailModalOpen, setIsDeleteDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [notification, setNotification] = useState(null);

    // Distribusi specific states
    const [selectedOffice, setSelectedOffice] = useState('');
    const [showDistribusiForm, setShowDistribusiForm] = useState(false);
    const [tglMasukRph, setTglMasukRph] = useState('');

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

    // Detail delete handlers (only delete functionality, no edit)
    const handleDeleteDetail = (detail) => {
        setSelectedDetail(detail);
        setIsDeleteDetailModalOpen(true);
        setOpenDetailMenuId(null);
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

    const handleCloseDeleteDetailModal = () => {
        setIsDeleteDetailModalOpen(false);
        setSelectedDetail(null);
    };

    // Distribusi handlers
    const handleDistribusi = async () => {
        if (detailData.length === 0) {
            setNotification({
                type: 'error',
                message: 'Tidak ada data ternak untuk didistribusi'
            });
            return;
        }

        if (!selectedOffice) {
            setNotification({
                type: 'error',
                message: 'Pilih office tujuan distribusi'
            });
            return;
        }

        if (!tglMasukRph) {
            setNotification({
                type: 'error',
                message: 'Pilih tanggal masuk RPH'
            });
            return;
        }

        try {
            // Here you would call the distribusi API
            // For now, we'll just show a success message
            setNotification({
                type: 'success',
                message: `Berhasil mendistribusi ${detailData.length} ternak ke office tujuan`
            });
            
            setSelectedOffice('');
            setTglMasukRph('');
            setShowDistribusiForm(false);
        } catch (err) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat mendistribusi data'
            });
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

    // Columns for detail table
    const detailColumns = [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-700 text-center">
                    {index + 1}
                </div>
            )
        },
        {
            name: 'Eartag',
            selector: row => row.eartag,
            width: '15%',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-2 py-1 text-sm font-medium rounded bg-blue-100 text-blue-800 break-words">
                    {row.eartag || '-'}
                </span>
            )
        },
        {
            name: 'Code Eartag',
            selector: row => row.code_eartag,
            width: '15%',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-2 py-1 text-sm font-medium rounded bg-green-100 text-green-800 break-words">
                    {row.code_eartag || '-'}
                </span>
            )
        },
        {
            name: 'Klasifikasi',
            selector: row => row.nama_klasifikasi_hewan,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {row.nama_klasifikasi_hewan || 'N/A'}
                </span>
            )
        },
        {
            name: 'Berat (kg)',
            selector: row => row.berat,
            sortable: true,
            width: '100px',
            cell: row => (
                <span className="text-gray-900 font-medium">
                    {row.berat ? `${row.berat} kg` : '-'}
                </span>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="text-gray-900 font-medium">
                    {row.harga ? `Rp ${Number(row.harga).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Markup',
            selector: row => row.markup_percentage,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="text-green-600 font-medium">
                    {row.markup_percentage ? `${row.markup_percentage}%` : '-'}
                </span>
            )
        },
        {
            name: 'HPP',
            selector: row => row.hpp,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="text-purple-600 font-medium">
                    {row.hpp ? `Rp ${Number(row.hpp).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            width: '140px',
            cell: row => (
                <span className="text-red-600 font-bold">
                    {row.total_harga ? `Rp ${Number(row.total_harga).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Tgl Masuk RPH',
            selector: row => row.tgl_masuk_rph,
            sortable: true,
            width: '130px',
            cell: row => (
                <span className="text-gray-900 font-medium text-xs">
                    {row.tgl_masuk_rph ? new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID') : '-'}
                </span>
            )
        },
        {
            name: 'Aksi',
            width: '80px',
            cell: row => (
                <DetailActionButton
                    row={row}
                    openMenuId={openDetailMenuId}
                    setOpenMenuId={setOpenDetailMenuId}
                    onEdit={null}
                    onDelete={handleDeleteDetail}
                    onClone={null}
                    isActive={openDetailMenuId === row.pubid}
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
                    <p className="text-gray-500 text-lg mt-4">Memuat data distribusi...</p>
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
                    <p className="text-gray-600 mb-4">{error || 'Data pembelian tidak dapat dimuat'}</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl p-5 md:p-7 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                    <Truck size={32} className="text-emerald-600" />
                                    Distribusi Ternak
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Distribusi ternak ke office tujuan
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDistribusiForm(!showDistribusiForm)}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 md:px-7 md:py-3.5 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 text-sm md:text-base font-medium shadow-lg hover:shadow-xl"
                                disabled={detailData.length === 0}
                            >
                                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                                {showDistribusiForm ? 'Tutup Form' : 'Mulai Distribusi'}
                                {detailData.length > 0 && (
                                    <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                        {detailData.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Distribusi Form */}
                {showDistribusiForm && (
                    <div className="bg-white rounded-2xl p-5 md:p-7 shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Send className="w-6 h-6 text-red-600" />
                            Form Distribusi
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                                    Office Tujuan
                                </label>
                                <select
                                    value={selectedOffice}
                                    onChange={(e) => setSelectedOffice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm md:text-base"
                                    disabled={parameterLoading}
                                >
                                    <option value="">
                                        {parameterLoading ? 'Memuat office...' : 'Pilih Office Tujuan'}
                                    </option>
                                    {officeOptions.map((office) => (
                                        <option key={office.value} value={office.value}>
                                            {office.label}
                                        </option>
                                    ))}
                                </select>
                                {parameterError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        Error memuat data office: {parameterError}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                                    Tanggal Masuk RPH
                                </label>
                                <input
                                    type="date"
                                    value={tglMasukRph}
                                    onChange={(e) => setTglMasukRph(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm md:text-base"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                                    Total Ternak Tersedia
                                </label>
                                <div className="text-2xl font-bold text-red-600">
                                    {detailData.length} Ternak
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDistribusiForm(false)}
                                className="px-5 py-2.5 md:px-7 md:py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm md:text-base shadow-lg"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDistribusi}
                                className="px-5 py-2.5 md:px-7 md:py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 text-sm md:text-base shadow-lg"
                                disabled={detailData.length === 0 || !selectedOffice || !tglMasukRph}
                            >
                                Proses Distribusi
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Information */}
                <div className="bg-white rounded-2xl p-5 md:p-7 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900">
                                {pembelianData.nota || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900">
                                {pembelianData.nama_supplier || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900">
                                {pembelianData.nama_office || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900">
                                {pembelianData.tgl_masuk ? new Date(pembelianData.tgl_masuk).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <User className="w-4 h-4 inline mr-1" />
                                Nama Supir
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900">
                                {pembelianData.nama_supir || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl">
                            <label className="block text-xs md:text-sm font-medium text-gray-600 mb-1 flex items-center">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor
                            </label>
                            <p className="text-base md:text-lg font-bold text-gray-900 font-mono">
                                {pembelianData.plat_nomor || '-'}
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
                                <p className="text-sm text-gray-600">Total Ternak</p>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative">
                    <div className="p-6 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-6 h-6 text-purple-600" />
                                Data Ternak untuk Distribusi
                            </h2>
                            <p className="text-gray-600 text-sm mt-1">
                                Semua ternak akan didistribusi ke office tujuan
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <DataTable
                            columns={detailColumns}
                            data={detailData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[5, 10, 15, 20]}
                            customStyles={{
                                ...customTableStyles,
                                table: {
                                    ...customTableStyles.table,
                                    style: {
                                        ...customTableStyles.table.style,
                                        minWidth: '800px', // Sesuaikan dengan ukuran layar minimal
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                    }
                                },
                                tableWrapper: {
                                    style: {
                                        overflowX: 'auto',
                                        overflowY: 'auto',
                                        maxHeight: '600px',
                                        maxWidth: '100%',
                                        width: '100%',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        WebkitOverflowScrolling: 'touch',
                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                    }
                                },
                                headRow: {
                                    style: {
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1000,
                                        backgroundColor: '#ffffff',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }
                                },
                                headCells: {
                                    style: {
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'inherit',
                                        '&:first-child': { // Kolom "No"
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 1002,
                                            backgroundColor: '#ffffff',
                                            borderRight: '2px solid #e2e8f0',
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                    },
                                },
                                cells: {
                                    style: {
                                        wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'normal',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        '&:first-child': { // Kolom "No"
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 999,
                                            backgroundColor: '#fff',
                                            borderRight: '2px solid #e2e8f0',
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                    }
                                }
                            }}
                            progressPending={loading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            responsive={false} // Kontrol penuh scrolling
                            highlightOnHover
                            pointerOnHover
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

                {/* Delete Modal */}
                <DeleteDetailModal
                    isOpen={isDeleteDetailModalOpen}
                    onClose={handleCloseDeleteDetailModal}
                    onConfirm={handleConfirmDeleteDetail}
                    data={selectedDetail}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default DistribusiPage;