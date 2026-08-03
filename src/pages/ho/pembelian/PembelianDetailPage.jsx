import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye,
    Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    ArrowUpDown, ArrowUp, ArrowDown, FileText, X
} from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import useTipePembelian from './hooks/useTipePembelian';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 400;

const formatCurrency = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const formatNumber = (value, suffix = '') => {
    const num = Number(value || 0);
    return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(num)}${suffix}`;
};

const PembelianDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetailPaginated,
        loading,
        error
    } = usePembelianHO();

    // Get parameter data for office mapping
    const { parameterData } = useParameterSelect(false, {}, [], null, ['office']);

    // Get tipe pembelian options for mapping jenis_pembelian
    const { tipePembelianOptions } = useTipePembelian();

    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);

    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortColumn, setSortColumn] = useState(0);
    const [sortDir, setSortDir] = useState('asc');
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [recordsFiltered, setRecordsFiltered] = useState(0);
    const [draw, setDraw] = useState(1);
    const [totals, setTotals] = useState(null);

    const searchTimerRef = useRef(null);

    // Function to get jenis_pembelian label from ID
    const getJenisPembelianLabel = (jenisPembelianId) => {
        if (!jenisPembelianId || !tipePembelianOptions.length) return jenisPembelianId || '-';
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

    // Debounced search handler
    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);
    }, []);

    // Sort handler
    const handleSort = useCallback((columnIndex) => {
        if (sortColumn === columnIndex) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnIndex);
            setSortDir('asc');
        }
        setCurrentPage(1);
    }, [sortColumn]);

    // Fetch paginated detail data
    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const decodedId = (() => {
                    try { return decodeURIComponent(id); } catch { return id; }
                })();

                const result = await getPembelianDetailPaginated(decodedId, {
                    start: (currentPage - 1) * perPage,
                    length: perPage,
                    draw: draw + 1,
                    search: debouncedSearch,
                    orderColumn: sortColumn,
                    orderDir: sortDir,
                });

                if (result.success) {
                    setDetailData(result.data || []);
                    setRecordsTotal(result.recordsTotal || 0);
                    setRecordsFiltered(result.recordsFiltered || 0);
                    setDraw(result.draw || draw + 1);
                    setTotals(result.totals || null);

                    if (result.header) {
                        setPembelianData({
                            pubid: result.header.pubid || decodedId,
                            encryptedPid: decodedId,
                            nota: result.header.nota || '',
                            nota_sistem: result.header.nota_sistem || '',
                            nama_supplier: result.header.nama_supplier || '',
                            nama_office: result.header.nama_office || getOfficeName(result.header.id_office),
                            id_office: result.header.id_office || null,
                            tgl_masuk: result.header.tgl_masuk || '',
                            nama_supir: result.header.nama_supir || '',
                            plat_nomor: result.header.plat_nomor || '',
                            biaya_lain: result.header.biaya_lain || 0,
                            biaya_truk: result.header.biaya_truk || 0,
                            biaya_total: result.header.biaya_total || 0,
                            berat_total: parseFloat(result.header.berat_total) || 0,
                            jumlah: result.header.jumlah || 0,
                            jenis_pembelian: result.header.jenis_pembelian !== null && result.header.jenis_pembelian !== undefined
                                ? result.header.jenis_pembelian
                                : (result.header.tipe_pembelian !== null && result.header.tipe_pembelian !== undefined ? result.header.tipe_pembelian : ''),
                            file: result.header.file || null,
                            note: result.header.note || '',
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching detail:', err);
            }
        };
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, currentPage, perPage, debouncedSearch, sortColumn, sortDir, getPembelianDetailPaginated]);

    // Update office name when parameter data is available
    useEffect(() => {
        if (pembelianData && pembelianData.id_office && parameterData.office) {
            const officeName = getOfficeName(pembelianData.id_office);
            if (officeName !== pembelianData.nama_office) {
                setPembelianData(prev => ({ ...prev, nama_office: officeName }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pembelianData, parameterData.office]);

    const handleBack = () => navigate('/ho/pembelian');

    const totalPages = Math.max(1, Math.ceil(recordsFiltered / perPage));
    const startRecord = recordsFiltered === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endRecord = Math.min(currentPage * perPage, recordsFiltered);


    // Column definitions with server-side sort indicators
    const columns = [
        { key: 'eartag', label: 'Eartag', width: '180px', align: 'left' },
        { key: 'code_eartag', label: 'Code Eartag', width: '160px', align: 'left' },
        { key: 'nama_klasifikasi_hewan', label: 'Klasifikasi', width: '160px', align: 'left' },
        { key: 'berat', label: 'Berat (kg)', width: '120px', align: 'right' },
        { key: 'harga', label: 'Harga Satuan', width: '180px', align: 'right' },
        { key: 'hpp', label: 'HPP / Ekor', width: '180px', align: 'right' },
        { key: 'total_harga_beli', label: 'Total Harga Beli', width: '200px', align: 'right' },
        { key: 'total_harga', label: 'Total Harga Jual', width: '200px', align: 'right' },
        { key: 'persentase', label: '%', width: '90px', align: 'right' },
    ];

    const renderSortIcon = (idx) => {
        if (sortColumn !== idx) return <ArrowUpDown size={12} className="text-gray-400" />;
        return sortDir === 'asc'
            ? <ArrowUp size={12} className="text-indigo-600" />
            : <ArrowDown size={12} className="text-indigo-600" />;
    };

    const renderCell = (row, col) => {
        const val = row[col.key];
        if (val === null || val === undefined || val === '') return <span className="text-gray-300">-</span>;
        switch (col.key) {
            case 'eartag':
                return <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{val}</span>;
            case 'code_eartag':
                return <span className="font-mono text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{val}</span>;
            case 'nama_klasifikasi_hewan':
                return <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{val}</span>;
            case 'berat':
                return <span className="text-xs font-medium text-gray-900">{formatNumber(val, ' kg')}</span>;
            case 'harga':
            case 'hpp':
                return <span className="text-xs font-medium text-gray-900">{formatCurrency(val)}</span>;
            case 'total_harga_beli':
                return <span className="text-xs font-semibold text-amber-700">{formatCurrency(val)}</span>;
            case 'total_harga':
                return <span className="text-xs font-semibold text-red-600">{formatCurrency(val)}</span>;
            case 'persentase':
                return <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">{formatNumber(val, '%')}</span>;
            default:
                return <span className="text-xs text-gray-700">{val}</span>;
        }
    };

    if (loading && !pembelianData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-3">Memuat detail pembelian...</p>
                </div>
            </div>
        );
    }

    if (error || !pembelianData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-3">
                        <Package size={40} className="mx-auto" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Data Tidak Ditemukan</h2>
                    <p className="text-gray-500 text-sm mb-4">{error || 'Detail pembelian tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Eye size={20} className="text-indigo-600" />
                                Detail Pembelian
                            </h1>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Informasi lengkap pembelian dan detail ternak
                            </p>
                        </div>
                    </div>
                    {pembelianData.file && (
                        <a
                            href={pembelianData.file}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <FileText size={14} />
                            Lihat File
                        </a>
                    )}
                </div>

                {/* Header Information - compact grid */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-600" />
                            Informasi Pembelian
                        </h2>
                    </div>
                    <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <InfoCard icon={Hash} label="Nomor Nota" value={pembelianData.nota} accent="blue" />
                        <InfoCard icon={Building2} label="Supplier" value={pembelianData.nama_supplier} accent="green" />
                        <InfoCard icon={Building2} label="Office" value={pembelianData.nama_office || 'Head Office (HO)'} accent="purple" />
                        <InfoCard icon={Calendar} label="Tanggal Masuk" value={pembelianData.tgl_masuk ? new Date(pembelianData.tgl_masuk).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'} accent="orange" />
                        <InfoCard icon={User} label="Nama Sopir" value={pembelianData.nama_supir} accent="teal" />
                        <InfoCard icon={Truck} label="Plat Nomor" value={pembelianData.plat_nomor} accent="red" mono />
                        <InfoCard icon={Package} label="Biaya Lain" value={formatCurrency(pembelianData.biaya_lain)} accent="yellow" />
                        <InfoCard icon={Truck} label="Biaya Truk" value={formatCurrency(pembelianData.biaya_truk)} accent="blue" />
                        <InfoCard icon={Package} label="Jenis Pembelian" value={getJenisPembelianLabel(pembelianData.jenis_pembelian)} accent="slate" />
                    </div>
                    {/* Summary */}
                    <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryStat label="Jumlah" value={pembelianData?.jumlah || 0} color="text-indigo-600" />
                        <SummaryStat label="Berat Total" value={formatNumber(totals?.sum_berat ?? pembelianData?.berat_total ?? 0, ' kg')} color="text-green-600" />
                        <SummaryStat label="Total Harga Beli" value={formatCurrency(totals?.sum_total_harga_beli ?? 0)} color="text-amber-600" hint="harga × berat" />
                        <SummaryStat label="Total Harga Jual" value={formatCurrency(totals?.sum_harga_jual ?? 0)} color="text-emerald-600" hint="dari datatable" />
                    </div>
                </div>

                {/* Detail Table Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table header with search */}
                    <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Package size={16} className="text-purple-600" />
                                Detail Ternak
                            </h2>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Menampilkan {startRecord}–{endRecord} dari {recordsFiltered} data{recordsFiltered !== recordsTotal ? ` (total ${recordsTotal})` : ''}
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Cari eartag, kode, klasifikasi..."
                                className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setCurrentPage(1); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-12">No</th>
                                    {columns.map((col, idx) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(idx)}
                                            style={{ width: col.width, textAlign: col.align }}
                                            className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        >
                                            <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                                <span>{col.label}</span>
                                                {renderSortIcon(idx)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: perPage }).map((_, i) => (
                                        <tr key={`skel-${i}`} className="border-b border-gray-50">
                                            <td className="px-4 py-3"><div className="h-3 w-6 bg-gray-100 rounded animate-pulse" /></td>
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-4 py-3">
                                                    <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: '60%' }} />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : detailData.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-gray-100 rounded-full p-4 mb-3">
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-1">Tidak ada detail ternak</h3>
                                                <p className="text-gray-400 text-xs max-w-sm">
                                                    {debouncedSearch ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data detail ternak untuk pembelian ini.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    detailData.map((row, idx) => (
                                        <tr
                                            key={row.pubid_detail || idx}
                                            className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                                        >
                                            <td className="px-4 py-2.5 text-xs text-gray-500 font-medium">
                                                {startRecord + idx}
                                            </td>
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    style={{ textAlign: col.align }}
                                                    className="px-4 py-2.5 whitespace-nowrap"
                                                >
                                                    {renderCell(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {totals && !loading && detailData.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-200 font-semibold">
                                        <td className="px-4 py-2.5 text-[11px] text-gray-700 uppercase tracking-wider w-12 whitespace-nowrap"></td>
                                        {columns.map((col) => (
                                            <td
                                                key={`sum-${col.key}`}
                                                style={{ width: col.width, textAlign: col.align }}
                                                className="px-4 py-2.5 text-xs whitespace-nowrap"
                                            >
                                                {col.key === 'berat' && (
                                                    <span className="font-semibold text-gray-900">{formatNumber(totals.sum_berat ?? 0, ' kg')}</span>
                                                )}
                                                {col.key === 'total_harga_beli' && (
                                                    <span className="font-bold text-amber-700">{formatCurrency(totals.sum_total_harga_beli ?? 0)}</span>
                                                )}
                                                {col.key === 'total_harga' && (
                                                    <span className="font-bold text-red-600">{formatCurrency(totals.sum_harga_jual ?? 0)}</span>
                                                )}
                                                {col.key === 'eartag' && (
                                                    <span className="text-gray-700 uppercase tracking-wider text-[11px]">SUM</span>
                                                )}
                                                {!['berat', 'total_harga_beli', 'total_harga', 'eartag'].includes(col.key) && (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Grand total footer */}
                    {totals && !loading && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gradient-to-r from-amber-50 to-emerald-50 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <div className="text-xs text-gray-600">
                                    <span className="font-medium">Total Harga Jual: </span>
                                    <span className="font-semibold text-emerald-700">{formatCurrency(totals.sum_harga_jual)}</span>
                                    <span className="mx-2 text-gray-300">+</span>
                                    <span className="font-medium">Biaya Lain: </span>
                                    <span className="font-semibold text-gray-700">{formatCurrency(totals.biaya_lain)}</span>
                                    <span className="mx-2 text-gray-300">+</span>
                                    <span className="font-medium">Biaya Truk: </span>
                                    <span className="font-semibold text-gray-700">{formatCurrency(totals.biaya_truk)}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700">Grand Total Jual: </span>
                                    <span className="font-bold text-red-600">{formatCurrency((totals.sum_harga_jual ?? 0) + (totals.biaya_lain ?? 0) + (totals.biaya_truk ?? 0))}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 md:items-end">
                                <div className="text-xs text-gray-600">
                                    <span className="font-medium">Total Harga Beli: </span>
                                    <span className="font-semibold text-amber-700">{formatCurrency(totals.sum_total_harga_beli)}</span>
                                    <span className="mx-2 text-gray-300">+</span>
                                    <span className="font-medium">Biaya Lain: </span>
                                    <span className="font-semibold text-gray-700">{formatCurrency(totals.biaya_lain)}</span>
                                    <span className="mx-2 text-gray-300">+</span>
                                    <span className="font-medium">Biaya Truk: </span>
                                    <span className="font-semibold text-gray-700">{formatCurrency(totals.biaya_truk)}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700">Grand Total Beli: </span>
                                    <span className="font-bold text-amber-700">{formatCurrency((totals.sum_total_harga_beli ?? 0) + (totals.biaya_lain ?? 0) + (totals.biaya_truk ?? 0))}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pagination footer */}
                    <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>Baris per halaman:</span>
                            <select
                                value={perPage}
                                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                {PER_PAGE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">|</span>
                            <span>Menampilkan {startRecord}–{endRecord} dari {recordsFiltered}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Compact info card component
const InfoCard = ({ icon: Icon, label, value, accent = 'blue', mono = false }) => {
    const accentMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        teal: 'bg-teal-50 text-teal-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        slate: 'bg-slate-100 text-slate-600',
    };
    return (
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div className={`p-1.5 rounded-md ${accentMap[accent]}`}>
                <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-semibold text-gray-900 truncate ${mono ? 'font-mono' : ''}`} title={value}>{value || '-'}</p>
            </div>
        </div>
    );
};

const SummaryStat = ({ label, value, color, hint }) => (
    <div className="text-center">
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
);

export default PembelianDetailPage;