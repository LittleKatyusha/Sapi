import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Plus, Edit, Trash2, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import perpindahanTernakService from '../../../services/perpindahanTernakService';
import AddEditPerpindahanTernakModal from './AddEditPerpindahanTernakModal';

const PerpindahanTernakPage = () => {
  useDocumentTitle('Perpindahan Ternak');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPid, setSelectedPid] = useState(null);

  // Pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  /** Fetch data */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
      };

      const response = await perpindahanTernakService.getData(params);

      if (response.success) {
        setData(response.data?.data || []);
        setTotalRecords(response.data?.recordsTotal || 0);
      } else {
        setError(response.message);
        setData([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Handle add */
  const handleAdd = useCallback(() => {
    setEditMode(false);
    setSelectedPid(null);
    setModalOpen(true);
  }, []);

  /** Handle edit */
  const handleEdit = useCallback((pid) => {
    setEditMode(true);
    setSelectedPid(pid);
    setModalOpen(true);
  }, []);

  /** Handle delete */
  const handleDelete = useCallback(async (pid) => {
    if (!window.confirm('Yakin ingin menghapus data perpindahan ternak ini?')) return;

    try {
      const response = await perpindahanTernakService.delete(pid);
      
      if (response.success) {
        alert(response.message);
        fetchData();
      } else {
        alert(response.message);
      }
    } catch (err) {
      alert(err?.message || 'Gagal menghapus data');
    }
  }, [fetchData]);

  /** Handle modal close */
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditMode(false);
    setSelectedPid(null);
  }, []);

  /** Handle modal success */
  const handleModalSuccess = useCallback(() => {
    fetchData();
    handleModalClose();
  }, [fetchData, handleModalClose]);

  /** Handle search */
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  }, [fetchData]);

  /** Format currency */
  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  /** Pagination info */
  const paginationInfo = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalRecords);
    return { start, end, total: totalRecords };
  }, [currentPage, pageSize, totalRecords]);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/60">
      <div className="mx-auto max-w-full space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-3 text-white">
                <Truck className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Perpindahan Ternak
                </h1>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Kelola data perpindahan ternak antar lokasi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-5 w-5" />
              Tambah Perpindahan Ternak
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari lokasi, plat nomor, sopir..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Cari
            </button>
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lokasi Asal</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Lokasi Tujuan</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Alasan</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Jumlah</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Bobot Total</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Armada</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Biaya Kirim</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="inline h-5 w-5 animate-spin" />
                      <span className="ml-2">Memuat data...</span>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      Tidak ada data perpindahan ternak
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={row.pubid} className="hover:bg-blue-50/50 transition">
                      <td className="px-4 py-3 text-gray-900">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(row.tanggal_perpindahan).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{row.lokasi_asal}</td>
                      <td className="px-4 py-3 text-gray-900">{row.lokasi_tujuan}</td>
                      <td className="px-4 py-3 text-gray-700">{row.alasan_perpindahan}</td>
                      <td className="px-4 py-3 text-gray-900">{row.jumlah_ekor} ekor</td>
                      <td className="px-4 py-3 text-gray-900">{row.total_bobot} kg</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="text-xs">
                          <div>{row.armada_pengiriman || '-'}</div>
                          <div className="text-gray-500">{row.plat_nomor || '-'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{formatCurrency(row.biaya_kirim)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(row.pubid)}
                            className="rounded-lg bg-amber-100 p-2 text-amber-700 transition hover:bg-amber-200"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.pubid)}
                            className="rounded-lg bg-red-100 p-2 text-red-700 transition hover:bg-red-200"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-sm text-gray-700">
                Menampilkan {paginationInfo.start} - {paginationInfo.end} dari {paginationInfo.total} data
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="flex items-center px-3 text-sm text-gray-700">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <AddEditPerpindahanTernakModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editMode={editMode}
          selectedPid={selectedPid}
        />
      )}
    </div>
  );
};

export default PerpindahanTernakPage;
