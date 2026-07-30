import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Package, AlertCircle, Boxes } from 'lucide-react';
import HttpClient from '../../../../../services/httpClient';

const ITEMS_PER_PAGE = 15;

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);

const StokRphModal = ({ isOpen, onClose, activeTab }) => {
  const [stokList, setStokList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // pakan -> stok bahan baku feedmill yang sudah masuk RPH (dt_stok_feedmil_rph)
  // ovk  -> stok OVK warehouse (belum ada endpoint stok OVK RPH)
  const { endpoint, params, title } = useMemo(() => {
    if (activeTab === 'ovk') {
      return {
        endpoint: '/api/rph/pembelian/getproduk',
        params: { jenis: 2 },
        title: 'Stok OVK Warehouse'
      };
    }
    return {
      endpoint: '/api/rph/persediaan/pakan/datastok',
      params: {},
      title: 'Stok Bahan Baku di RPH'
    };
  }, [activeTab]);

  const fetchStok = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await HttpClient.get(endpoint, { params });
      const data = response?.data ?? response;
      setStokList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data stok');
      console.error('Error fetching stok RPH:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setCurrentPage(1);
      fetchStok();
    }
  }, [isOpen, fetchStok]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredStok = useMemo(
    () =>
      stokList.filter((item) => {
        const jumlah = parseFloat(item.jumlah);
        if (
          item.jumlah === null ||
          item.jumlah === undefined ||
          item.jumlah === '' ||
          isNaN(jumlah) ||
          jumlah <= 0
        ) {
          return false;
        }
        return (item.name || item.NAME || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }),
    [stokList, searchTerm]
  );

  const totalPages = Math.ceil(filteredStok.length / ITEMS_PER_PAGE);
  const paginatedStok = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStok.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStok, currentPage]);

  const totalJumlah = useMemo(
    () => filteredStok.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0),
    [filteredStok]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Boxes className="text-emerald-600" size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">
                Total {filteredStok.length} item · {totalJumlah} unit stok tersedia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="text-xs text-gray-500">Memuat stok...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={22} className="text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              <button
                onClick={fetchStok}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                Coba Lagi
              </button>
            </div>
          ) : paginatedStok.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                {searchTerm ? 'Coba kata kunci pencarian lain.' : 'Stok produk tidak tersedia.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Satuan</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedStok.map((item) => {
                      const jumlah = parseFloat(item.jumlah) || 0;
                      const isLow = jumlah <= 0;
                      const rowKey = `${item.id}|${item.id_satuan ?? ''}`;
                      return (
                        <tr key={rowKey} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {item.name || item.NAME || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.produk || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.satuan || item.unit || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            {formatCurrency(item.harga)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {jumlah} {item.satuan || ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {paginatedStok.map((item) => {
                  const jumlah = parseFloat(item.jumlah) || 0;
                  const isLow = jumlah <= 0;
                  const rowKey = `${item.id}|${item.id_satuan ?? ''}`;
                  return (
                    <div key={rowKey} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name || item.NAME || '-'}
                            </p>
                            <p className="text-xs text-gray-500">{item.produk || '-'}</p>
                            {item.satuan && (
                              <p className="text-xs text-gray-400">Satuan: {item.satuan}</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          isLow ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {jumlah} {item.satuan || ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Harga: {formatCurrency(item.harga)}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredStok.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredStok.length)} dari {filteredStok.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="text-gray-600 text-xs">Hal {currentPage}/{totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StokRphModal;
