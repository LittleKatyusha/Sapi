import { useEffect, useMemo, useState } from 'react';
import { Printer, Download, FileSpreadsheet, Eye } from 'lucide-react';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';
import SearchableSelect from '../../components/shared/SearchableSelect';
import AccountDetailModal from './AccountDetailModal';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const DetailButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
    title="Lihat rincian transaksi & pengelompokan"
  >
    <Eye className="h-3.5 w-3.5" />
    <span>Detail</span>
  </button>
);

export default function IncomeStatementPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggalFrom, setTanggalFrom] = useState(monthStart);
  const [tanggalTo, setTanggalTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState(null);

  // Opsi entitas untuk SearchableSelect (template selectbox aplikasi).
  const settingOptions = useMemo(() => {
    const options = [];
    if (settings.length > 1) {
      options.push({ value: 'all', label: '★ Semua Entitas (Konsolidasi)' });
    }
    settings.forEach((s) => {
      options.push({ value: String(s.id), label: `${s.nama_perusahaan} (${s.entitas})` });
    });
    return options;
  }, [settings]);

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

  const buildParams = () => ({
    setting_id: settingId === 'all' ? 'all' : Number(settingId),
    tanggal_from: tanggalFrom || undefined,
    tanggal_to: tanggalTo || undefined,
  });

  const loadReport = async () => {
    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getIncomeStatement(buildParams());
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
      const blob = await accountingService.exportIncomeStatement(buildParams(), 'pdf');
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
      const blob = await accountingService.exportIncomeStatement(buildParams(), 'pdf');
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
      const blob = await accountingService.exportIncomeStatement(buildParams(), 'xlsx');
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

  const openDetail = (row, tipe) => setSelectedAccountForDetail({ ...row, tipe });

  const sales = report?.sales ?? null;
  const cogs = report?.cogs ?? null;

  const sectionRow = (label, tone = 'default') => (
    <tr key={`section-${label}`}>
      <td
        colSpan="4"
        className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wide ${
          tone === 'highlight' ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-100 text-gray-700'
        }`}
      >
        {label}
      </td>
    </tr>
  );

  const accountRows = (rows, tipe, negative = false) =>
    (rows ?? []).map((row) => {
      const amount = Number(row.amount || 0);
      const isZero = Math.abs(amount) < 0.01;

      return (
        <tr key={`${tipe}-${row.id}`} className={isZero ? 'text-gray-400' : 'hover:bg-gray-50/60'}>
          <td className="w-20 py-1.5 pl-6 pr-2 font-mono text-xs text-gray-500">{row.kode_akun}</td>
          <td className={`py-1.5 pr-2 text-sm ${isZero ? 'text-gray-400' : 'text-gray-800'}`}>{row.nama_akun}</td>
          <td className="whitespace-nowrap py-1.5 pr-2 text-right font-mono text-sm text-gray-900">
            {negative ? '(' : ''}
            {formatNumber(Math.abs(amount))}
            {negative ? ')' : ''}
          </td>
          <td className="w-20 py-1.5 text-center">
            {!isZero && <DetailButton onClick={() => openDetail(row, tipe)} />}
          </td>
        </tr>
      );
    });

  const totalRow = (label, value, tone = 'total') => {
    const toneClass = {
      total: 'bg-gray-50 font-semibold text-gray-900',
      subtotal: 'bg-gray-100 font-bold text-gray-900',
      highlight: 'bg-indigo-600 font-bold text-white',
      final: 'bg-emerald-600 font-bold text-white',
    }[tone] || 'bg-gray-50 font-semibold text-gray-900';

    return (
      <tr key={`total-${label}`} className={toneClass}>
        <td colSpan="2" className="px-3 py-2 text-sm">{label}</td>
        <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-sm">{formatNumber(value)}</td>
        <td />
      </tr>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Laba Rugi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Penjualan bersih, HPP (pembelian, pemeliharaan hewan, pakan &amp; vitamin, upah), beban operasional, non operasional, dan beban pajak.
          </p>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entitas Akunting</label>
          <SearchableSelect
            options={settingOptions}
            value={settingId}
            onChange={(val) => setSettingId(val ?? '')}
            placeholder="Pilih entitas"
            isSearchable={true}
            isClearable={true}
            accentColor="blue"
            className="text-sm"
          />
        </div>
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

      {report && sales && cogs && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Penjualan Bersih</p>
              <p className="mt-1 text-xl font-bold text-gray-800">{formatNumber(sales.net_sales)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-gray-500">Harga Pokok Penjualan</p>
              <p className="mt-1 text-xl font-bold text-rose-600">{formatNumber(cogs.total)}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Laporan Laba Rugi</h2>
              <p className="text-xs text-gray-500">
                Periode {tanggalFrom || 'awal'} s/d {tanggalTo || 'kini'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <tbody className="divide-y divide-gray-100">
                  {sectionRow('Penjualan')}
                  {accountRows(sales.gross_lines, 'Pendapatan')}
                  {accountRows(sales.return_lines, 'Pendapatan', true)}
                  {accountRows(sales.discount_lines, 'Pendapatan', true)}
                  {totalRow('Penjualan Bersih', sales.net_sales, 'subtotal')}

                  {sectionRow('Harga Pokok Penjualan (HPP)')}
                  {accountRows(cogs.components, 'Beban')}
                  {totalRow('Total Harga Pokok Penjualan', cogs.total, 'subtotal')}

                  {sectionRow('Beban Operasional')}
                  {accountRows(report.operating_expenses, 'Beban')}
                  {totalRow('Total Beban Operasional', report.total_operating_expenses, 'subtotal')}

                  {(report.other_incomes ?? []).length > 0 && (
                    <>
                      {sectionRow('Pendapatan Lain-lain')}
                      {accountRows(report.other_incomes, 'Pendapatan')}
                      {totalRow('Total Pendapatan Lain-lain', report.total_other_income, 'subtotal')}
                    </>
                  )}

                  {(report.non_operating_expenses ?? []).length > 0 && (
                    <>
                      {sectionRow('Beban Non Operasional')}
                      {accountRows(report.non_operating_expenses, 'Beban')}
                      {totalRow('Total Beban Non Operasional', report.total_non_operating_expenses, 'subtotal')}
                    </>
                  )}

                  {sectionRow('Beban Pajak')}
                  {accountRows(report.tax_expenses, 'Beban')}
                  {totalRow('Total Beban Pajak', report.total_tax_expense, 'subtotal')}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedAccountForDetail && (
        <AccountDetailModal
          isOpen={Boolean(selectedAccountForDetail)}
          onClose={() => setSelectedAccountForDetail(null)}
          account={selectedAccountForDetail}
          settingId={settingId}
          settingName={settingId === 'all' ? 'Konsolidasi Semua Entitas' : (settings.find((s) => String(s.id) === String(settingId))?.nama_perusahaan || '')}
          tanggalFrom={tanggalFrom}
          tanggalTo={tanggalTo}
        />
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan rentang tanggal, lalu klik Tampilkan.
        </div>
      )}
    </div>
  );
}
