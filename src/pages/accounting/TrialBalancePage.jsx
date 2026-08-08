import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function TrialBalancePage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggalFrom, setTanggalFrom] = useState(monthStart);
  const [tanggalTo, setTanggalTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError('');
        const response = await accountingService.getSettings();
        const s = response?.data ?? [];
        setSettings(s);
        if (s.length) setSettingId(String(s[0].id));
      } catch (e) {
        setError(e.message || 'Gagal memuat master akunting.');
      }
    };
    loadSettings();
  }, []);

  const loadReport = async () => {
    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getTrialBalance({
        setting_id: Number(settingId),
        tanggal_from: tanggalFrom || undefined,
        tanggal_to: tanggalTo || undefined,
      });
      setReport(response?.data ?? null);
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat neraca saldo.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Neraca Saldo</h1>
        <p className="mt-1 text-sm text-gray-500">Keseimbangan saldo debit dan kredit seluruh Chart of Accounts.</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4 md:items-end md:p-6">
        <label className="text-sm text-gray-700">
          Entitas Akunting
          <select value={settingId} onChange={(e) => setSettingId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Pilih entitas</option>
            {settings.map((s) => <option key={s.id} value={s.id}>{s.nama_perusahaan} ({s.entitas})</option>)}
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
        <button type="button" onClick={loadReport} disabled={loading || !settingId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </section>

      {report && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Kode Akun</th>
                  <th className="p-3">Nama Akun</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(report.accounts ?? []).map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono">{account.kode_akun}</td>
                    <td className="p-3">{account.nama_akun}</td>
                    <td className="p-3 text-right">{formatNumber(account.debit)}</td>
                    <td className="p-3 text-right">{formatNumber(account.credit)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-gray-50 font-bold">
                  <td colSpan="2" className="p-3 text-right">Total</td>
                  <td className="p-3 text-right">{formatNumber(report.total_debit)}</td>
                  <td className="p-3 text-right">{formatNumber(report.total_credit)}</td>
                </tr>
                <tr className="bg-gray-100 text-xs font-semibold">
                  <td colSpan="4" className="p-3 text-center">
                    Status:{' '}
                    <span className={report.is_balanced ? 'text-green-700' : 'text-red-700'}>
                      {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan rentang tanggal, lalu klik Tampilkan.
        </div>
      )}
    </div>
  );
}
