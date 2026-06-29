import React, { useState, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, AlertTriangle, Filter, Search, RotateCcw } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';
import SapiMatiModal from '../modals/SapiMatiModal';
import ActionButton from './ActionButton';

const SapiMatiTab = () => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = useCallback(async (opts = {}) => {
    const { explicit = false } = opts;
    const start = startDate || null;
    const end = endDate || null;

    if (explicit && !(start && end)) {
      setError('Pilih rentang tanggal terlebih dahulu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        start: 0,
        length: 100,
        _t: Date.now(),
      };
      if (start) params.start_date = start;
      if (end) params.end_date = end;

      const response = await StokSapiService.getSapiMatiData(params);

      if (response.success) {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          setData([]);
        }
      } else {
        setError(response.message || 'Gagal memuat data');
        setData([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleSearch = () => {
    if (startDate && endDate) {
      fetchData({ explicit: true });
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setError(null);
    setData([]);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleEdit = (record) => {
    // Transform record back to match cowData format expected by SapiMatiModal
    const cowData = {
      pid: record.pid,
      pubid: record.pubid,
      sapi: record.sapi,
      eartag_supplier: record.sapi,
      klasifikasi_hewan: record.klasifikasi_hewan,
    };
    setSelectedRecord({ ...record, cowData });
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    handleRefresh();
  };

  const handleDelete = async (pid) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data sapi mati ini?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await StokSapiService.deleteSapiMati(pid);
      if (res.success) {
        handleRefresh();
      } else {
        setError(res.message || 'Gagal menghapus data');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menghapus data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">Riwayat Sapi Mati</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Filter Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4 text-slate-500" />
            Filter Tanggal
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/30"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!startDate || !endDate || loading}
                className="inline-flex items-center gap-2 rounded-md bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">No</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">Aksi</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal & Pelapor</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sapi</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sebab & Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                  <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
                </td>
              </tr>
            ) : !loading && data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-slate-100 p-3 mb-2">
                      <AlertTriangle className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-1">Belum Ada Data Sapi Mati</p>
                    <p className="text-sm text-slate-500">Data sapi mati akan muncul di sini setelah dicatat.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.pubid || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-center text-sm font-medium text-slate-700 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 text-center border-gray-100 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <ActionButton
                        row={{ id: item.pid || index, ...item }}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.pid)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 border-gray-100 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="text-sm text-slate-700">{item.tgl_kematian || '-'}</div>
                      <div className="text-xs text-slate-500">
                        <span className="text-slate-400">Pelapor:</span> {item.mengetahui || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-gray-100 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-slate-900">{item.sapi || '-'}</div>
                      <div className="text-xs text-slate-500">
                        <span className="text-slate-400">Klasifikasi:</span> {item.klasifikasi_hewan || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 border-gray-100 whitespace-normal max-w-xs truncate">
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500">
                        <span className="text-slate-400">Sebab:</span> {item.sebab_kematian || '-'}
                      </div>
                      <div className="text-sm text-slate-600" title={item.keterangan}>{item.keterangan || '-'}</div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModalOpen && (
        <SapiMatiModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRecord(null);
          }}
          onSuccess={handleEditSuccess}
          cowData={selectedRecord?.cowData}
          editData={selectedRecord}
        />
      )}
    </div>
  );
};

export default SapiMatiTab;
