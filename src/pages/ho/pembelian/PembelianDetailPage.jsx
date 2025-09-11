import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Plus } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import useTipePembelian from './hooks/useTipePembelian';

import customTableStyles, { detailPageTableStyles } from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        loading,
        error
    } = usePembelianHO();
    
    // Get parameter data for eartag mapping
    const { parameterData } = useParameterSelect();
    
    // Get tipe pembelian options for mapping jenis_pembelian
    const { tipePembelianOptions } = useTipePembelian();
    
    

    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [mappedDetailData, setMappedDetailData] = useState([]);

    // Function to get jenis_pembelian label from ID
    const getJenisPembelianLabel = (jenisPembelianId) => {
        if (!jenisPembelianId || !tipePembelianOptions.length) return jenisPembelianId || '-';
        
        // Convert both values to strings for comparison to handle type mismatches
        const option = tipePembelianOptions.find(opt => String(opt.value) === String(jenisPembelianId));
        
        return option ? option.label : jenisPembelianId;
    };

    // Fetch detail data from /show endpoint (contains both header and detail data)
    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    console.log('🚀 Fetching detail for ID:', id);
                    
                    // Get both header and detail data from /show endpoint
                    const detailResult = await getPembelianDetail(id);
                    console.log('📋 Detail result:', detailResult);
                    
                    if (detailResult.success && Array.isArray(detailResult.data) && detailResult.data.length > 0) {
                        // Use the first record as header data (since /show returns detail records with header info)
                        // All records have the same header data (nota, tgl_masuk, nama_supir, etc.)
                        const headerData = detailResult.data[0];
                        
                        console.log('✅ Header and detail data found from /show endpoint:', {
                            nota: headerData.nota,
                            pid: headerData.pid,
                            nama_supplier: headerData.nama_supplier,
                            detailRecords: detailResult.data.length
                        });
                        
                        // Set header data from the first detail record
                        setPembelianData({
                            pubid: headerData.pubid || id,
                            encryptedPid: headerData.pid || id,
                            nota: headerData.nota || '',
                            nama_supplier: headerData.nama_supplier || '',
                            nama_office: headerData.nama_office || '',
                            tgl_masuk: headerData.tgl_masuk || '',
                            nama_supir: headerData.nama_supir || '',
                            plat_nomor: headerData.plat_nomor || '',
                            biaya_lain: headerData.biaya_lain || 0,
                            biaya_truk: headerData.biaya_truk || 0,
                            biaya_total: headerData.biaya_total || 0,
                            berat_total: parseFloat(headerData.berat_total) || 0,
                            jumlah: headerData.jumlah || 0,
                            jenis_pembelian: headerData.jenis_pembelian !== null && headerData.jenis_pembelian !== undefined ? headerData.jenis_pembelian : (headerData.tipe_pembelian !== null && headerData.tipe_pembelian !== undefined ? headerData.tipe_pembelian : ''),
                            file: headerData.file || null
                        });
                        
                        setDetailData(detailResult.data);
                    }
                } catch (err) {
                    console.error('❌ Error fetching detail:', err);
                }
            }
        };

        fetchDetail();
    }, [id]);

    // Map detail data with eartag names whenever data changes
    useEffect(() => {
        if (detailData.length > 0) {
            // Create eartag mapping from parameter data
            const eartagMap = new Map();
            if (parameterData.eartag && Array.isArray(parameterData.eartag)) {
                parameterData.eartag.forEach(eartag => {
                    if (eartag.id) eartagMap.set(String(eartag.id), eartag.name);
                });
            }
            
            console.log('🔍 Parameter eartag data:', parameterData.eartag?.slice(0, 3));
            console.log('🔍 Eartag map keys:', Array.from(eartagMap.keys()));
            
            const mapped = detailData.map(detail => {
                // Get eartag name from parameter mapping
                const eartagName = eartagMap.get(String(detail.eartag)) || `ET-${String(detail.eartag).padStart(6, '0')}`;
                
                console.log(`📋 Mapping eartag ${detail.eartag}:`, {
                    found: eartagMap.has(String(detail.eartag)),
                    name: eartagName
                });
                
                return {
                    ...detail,
                    eartagName: eartagName,
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
            name: 'Klasifikasi\nHewan',
            selector: row => row.nama_klasifikasi_hewan,
            sortable: true,
            width: '180px',
            cell: row => (
                <div className="text-center">
                    <span className="inline-block bg-amber-50 px-3 py-1 rounded-md text-amber-700 font-medium text-sm border border-amber-200">
                        {row.nama_klasifikasi_hewan || '-'}
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
            name: 'Persentase',
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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



                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Jenis Pembelian
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {getJenisPembelianLabel(pembelianData.jenis_pembelian)}
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
                                    {pembelianData?.jumlah || mappedDetailData.length}
                                </p>
                                <p className="text-sm text-gray-600">Jumlah</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">
                                    {(pembelianData?.berat_total || 0).toFixed(1)} kg
                                </p>
                                <p className="text-sm text-gray-600">Berat Total</p>
                            </div>

                            <div className="text-center">
                                <p className="text-3xl font-bold text-purple-600">
                                    Rp {(pembelianData?.biaya_total || 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">Biaya Total</p>
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

            </div>
        </div>
    );
};

export default PembelianDetailPage;