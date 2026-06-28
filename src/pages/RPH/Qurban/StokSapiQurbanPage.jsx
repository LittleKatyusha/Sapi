import React, { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Beef, Search, Loader2, AlertCircle, FileText } from 'lucide-react';
import HttpClient from '../../../services/httpClient';

const StokSapiQurbanPage = () => {
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (page = 1, limit = perPage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await HttpClient.get('/api/rph/qurban/data-persapi', {
        params: {
          start: (page - 1) * limit,
          length: limit,
          draw: 1,
          search: { value: searchTerm },
          order: [{ column: 0, dir: 'desc' }],
        }
      });
      setTableData(response.data || []);
      setTotalRecords(response.recordsTotal || 0);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data qurban');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, perPage]);

  useEffect(() => { fetchData(currentPage); }, [fetchData, currentPage]);

  const columns = [
    { name: 'No.', width: '52px', center: true, cell: (_, idx) => (currentPage - 1) * perPage + idx + 1 },
    { name: 'Eartag', selector: (row) => row.eartag, sortable: true, minWidth: '120px', cell: (row) => <span className="font-mono font-semibold text-gray-800">{row.eartag || '-'}</span> },
    { name: 'Eartag Supplier', selector: (row) => row.eartag_supplier, sortable: true, minWidth: '140px', cell: (row) => <span className="font-mono text-gray-600">{row.eartag_supplier || '-'}</span> },
    { name: 'Berat (kg)', selector: (row) => row.berat, sortable: true, width: '110px', center: true, cell: (row) => <span className="text-gray-700">{row.berat ? row.berat + ' kg' : '-'}</span> },
    { name: 'Harga Beli', selector: (row) => row.harga_beli, sortable: true, width: '150px', right: true, cell: (row) => <span className="font-bold text-emerald-600">{'Rp ' + (row.harga_beli || 0).toLocaleString('id-ID')}</span> },
    { name: 'Nota Qurban', selector: (row) => row.nota_sistem, sortable: true, minWidth: '150px', cell: (row) => <span className="text-sm text-gray-600">{row.nota_sistem || '-'}</span> },
    { name: 'Tanggal', selector: (row) => row.tanggal_pemesanan, sortable: true, width: '120px', cell: (row) => <span className="text-sm text-gray-500">{row.tanggal_pemesanan || '-'}</span> },
  ];

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '52px', borderBottom: '1px solid #f1f5f9' } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Beef className="w-8 h-8 text-emerald-600" />
              Stok Sapi Qurban
            </h1>
            <p className="text-gray-500 text-sm mt-1">Daftar sapi qurban per ekor</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari eartag atau nota..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData(1)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
          <DataTable columns={columns} data={tableData} pagination paginationServer paginationTotalRows={totalRecords} paginationPerPage={perPage} paginationDefaultPage={currentPage} onChangePage={setCurrentPage} onChangeRowsPerPage={(n) => { setPerPage(n); setCurrentPage(1); }} customStyles={customStyles} highlightOnHover pointerOnHover responsive />
        )}
      </div>
    </div>
  );
};

export default StokSapiQurbanPage;
