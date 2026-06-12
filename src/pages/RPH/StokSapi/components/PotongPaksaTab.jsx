import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, Scale, Edit, Trash2 } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';
import PotongPaksaModal from '../modals/PotongPaksaModal';
import ActionButton from './ActionButton';

const PotongPaksaTab = ({ onRefresh }) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getPotongPaksaData({
        start_date: startDate,
        end_date: endDate,
        start: 0,
        length: 100,
        _t: Date.now(),
      });

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };

  const handleEdit = (record) => {
    // Transform record back to match cowData format expected by PotongPaksaModal
    // The table record has `pid`, `sapi` (eartag), `klasifikasi_hewan`
    // We need to build a mock cowData object that the modal uses
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
    if (!window.confirm('Apakah Anda yakin ingin menghapus data potong paksa ini?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await StokSapiService.deletePotongPaksa(pid);
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Riwayat Potong Paksa</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-red-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-red-50 to-rose-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">No</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Aksi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Eartag / Sapi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Klasifikasi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sebab</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Bobot Selisih</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mengetahui</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                  <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
                </td>
              </tr>
            ) : !loading && data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-slate-100 p-4 mb-3">
                      <Scale className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-1">Belum Ada Data Potong Paksa</p>
                    <p className="text-sm text-slate-500">Data potong paksa akan muncul di sini setelah dicatat.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.pubid || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center text-sm font-medium text-slate-700 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-center border-gray-100 whitespace-nowrap">
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
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {item.tgl_potong_paksa || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {item.sapi || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {item.klasifikasi_hewan || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {item.sebab_potong_paksa || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {item.bobot_selisih_potong_paksa ? `${item.bobot_selisih_potong_paksa} kg` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {item.mengetahui || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-normal max-w-xs truncate">
                    {item.keterangan || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModalOpen && (
        <PotongPaksaModal
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

export default PotongPaksaTab;