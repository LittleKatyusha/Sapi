import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const today = new Date().toISOString().slice(0, 10);

export default function BalanceSheetPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError('');
        const response = await accountingService.getSettings();
        const loadedSettings = response?.data ?? [];
        setSettings(loadedSettings);

        if (loadedSettings.length) {
          setSettingId(String(loadedSettings[0].id));
        }
      } catch (exception) {
        setError(exception.message || 'Gagal memuat master akunting.');
      }
    };

    loadSettings();
  }, []);

  const loadReport = async () => {
    if (!settingId) return;

    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getBalanceSheet({
        setting_id: Number(settingId),
        tanggal,
      });
      setReport(response?.data ?? null);
    } catch (exception) {
      setReport(null);
      setError(exception.message || 'Gagal memuat laporan neraca.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  const AccountTable = ({ title, rows, emptyText, footer }) => (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="border-b bg-gray-50 p-3 font-semibold text-gray-800">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="p-3 font-mono">{row.kode_akun}</td>
                <td className="p-3">{row.nama_akun}</td>
                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">{emptyText}</td>
              </tr>
            )}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t bg-gray-100 font-bold">
                <td colSpan="2" className="p-3">{footer.label}</td>
                <td className="p-3 text-right">{formatNumber(footer.amount)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Neraca</h1>
        <p className="mt-1 text-sm text-gray-500">
          Posisi aset, kewajiban, dan ekuitas pada tanggal tertentu.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3 md:items-end md:p-6">
        <label className="text-sm text-gray-700">
          Entitas Akunting
          <select
            value={settingId}
            onChange={(event) => setSettingId(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">Pilih entitas</option>
            {settings.map((setting) => (
              <option key={setting.id} value={setting.id}>
                {setting.nama_perusahaan} ({setting.entitas})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-gray-700">
          Per Tanggal
          <input
            required
            type="date"
            value={tanggal}
            onChange={(event) => setTanggal(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>

        <button
          type="button"
          onClick={loadReport}
          disabled={loading || !settingId || !tanggal}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </section>

      {report && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Total Aset</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{formatNumber(report.total_asset)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Total Kewajiban & Ekuitas</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{formatNumber(report.total_liability_equity)}</p>
            </div>
            <div className={`rounded-xl border p-4 shadow-sm ${report.is_balanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs font-medium uppercase text-gray-500">Status Neraca</p>
              <p className={`mt-1 text-xl font-bold ${report.is_balanced ? 'text-green-700' : 'text-red-700'}`}>
                {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AccountTable
              title="Aset"
              rows={report.assets ?? []}
              emptyText="Tidak ada aset."
              footer={{ label: 'TOTAL ASET', amount: report.total_asset }}
            />

            <div className="space-y-6">
              <AccountTable
                title="Kewajiban"
                rows={report.liabilities ?? []}
                emptyText="Tidak ada kewajiban."
                footer={{ label: 'TOTAL KEWAJIBAN', amount: report.total_liability }}
              />

              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <h2 className="border-b bg-gray-50 p-3 font-semibold text-gray-800">Ekuitas</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y">
                      {(report.equities ?? []).map((row) => (
                        <tr key={row.id}>
                          <td className="p-3 font-mono">{row.kode_akun}</td>
                          <td className="p-3">{row.nama_akun}</td>
                          <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                        </tr>
                      ))}
                      {!(report.equities ?? []).length && (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-gray-500">Tidak ada ekuitas.</td>
                        </tr>
                      )}
                      <tr className="bg-gray-50">
                        <td className="p-3 font-mono">-</td>
                        <td className="p-3">Laba (Rugi) Berjalan</td>
                        <td className="p-3 text-right">{formatNumber(report.current_earnings)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-gray-100 font-bold">
                        <td colSpan="2" className="p-3">TOTAL EKUITAS</td>
                        <td className="p-3 text-right">{formatNumber(Number(report.total_equity || 0) + Number(report.current_earnings || 0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}