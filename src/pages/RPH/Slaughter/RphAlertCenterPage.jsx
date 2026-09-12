import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Eye, X, Filter, RefreshCw } from 'lucide-react';
import rphAlertService from '../../../services/rphAlertService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const fmt = (v, dec = 2) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const sevColor = (s) => ({
  LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}[s] || 'bg-gray-100 text-gray-700 border-gray-200');

const statusColor = (s) => ({
  OPEN: 'bg-red-50 text-red-600',
  ACKNOWLEDGED: 'bg-blue-50 text-blue-600',
  RESOLVED: 'bg-green-50 text-green-600',
  ESCALATED: 'bg-purple-50 text-purple-600',
}[s] || 'bg-gray-50 text-gray-600');

const RphAlertCenterPage = () => {
  useDocumentTitle('Pusat Peringatan RPH');
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', severity: '', alert_type: '' });
  const [detail, setDetail] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rphAlertService.getData({
        draw: page,
        start: (page - 1) * pageSize,
        length: pageSize,
        searchValue: search,
        ...filters,
      });
      if (res.success) {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setData(rows);
        setTotalRecords(res.recordsTotal || res.data?.recordsTotal || 0);
      }
    } catch (e) {
      showError('Gagal memuat peringatan: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters, showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAcknowledge = async (row) => {
    try {
      const res = await rphAlertService.acknowledge(row.pid);
      if (res.success) {
        showSuccess('Peringatan diketahui');
        fetchData();
      }
    } catch (e) { showError('Acknowledge gagal: ' + e.message); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    try {
      const res = await rphAlertService.resolve({ pid: resolveModal.pid, notes: resolveNotes });
      if (res.success) {
        showSuccess('Peringatan diselesaikan');
        setResolveModal(null);
        setResolveNotes('');
        fetchData();
      }
    } catch (e) { showError('Resolve gagal: ' + e.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pusat Peringatan RPH</h1>
          <p className="text-sm text-gray-500">Peringatan anti-susut real-time — ketahui, selidiki, selesaikan</p>
        </div>
        <button onClick={fetchData} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1">
          <RefreshCw size={14} /> Segarkan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-center">
        <Filter size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Cari judul/deskripsi..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
        />
        <select value={filters.status} onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">Semua Status</option>
          <option value="OPEN">Terbuka</option>
          <option value="ACKNOWLEDGED">Diketahui</option>
          <option value="RESOLVED">Selesai</option>
          <option value="ESCALATED">Eskalasi</option>
        </select>
        <select value={filters.severity} onChange={(e) => { setFilters(f => ({ ...f, severity: e.target.value })); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">Semua Tingkat</option>
          <option value="LOW">Rendah</option>
          <option value="WARNING">Peringatan</option>
          <option value="HIGH">Tinggi</option>
          <option value="CRITICAL">Kritis</option>
        </select>
        <select value={filters.alert_type} onChange={(e) => { setFilters(f => ({ ...f, alert_type: e.target.value })); setPage(1); }} className="border rounded px-2 py-1 text-sm">
          <option value="">Semua Tipe</option>
          <option value="MASS_BALANCE_UNEXPLAINED">Neraca Massa</option>
          <option value="YIELD_DRESSING_LOW">Yield Dressing Rendah</option>
          <option value="YIELD_DRESSING_HIGH">Yield Dressing Tinggi</option>
          <option value="YIELD_CUTTING_LOW">Yield Cutting Rendah</option>
          <option value="CORRECTION_FREQUENCY">Frekuensi Koreksi</option>
          <option value="BACKDATE_NO_REASON">Backdate Tanpa Alasan</option>
          <option value="CLOSE_BLOCKED">Tutup Diblokir</option>
          <option value="COLLUSION_PATTERN">Pola Kolusi</option>
          <option value="INVENTORY_MISMATCH">Ketidaksesuaian Stok</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Tingkat</th>
              <th className="text-left px-3 py-2">Tipe</th>
              <th className="text-left px-3 py-2">Judul</th>
              <th className="text-left px-3 py-2">RPH</th>
              <th className="text-left px-3 py-2">Batch</th>
              <th className="text-left px-3 py-2">Eartag</th>
              <th className="text-center px-3 py-2">Terukur</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Dibuat</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Tidak ada peringatan</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${sevColor(row.severity)}`}>{row.severity}</span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.alert_type.replace(/_/g, ' ').toLowerCase()}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800">{row.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-md">{row.description}</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{row.rph_name || '—'}</td>
                <td className="px-3 py-2 text-xs">
                  {row.batch_code ? (
                    <div>
                      <div className="font-mono text-gray-700">{row.batch_code}</div>
                      <div className="text-gray-400">{row.slaughter_date || '—'}</div>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {row.code_eartag ? (
                    <div>
                      <div className="font-mono text-gray-700">{row.code_eartag}</div>
                      <div className="text-gray-400">{row.eartag_supplier || ''}</div>
                    </div>
                  ) : '—'}
                </td>
                <td className="text-center px-3 py-2 text-xs">
                  {row.measured_value != null ? `${fmt(row.measured_value)} ${row.value_unit || ''}` : '—'}
                </td>
                <td className="text-center px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '—'}</td>
                <td className="text-center px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setDetail(row)} className="p-1 hover:bg-gray-100 rounded" title="Lihat"><Eye size={14} /></button>
                    {(row.status === 'OPEN' || row.status === 'ESCALATED') && (
                      <button onClick={() => handleAcknowledge(row)} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Ketahui"><CheckCircle2 size={14} /></button>
                    )}
                    {(row.status === 'OPEN' || row.status === 'ACKNOWLEDGED' || row.status === 'ESCALATED') && (
                      <button onClick={() => setResolveModal(row)} className="p-1 hover:bg-green-100 rounded text-green-600" title="Selesaikan"><AlertTriangle size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
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
              <h3 className="font-bold text-gray-800">Detail Peringatan</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Tipe" value={detail.alert_type} />
              <Row label="Tingkat" value={<span className={`px-2 py-0.5 rounded text-xs ${sevColor(detail.severity)}`}>{detail.severity}</span>} />
              <Row label="Status" value={<span className={`px-2 py-0.5 rounded text-xs ${statusColor(detail.status)}`}>{detail.status}</span>} />
              <Row label="Judul" value={detail.title} />
              <Row label="Deskripsi" value={detail.description} />
              <Row label="Terukur" value={`${detail.measured_value ?? '—'} ${detail.value_unit || ''}`} />
              <Row label="Diharapkan" value={detail.expected_min != null ? `${detail.expected_min}–${detail.expected_max} ${detail.value_unit || ''}` : '—'} />

              <div className="border-t pt-2 mt-2">
                <div className="text-gray-400 text-xs uppercase mb-1">Lokasi & Ternak</div>
                <Row label="RPH" value={detail.rph_name || '—'} />
                <Row label="Kode Batch" value={detail.batch_code || '—'} />
                <Row label="Tanggal Potong" value={detail.slaughter_date || '—'} />
                <Row label="Status Batch" value={detail.batch_status || '—'} />
                <Row label="Berat Hidup" value={detail.live_weight != null ? `${fmt(detail.live_weight, 2)} kg` : '—'} />
                <Row label="Berat Karkas" value={detail.carcass_weight != null ? `${fmt(detail.carcass_weight, 2)} kg` : '—'} />
                <Row label="Eartag" value={detail.eartag || '—'} />
                <Row label="Kode Eartag" value={detail.code_eartag || '—'} />
                <Row label="Supplier Eartag" value={detail.eartag_supplier || '—'} />
                <Row label="Jenis Kelamin" value={detail.jenis_kelamin || '—'} />
                <Row label="Klasifikasi" value={detail.id_klasifikasi_hewan || '—'} />
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="text-gray-400 text-xs uppercase mb-1">Pelaku</div>
                <Row label="Operator" value={detail.id_operator || '—'} />
                <Row label="Supervisor" value={detail.id_supervisor || '—'} />
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="text-gray-400 text-xs uppercase mb-1">Waktu</div>
                <Row label="Dibuat" value={detail.created_at ? new Date(detail.created_at).toLocaleString('id-ID') : '—'} />
                {detail.acknowledged_at && <Row label="Diketahui" value={new Date(detail.acknowledged_at).toLocaleString('id-ID')} />}
                {detail.resolved_at && <Row label="Selesai" value={new Date(detail.resolved_at).toLocaleString('id-ID')} />}
                {detail.resolution_notes && <Row label="Catatan Penyelesaian" value={detail.resolution_notes} />}
              </div>

              {detail.metadata && (
                <div>
                  <div className="text-gray-500 text-xs">Metadata</div>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(detail.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Selesaikan Peringatan</h3>
              <button onClick={() => setResolveModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{resolveModal.title}</p>
            <textarea
              placeholder="Catatan penyelesaian (temuan investigasi, akar masalah, tindakan korektif)..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="w-full border rounded p-2 text-sm h-24"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setResolveModal(null)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleResolve} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">Selesaikan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-500 w-40 text-xs">{label}</span>
    <span className="flex-1 text-gray-800">{value}</span>
  </div>
);

export default RphAlertCenterPage;
