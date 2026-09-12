import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Eye, Scale, AlertTriangle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import slaughterBatchService from '../../../services/slaughterBatchService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const fmt = (v, dec = 2) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const varianceColor = (s) => ({
  BALANCED: 'bg-green-100 text-green-700',
  UNEXPLAINED: 'bg-yellow-100 text-yellow-700',
  HIGH_RISK: 'bg-red-100 text-red-700',
  EXPLAINED: 'bg-blue-100 text-blue-700',
}[s] || 'bg-gray-100 text-gray-600');

const statusColor = (s) => ({
  PLANNED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RECONCILED: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-green-100 text-green-700',
  INVESTIGATION: 'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-600');

const SlaughterBatchPage = () => {
  useDocumentTitle('Kontrol Batch Penyembelihan');
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [closeModal, setCloseModal] = useState(null);
  const [closeNotes, setCloseNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await slaughterBatchService.getData({
        draw: page,
        start: (page - 1) * pageSize,
        length: pageSize,
        searchValue: search,
        status: statusFilter,
      });
      if (res.success) {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setData(rows);
        setTotalRecords(res.recordsTotal || res.data?.recordsTotal || 0);
      }
    } catch (e) {
      showError('Gagal memuat batches: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showDetail = async (row) => {
    setDetailLoading(true);
    try {
      const res = await slaughterBatchService.show(row.pid);
      if (res.success) setDetail(res.data?.data || res.data);
    } catch (e) { showError('Gagal memuat batch: ' + e.message); }
    finally { setDetailLoading(false); }
  };

  const handleReconcile = async (row) => {
    try {
      const res = await slaughterBatchService.reconcile(row.pid);
      if (res.success) {
        showSuccess(`Direkonsiliasi: susut tak wajar ${fmt(res.data?.unexplained || 0, 3)} kg (${res.data?.variance})`);
        fetchData();
      }
    } catch (e) { showError('Reconcile gagal: ' + e.message); }
  };

  const handleClose = async () => {
    if (!closeModal) return;
    try {
      const res = await slaughterBatchService.closeBatch({ pid: closeModal.pid, notes: closeNotes });
      if (res.success) {
        showSuccess('Batch ditutup');
        setCloseModal(null);
        setCloseNotes('');
        fetchData();
      }
    } catch (e) { showError('Tutup gagal: ' + e.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kontrol Batch Penyembelihan</h1>
          <p className="text-sm text-gray-500">Rekonsiliasi neraca massa, event berat immutable, tutup two-man</p>
        </div>
        <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1">
          <RefreshCw size={14} /> Segarkan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Cari kode batch..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">Semua Status</option>
          <option value="PLANNED">Direncanakan</option>
          <option value="IN_PROGRESS">Berlangsung</option>
          <option value="RECONCILED">Direkonsiliasi</option>
          <option value="CLOSED">Ditutup</option>
          <option value="INVESTIGATION">Investigasi</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Kode Batch</th>
              <th className="text-left px-3 py-2">Tanggal</th>
              <th className="text-left px-3 py-2">RPH</th>
              <th className="text-left px-3 py-2">Eartag</th>
              <th className="text-center px-3 py-2">Hidup (kg)</th>
              <th className="text-center px-3 py-2">Karkas (kg)</th>
              <th className="text-center px-3 py-2">Cutting (kg)</th>
              <th className="text-center px-3 py-2">Susut Tak Wajar (kg)</th>
              <th className="text-center px-3 py-2">Varians</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={11} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-8 text-gray-400">Tidak ada batch</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{row.batch_code}</td>
                <td className="px-3 py-2">{row.slaughter_date}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.rph_name || '—'}</td>
                <td className="px-3 py-2 text-xs">
                  {row.code_eartag ? (
                    <div>
                      <div className="font-mono text-gray-700">{row.code_eartag}</div>
                      <div className="text-gray-400">{row.eartag_supplier || ''}</div>
                    </div>
                  ) : '—'}
                </td>
                <td className="text-center px-3 py-2">{fmt(row.live_weight, 2)}</td>
                <td className="text-center px-3 py-2">{fmt(row.carcass_weight, 2)}</td>
                <td className="text-center px-3 py-2">{fmt(row.cutting_output, 2)}</td>
                <td className="text-center px-3 py-2 text-red-600 font-medium">{fmt(row.unexplained_loss, 3)}</td>
                <td className="text-center px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${varianceColor(row.variance_status)}`}>{row.variance_status}</span>
                </td>
                <td className="text-center px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(row.status)}`}>{row.status}</span>
                </td>
                <td className="text-center px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => showDetail(row)} className="p-1 hover:bg-gray-100 rounded" title="Lihat"><Eye size={14} /></button>
                    <button onClick={() => handleReconcile(row)} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Rekonsiliasi"><Scale size={14} /></button>
                    {row.status !== 'CLOSED' && (
                      <button onClick={() => setCloseModal(row)} className="p-1 hover:bg-green-100 rounded text-green-600" title="Tutup (two-man)"><Lock size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 border-t text-sm">
          <span className="text-gray-500">Total: {totalRecords}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Sebelumnya</button>
            <span className="px-2 py-1">Halaman {page}</span>
            <button disabled={page * pageSize >= totalRecords} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Detail Batch — {detail.batch_code}</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {detailLoading ? (
              <p className="text-center py-8 text-gray-400">Memuat...</p>
            ) : (
              <div className="space-y-4 text-sm">
                {/* Animal & RPH context */}
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-gray-400 text-xs uppercase mb-2">Lokasi & Ternak</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Stat label="RPH" value={detail.rph_name || '—'} />
                    <Stat label="Kode Eartag" value={detail.code_eartag || '—'} />
                    <Stat label="Eartag" value={detail.eartag || '—'} />
                    <Stat label="Supplier Eartag" value={detail.eartag_supplier || '—'} />
                    <Stat label="Jenis Kelamin" value={detail.jenis_kelamin || '—'} />
                    <Stat label="Klasifikasi" value={detail.klasifikasi_name || detail.id_klasifikasi_hewan || '—'} />
                    <Stat label="Berat Pembelian" value={detail.berat_pembelian != null ? fmt(detail.berat_pembelian, 2) + ' kg' : '—'} />
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Stat label="Berat Hidup" value={fmt(detail.live_weight, 2) + ' kg'} />
                  <Stat label="Karkas" value={fmt(detail.carcass_weight, 2) + ' kg'} />
                  <Stat label="Output Cutting" value={fmt(detail.cutting_output, 2) + ' kg'} />
                  <Stat label="Limbah" value={fmt(detail.waste_weight, 2) + ' kg'} />
                  <Stat label="Susut Wajar" value={fmt(detail.explained_loss, 3) + ' kg'} />
                  <Stat label="Susut Tak Wajar" value={fmt(detail.unexplained_loss, 3) + ' kg'} color="text-red-600" />
                  <Stat label="Varians" value={detail.variance_status} />
                  <Stat label="Status" value={detail.status} />
                </div>

                {/* Expected vs actual */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Baseline Yield</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    Karkas diharapkan: {fmt(detail.expected_carcass_min, 2)}–{fmt(detail.expected_carcass_max, 2)} kg
                    {detail.expected_cutting_loss_min != null && <> · Susut cutting diharapkan: {fmt(detail.expected_cutting_loss_min, 2)}–{fmt(detail.expected_cutting_loss_max, 2)} kg</>}
                  </div>
                </div>

                {/* Weight events */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Event Berat (immutable)</h4>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-2 py-1">Titik</th>
                        <th className="text-right px-2 py-1">Berat (kg)</th>
                        <th className="text-left px-2 py-1">Timbangan</th>
                        <th className="text-left px-2 py-1">Dicatat Pada</th>
                        <th className="text-center px-2 py-1">Dikoreksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detail.weight_events || []).map((e, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1">{e.weight_point}</td>
                          <td className="text-right px-2 py-1 font-medium">{fmt(e.berat, 3)}</td>
                          <td className="px-2 py-1">{e.scale_id || '—'}</td>
                          <td className="px-2 py-1">{e.recorded_at ? new Date(e.recorded_at).toLocaleString('id-ID') : '—'}</td>
                          <td className="text-center px-2 py-1">{e.is_corrected ? <span className="text-yellow-600">⚠</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Losses */}
                {(detail.losses || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Susut Wajar</h4>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-2 py-1">Kategori</th>
                          <th className="text-right px-2 py-1">Berat (kg)</th>
                          <th className="text-left px-2 py-1">Alasan</th>
                          <th className="text-left px-2 py-1">Disetujui Oleh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detail.losses.map((l, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{l.category}</td>
                            <td className="text-right px-2 py-1">{fmt(l.berat, 3)}</td>
                            <td className="px-2 py-1">{l.reason || '—'}</td>
                            <td className="px-2 py-1">{l.approved_by || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Corrections */}
                {(detail.corrections || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Koreksi</h4>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-2 py-1">Lama (kg)</th>
                          <th className="text-left px-2 py-1">Baru (kg)</th>
                          <th className="text-left px-2 py-1">Alasan</th>
                          <th className="text-center px-2 py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detail.corrections.map((c, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{fmt(c.old_berat, 3)}</td>
                            <td className="px-2 py-1">{fmt(c.new_berat, 3)}</td>
                            <td className="px-2 py-1">{c.reason || '—'}</td>
                            <td className="text-center px-2 py-1">{c.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close modal */}
      {closeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCloseModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Tutup Batch — Aturan Two-Man</h3>
              <button onClick={() => setCloseModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3 text-xs text-yellow-700">
              <AlertTriangle size={14} className="inline mr-1" />
              Penutupan memerlukan persetujuan supervisor. Jika varians HIGH_RISK, penutupan akan diblokir.
            </div>
            <p className="text-sm text-gray-600 mb-2">Batch: <span className="font-mono">{closeModal.batch_code}</span></p>
            <p className="text-sm text-gray-600 mb-2">Susut Tak Wajar: <span className="text-red-600 font-medium">{fmt(closeModal.unexplained_loss, 3)} kg</span></p>
            <textarea
              placeholder="Catatan tutup (opsional)..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full border rounded p-2 text-sm h-20"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setCloseModal(null)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleClose} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"><CheckCircle2 size={14} /> Konfirmasi Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className="bg-gray-50 rounded p-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`font-bold ${color || 'text-gray-800'}`}>{value}</div>
  </div>
);

export default SlaughterBatchPage;
