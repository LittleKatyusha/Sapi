import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Weight, DollarSign } from 'lucide-react';
import usePembelianFeedmil from './hooks/usePembelianFeedmil';
import customTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianFeedmilDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        loading,
        error
    } = usePembelianFeedmil();
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success && result.data && result.data.length > 0) {
                        // Backend returns array of detail items from dt_pembelian_ho_feedmil_detail view
                        const detailItems = result.data;
                        
                        // Set header data from first item (all items have same header info)
                        const firstItem = detailItems[0];
                        setPembelianData({
                            encryptedPid: firstItem.pubid || id,
                            nota: firstItem.nota || '',
                            nama_supplier: firstItem.nama_supplier || '',
                            nama_office: 'Head Office (HO)',
                            tgl_masuk: firstItem.tgl_masuk || '',
                            nama_supir: firstItem.nama_supir || '',
                            plat_nomor: firstItem.plat_nomor || '',
                            biaya_lain: firstItem.biaya_lain || 0,
                            biaya_total: firstItem.biaya_total || 0,
                            jumlah: firstItem.jumlah || 0,
                            satuan: 'sak', // Default unit for feedmil
                            berat_total: firstItem.berat_total || 0,
                            jenis_pembelian: 'Feedmil'
                        });

                        // Transform detail items to match frontend structure
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: index + 1,
                            pubid: item.pubid || '',
                            item_name: item.item_name || '',
                            id_klasifikasi_feedmil: item.id_klasifikasi_feedmil || '',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0, // Backend uses 'persentase'
                            berat: parseInt(item.berat) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null
                        }));
                        
                        setDetailData(transformedDetailItems);
                    } else {
                        // If no detail data found, but request was successful, show header with empty details
                        console.warn('No detail data found for pembelian feedmil:', id);
                        setPembelianData({
                            encryptedPid: id,
                            nota: '',
                            nama_supplier: '',
                            nama_office: 'Head Office (HO)',
                            tgl_masuk: '',
                            nama_supir: '',
                            plat_nomor: '',
                            biaya_lain: 0,
                            biaya_total: 0,
                            jumlah: 0,
                            satuan: 'sak',
                            berat_total: 0,
                            jenis_pembelian: 'Feedmil'
                        });
                        setDetailData([]);
                    }
                } catch (err) {
                    console.error('Error fetching pembelian feedmil detail:', err);
                    setNotification({
                        type: 'error',
                        message: err.message || 'Gagal memuat detail pembelian feedmil'
                    });
                    setPembelianData(null);
                    setDetailData([]);
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail]);

    const handleBack = () => {
        navigate('/ho/pembelian-feedmil');
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

    // Columns for detail table - Sesuai dengan struktur backend dt_pembelian_ho_feedmil_detail view
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
            name: 'Nama Item',
            selector: row => row.item_name,
            sortable: true,
            width: '18%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="font-medium text-gray-900 break-words" title={row.item_name}>
                        {row.item_name || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Klasifikasi Feedmil',
            selector: row => row.id_klasifikasi_feedmil,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {row.id_klasifikasi_feedmil || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Berat (kg)',
            selector: row => row.berat,
            sortable: true,
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="text-gray-900 break-words">
                        {row.berat ? `${row.berat} kg` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-green-100 text-green-800 break-words">
                        {row.harga ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.harga) : 'Rp 0'}
                    </span>
                </div>
            )
        },
        {
            name: 'Persentase (%)',
            selector: row => row.persentase,
            sortable: true,
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 break-words">
                        {row.persentase ? `${parseFloat(row.persentase).toFixed(1)}%` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'HPP',
            selector: row => row.hpp,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 break-words">
                        {row.hpp ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.hpp) : 'Rp 0'}
                    </span>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-full bg-red-100 text-red-800 break-words">
                        {row.total_harga ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.total_harga) : 'Rp 0'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tgl Masuk RPH',
            selector: row => row.tgl_masuk_rph,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="text-gray-900 break-words">
                        {row.tgl_masuk_rph ? new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID') : '-'}
                    </span>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian feedmil...</p>
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
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian feedmil tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                    <Eye size={28} className="text-blue-500" />
                                    Detail Pembelian Feedmil
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian feedmil dan detail produk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian Feedmil
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
                                Jenis Pembelian
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.jenis_pembelian || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Weight className="w-4 h-4 inline mr-1" />
                                Berat Total
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.berat_total ? `${parseFloat(pembelianData.berat_total).toFixed(1)} kg` : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
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


                </div>

                {/* Detail Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative w-full">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-green-600" />
                                    Detail Item Feedmil
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian setiap item feedmil dalam pembelian ini
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <DataTable
                            title="Daftar Detail Item Feedmil"
                            columns={detailColumns}
                            data={detailData}
                            pagination
                            customStyles={{
                                 // Mulai dengan gaya dasar yang ada
                                 ...customTableStyles,
                                 // Timpa atau tambahkan gaya spesifik untuk tabel ini
                                 table: {
                                     ...customTableStyles.table,
                                     style: {
                                         ...customTableStyles.table.style,
                                         // Sesuaikan minWidth dengan jumlah dan lebar kolom feedmil detail
                                         minWidth: '1200px', // Lebar untuk 9 kolom dengan total width ~1000px
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
                                     }
                                 },
                                 headRow: {
                                     style: {
                                         position: 'sticky',
                                         top: 0,
                                         // Pastikan z-index headRow lebih tinggi dari sel data sticky
                                         zIndex: 1000,
                                         backgroundColor: '#ffffff',
                                         fontWeight: 'bold',
                                         // Sesuaikan boxShadow untuk konsistensi
                                         boxShadow: '0 2px 4px rgba(0,0,0,0.08)', // Bayangan lebih halus
                                     }
                                 },
                                 // Tambahkan headCells untuk styling header sticky
                                 headCells: {
                                     style: {
                                         fontSize: '12px',
                                         fontWeight: 'bold',
                                         color: 'inherit',
                                         padding: '8px 12px', // Sesuaikan padding
                                         // Perbaikan/pastikan styling kolom "No" di header
                                         '&:first-child': { // Target header kolom pertama ("No")
                                             position: 'sticky',
                                             left: 0,
                                             // z-index header kolom "No" harus > headRow dan > sel data sticky
                                             zIndex: 1002,
                                             backgroundColor: '#ffffff', // Latar belakang header
                                             borderRight: '2px solid #e2e8f0', // Border kanan
                                             // Tambahkan bayangan vertikal untuk efek pemisahan
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
                                         // Sesuaikan padding untuk konsistensi
                                         padding: '8px 12px',
                                         fontSize: '12px',
                                         lineHeight: '1.4',
                                         // Perbaikan/pastikan styling kolom "No" di data
                                         '&:first-child': { // Target sel data kolom pertama ("No")
                                             position: 'sticky',
                                             left: 0,
                                             // z-index sel data kolom "No" harus < headRow
                                             zIndex: 999,
                                             backgroundColor: '#fff', // Latar belakang sel
                                             borderRight: '2px solid #e2e8f0', // Border kanan
                                             // Tambahkan bayangan vertikal untuk efek pemisahan
                                             boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                         },
                                     }
                                 }
                             }}
                            noDataComponent={
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">Tidak ada detail item feedmil ditemukan</p>
                                </div>
                            }
                            responsive={false} // Konsisten dengan halaman utama untuk kontrol penuh scrolling
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
            </div>
        </div>
    );
};

export default PembelianFeedmilDetailPage;
