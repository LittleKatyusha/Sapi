import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  Building,
  PiggyBank
} from 'lucide-react';
import accountingService from '../../services/accountingService';

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString()
  .slice(0, 10);

export default function CashFlowPage() {
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
      const response = await accountingService.getCashFlow({
        setting_id: Number(settingId),
        tanggal_from: tanggalFrom || undefined,
        tanggal_to: tanggalTo || undefined,
      });
      setReport(response?.data ?? null);
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat laporan arus kas.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    const now = new Date();
    if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setTanggalFrom(start);
      setTanggalTo(today);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setTanggalFrom(start);
      setTanggalTo(end);
    } else if (preset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      setTanggalFrom(start);
      setTanggalTo(today);
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return (num < 0 ? '- ' : '') + 'Rp ' + Math.abs(num).toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      ['Kategori', 'Kode Akun', 'Nama Akun', 'Arus Kas (Rp)'].join(','),
      ['"Saldo Kas Awal"', '""', '""', `"${report.opening_balance}"`].join(','),
      ['"--- AKTIVITAS OPERASI ---"', '""', '""', '""'].join(','),
      ...(report.operations.inflows || []).map((r) =>
        ['"Operasi - Penerimaan"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${r.amount}"`].join(',')
      ),
      ...(report.operations.outflows || []).map((r) =>
        ['"Operasi - Pengeluaran"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${r.amount}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Operasi"', '""', '""', `"${report.operations.net}"`].join(','),
      ['"--- AKTIVITAS INVESTASI ---"', '""', '""', '""'].join(','),
      ...(report.investing.inflows || []).map((r) =>
        ['"Investasi - Penerimaan"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${r.amount}"`].join(',')
      ),
      ...(report.investing.outflows || []).map((r) =>
        ['"Investasi - Pengeluaran"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${r.amount}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Investasi"', '""', '""', `"${report.investing.net}"`].join(','),
      ['"--- AKTIVITAS PENDANAAN ---"', '""', '""', '""'].join(','),
      ...(report.financing.inflows || []).map((r) =>
        ['"Pendanaan - Penerimaan"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${r.amount}"`].join(',')
      ),
      ...(report.financing.outflows || []).map((r) =>
        ['"Pendanaan - Pengeluaran"', `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${r.amount}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Pendanaan"', '""', '""', `"${report.financing.net}"`].join(','),
      ['"Kenaikan (Penurunan) Kas Bersih"', '""', '""', `"${report.net_change}"`].join(','),
      ['"Saldo Kas Akhir"', '""', '""', `"${report.ending_balance}"`].join(','),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan-arus-kas-${tanggalFrom}-${tanggalTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasSectionData = (section) =>
    (section.inflows && section.inflows.length > 0) ||
    (section.outflows && section.outflows.length > 0) ||
    Math.abs(Number(section.net || 0)) > 0.01;

  const ActivitySection = ({ title, icon: Icon, sectionData, badgeColor }) => {
    const hasInflows = sectionData.inflows && sectionData.inflows.length > 0;
    const hasOutflows = sectionData.outflows && sectionData.outflows.length > 0;
    const isNetPositive = sectionData.net >= 0;

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${badgeColor}`} />
            <h2 className="font-semibold text-gray-800">{title}</h2>
          </div>
          <span
            className={`text-sm font-bold ${
              isNetPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(sectionData.net)}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Arus Kas Masuk */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-green-700">
              <span className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> Arus Kas Masuk (Penerimaan)
              </span>
              <span>{formatCurrency(sectionData.total_inflows)}</span>
            </div>
            {hasInflows ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {sectionData.inflows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="py-2 px-3 font-mono text-xs text-gray-500 w-24">
                          {row.kode_akun}
                        </td>
                        <td className="py-2 px-3 text-gray-800">{row.nama_akun}</td>
                        <td className="py-2 px-3 text-right font-medium text-green-600">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-1 px-3 text-xs italic text-gray-400">Tidak ada arus kas masuk.</p>
            )}
          </div>

          {/* Arus Kas Keluar */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-700">
              <span className="flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4" /> Arus Kas Keluar (Pengeluaran)
              </span>
              <span>{formatCurrency(sectionData.total_outflows)}</span>
            </div>
            {hasOutflows ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {sectionData.outflows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/60">
                        <td className="py-2 px-3 font-mono text-xs text-gray-500 w-24">
                          {row.kode_akun}
                        </td>
                        <td className="py-2 px-3 text-gray-800">{row.nama_akun}</td>
                        <td className="py-2 px-3 text-right font-medium text-red-600">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-1 px-3 text-xs italic text-gray-400">Tidak ada arus kas keluar.</p>
            )}
          </div>
        </div>

        <div className="border-t bg-gray-50/50 px-4 py-2.5 flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Arus Kas Bersih {title}</span>
          <span className={`font-bold ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(sectionData.net)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Arus Kas (Cash Flow)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Penerimaan dan pengeluaran kas berdasarkan aktivitas operasi, investasi, dan pendanaan.
          </p>
        </div>
        {report && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Printer className="h-4 w-4" /> Cetak
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Card */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <label className="text-sm font-medium text-gray-700">
            Entitas Akunting
            <select
              value={settingId}
              onChange={(e) => setSettingId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Pilih entitas</option>
              {settings.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_perusahaan} ({s.entitas})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Dari Tanggal
            <input
              type="date"
              value={tanggalFrom}
              onChange={(e) => setTanggalFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
            </input>
          </label>
          <label className="text-sm font-medium text-gray-700">
            Sampai Tanggal
            <input
              type="date"
              value={tanggalTo}
              onChange={(e) => setTanggalTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
            </input>
          </label>
          <button
            type="button"
            onClick={loadReport}
            disabled={loading || !settingId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm h-10"
          >
            {loading ? 'Memuat...' : 'Tampilkan Laporan'}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 pt-2 border-t text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>Preset Periode:</span>
          <button
            type="button"
            onClick={() => applyPreset('this_month')}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 text-gray-700"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => applyPreset('last_month')}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 text-gray-700"
          >
            Bulan Lalu
          </button>
          <button
            type="button"
            onClick={() => applyPreset('this_year')}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 text-gray-700"
          >
            Tahun Berjalan
          </button>
        </div>
      </section>

      {/* Report Data */}
      {report && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Saldo Awal</span>
                <Wallet className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(report.opening_balance)}</p>
              <p className="mt-0.5 text-xs text-gray-400">Kas & bank sebelum periode</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Operasi</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className={`mt-2 text-lg font-bold ${report.operations.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(report.operations.net)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Aktivitas operasional</p>
            </div>

            {hasSectionData(report.investing) && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Investasi</span>
                  <Building className="h-4 w-4 text-amber-500" />
                </div>
                <p className={`mt-2 text-lg font-bold ${report.investing.net >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatCurrency(report.investing.net)}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Aset tetap & inventaris</p>
              </div>
            )}

            {hasSectionData(report.financing) && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Pendanaan</span>
                  <PiggyBank className="h-4 w-4 text-purple-500" />
                </div>
                <p className={`mt-2 text-lg font-bold ${report.financing.net >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {formatCurrency(report.financing.net)}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Modal & pinjaman</p>
              </div>
            )}

            <div className={`rounded-xl border p-4 shadow-sm ${report.is_balanced ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-600">Saldo Akhir</span>
                {report.is_balanced ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(report.ending_balance)}</p>
              <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${report.is_balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
              </span>
            </div>
          </section>

          {/* 3 Detail Activity Sections */}
          <section className="space-y-4">
            <ActivitySection
              title="Aktivitas Operasi"
              icon={TrendingUp}
              badgeColor="text-emerald-600"
              sectionData={report.operations}
            />

            {hasSectionData(report.investing) && (
              <ActivitySection
                title="Aktivitas Investasi"
                icon={Building}
                badgeColor="text-amber-600"
                sectionData={report.investing}
              />
            )}

            {hasSectionData(report.financing) && (
              <ActivitySection
                title="Aktivitas Pendanaan"
                icon={PiggyBank}
                badgeColor="text-purple-600"
                sectionData={report.financing}
              />
            )}
          </section>

          {/* Reconciliation & Account Breakdown */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Reconciliation Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-800">
                Rekonsiliasi Perubahan Kas
              </h3>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Saldo Kas & Setara Kas Awal</span>
                  <span className="font-mono font-medium">{formatCurrency(report.opening_balance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Arus Kas Bersih dari Aktivitas Operasi</span>
                  <span className={`font-mono font-medium ${report.operations.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.operations.net)}
                  </span>
                </div>
                {hasSectionData(report.investing) && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Arus Kas Bersih dari Aktivitas Investasi</span>
                    <span className={`font-mono font-medium ${report.investing.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(report.investing.net)}
                    </span>
                  </div>
                )}
                {hasSectionData(report.financing) && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-600">Arus Kas Bersih dari Aktivitas Pendanaan</span>
                    <span className={`font-mono font-medium ${report.financing.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(report.financing.net)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t-2 border-gray-200 font-bold bg-gray-50 px-2 rounded">
                  <span className="text-gray-800">Kenaikan (Penurunan) Kas Bersih</span>
                  <span className={`font-mono ${report.net_change >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(report.net_change)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 font-bold bg-indigo-50/60 px-2 rounded text-indigo-950">
                  <span>Saldo Kas & Setara Kas Akhir (Terhitung)</span>
                  <span className="font-mono">{formatCurrency(report.calculated_ending_balance)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs text-gray-500 px-2">
                  <span>Saldo Kas & Setara Kas di Buku Besar (Neraca)</span>
                  <span className="font-mono">{formatCurrency(report.ending_balance)}</span>
                </div>
              </div>
            </div>

            {/* Account Breakdown Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <h3 className="border-b bg-gray-50 px-4 py-3 font-semibold text-gray-800">
                Rincian Saldo Kas & Bank
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50/60 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Kode</th>
                      <th className="py-2.5 px-4 font-medium">Nama Rekening / Akun</th>
                      <th className="py-2.5 px-4 text-right font-medium">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report.accounts || []).map((acc) => (
                      <tr key={acc.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-mono text-xs text-gray-500">{acc.kode_akun}</td>
                        <td className="py-2.5 px-4 text-gray-800">{acc.nama_akun}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                          {formatCurrency(acc.saldo)}
                        </td>
                      </tr>
                    ))}
                    {(!report.accounts || report.accounts.length === 0) && (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-sm text-gray-400">
                          Belum ada akun kas/bank terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="2" className="py-3 px-4 text-gray-800">Total Kas & Bank</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-900">
                        {formatCurrency(report.ending_balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
