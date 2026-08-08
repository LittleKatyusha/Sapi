import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function LedgerPage() {
  const [settings, setSettings] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [coaId, setCoaId] = useState('');
  const [tanggalFrom, setTanggalFrom] = useState(monthStart);
  const [tanggalTo, setTanggalTo] = useState(today);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        setError('');
        const [settingsRes, coaRes] = await Promise.all([
          accountingService.getSettings(),
          accountingService.getCoa(),
        ]);
        const s = settingsRes?.data ?? [];
        const a = (coaRes?.data ?? []).filter((acc) => acc.is_posting);
        setSettings(s);
        setAccounts(a);
        if (s.length) setSettingId(String(s[0].id));
        if (a.length) setCoaId(String(a[0].id));
      } catch (e) {
        setError(e.message || 'Gagal memuat master akunting.');
      }
    };
    loadBootstrap();
  }, []);

  const buildParams = () => ({
    setting_id: Number(settingId),
    coa_id: Number(coaId),
    tanggal_from: tanggalFrom || undefined,
    tanggal_to: tanggalTo || undefined,
  });

  const loadLedger = async () => {
    if (!settingId || !coaId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getGeneralLedger(buildParams());
      setLedger(response?.data ?? null);
    } catch (e) {
      setLedger(null);
      setError(e.message || 'Gagal memuat buku besar.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!settingId || !coaId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportGeneralLedger(buildParams(), format);
      const ext = { csv: 'csv', pdf: 'pdf', xlsx: 'xlsx' }[format] || format;
      triggerDownload(blob, `general-ledger.${ext}`);
    } catch (e) {
      setError(e.message || `Gagal export ${format.toUpperCase()}.`);
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Buku Besar</h1>
        <p className="mt-1 text-sm text-gray-500">Mutasi debit, kredit, dan saldo berjalan dari jurnal yang telah diposting.</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-5 md:items-end md:p-6">
        <label className="text-sm text-gray-700">
          Entitas Akunting
          <select value={settingId} onChange={(e) => setSettingId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Pilih entitas</option>
            {settings.map((s) => <option key={s.id} value={s.id}>{s.nama_perusahaan} ({s.entitas})</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Akun COA
          <select value={coaId} onChange={(e) => setCoaId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Pilih akun</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.kode_akun} — {a.nama_akun}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Dari Tanggal
          <input type="date" value={tanggalFrom} onChange={(e) => setTanggalFrom(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-gray-700">
          Sampai Tanggal
          <input type="date" value={tanggalTo} onChange={(e) => setTanggalTo(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <button type="button" onClick={loadLedger} disabled={loading || !settingId || !coaId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </section>

      {ledger && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Saldo Awal</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{formatNumber(ledger.opening_balance)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Mutasi Debit / Kredit</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{formatNumber(ledger.total_debit)} / {formatNumber(ledger.total_credit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Saldo Akhir</p>
              <p className="mt-1 text-xl font-bold text-indigo-600">{formatNumber(ledger.ending_balance)}</p>
            </div>
          </section>

          {/* Export Buttons */}
          <div className="flex gap-2">
            {['csv', 'pdf', 'xlsx'].map((fmt) => (
              <button key={fmt} type="button" onClick={() => exportReport(fmt)} disabled={exporting}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                {exporting ? '...' : `Export ${fmt.toUpperCase()}`}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Nomor Jurnal</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Kredit</th>
                    <th className="p-3 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(ledger.rows ?? []).map((line, index) => (
                    <tr key={line.journal_id ?? `${line.nomor_jurnal}-${index}`} className="hover:bg-gray-50">
                      <td className="p-3">{line.tanggal}</td>
                      <td className="p-3 font-mono">{line.nomor_jurnal}</td>
                      <td className="p-3">{line.keterangan || '-'}</td>
                      <td className="p-3 text-right">{formatNumber(line.debit)}</td>
                      <td className="p-3 text-right">{formatNumber(line.credit)}</td>
                      <td className="p-3 text-right font-medium">{formatNumber(line.saldo_berjalan)}</td>
                    </tr>
                  ))}
                  {!loading && !(ledger.rows ?? []).length && <tr><td colSpan="6" className="p-8 text-center text-gray-500">Tidak ada mutasi pada rentang tanggal ini.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!ledger && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan akun, lalu klik Tampilkan untuk melihat buku besar.
        </div>
      )}
    </div>
  );
}
