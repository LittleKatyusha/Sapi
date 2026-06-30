import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Beef, Search, Loader2, AlertCircle, FileText, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, Tag, Calendar, Weight, CircleDollarSign, Hash, CheckCircle2, RotateCcw as RotateCcwIcon } from 'lucide-react';
import HttpClient from '../../../services/httpClient';

const initialAdvanced = { eartag: '', eartag_supplier: '', nota_qurban: '' };

const StokSapiQurbanPage = () => {
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collapsible panels
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(true);

  // Search state
  const [advanced, setAdvanced] = useState(initialAdvanced);
  const [appliedFilters, setAppliedFilters] = useState(initialAdvanced);
  const [sortConfig, setSortConfig] = useState({ column: 'tr_qurban_detail.id', dir: 'desc' });

  const fetchData = useCallback(async (page = 1, limit = perPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await HttpClient.get('/api/rph/qurban/data-persapi', {
        params: {
          start: (page - 1) * limit,
          length: limit,
          draw: 1,
          eartag: appliedFilters.eartag,
          eartag_supplier: appliedFilters.eartag_supplier,
          nota_qurban: appliedFilters.nota_qurban,
          order: [{ column: sortConfig.column, dir: sortConfig.dir }],
        }
      });
      setTableData(response.data || []);
      setTotalRecords(response.recordsTotal || 0);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data qurban');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, perPage, sortConfig]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  const handleAdvancedSearch = () => {
    setAppliedFilters(advanced);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setAdvanced(initialAdvanced);
    setAppliedFilters(initialAdvanced);
    setCurrentPage(1);
  };

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((v) => v.trim() !== '').length,
    [appliedFilters]
  );

  const statusConfig = {
    0: { label: 'Tersedia', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
    2: { label: 'Return', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: RotateCcwIcon },
  };

  const columns = [
    {
      name: 'No.',
      width: '52px',
      center: true,
      cell: (_, idx) => (currentPage - 1) * perPage + idx + 1,
    },
    {
      name: 'Eartag & Supplier',
      sortable: true,
      sortField: 'tr_pembelian_ho_detail.eartag',
      minWidth: '240px',
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <Tag className={`w-3.5 h-3.5 ${isReturn ? 'text-red-600' : 'text-emerald-600'}`} />
              <span className={`font-mono font-semibold ${isReturn ? 'text-red-700 line-through' : 'text-gray-800'}`}>{row.eartag || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5 pl-5">
              <span className="text-[11px] text-gray-400">Supplier:</span>
              <span className={`font-mono text-xs ${isReturn ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{row.eartag_supplier || '-'}</span>
            </div>
          </div>
        );
      },
    },
    {
      name: 'Status',
      sortable: false,
      width: '130px',
      center: true,
      cell: (row) => {
        const cfg = statusConfig[Number(row.status)] || statusConfig[0];
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} border text-[11px] font-semibold`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      },
    },
    {
      name: 'Berat',
      sortable: true,
      sortField: 'tr_pembelian_ho_detail.berat',
      width: '110px',
      center: true,
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <div className={`flex items-center gap-1.5 justify-center ${isReturn ? 'line-through text-gray-400' : ''}`}>
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700 font-medium">{row.berat ? `${row.berat} kg` : '-'}</span>
          </div>
        );
      },
    },
    {
      name: 'Harga Beli',
      sortable: true,
      sortField: 'tr_qurban_detail.harga_beli',
      width: '150px',
      right: true,
      cell: (row) => {
        const isReturn = Number(row.status) === 2;
        return (
          <span className={`font-bold ${isReturn ? 'text-red-400 line-through' : 'text-emerald-600'}`}>
            {row.harga_beli ? `Rp ${Number(row.harga_beli).toLocaleString('id-ID')}` : '-'}
          </span>
        );
      },
    },
    {
      name: 'Nota & Tanggal Qurban',
      sortable: true,
      sortField: 'tr_qurban.nota_sistem',
      minWidth: '220px',
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-sm font-medium text-gray-700">{row.nota_sistem || '-'}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{row.tanggal_pemesanan || '-'}</span>
          </div>
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '56px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
  };

  const handleSort = (column, dir) => {
    if (column.sortField) {
      setSortConfig({ column: column.sortField, dir: dir || 'desc' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Beef className="w-8 h-8 text-emerald-600" />
              Stok Sapi Qurban
            </h1>
            <p className="text-gray-500 text-sm mt-1">Daftar sapi qurban per ekor</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg text-xs font-medium text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersedia: {tableData.filter(d => Number(d.status) !== 2).length}
            </div>
            <div className="px-3 py-1.5 bg-red-50 rounded-lg text-xs font-medium text-red-700 border border-red-100 flex items-center gap-1.5">
              <RotateCcwIcon className="w-3.5 h-3.5" />
              Return: {tableData.filter(d => Number(d.status) === 2).length}
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
              Total: {totalRecords} ekor
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel (Collapsible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Pencarian Lanjutan</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-emerald-500 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {advancedOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {advancedOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Eartag</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari eartag..."
                    value={advanced.eartag}
                    onChange={(e) => setAdvanced((p) => ({ ...p, eartag: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Eartag Supplier</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari eartag supplier..."
                    value={advanced.eartag_supplier}
                    onChange={(e) => setAdvanced((p) => ({ ...p, eartag_supplier: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nota Qurban</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nota qurban..."
                    value={advanced.nota_qurban}
                    onChange={(e) => setAdvanced((p) => ({ ...p, nota_qurban: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdvancedSearch()}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleAdvancedSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow-sm transition"
              >
                <Search className="w-3.5 h-3.5" />
                Cari
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DataTable (Collapsible) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2.5">
            <CircleDollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Daftar Stok Sapi Qurban</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{totalRecords} data</span>
          </div>
          {tableOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {tableOpen && (
          <div className="border-t border-gray-100">
            {loading && tableData.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="p-12 flex flex-col items-center justify-center text-red-500">
                <AlertCircle className="w-8 h-8 mb-3" />
                <p className="text-sm">{error}</p>
              </div>
            ) : tableData.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Belum ada stok sapi qurban</p>
                <p className="text-xs mt-1">Data akan muncul setelah pembelian qurban ditambahkan</p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={tableData}
                pagination
                paginationServer
                paginationTotalRows={totalRecords}
                paginationPerPage={perPage}
                paginationDefaultPage={currentPage}
                onChangePage={setCurrentPage}
                onChangeRowsPerPage={(n) => { setPerPage(n); setCurrentPage(1); }}
                onSort={handleSort}
                sortServer
                defaultSortFieldId={1}
                defaultSortAsc={false}
                customStyles={customStyles}
                highlightOnHover
                pointerOnHover
                responsive
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StokSapiQurbanPage;
