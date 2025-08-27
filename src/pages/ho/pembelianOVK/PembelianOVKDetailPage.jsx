import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Weight, DollarSign } from 'lucide-react';
import usePembelianOVK from './hooks/usePembelianOVK';
import customTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianOVKDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        loading,
        error
    } = usePembelianOVK();
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success && result.data.length > 0) {
                        // Backend returns detail items from DataPembelianOvkDetail view
                        const detailItems = result.data;
                        
                        // Extract header information from the first detail item (all details have same header info)
                        const firstItem = detailItems[0];
                        
                        // Set header data from first detail item
                        setPembelianData({
                            encryptedPid: id,
                            nota: firstItem.nota || '',
                            nama_supplier: firstItem.nama_supplier || '',
                            nama_office: firstItem.nama_office || 'Head Office (HO)',
                            tgl_masuk: firstItem.tgl_masuk || '',
                            nama_supir: firstItem.nama_supir || '',
                            plat_nomor: firstItem.plat_nomor || '',
                            biaya_lain: firstItem.biaya_lain || 0,
                            biaya_total: firstItem.biaya_total || 0,
                            biaya_truk: firstItem.biaya_truk || 0,
                            jumlah: detailItems.length, // Count of detail items
                            satuan: 'item',
                            berat_total: detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0),
                            jenis_pembelian: firstItem.jenis_pembelian || 'OVK',
                            note: firstItem.note || ''
                        });

                        // Set detail data - map backend fields to frontend structure
                        const processedDetailItems = detailItems.map((item, index) => ({
                            id: item.id || index + 1,
                            pubid: item.pubid,
                            id_pembelian: item.id_pembelian,
                            id_office: item.id_office,
                            item_name: item.item_name || '-',
                            id_klasifikasi_ovk: item.id_klasifikasi_ovk || '-',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0, // Note: backend uses 'persentase' not 'presentase'
                            berat: parseFloat(item.berat) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null,
                            // Computed values for display
                            pid: item.pid || null // Encrypted ID for operations
                        }));
                        
                        setDetailData(processedDetailItems);
                    } else {
                        // No data found
                        setPembelianData(null);
                        setDetailData([]);
                        setNotification({
                            type: 'error',
                            message: 'Data detail pembelian OVK tidak ditemukan'
                        });
                    }
                } catch (err) {
                    console.error('Error fetching detail:', err);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat detail pembelian OVK: ' + (err.message || 'Terjadi kesalahan')
                    });
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail]);

    const handleBack = () => {
        navigate('/ho/pembelian-ovk');
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

    // Columns for detail table - Sesuai dengan struktur database tr_pembelian_ho_ovk_detail
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
            name: 'Klasifikasi OVK',
            selector: row => row.id_klasifikasi_ovk,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {row.id_klasifikasi_ovk || '-'}
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
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '10%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full break-words ${
                        row.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {row.status === 1 ? 'Aktif' : 'Tidak Aktif'}
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
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian OVK...</p>
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
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian OVK tidak dapat dimuat'}</p>
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
                                    Detail Pembelian OVK
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian OVK (Obat, Vitamin, Kimia) dan detail produk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian OVK
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

                        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg">
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

                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Biaya Total
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_total ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_total) : 'Rp 0'}
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
                                    Detail Item OVK
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian setiap item OVK dalam pembelian ini
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <DataTable
                            title="Daftar Detail Item OVK"
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
                                         // Sesuaikan minWidth dengan jumlah dan lebar kolom OVK detail
                                         minWidth: '1300px', // Lebar untuk 10 kolom dengan total width ~1100px
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
                                    <p className="text-gray-500 text-lg">Tidak ada detail item OVK ditemukan</p>
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

export default PembelianOVKDetailPage;
