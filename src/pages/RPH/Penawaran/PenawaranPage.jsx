import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import {
  PlusCircle, Search, Eye, Edit2, Trash2, Send, CheckCircle, XCircle,
  Handshake, Filter, Loader2, FileText, AlertCircle
} from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  diajukan: { label: 'Diajukan', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' },
  disetujui: { label: 'Disetujui', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' },
};

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');
const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID') : '-';

const PenawaranPage = () => {
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [ajukanConfirm, setAjukanConfirm] = useState(null);
  const [setujuiModal, setSetujuiModal] = useState(null);
  const [selectedApprover, setSelectedApprover] = useState('');
  const [approvers, setApprovers] = useState([]);
  const { loading, error, fetchData, hapus, ajukan, setujui, fetchApprovers } = usePenawaranPenjualan();

  const loadData = useCallback(async (page = 1, limit = perPage) => {
    const result = await fetchData({
      start: (page - 1) * limit,
      length: limit,
      search: searchTerm,
      status: statusFilter,
    });
    if (result.success) {
      setTableData(result.data || []);
      setTotalRecords(result.recordsTotal || 0);
    }
  }, [searchTerm, statusFilter, perPage, fetchData]);

  useEffect(() => { loadData(currentPage); }, [loadData, currentPage]);

  useEffect(() => {
    const loadApprovers = async () => {
      const result = await fetchApprovers();
      if (result.success) setApprovers(result.data || []);
    };
    loadApprovers();
  }, [fetchApprovers]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await hapus(deleteConfirm.pid);
    if (result.success) {
      setDeleteConfirm(null);
      loadData(currentPage);
    }
  };

  const handleAjukan = async () => {
    if (!ajukanConfirm || !selectedApprover) return;
    const result = await ajukan(ajukanConfirm.pid, selectedApprover);
    if (result.success) {
      setAjukanConfirm(null);
      setSelectedApprover('');
      loadData(currentPage);
    }
  };

  const handleSetujui = async (approved) => {
    if (!setujuiModal) return;
    const result = await setujui(setujuiModal.pid, approved);
    if (result.success) {
      setSetujuiModal(null);
      loadData(currentPage);
    }
  };

  const columns = useMemo(() => [
    { name: 'No.', width: '52px', center: true, cell: (_, idx) => <span className="text-xs text-gray-400 font-medium">{(currentPage - 1) * perPage + idx + 1}</span> },
    { name: 'Tanggal', selector: (row) => row.tanggal, sortable: true, width: '110px', cell: (row) => <span className="text-sm text-gray-600">{formatDate(row.tanggal)}</span> },
    { name: 'No. Penawaran', selector: (row) => row.no_penawaran, sortable: true, minWidth: '140px', cell: (row) => <span className="text-sm font-semibold text-gray-800">{row.no_penawaran || '-'}</span> },
    { name: 'Pedagang', selector: (row) => row.nama_pedagang, sortable: true, minWidth: '160px', cell: (row) => <span className="text-sm text-gray-700">{row.nama_pedagang || '-'}</span> },
    { name: 'Total', selector: (row) => row.total_harga, sortable: true, width: '150px', right: true, cell: (row) => <span className="text-sm font-bold text-gray-800">{formatRupiah(row.total_harga)}</span> },
    {
      name: 'Status', selector: (row) => row.status, sortable: true, width: '130px', center: true,
      cell: (row) => {
        const s = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        );
      },
    },
    {
      name: 'Aksi', center: true, width: '180px',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/rph/penawaran/detail/${row.pid}`)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition" title="Detail"><Eye className="w-4 h-4" /></button>
          {row.status === 'draft' && (
            <button onClick={() => navigate(`/rph/penawaran/edit/${row.pid}`)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition" title="Edit"><Edit2 className="w-4 h-4" /></button>
          )}
          {row.status === 'draft' && (
            <button onClick={() => setAjukanConfirm(row)} className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 transition" title="Ajukan"><Send className="w-4 h-4" /></button>
          )}
          {row.status === 'diajukan' && (
            <button onClick={() => setSetujuiModal(row)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition" title="Setujui/Tolak"><CheckCircle className="w-4 h-4" /></button>
          )}
          {row.status === 'draft' && (
            <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition" title="Hapus"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ], [currentPage, perPage, navigate]);

  const customStyles = {
    headRow: { style: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', minHeight: '44px' } },
    headCells: { style: { fontSize: '11px', fontWeight: '700', color: '#64748b', padding: '10px 12px', textTransform: 'uppercase', letterSpacing: '0.03em' } },
    rows: { style: { minHeight: '52px', borderBottom: '1px solid #f1f5f9', '&:hover': { backgroundColor: '#f8fafc' } } },
    cells: { style: { padding: '10px 12px', fontSize: '13px', color: '#334155' } },
    pagination: { style: { borderTop: '1px solid #e2e8f0', padding: '10px 14px' } },
  };

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Handshake className="w-8 h-8 text-emerald-600" />
                Penawaran Penjualan
              </h1>
              <p className="text-gray-500 text-sm mt-1">Kelola penawaran harga ke pedagang</p>
            </div>
            <button onClick={() => navigate('/rph/penawaran/add')} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-sm">
              <PlusCircle className="w-4 h-4" />
              Buat Penawaran
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari no. penawaran atau pedagang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadData(1)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); loadData(1); }} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="diajukan">Diajukan</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Table */}
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
              <p className="text-sm font-medium">Belum ada data penawaran</p>
              <p className="text-xs mt-1">Klik "Buat Penawaran" untuk mulai</p>
            </div>
          ) : (
            <DataTable columns={columns} data={tableData} pagination paginationServer paginationTotalRows={totalRecords} paginationPerPage={perPage} paginationDefaultPage={currentPage} onChangePage={setCurrentPage} onChangeRowsPerPage={(n) => { setPerPage(n); setCurrentPage(1); }} customStyles={customStyles} highlightOnHover pointerOnHover responsive />
          )}
        </div>

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold">Hapus Penawaran</h3>
              </div>
              <p className="text-gray-600 text-sm">Yakin ingin menghapus penawaran <strong>{deleteConfirm.no_penawaran}</strong>? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Batal</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* Ajukan Modal */}
        {ajukanConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-sky-600">
                <Send className="w-6 h-6" />
                <h3 className="text-lg font-bold">Ajukan Penawaran</h3>
              </div>
              <p className="text-gray-600 text-sm">Pilih approver untuk penawaran <strong>{ajukanConfirm.no_penawaran}</strong>:</p>
              <select value={selectedApprover} onChange={(e) => setSelectedApprover(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500">
                <option value="">-- Pilih Approver --</option>
                {approvers.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setAjukanConfirm(null); setSelectedApprover(''); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">Batal</button>
                <button onClick={handleAjukan} disabled={!selectedApprover} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Ajukan</button>
              </div>
            </div>
          </div>
        )}

        {/* Setujui/Tolak Modal */}
        {setujuiModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Persetujuan</h3>
              </div>
              <p className="text-gray-600 text-sm">Penawaran <strong>{setujuiModal.no_penawaran}</strong> dari {setujuiModal.nama_pedagang}</p>
              <div className="flex gap-3">
                <button onClick={() => handleSetujui(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition">
                  <XCircle className="w-4 h-4" />
                  Tolak
                </button>
                <button onClick={() => handleSetujui(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition">
                  <CheckCircle className="w-4 h-4" />
                  Setujui
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default PenawaranPage;
