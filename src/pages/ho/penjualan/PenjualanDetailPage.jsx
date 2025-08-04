import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, TrendingUp } from 'lucide-react';
import usePenjualanHO from './hooks/usePenjualanHO';
import customTableStyles from '../pembelian/constants/tableStyles';
import DataTable from 'react-data-table-component';

const PenjualanDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPenjualanDetail,
        loading,
        error
    } = usePenjualanHO();
    
    const [penjualanData, setPenjualanData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPenjualanDetail(id);
                    if (result.success) {
                        // Assuming the response contains header and detail data
                        if (Array.isArray(result.data) && result.data.length > 0) {
                            // Get header info from first detail record
                            const firstDetail = result.data[0];
                            setPenjualanData({
                                pubid: firstDetail.pubid_header || id,
                                nota: firstDetail.nota || '',
                                nama_supplier: firstDetail.nama_supplier || '',
                                nama_office: firstDetail.nama_office || '',
                                tgl_masuk: firstDetail.tgl_masuk || '',
                                tgl_masuk_rph: firstDetail.tgl_masuk_rph || '',
                                nama_supir: firstDetail.nama_supir || '',
                                plat_nomor: firstDetail.plat_nomor || '',
                                jumlah: firstDetail.jumlah_total || result.data.length
                            });
                            setDetailData(result.data);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching detail:', err);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat detail penjualan'
                    });
                }
            }
        };

        fetchDetail();
    }, [id, getPenjualanDetail]);

    const handleBack = () => {
        navigate('/ho/penjualan');
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

    // Columns for detail table - readonly for sales
    const detailColumns = [
        {
            name: 'No',
            cell: (row, index) => (
                <div className="font-semibold text-gray-700">
                    {index + 1}
                </div>
            ),
            width: '60px',
            ignoreRowClick: true,
        },
        {
            name: 'Eartag',
            selector: row => row.eartag,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="font-mono text-sm bg-red-100 px-2 py-1 rounded text-red-800">
                    {row.eartag || '-'}
                </span>
            )
        },
        {
            name: 'Code Eartag',
            selector: row => row.code_eartag,
            sortable: true,
            width: '150px',
            cell: row => (
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {row.code_eartag || '-'}
                </span>
            )
        },
        {
            name: 'Klasifikasi',
            selector: row => row.nama_klasifikasi,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {row.nama_klasifikasi || 'N/A'}
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
            name: 'Biaya Truck',
            selector: row => row.biaya_truck,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="text-gray-900">
                    {row.biaya_truck ? `Rp ${Number(row.biaya_truck).toLocaleString('id-ID')}` : '-'}
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
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail penjualan...</p>
                </div>
            </div>
        );
    }

    if (error || !penjualanData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <TrendingUp size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">{error || 'Detail penjualan tidak dapat dimuat'}</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
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
                                    <Eye size={28} />
                                    Detail Penjualan
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap penjualan dan detail ternak
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-red-600" />
                        Informasi Penjualan
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {penjualanData.nota || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {penjualanData.nama_supplier || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office Tujuan
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {penjualanData.nama_office || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk Awal
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {penjualanData.tgl_masuk ? new Date(penjualanData.tgl_masuk).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk RPH
                            </label>
                            <p className="text-lg font-bold text-red-600">
                                {penjualanData.tgl_masuk_rph ? new Date(penjualanData.tgl_masuk_rph).toLocaleDateString('id-ID', {
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
                                {penjualanData.nama_supir || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor
                            </label>
                            <p className="text-lg font-bold text-gray-900 font-mono">
                                {penjualanData.plat_nomor || '-'}
                            </p>
                        </div>
                    </div>

                    {/* Sales Info Box */}
                    <div className="mt-6 bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm font-semibold text-red-900">Informasi Penjualan</h3>
                        </div>
                        <p className="text-xs text-red-800">
                            Data ini merupakan hasil transfer dari pembelian ke penjualan. Ternak telah dipindahkan ke office tujuan dan siap untuk proses selanjutnya.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-100 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-red-600" />
                            Ringkasan Penjualan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">
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
                                <p className="text-3xl font-bold text-purple-600">
                                    Rp {detailData.reduce((sum, item) => sum + (parseFloat(item.total_harga) || 0), 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">Total Nilai</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Table - Read Only for Sales */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-red-600" />
                                    Detail Ternak Terjual
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian setiap ternak dalam penjualan ini (Read-Only)
                                </p>
                            </div>
                            <div className="bg-red-50 px-3 py-1 rounded-full">
                                <span className="text-red-600 text-xs font-medium">📋 Data Penjualan</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detail Table */}
                    <div className="w-full">
                        <DataTable
                            title="Daftar Detail Ternak Terjual"
                            columns={detailColumns}
                            data={detailData}
                            pagination
                            paginationPerPage={100}
                            paginationRowsPerPageOptions={[25, 50, 100, 200]}
                            customStyles={{
                                ...customTableStyles,
                                table: {
                                    ...customTableStyles.table,
                                    style: {
                                        ...customTableStyles.table.style,
                                        minWidth: '800px',
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
                                        maxHeight: '500px',
                                        maxWidth: '100%',
                                        width: '100%',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        WebkitOverflowScrolling: 'touch',
                                    }
                                },
                                headRow: {
                                    style: {
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1000,
                                        backgroundColor: '#ffffff',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                    }
                                },
                                headCells: {
                                    style: {
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'inherit',
                                        padding: '8px 12px',
                                        '&:first-child': {
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
                                        '&:first-child': {
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
                            noDataComponent={
                                <div className="text-center py-12">
                                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">Tidak ada detail ternak terjual ditemukan</p>
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
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
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
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

export default PenjualanDetailPage;