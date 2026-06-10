import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Tag, Eye, Trash2 } from 'lucide-react';
import EartagHoService from '../../../services/eartagHoService';
import DeleteConfirmationModal from '../../../components/shared/modals/DeleteConfirmationModal';

const EartagHoPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await EartagHoService.getData();
      const rows = res?.data ?? res ?? [];
      setData(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() =>
    data.filter(r =>
      JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase())
    ), [data, searchTerm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await EartagHoService.delete(deleteTarget.pubid);
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  const handleDetail = useCallback(async (row) => {
    try {
      const res = await EartagHoService.show(row.pubid);
      setDetail(res?.data ?? res);
    } catch (e) {
      console.error('Detail failed:', e);
    }
  }, []);

  const columns = useMemo(() => [
    {
      name: 'No.',
      width: '60px',
      cell: (_, idx) => <span>{idx + 1}</span>,
    },
    { name: 'No. Eartag', selector: r => r.no_eartag || r.kode || '-', sortable: true, grow: 1 },
    { name: 'Nama Sapi', selector: r => r.nama_sapi || r.animal_name || '-', sortable: true, grow: 1 },
    { name: 'Kandang', selector: r => r.kandang || r.pen || '-', sortable: true, grow: 1 },
    { name: 'Tanggal Pasang', selector: r => r.tanggal_pasang || r.installed_at || '-', sortable: true, grow: 1 },
    { name: 'Status', selector: r => r.status ?? '-', sortable: true, grow: 1,
      cell: r => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          r.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {r.status === 1 ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      name: 'Aksi',
      grow: 0,
      width: '110px',
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => handleDetail(row)} className="text-blue-500 hover:text-blue-700">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    }
  ], [handleDetail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Eartag HO</h1>
              <p className="text-gray-600 text-sm">Manajemen pemasangan eartag ternak Head Office</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari data eartag..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <DataTable
            columns={columns}
            data={filtered}
            pagination
            paginationPerPage={15}
            progressPending={loading}
            noDataComponent={
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data eartag</p>
              </div>
            }
            highlightOnHover
            responsive
          />
        </div>

        {/* Detail modal minimalist */}
        {detail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Detail Eartag</h2>
              <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-80">
                {JSON.stringify(detail, null, 2)}
              </pre>
              <button
                onClick={() => setDetail(null)}
                className="mt-4 w-full bg-red-500 text-white rounded-xl py-2 font-medium hover:bg-red-600 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={`Hapus Eartag ${deleteTarget?.no_eartag || ''}?`}
          description="Data eartag akan dihapus permanen."
          loading={isDeleting}
        />
      </div>
    </div>
  );
};

export default EartagHoPage;
