import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldAlert, Scale, TrendingDown, Activity, Clock, XCircle, Users, Package } from 'lucide-react';
import rphDashboardService from '../../../services/rphDashboardService';
import rphAlertService from '../../../services/rphAlertService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const fmt = (v, dec = 2) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const bandColor = (band) => ({
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}[band] || 'bg-gray-100 text-gray-700');

const sevColor = (s) => ({
  LOW: 'bg-blue-100 text-blue-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-700');

const RphDashboardPage = () => {
  useDocumentTitle('Pusat Kontrol RPH');
  const { showError } = useNotification();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [alertSummary, setAlertSummary] = useState(null);
  const [period, setPeriod] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
  });

  const fetchAll = useCallback(async () => {
    try {
      const [s, t, a] = await Promise.all([
        rphDashboardService.summary(period),
        rphDashboardService.batchTimeline(period),
        rphAlertService.summary(),
      ]);
      if (s.success) setSummary(s.data);
      if (t.success) setTimeline(t.data || []);
      if (a.success) setAlertSummary(a.data);
    } catch (e) {
      showError('Gagal memuat dashboard: ' + e.message);
    }
  }, [period, showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const b = summary?.batches || {};
  const a = summary?.alerts || {};

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + period filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pusat Kontrol Anti-Susut RPH</h1>
          <p className="text-sm text-gray-500">Neraca massa, yield, peringatan, risiko, dan rekonsiliasi</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={period.start_date} onChange={(e) => setPeriod(p => ({ ...p, start_date: e.target.value }))} className="border rounded px-2 py-1 text-sm" />
          <span className="text-gray-400">→</span>
          <input type="date" value={period.end_date} onChange={(e) => setPeriod(p => ({ ...p, end_date: e.target.value }))} className="border rounded px-2 py-1 text-sm" />
          <button onClick={fetchAll} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Segarkan</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard icon={Scale} label="Total Batch" value={fmt(b.total, 0)} color="bg-blue-50 text-blue-600" />
        <KpiCard icon={TrendingDown} label="Susut Tak Wajar (kg)" value={fmt(b.total_unexplained, 3)} color="bg-red-50 text-red-600" />
        <KpiCard icon={Activity} label="Rata-rata Dressing %" value={fmt(b.avg_dressing_pct, 2) + '%'} color="bg-green-50 text-green-600" />
        <KpiCard icon={ShieldAlert} label="Batch Risiko Tinggi" value={fmt(b.high_risk, 0)} color="bg-orange-50 text-orange-600" />
        <KpiCard icon={AlertTriangle} label="Peringatan Terbuka" value={fmt(a.open, 0)} color="bg-yellow-50 text-yellow-600" />
        <KpiCard icon={XCircle} label="Peringatan Kritis" value={fmt(a.critical, 0)} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch timeline chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={18} /> Lini Masa Batch</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Tidak ada data untuk periode terpilih</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timeline.map((t, i) => {
                const maxLive = Math.max(...timeline.map(x => Number(x.live_weight || 0)), 1);
                const w = (Number(t.live_weight || 0) / maxLive) * 100;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-24 text-gray-500">{t.slaughter_date}</span>
                    <div className="flex-1 bg-gray-100 rounded h-5 relative overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${w}%` }} />
                      <span className="absolute inset-0 flex items-center px-2 text-white font-medium">
                        {fmt(t.batch_count, 0)} batch · {fmt(t.live_weight, 0)} kg hidup
                      </span>
                    </div>
                    {Number(t.high_risk_count) > 0 && (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-medium">{t.high_risk_count} risiko</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alert summary */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Ringkasan Peringatan</h2>
          {alertSummary ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-yellow-50 rounded p-2"><div className="font-bold text-lg">{alertSummary.by_status?.OPEN || 0}</div><div className="text-gray-500">Terbuka</div></div>
                <div className="bg-blue-50 rounded p-2"><div className="font-bold text-lg">{alertSummary.by_status?.ACKNOWLEDGED || 0}</div><div className="text-gray-500">Diketahui</div></div>
                <div className="bg-green-50 rounded p-2"><div className="font-bold text-lg">{alertSummary.by_status?.RESOLVED || 0}</div><div className="text-gray-500">Selesai</div></div>
                <div className="bg-red-50 rounded p-2"><div className="font-bold text-lg">{alertSummary.open_critical || 0}</div><div className="text-gray-500">Kritis</div></div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Berdasarkan Tingkat</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(alertSummary.by_severity || {}).map(([k, v]) => (
                    <span key={k} className={`px-2 py-1 rounded text-xs font-medium ${sevColor(k)}`}>{k}: {v}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Berdasarkan Tipe</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(alertSummary.by_type || {}).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">{k.replace(/_/g, ' ')}: {v}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 py-8 text-center">Tidak ada data peringatan</p>}
        </div>
      </div>

      {/* Top risk operators */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users size={18} /> Operator Risiko Tertinggi</h2>
        {(summary?.top_risk_operators || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Tidak ada operator berisiko tinggi pada periode ini</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Operator</th>
                  <th className="text-center px-3 py-2">Skor</th>
                  <th className="text-center px-3 py-2">Band</th>
                  <th className="text-center px-3 py-2">Batch</th>
                  <th className="text-center px-3 py-2">Susut Tak Wajar (kg)</th>
                  <th className="text-center px-3 py-2">Koreksi</th>
                  <th className="text-center px-3 py-2">Kolusi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.top_risk_operators.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{r.entity_label}</td>
                    <td className="text-center px-3 py-2 font-bold">{fmt(r.score, 1)}</td>
                    <td className="text-center px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${bandColor(r.band)}`}>{r.band}</span></td>
                    <td className="text-center px-3 py-2">{r.batch_count}</td>
                    <td className="text-center px-3 py-2 text-red-600">{fmt(r.unexplained_loss_kg, 3)}</td>
                    <td className="text-center px-3 py-2">{r.correction_count}</td>
                    <td className="text-center px-3 py-2">{r.collusion_flag ? <span className="text-red-600 font-bold">⚠</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent batches */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Package size={18} /> Batch Terbaru</h2>
        {(summary?.recent_batches || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Belum ada batch</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Kode Batch</th>
                  <th className="text-left px-3 py-2">Tanggal</th>
                  <th className="text-center px-3 py-2">Hidup (kg)</th>
                  <th className="text-center px-3 py-2">Karkas (kg)</th>
                  <th className="text-center px-3 py-2">Susut Tak Wajar (kg)</th>
                  <th className="text-center px-3 py-2">Varians</th>
                  <th className="text-center px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.recent_batches.map((b, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{b.batch_code}</td>
                    <td className="px-3 py-2">{b.slaughter_date}</td>
                    <td className="text-center px-3 py-2">{fmt(b.live_weight, 2)}</td>
                    <td className="text-center px-3 py-2">{fmt(b.carcass_weight, 2)}</td>
                    <td className="text-center px-3 py-2 text-red-600">{fmt(b.unexplained_loss, 3)}</td>
                    <td className="text-center px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        b.variance_status === 'HIGH_RISK' ? 'bg-red-100 text-red-700' :
                        b.variance_status === 'UNEXPLAINED' ? 'bg-yellow-100 text-yellow-700' :
                        b.variance_status === 'BALANCED' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{b.variance_status}</span>
                    </td>
                    <td className="text-center px-3 py-2">{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3">
    <div className={`p-2 rounded-lg ${color}`}><Icon size={20} /></div>
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  </div>
);

export default RphDashboardPage;
