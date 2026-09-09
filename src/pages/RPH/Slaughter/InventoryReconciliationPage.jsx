import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Eye, RefreshCw, ClipboardCheck, ShieldCheck, AlertTriangle } from 'lucide-react';
import inventoryReconciliationService from '../../../services/inventoryReconciliationService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const fmt = (v, dec = 2) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const statusColor = (s) => ({
  DRAFT: 'bg-gray-100 text-gray-600',
  COUNTED: 'bg-blue-100 text-blue-700',
  RECONCILED: 'bg-green-100 text-green-700',
  INVESTIGATION: 'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-600');

const InventoryReconciliationPage = () => {
  useDocumentTitle('Rekonsiliasi Stok');
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ recon_date: new Date().toISOString().slice(0, 10), stock_type: 'BONING' });
  const [detail, setDetail] = useState(null);
  const [countModal, setCountModal] = useState(null);
  const [countItems, setCountItems] = useState([]);
  const [verifyTarget, setVerifyTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryReconciliationService.getData({});
      if (res.success) {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setData(rows);
      }
    } catch (e) { showError('Gagal memuat: ' + e.message); }
    finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    try {
      const res = await inventoryReconciliationService.store(createForm);
      if (res.success) {
        showSuccess('Rekonsiliasi dibuat — snapshot stok sistem telah diambil');
        setCreateModal(false);
        fetchData();
      }
    } catch (e) { showError('Buat gagal: ' + e.message); }
  };

  const showDetail = async (row) => {
    try {
      const res = await inventoryReconciliationService.show(row.pid);
      if (res.success) setDetail(res.data?.data || res.data);
    } catch (e) { showError('Gagal memuat detail: ' + e.message); }
  };

  const openCount = async (row) => {
    try {
      const res = await inventoryReconciliationService.show(row.pid);
      if (res.success) {
        const d = res.data?.data || res.data;
        setCountItems((d.details || []).map(it => ({ ...it, physical_berat: it.physical_berat || '', reason: it.reason || '' })));
        setCountModal(row);
      }
    } catch (e) { showError('Gagal memuat: ' + e.message); }
  };

  const handleSaveCount = async () => {
    try {
      const res = await inventoryReconciliationService.enterCount({
        pid: countModal.pid,
        items: countItems.map(it => ({
          id_item_potong: it.id_item_potong,
          physical_berat: Number(it.physical_berat) || 0,
          reason: it.reason || null,
        })),
      });
      if (res.success) {
        showSuccess('Hitung fisik tersimpan');
        setCountModal(null);
        fetchData();
      }
    } catch (e) { showError('Simpan hitung gagal: ' + e.message); }
  };

  const handleVerify = async () => {
    try {
      const res = await inventoryReconciliationService.verify(verifyTarget.pid);
      if (res.success) {
        showSuccess('Rekonsiliasi diverifikasi — varians dihitung');
        setVerifyTarget(null);
        fetchData();
      }
    } catch (e) { showError('Verifikasi gagal: ' + e.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Rekonsiliasi Stok</h1>
          <p className="text-sm text-gray-500">Hitung fisik vs stok sistem — verifikasi two-man</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="bg-gray-100 px-3 py-1.5 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><RefreshCw size={14} /> Segarkan</button>
          <button onClick={() => setCreateModal(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Rekonsiliasi Baru</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Kode Rekonsiliasi</th>
              <th className="text-left px-3 py-2">Tanggal</th>
              <th className="text-center px-3 py-2">Tipe Stok</th>
              <th className="text-center px-3 py-2">Sistem (kg)</th>
              <th className="text-center px-3 py-2">Fisik (kg)</th>
              <th className="text-center px-3 py-2">Varians (kg)</th>
              <th className="text-center px-3 py-2">Varians %</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Tidak ada rekonsiliasi</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{row.recon_code}</td>
                <td className="px-3 py-2">{row.recon_date}</td>
                <td className="text-center px-3 py-2">{row.stock_type}</td>
                <td className="text-center px-3 py-2">{fmt(row.total_system_berat, 3)}</td>
                <td className="text-center px-3 py-2">{fmt(row.total_physical_berat, 3)}</td>
                <td className="text-center px-3 py-2 text-red-600 font-medium">{fmt(row.total_variance, 3)}</td>
                <td className="text-center px-3 py-2">{fmt(row.variance_pct, 2)}%</td>
                <td className="text-center px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(row.status)}`}>{row.status}</span>
                  {row.variance_status === 'HIGH_RISK' && <span className="ml-1 text-red-600">⚠</span>}
                </td>
                <td className="text-center px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => showDetail(row)} className="p-1 hover:bg-gray-100 rounded" title="Lihat"><Eye size={14} /></button>
                    {row.status === 'DRAFT' && (
                      <button onClick={() => openCount(row)} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Input Hitung"><ClipboardCheck size={14} /></button>
                    )}
                    {row.status === 'COUNTED' && (
                      <button onClick={() => setVerifyTarget(row)} className="p-1 hover:bg-green-100 rounded text-green-600" title="Verifikasi (two-man)"><ShieldCheck size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Rekonsiliasi Baru</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tanggal Rekonsiliasi</label>
                <input type="date" value={createForm.recon_date} onChange={(e) => setCreateForm(f => ({ ...f, recon_date: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tipe Stok</label>
                <select value={createForm.stock_type} onChange={(e) => setCreateForm(f => ({ ...f, stock_type: e.target.value }))} className="w-full border rounded px-2 py-1">
                  <option value="BONING">Boning</option>
                  <option value="KULIT">Kulit</option>
                  <option value="KARKAS">Karkas</option>
                  <option value="DOKA">Doka</option>
                </select>
              </div>
              <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                Stok sistem akan di-snapshot otomatis per item saat Anda membuat rekonsiliasi ini.
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCreateModal(false)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleCreate} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Buat</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Detail — {detail.recon_code}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Sistem</div><div className="font-bold">{fmt(detail.total_system_berat, 3)} kg</div></div>
              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Fisik</div><div className="font-bold">{fmt(detail.total_physical_berat, 3)} kg</div></div>
              <div className="bg-gray-50 p-2 rounded"><div className="text-xs text-gray-500">Varians</div><div className={`font-bold ${detail.total_variance < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(detail.total_variance, 3)} kg</div></div>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-2 py-1">Item</th>
                  <th className="text-right px-2 py-1">Sistem</th>
                  <th className="text-right px-2 py-1">Fisik</th>
                  <th className="text-right px-2 py-1">Varians</th>
                  <th className="text-left px-2 py-1">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(detail.details || []).map((d, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1">{d.item_label || d.id_item_potong}</td>
                    <td className="text-right px-2 py-1">{fmt(d.system_berat, 3)}</td>
                    <td className="text-right px-2 py-1">{fmt(d.physical_berat, 3)}</td>
                    <td className={`text-right px-2 py-1 ${d.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(d.variance, 3)}</td>
                    <td className="px-2 py-1">{d.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Count modal */}
      {countModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCountModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Input Hitung Fisik — {countModal.recon_code}</h3>
              <button onClick={() => setCountModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-2 py-1">Item</th>
                  <th className="text-right px-2 py-1">Sistem (kg)</th>
                  <th className="text-right px-2 py-1">Fisik (kg)</th>
                  <th className="text-left px-2 py-1">Alasan (jika varians)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {countItems.map((it, i) => {
                  const variance = (Number(it.physical_berat) || 0) - (Number(it.system_berat) || 0);
                  return (
                    <tr key={i}>
                      <td className="px-2 py-1">{it.item_label || it.id_item_potong}</td>
                      <td className="text-right px-2 py-1">{fmt(it.system_berat, 3)}</td>
                      <td className="text-right px-2 py-1">
                        <input type="number" step="0.001" value={it.physical_berat} onChange={(e) => setCountItems(arr => arr.map((x, j) => j === i ? { ...x, physical_berat: e.target.value } : x))} className="border rounded px-1 py-0.5 w-24 text-right" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" value={it.reason} onChange={(e) => setCountItems(arr => arr.map((x, j) => j === i ? { ...x, reason: e.target.value } : x))} placeholder={variance !== 0 ? 'Jelaskan...' : ''} className="border rounded px-1 py-0.5 w-full" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setCountModal(null)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleSaveCount} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Simpan Hitung</button>
            </div>
          </div>
        </div>
      )}

      {/* Verify modal */}
      {verifyTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setVerifyTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Verifikasi Rekonsiliasi — Aturan Two-Man</h3>
              <button onClick={() => setVerifyTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-700">
              <AlertTriangle size={14} className="inline mr-1" />
              Dengan memverifikasi, Anda memastikan hitung fisik sudah benar. Varians akan dihitung dan peringatan akan muncul jika selisih melebihi ambang batas.
            </div>
            <p className="text-sm text-gray-600 mb-2">Rekonsiliasi: <span className="font-mono">{verifyTarget.recon_code}</span></p>
            <p className="text-sm text-gray-600 mb-2">Sistem: {fmt(verifyTarget.total_system_berat, 3)} kg · Fisik: {fmt(verifyTarget.total_physical_berat, 3)} kg</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setVerifyTarget(null)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleVerify} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"><ShieldCheck size={14} /> Konfirmasi Verifikasi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReconciliationPage;
