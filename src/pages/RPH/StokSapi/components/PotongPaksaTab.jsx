import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, Scale } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';
import PotongPaksaModal from '../modals/PotongPaksaModal';
import ActionButton from './ActionButton';

const PotongPaksaTab = ({ onRefresh }) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getPotongPaksaData({
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
  }, []);

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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Riwayat Potong Paksa</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 shadow-sm">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gradient-to-r from-red-50 to-rose-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-12">No</th>
              <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-20">Aksi</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Eartag / Sapi</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Klasifikasi</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Sebab</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Bobot Selisih</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Mengetahui</th>
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                  <p className="mt-2 text-xs text-slate-500">Memuat data...</p>
                </td>
              </tr>
            ) : !loading && data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-slate-100 p-3 mb-2">
                      <Scale className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Belum Ada Data Potong Paksa</p>
                    <p className="text-xs text-slate-500">Data potong paksa akan muncul di sini setelah dicatat.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.pubid || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 text-center text-xs font-medium text-slate-700 whitespace-nowrap">
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
                  <td className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                    {item.tgl_potong_paksa || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-slate-900 whitespace-nowrap">
                    {item.sapi || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {item.klasifikasi_hewan || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {item.sebab_potong_paksa || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                    {item.bobot_selisih_potong_paksa ? `${item.bobot_selisih_potong_paksa} kg` : '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {item.mengetahui || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 whitespace-normal max-w-xs truncate">
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