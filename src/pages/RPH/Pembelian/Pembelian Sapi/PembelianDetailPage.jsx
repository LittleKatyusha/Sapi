import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import usePoRph from './hooks/usePoRph';
import useParameterSelect from './hooks/useParameterSelect';
import useTipePembelian from './hooks/useTipePembelian';

import { detailPageTableStyles } from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPoDetail,
        detailLoading: loading,
        error
    } = usePoRph();
    
    // Get parameter data for office mapping
    const { parameterData } = useParameterSelect(false, {}, [], null, ['office']);
    
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

    // Function to get office name from ID
    const getOfficeName = (officeId) => {
        if (!officeId || !parameterData.office || !Array.isArray(parameterData.office)) {
            return 'Head Office (HO)';
        }
        
        const office = parameterData.office.find(opt => String(opt.id) === String(officeId));
        return office ? office.name : 'Head Office (HO)';
    };

    // Fetch detail data from /show endpoint (contains both header and detail data)
    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    console.log('🚀 Fetching detail for ID:', id);
                    
                    // Get both header and detail data from /show endpoint
                    const detailResult = await getPoDetail(id);
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
                            nama_office: headerData.nama_office || getOfficeName(headerData.id_office),
                            id_office: headerData.id_office || null,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Update office name when parameter data is available
    useEffect(() => {
        if (pembelianData && pembelianData.id_office && parameterData.office) {
            const officeName = getOfficeName(pembelianData.id_office);
            if (officeName !== pembelianData.nama_office) {
                setPembelianData(prev => ({
                    ...prev,
                    nama_office: officeName
                }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pembelianData, parameterData.office]);

    const handleBack = () => {
        navigate('/rph/pembelian-sapi');
    };


    const detailColumns = [
        {
            name: 'No',
            width: '60px',
            cell: (row, index) => (
                <span className="text-slate-400 text-xs">{index + 1}</span>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Eartag',
            selector: row => row.eartagName || row.eartag,
            sortable: true,
            width: '180px',
            cell: row => (
                <span className="font-mono text-sm text-slate-900">
                    {row.eartagName || row.eartag || '-'}
                </span>
            )
        },
        {
            name: 'Code Eartag',
            selector: row => row.code_eartag,
            sortable: true,
            width: '160px',
            cell: row => (
                <span className="font-mono text-sm text-slate-600">
                    {row.code_eartag || '-'}
                </span>
            )
        },
        {
            name: 'Klasifikasi',
            selector: row => row.nama_klasifikasi_hewan,
            sortable: true,
            width: '160px',
            cell: row => (
                <span className="text-sm text-slate-700">
                    {row.nama_klasifikasi_hewan || '-'}
                </span>
            )
        },
        {
            name: 'Berat',
            selector: row => row.berat,
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="text-sm text-slate-900 tabular-nums">
                    {row.berat ? `${row.berat} kg` : '-'}
                </span>
            )
        },
        {
            name: 'Harga Satuan',
            selector: row => row.hpp,
            sortable: true,
            width: '180px',
            cell: row => (
                <span className="text-sm text-slate-700 tabular-nums">
                    {row.hpp ? `Rp ${Number(row.hpp).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            width: '200px',
            cell: row => (
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {row.total_harga ? `Rp ${Number(row.total_harga).toLocaleString('id-ID')}` : '-'}
                </span>
            )
        }
    ];

    const totalBiayaJual = useMemo(
        () => detailData.reduce((sum, r) => sum + ((Number(r.berat) || 0) * (Number(r.hpp) || 0)), 0),
        [detailData]
    );
    const totalBerat = useMemo(
        () => detailData.reduce((sum, r) => sum + (Number(r.berat) || 0), 0),
        [detailData]
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="space-y-3 p-4 sm:p-6">
                    <div className="bg-white rounded-lg border border-slate-200 h-14 animate-pulse" />
                    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
                        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="h-10 bg-slate-100 border-b border-slate-200 animate-pulse" />
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-10 border-b border-slate-100 animate-pulse bg-white">
                                <div className="h-full flex items-center px-6 gap-6">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <div key={j} className="h-3 flex-1 bg-slate-100 rounded animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !pembelianData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md bg-white rounded-lg border border-slate-200 p-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-red-50 flex items-center justify-center">
                        <Package size={22} className="text-red-600" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 mb-1">Data Tidak Ditemukan</h2>
                    <p className="text-slate-500 text-sm mb-4">{error || 'Detail pembelian tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    const formatRupiah = (val) =>
        val ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) : 'Rp 0';

    const infoItems = [
        { label: 'Nomor Nota', value: pembelianData.nota || '-' },
        { label: 'Supplier', value: pembelianData.nama_supplier || '-' },
        { label: 'Office', value: pembelianData.nama_office || 'Head Office (HO)' },
        { label: 'Tanggal Masuk', value: pembelianData.tgl_masuk ? new Date(pembelianData.tgl_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
        { label: 'Nama Sopir', value: pembelianData.nama_supir || '-' },
        { label: 'Plat Nomor', value: pembelianData.plat_nomor || '-', mono: true },
        { label: 'Jenis Pembelian', value: getJenisPembelianLabel(pembelianData.jenis_pembelian) },
        { label: 'Biaya Lain', value: formatRupiah(pembelianData.biaya_lain) },
        { label: 'Biaya Truk', value: formatRupiah(pembelianData.biaya_truk) },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="space-y-3 p-4 sm:p-6">
                {/* Header */}
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            aria-label="Kembali"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-sm font-semibold text-slate-900">Detail Pembelian</h1>
                    </div>
                    <span className="text-xs text-slate-500">{mappedDetailData.length} ternak</span>
                </div>

                {/* Info Pembelian */}
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Informasi Pembelian</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
                        {infoItems.map((item, i) => (
                            <div key={i} className="min-w-0">
                                <div className="text-[11px] text-slate-500 mb-0.5">{item.label}</div>
                                <div className={`text-sm font-medium text-slate-900 truncate ${item.mono ? 'font-mono' : ''}`} title={typeof item.value === 'string' ? item.value : ''}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
                        <div>
                            <div className="text-[11px] text-slate-500 mb-0.5">Jumlah</div>
                            <div className="text-lg font-semibold text-slate-900">
                                {pembelianData?.jumlah || mappedDetailData.length}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 mb-0.5">Berat Total</div>
                            <div className="text-lg font-semibold text-slate-900">
                                {(totalBerat || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">kg</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-slate-500 mb-0.5">Biaya Total</div>
                            <div className="text-lg font-semibold text-slate-900">
                                Rp {totalBiayaJual.toLocaleString('id-ID')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail Ternak Table */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="w-full overflow-x-auto">
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
                                <div className="text-center py-16">
                                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <h3 className="text-sm font-medium text-slate-700 mb-0.5">Tidak ada detail ternak</h3>
                                    <p className="text-slate-400 text-xs">Belum ada data detail ternak untuk pembelian ini.</p>
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                            striped={false}
                            dense
                            progressPending={loading}
                            progressComponent={
                                <div className="py-8 space-y-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-8 bg-slate-100 rounded animate-pulse mx-4" />
                                    ))}
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