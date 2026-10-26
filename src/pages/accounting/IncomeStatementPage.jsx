import { useEffect, useState } from 'react';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function IncomeStatementPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggalFrom, setTanggalFrom] = useState(monthStart);
  const [tanggalTo, setTanggalTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      const response = await accountingService.getIncomeStatement({
        setting_id: Number(settingId),
        tanggal_from: tanggalFrom || undefined,
        tanggal_to: tanggalTo || undefined,
      });
      setReport(response?.data ?? null);
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat laporan laba rugi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!settingId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportIncomeStatement(
        {
          setting_id: Number(settingId),
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        },
        'pdf'
      );
      const fileUrl = URL.createObjectURL(blob);
      const printWindow = window.open(fileUrl, '_blank');
      if (!printWindow) {
        await downloadPdf(blob, `laporan-laba-rugi-${tanggalFrom || 'awal'}-sd-${tanggalTo || 'kini'}.pdf`);
      }
    } catch (e) {
      setError(e.message || 'Gagal mencetak PDF laporan laba rugi.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!settingId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportIncomeStatement(
        {
          setting_id: Number(settingId),
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        },
        'pdf'
      );
      await downloadPdf(blob, `laporan-laba-rugi-${tanggalFrom || 'awal'}-sd-${tanggalTo || 'kini'}.pdf`);
    } catch (e) {
      setError(e.message || 'Gagal mengunduh cetakan PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!settingId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportIncomeStatement(
        {
          setting_id: Number(settingId),
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        },
        'xlsx'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-laba-rugi-${tanggalFrom || 'awal'}-sd-${tanggalTo || 'kini'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Gagal mengunduh file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Laba Rugi</h1>
          <p className="mt-1 text-sm text-gray-500">Ringkasan pendapatan, beban, dan laba (rugi) bersih periode berjalan.</p>
        </div>
        {report && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-gray-500" />
              <span>{exporting ? 'Memproses...' : 'Cetak PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-gray-500" />
              <span>{exporting ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{exporting ? 'Mengunduh...' : 'Unduh Excel'}</span>
            </button>
          </div>
        )}
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
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Total Pendapatan</p>
              <p className="mt-1 text-xl font-bold text-green-600">{formatNumber(report.total_revenue)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Total Beban</p>
              <p className="mt-1 text-xl font-bold text-red-600">{formatNumber(report.total_expense)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Laba (Rugi) Bersih</p>
              <p className="mt-1 text-xl font-bold text-indigo-600">{formatNumber(report.net_income)}</p>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b bg-gray-50 p-3 font-semibold text-gray-800">Pendapatan</h2>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y">
                  {(report.revenues ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="p-3 font-mono">{row.kode_akun}</td>
                      <td className="p-3">{row.nama_akun}</td>
                      <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                    </tr>
                  ))}
                  {!(report.revenues ?? []).length && <tr><td colSpan="3" className="p-4 text-center text-gray-500">Tidak ada pendapatan.</td></tr>}
                </tbody>
              </table>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b bg-gray-50 p-3 font-semibold text-gray-800">Beban</h2>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y">
                  {(report.expenses ?? []).map((row) => (
                    <tr key={row.id}>
                      <td className="p-3 font-mono">{row.kode_akun}</td>
                      <td className="p-3">{row.nama_akun}</td>
                      <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                    </tr>
                  ))}
                  {!(report.expenses ?? []).length && <tr><td colSpan="3" className="p-4 text-center text-gray-500">Tidak ada beban.</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan rentang tanggal, lalu klik Tampilkan.
        </div>
      )}
    </div>
  );
}
