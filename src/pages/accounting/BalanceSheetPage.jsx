import { useEffect, useState } from 'react';
import { Printer, Download, FileSpreadsheet } from 'lucide-react';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';

const today = new Date().toISOString().slice(0, 10);

export default function BalanceSheetPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggal, setTanggal] = useState(today);
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
      const response = await accountingService.getBalanceSheet({
        setting_id: Number(settingId),
        tanggal,
      });
      setReport(response?.data ?? null);
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat laporan neraca.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!settingId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportBalanceSheet(
        {
          setting_id: Number(settingId),
          tanggal,
        },
        'pdf'
      );
      const fileUrl = URL.createObjectURL(blob);
      const printWindow = window.open(fileUrl, '_blank');
      if (!printWindow) {
        await downloadPdf(blob, `laporan-neraca-${tanggal || 'kini'}.pdf`);
      }
    } catch (e) {
      setError(e.message || 'Gagal mencetak PDF laporan neraca.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!settingId) return;
    try {
      setExporting(true);
      setError('');
      const blob = await accountingService.exportBalanceSheet(
        {
          setting_id: Number(settingId),
          tanggal,
        },
        'pdf'
      );
      await downloadPdf(blob, `laporan-neraca-${tanggal || 'kini'}.pdf`);
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
      const blob = await accountingService.exportBalanceSheet(
        {
          setting_id: Number(settingId),
          tanggal,
        },
        'xlsx'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-neraca-${tanggal || 'kini'}.xlsx`;
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
            {!rows.length && <tr><td colSpan="3" className="p-4 text-center text-gray-500">{emptyText}</td></tr>}
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Neraca</h1>
          <p className="mt-1 text-sm text-gray-500">Posisi aset, kewajiban, dan ekuitas pada tanggal tertentu.</p>
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

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3 md:items-end md:p-6">
        <label className="text-sm text-gray-700">
          Entitas Akunting
          <select value={settingId} onChange={(e) => setSettingId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Pilih entitas</option>
            {settings.map((s) => <option key={s.id} value={s.id}>{s.nama_perusahaan} ({s.entitas})</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Per Tanggal
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <button type="button" onClick={loadReport} disabled={loading || !settingId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
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
                      {!(report.equities ?? []).length && <tr><td colSpan="3" className="p-4 text-center text-gray-500">Tidak ada ekuitas.</td></tr>}
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

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan tanggal, lalu klik Tampilkan.
        </div>
      )}
    </div>
  );
}
