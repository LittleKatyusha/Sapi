import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Wallet, Search, X, Eye, Loader2, FileText, AlertCircle, CheckCircle, Banknote, MoreVertical
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import usePenjualanSapiUtuh from '../../../../hooks/usePenjualanSapiUtuh';
import PenjualanSapiUtuhService from '../../../../services/penjualanSapiUtuhService';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

// Action menu cell with portal to escape table overflow clipping
const ActionMenuCell = ({ row, onDetail, onBayar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX - 140,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const isInsideButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-40 z-[99999]"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        onClick={() => { setIsOpen(false); onDetail(row); }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 transition"
      >
        <Eye className="w-4 h-4 text-blue-500" /> Detail
      </button>
      {(row.sisa_pembayaran || 0) > 0 && (
        <button
          onClick={() => { setIsOpen(false); onBayar(row); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 flex items-center gap-2 transition"
        >
          <Banknote className="w-4 h-4 text-emerald-500" /> Bayar
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-2 rounded-lg transition ${isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        title="Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};

const JENIS_PENJUALAN_OPTIONS = [
  { value: 'sapi_qurban_utuh', label: 'Sapi Qurban / Utuh' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  cancelled: { label: 'Batal', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' },
};

const BAYAR_CONFIG = {
  lunas: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  dp: { label: 'DP', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
  belum_bayar: { label: 'Belum', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

const formatRupiah = (val) => {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
};

const SummaryCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

const PenerimaanRphPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('belum-lunas');
  const [jenisSelected, setJenisSelected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const { loading, error, fetchData } = usePenjualanSapiUtuh();

  const isBelumLunas = activeTab === 'belum-lunas';
  const isHistory = activeTab === 'riwayat';

  // Load data
  const loadData = useCallback(async () => {
    if (isHistory) {
      setHistoryLoading(true);
      setHistoryError(null);
      const result = await PenjualanSapiUtuhService.getPenerimaanHistory({ length: 1000 });
      if (result.success) {
        setHistoryData(result.data || []);
      } else {
        setHistoryError(result.message);
      }
      setHistoryLoading(false);
      return;
    }
    const result = await fetchData({
      length: 1000,
      status_pembayaran: isBelumLunas ? 'belum_bayar,dp' : 'lunas',
      exclude_status_transaksi: 'draft',
    });
    if (result.success && result.data) {
      setTableData(result.data);
    }
  }, [isBelumLunas, isHistory, fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    if (tab === 'belum-lunas') {
      setJenisSelected(false);
    }
  };

  const filteredData = useMemo(() => {
    let data = tableData;
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) =>
      item.no_transaksi?.toLowerCase().includes(lower) ||
      item.nama_pembeli?.toLowerCase().includes(lower) ||
      item.pic?.toLowerCase().includes(lower)
    );
  }, [tableData, searchTerm]);

  const stats = useMemo(() => {
    const totalSisa = filteredData.reduce((sum, r) => sum + (r.sisa_pembayaran || 0), 0);
    const totalBayar = filteredData.reduce((sum, r) => sum + (r.nominal_pembayaran || 0), 0);
    const totalGrand = filteredData.reduce((sum, r) => {
      return sum + (r.total_harga || 0) + (r.biaya_kirim || 0) + (r.biaya_potong || 0);
    }, 0);
    return {
      count: filteredData.length,
      totalSisa,
      totalBayar,
      totalGrand,
    };
  }, [filteredData]);

  const onSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const onClearSearch = () => {
    setSearchTerm('');
  };

  // Filtered history data
  const filteredHistoryData = useMemo(() => {
    if (!searchTerm) return historyData;
    const lower = searchTerm.toLowerCase();
    return historyData.filter((item) =>
      item.no_transaksi?.toLowerCase().includes(lower) ||
      item.nama_pembeli?.toLowerCase().includes(lower) ||
      item.nama_pembayar?.toLowerCase().includes(lower) ||
      item.metode_pembayaran?.toLowerCase().includes(lower)
    );
  }, [historyData, searchTerm]);

  // History stats
  const historyStats = useMemo(() => {
    const totalDiterima = filteredHistoryData.reduce((s, r) => s + (r.amount || 0), 0);
    return { count: filteredHistoryData.length, totalDiterima };
  }, [filteredHistoryData]);

  // History DataTable columns
  const historyColumns = [
    {
      name: 'Tgl Bayar',
      selector: (row) => row.payment_date,
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{row.payment_date || '-'}</span>
          <span className="text-xs text-gray-400">{row.created_at}</span>
        </div>
      ),
    },
    {
      name: 'No Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      cell: (row) => <span className="font-semibold text-gray-800">{row.no_transaksi}</span>,
    },
    {
      name: 'Pembeli',
      selector: (row) => row.nama_pembeli,
      sortable: true,
    },
    {
      name: 'Jenis',
      selector: (row) => row.purchase_type_label,
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.purchase_type === 8 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {row.purchase_type_label}
        </span>
      ),
    },
    {
      name: 'Pembayar',
      selector: (row) => row.nama_pembayar,
      sortable: true,
      cell: (row) => <span className="text-gray-600">{row.nama_pembayar || '-'}</span>,
    },
    {
      name: 'Metode',
      selector: (row) => row.metode_pembayaran,
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 capitalize">
          {row.metode_pembayaran?.replace('_', ' ') || '-'}
        </span>
      ),
    },
    {
      name: 'Jumlah Diterima',
      selector: (row) => row.amount,
      sortable: true,
      right: true,
      cell: (row) => <span className="font-semibold text-emerald-600">{formatRupiah(row.amount)}</span>,
    },
    {
      name: 'Status',
      selector: (row) => row.payment_status,
      sortable: true,
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.payment_status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {row.payment_status_label}
        </span>
      ),
    },
  ];

  // DataTable columns
  const columns = useMemo(() => [
    {
      name: 'No.',
      width: '52px',
      center: true,
      cell: (_, idx) => <span className="text-xs text-gray-400 font-medium">{idx + 1}</span>,
    },
    {
      name: 'No. Transaksi',
      selector: (row) => row.no_transaksi,
      sortable: true,
      minWidth: '130px',
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-gray-800">{row.no_transaksi}</p>
          <p className="text-xs text-gray-400">{row.tanggal_transaksi}</p>
        </div>
      ),
    },
    {
      name: 'Jenis',
      selector: (row) => row.no_transaksi,
      sortable: true,
      width: '110px',
      center: true,
      cell: (row) => {
        const isQurban = row.no_transaksi?.toUpperCase().startsWith('PSQ');
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isQurban
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {isQurban ? 'Qurban' : 'Utuh'}
          </span>
        );
      },
    },
    {
      name: 'Pembeli',
      selector: (row) => row.nama_pembeli,
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{row.nama_pembeli || '-'}</p>
          <p className="text-xs text-gray-400">{row.no_hp_pembeli || '-'}</p>
        </div>
      ),
    },
    {
      name: 'PIC',
      selector: (row) => row.pic,
      sortable: true,
      width: '90px',
      cell: (row) => <span className="text-sm text-gray-600">{row.pic || '-'}</span>,
    },
    {
      name: 'Total & Sisa',
      minWidth: '170px',
      right: true,
      cell: (row) => {
        const grandTotal = (row.total_harga || 0) + (row.biaya_kirim || 0) + (row.biaya_potong || 0);
        const sisa = row.sisa_pembayaran || 0;
        return (
          <div className="text-right py-1">
            <p className="text-sm font-bold text-gray-800">{formatRupiah(grandTotal)}</p>
            <p className={`text-xs font-semibold ${sisa > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {sisa > 0 ? `Sisa ${formatRupiah(sisa)}` : 'Lunas'}
            </p>
          </div>
        );
      },
    },
    {
      name: 'Pembayaran',
      selector: (row) => row.status_pembayaran,
      sortable: true,
      width: '120px',
      center: true,
      cell: (row) => {
        const b = BAYAR_CONFIG[row.status_pembayaran] || BAYAR_CONFIG.belum_bayar;
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
            {b.label}
          </span>
        );
      },
    },
    {
      name: 'Status',
      selector: (row) => row.status_transaksi,
      sortable: true,
      width: '120px',
      center: true,
      cell: (row) => {
        const c = STATUS_CONFIG[row.status_transaksi] || STATUS_CONFIG.draft;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
          </span>
        );
      },
    },
    {
      name: '',
      center: true,
      width: '52px',
      cell: (row) => (
        <ActionMenuCell
          row={row}
          onDetail={(r) => navigate(`/rph/penjualan-sapi-utuh/detail/${r.pid}`)}
          onBayar={(r) => navigate(`/rph/keuangan/penerimaan/bayar/${r.pid}`)}
        />
      ),
    },
  ], [navigate]);

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '48px', borderBottom: '1px solid #f1f5f9', '&:hover': { backgroundColor: '#f8fafc' } } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
    pagination: { style: { borderTop: '1px solid #e2e8f0', padding: '10px 14px' } },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-emerald-600" />
                Penerimaan
              </h1>
              <p className="text-gray-500 text-sm mt-1">Daftar piutang & pelunasan penjualan sapi</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Record"
            value={stats.count}
            icon={FileText}
            color="blue"
          />
          <SummaryCard
            label={isBelumLunas ? 'Total Sisa Piutang' : 'Total Terbayar'}
            value={formatRupiah(isBelumLunas ? stats.totalSisa : stats.totalGrand)}
            icon={isBelumLunas ? AlertCircle : CheckCircle}
            color={isBelumLunas ? 'red' : 'emerald'}
          />
          <SummaryCard
            label={isBelumLunas ? 'Sudah Dibayar' : 'Total Lunas'}
            value={formatRupiah(isBelumLunas ? stats.totalBayar : stats.totalGrand)}
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('belum-lunas')}
              className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'belum-lunas'
                  ? 'text-white bg-blue-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Belum Lunas
              {jenisSelected && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'belum-lunas' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stats.count}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('lunas')}
              className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'lunas'
                  ? 'text-white bg-emerald-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Lunas
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'lunas' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stats.count}
              </span>
            </button>
            <button
              onClick={() => handleTabChange('riwayat')}
              className={`flex-1 px-6 py-3.5 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'riwayat'
                  ? 'text-white bg-violet-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.1)]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Riwayat Penerimaan
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'riwayat' ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {historyStats.count}
              </span>
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {/* === Riwayat Penerimaan Tab === */}
            {isHistory && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={onSearch}
                      placeholder="Cari no transaksi, pembeli, pembayar..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 placeholder-gray-400"
                    />
                    {searchTerm && (
                      <button onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 ml-auto">
                    Total Diterima: <span className="font-bold text-emerald-600">{formatRupiah(historyStats.totalDiterima)}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <DataTable
                    columns={historyColumns}
                    data={filteredHistoryData}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    progressPending={historyLoading}
                    progressComponent={
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-violet-500 animate-spin mr-2" />
                        <span className="text-gray-500 text-sm">Memuat riwayat...</span>
                      </div>
                    }
                    noDataComponent={
                      <div className="py-14 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Banknote className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">Belum ada riwayat penerimaan</p>
                        <p className="text-gray-400 text-xs mt-1">Pembayaran yang diterima akan tampil di sini</p>
                      </div>
                    }
                    customStyles={customStyles}
                    highlightOnHover
                    responsive
                  />
                </div>

                {historyError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {historyError}
                  </div>
                )}
              </>
            )}

            {/* === Belum Lunas / Lunas Tabs === */}
            {!isHistory && (
              <>
            {/* Belum Lunas: Selectbox gatekeeping */}
            {isBelumLunas && !jenisSelected && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mb-5">
                <p className="text-gray-500 text-sm mb-4">Pilih jenis penjualan terlebih dahulu untuk menampilkan data</p>
                <div className="max-w-xs mx-auto">
                  <SearchableSelect
                    options={JENIS_PENJUALAN_OPTIONS}
                    value=""
                    onChange={() => setJenisSelected(true)}
                    placeholder="Pilih Jenis Penjualan"
                    isClearable={false}
                  />
                </div>
              </div>
            )}

            {/* Toolbar: Search */}
            {(!isBelumLunas || jenisSelected) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="w-full sm:w-56">
                  <SearchableSelect
                    options={JENIS_PENJUALAN_OPTIONS}
                    value="sapi_qurban_utuh"
                    onChange={() => {}}
                    placeholder="Jenis"
                    isClearable={false}
                    isDisabled
                  />
                </div>
                <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={onSearch}
                  placeholder="Cari no transaksi, pembeli, PIC..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400"
                />
                {searchTerm && (
                  <button onClick={onClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            )}

            {/* Data Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                progressPending={loading}
                progressComponent={
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mr-2" />
                    <span className="text-gray-500 text-sm">Memuat data...</span>
                  </div>
                }
                noDataComponent={
                  <div className="py-14 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium">
                      {isBelumLunas ? 'Tidak ada piutang' : 'Tidak ada pelunasan'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {isBelumLunas ? 'Semua transaksi sudah lunas' : 'Belum ada transaksi yang lunas'}
                    </p>
                  </div>
                }
                customStyles={customStyles}
                highlightOnHover
                responsive
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PenerimaanRphPage;
