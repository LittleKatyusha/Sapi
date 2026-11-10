import React, { useEffect, useState, useMemo } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  Search,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Users,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';
import BalanceAccountDetailModal from './BalanceAccountDetailModal';

const today = new Date().toISOString().slice(0, 10);

export default function BalanceSheetPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assets' | 'liabilities' | 'counterparties'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState(null);

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

  // Filter accounts based on search
  const filteredAssets = useMemo(() => {
    if (!report?.assets) return [];
    if (!searchQuery.trim()) return report.assets;
    const q = searchQuery.toLowerCase();
    return report.assets.filter(
      (a) =>
        a.nama_akun?.toLowerCase().includes(q) ||
        a.kode_akun?.toLowerCase().includes(q) ||
        a.sub_kategori?.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  const filteredLiabilities = useMemo(() => {
    if (!report?.liabilities) return [];
    if (!searchQuery.trim()) return report.liabilities;
    const q = searchQuery.toLowerCase();
    return report.liabilities.filter(
      (l) =>
        l.nama_akun?.toLowerCase().includes(q) ||
        l.kode_akun?.toLowerCase().includes(q) ||
        l.sub_kategori?.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  const filteredEquities = useMemo(() => {
    if (!report?.equities) return [];
    if (!searchQuery.trim()) return report.equities;
    const q = searchQuery.toLowerCase();
    return report.equities.filter(
      (e) =>
        e.nama_akun?.toLowerCase().includes(q) ||
        e.kode_akun?.toLowerCase().includes(q) ||
        e.sub_kategori?.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  // Group accounts by sub_kategori for organized display
  const groupAccountsBySubCategory = (accounts) => {
    const groups = {};
    accounts.forEach((acc) => {
      const sub = acc.sub_kategori || 'Lainnya';
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(acc);
    });
    return groups;
  };

  const assetGroups = useMemo(() => groupAccountsBySubCategory(filteredAssets), [filteredAssets]);
  const liabilityGroups = useMemo(() => groupAccountsBySubCategory(filteredLiabilities), [filteredLiabilities]);

  // Ratios & Subtotals
  const subtotals = report?.subtotals || {};
  const ratios = report?.ratios || {};
  const totalEquityCalculated = Number(report?.total_equity || 0) + Number(report?.current_earnings || 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="h-6 w-6 text-indigo-600" />
            Laporan Neraca (Balance Sheet)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Posisi keuangan, analisis likuiditas, dan struktur aset/kewajiban per tanggal.
          </p>
        </div>
        {report && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-2xs disabled:opacity-50 transition-colors"
            >
              <Printer className="h-4 w-4 text-gray-500" />
              <span>{exporting ? 'Memproses...' : 'Cetak PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-2xs disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4 text-gray-500" />
              <span>{exporting ? 'Mengunduh...' : 'Unduh PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-2xs disabled:opacity-50 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{exporting ? 'Mengunduh...' : 'Unduh Excel'}</span>
            </button>
          </div>
        )}
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Filter Section */}
      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-2xs md:grid-cols-3 md:items-end md:p-6">
        <label className="text-sm font-medium text-gray-700">
          Entitas Akunting
          <select
            value={settingId}
            onChange={(e) => setSettingId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
          Posisi Neraca Per Tanggal
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </label>
        <button
          type="button"
          onClick={loadReport}
          disabled={loading || !settingId}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Memuat Data...' : 'Tampilkan Neraca'}
        </button>
      </section>

      {report && (
        <>
          {/* Executive KPI & Health Metrics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Aset</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">Rp {formatNumber(report.total_asset)}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-1.5">
                <span>Lancar: Rp {formatNumber(subtotals.aset_lancar || report.total_asset)}</span>
                {subtotals.aset_tetap > 0 && <span>Tetap: Rp {formatNumber(subtotals.aset_tetap)}</span>}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kewajiban &amp; Ekuitas</span>
              <p className="mt-1 text-2xl font-bold text-gray-900">Rp {formatNumber(report.total_liability_equity)}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-1.5">
                <span>Hutang: Rp {formatNumber(report.total_liability)}</span>
                <span>Ekuitas: Rp {formatNumber(totalEquityCalculated)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Modal Kerja Bersih</span>
              <p
                className={`mt-1 text-2xl font-bold ${
                  (ratios.working_capital ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                Rp {formatNumber(ratios.working_capital ?? 0)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 border-t border-gray-100 pt-1.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    (ratios.working_capital ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {(ratios.working_capital ?? 0) >= 0 ? 'Surplus' : 'Defisit Modal'}
                </span>
                <span>(Aset Lancar - Hutang Lancar)</span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 shadow-2xs ${
                report.is_balanced ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Status Neraca</span>
                {report.is_balanced ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                )}
              </div>
              <p className={`mt-1 text-2xl font-bold ${report.is_balanced ? 'text-emerald-800' : 'text-red-800'}`}>
                {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
              </p>
              <div className="mt-2 text-xs text-gray-600 border-t border-gray-200/60 pt-1.5">
                <span>Rasio Likuiditas: </span>
                <strong className="font-mono text-gray-800">{ratios.current_ratio ? `${ratios.current_ratio}x` : '-'}</strong>
              </div>
            </div>
          </section>

          {/* Toolbar: Navigation Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            {/* Quick Filter Tabs */}
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semua Posisi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('assets')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  activeTab === 'assets' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Aset (Aktiva)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('liabilities')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  activeTab === 'liabilities' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kewajiban &amp; Ekuitas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('counterparties')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'counterparties' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Rincian Rekanan</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama akun..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Tab: Counterparties Subledger Breakdown */}
          {activeTab === 'counterparties' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AR - Piutang per RPH / Debitur */}
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b bg-amber-50/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-700" />
                    <h2 className="font-semibold text-gray-900 text-sm">Piutang Usaha per Rekanan / Debitur</h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {(report.counterparties?.ar ?? []).length} Rekanan
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="p-3 font-semibold">Nama Rekanan / Debitur</th>
                        <th className="p-3 font-semibold">Tipe</th>
                        <th className="p-3 font-semibold text-right">Outstanding (Rp)</th>
                        <th className="p-3 font-semibold text-center">Aktivitas Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(report.counterparties?.ar ?? []).map((cp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="p-3 font-semibold text-gray-900">{cp.counterparty_name}</td>
                          <td className="p-3 text-gray-500 capitalize">{cp.counterparty_type?.replace('_', ' ')}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {formatNumber(cp.outstanding)}
                          </td>
                          <td className="p-3 text-center text-gray-500">{cp.last_activity || '-'}</td>
                        </tr>
                      ))}
                      {!(report.counterparties?.ar ?? []).length && (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-gray-400">
                            Tidak ada saldo piutang berjalan per rekanan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* AP - Hutang per Vendor / Supplier */}
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b bg-rose-50/60 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-rose-700" />
                    <h2 className="font-semibold text-gray-900 text-sm">Hutang Vendor per Supplier / Kreditur</h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-800">
                    {(report.counterparties?.ap ?? []).length} Supplier
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="p-3 font-semibold">Nama Supplier / Vendor</th>
                        <th className="p-3 font-semibold">Tipe</th>
                        <th className="p-3 font-semibold text-right">Outstanding (Rp)</th>
                        <th className="p-3 font-semibold text-center">Aktivitas Terakhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(report.counterparties?.ap ?? []).map((cp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60">
                          <td className="p-3 font-semibold text-gray-900">{cp.counterparty_name}</td>
                          <td className="p-3 text-gray-500 capitalize">{cp.counterparty_type?.replace('_', ' ')}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700">
                            {formatNumber(cp.outstanding)}
                          </td>
                          <td className="p-3 text-center text-gray-500">{cp.last_activity || '-'}</td>
                        </tr>
                      ))}
                      {!(report.counterparties?.ap ?? []).length && (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-gray-400">
                            Tidak ada saldo hutang berjalan per vendor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Statements Tables Grid */}
          {(activeTab === 'all' || activeTab === 'assets' || activeTab === 'liabilities') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Kolom Kiri: ASET */}
              {(activeTab === 'all' || activeTab === 'assets') && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b bg-emerald-50/60 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <h2 className="font-bold text-gray-900 text-sm">ASET (AKTIVA)</h2>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {filteredAssets.length} Akun &bull; Subtotal: Rp {formatNumber(report.total_asset)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="p-2.5 font-semibold w-20">Kode</th>
                          <th className="p-2.5 font-semibold">Nama Akun</th>
                          <th className="p-2.5 font-semibold text-center w-16">Porsi</th>
                          <th className="p-2.5 font-semibold text-right w-36">Jumlah (Rp)</th>
                          <th className="p-2.5 font-semibold text-center w-20">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Object.entries(assetGroups).map(([subCat, accs]) => (
                          <React.Fragment key={subCat}>
                            <tr className="bg-gray-50/80 font-bold text-gray-700">
                              <td colSpan="3" className="p-2 pl-3 text-[11px] uppercase tracking-wider text-indigo-900">
                                &bull; {subCat}
                              </td>
                              <td className="p-2 text-right font-mono text-gray-800 text-[11px]">
                                Rp {formatNumber(accs.reduce((acc, it) => acc + (it.amount || 0), 0))}
                              </td>
                              <td className="p-2" />
                            </tr>
                            {accs.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-2.5 font-mono text-gray-700">{row.kode_akun}</td>
                                <td className="p-2.5 font-medium text-gray-900">{row.nama_akun}</td>
                                <td className="p-2.5 text-center">
                                  {row.percentage > 0 ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                                      {row.percentage}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">
                                  {formatNumber(row.amount)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAccountForDetail({ ...row, tipe: 'Aset' })}
                                    className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                                    title="Lihat rincian transaksi pembentuk saldo"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Detail</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        {!filteredAssets.length && (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-gray-400">
                              Tidak ada data aset yang sesuai pencarian.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
                          <td colSpan="3" className="p-3 text-xs">
                            TOTAL ASET (AKTIVA)
                          </td>
                          <td className="p-3 text-right font-mono text-sm text-emerald-800">
                            Rp {formatNumber(report.total_asset)}
                          </td>
                          <td className="p-3" />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              )}

              {/* Kolom Kanan: KEWAJIBAN & EKUITAS */}
              {(activeTab === 'all' || activeTab === 'liabilities') && (
                <div className="space-y-6">
                  {/* Kewajiban */}
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b bg-amber-50/60 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                        <h2 className="font-bold text-gray-900 text-sm">KEWAJIBAN (HUTANG)</h2>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {filteredLiabilities.length} Akun &bull; Subtotal: Rp {formatNumber(report.total_liability)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2.5 font-semibold w-20">Kode</th>
                            <th className="p-2.5 font-semibold">Nama Akun</th>
                            <th className="p-2.5 font-semibold text-center w-16">Porsi</th>
                            <th className="p-2.5 font-semibold text-right w-36">Jumlah (Rp)</th>
                            <th className="p-2.5 font-semibold text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {Object.entries(liabilityGroups).map(([subCat, accs]) => (
                            <React.Fragment key={subCat}>
                              <tr className="bg-gray-50/80 font-bold text-gray-700">
                                <td colSpan="3" className="p-2 pl-3 text-[11px] uppercase tracking-wider text-amber-900">
                                  &bull; {subCat}
                                </td>
                                <td className="p-2 text-right font-mono text-gray-800 text-[11px]">
                                  Rp {formatNumber(accs.reduce((acc, it) => acc + (it.amount || 0), 0))}
                                </td>
                                <td className="p-2" />
                              </tr>
                              {accs.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="p-2.5 font-mono text-gray-700">{row.kode_akun}</td>
                                  <td className="p-2.5 font-medium text-gray-900">{row.nama_akun}</td>
                                  <td className="p-2.5 text-center">
                                    {row.percentage > 0 ? (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                                        {row.percentage}%
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-semibold text-amber-700">
                                    {formatNumber(row.amount)}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedAccountForDetail({ ...row, tipe: 'Kewajiban' })}
                                      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                                      title="Lihat rincian transaksi pembentuk saldo"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>Detail</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                          {!filteredLiabilities.length && (
                            <tr>
                              <td colSpan="5" className="p-6 text-center text-gray-400">
                                Tidak ada data kewajiban.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
                            <td colSpan="3" className="p-3 text-xs">
                              TOTAL KEWAJIBAN
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-amber-800">
                              Rp {formatNumber(report.total_liability)}
                            </td>
                            <td className="p-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>

                  {/* Ekuitas */}
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b bg-blue-50/60 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                        <h2 className="font-bold text-gray-900 text-sm">EKUITAS (MODAL)</h2>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        Subtotal: Rp {formatNumber(totalEquityCalculated)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/70 text-gray-600 border-b border-gray-200">
                          <tr>
                            <th className="p-2.5 font-semibold w-20">Kode</th>
                            <th className="p-2.5 font-semibold">Nama Akun</th>
                            <th className="p-2.5 font-semibold text-right w-36">Jumlah (Rp)</th>
                            <th className="p-2.5 font-semibold text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredEquities.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-2.5 font-mono text-gray-700">{row.kode_akun}</td>
                              <td className="p-2.5 font-medium text-gray-900">{row.nama_akun}</td>
                              <td className="p-2.5 text-right font-mono font-semibold text-blue-700">
                                {formatNumber(row.amount)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAccountForDetail({ ...row, tipe: 'Modal' })}
                                  className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                                  title="Lihat rincian transaksi pembentuk saldo"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Detail</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {/* Laba Rugi Berjalan row */}
                          <tr className="bg-gray-50/60 font-medium">
                            <td className="p-2.5 font-mono text-gray-500">-</td>
                            <td className="p-2.5 text-gray-800">Laba (Rugi) Periode Berjalan</td>
                            <td
                              className={`p-2.5 text-right font-mono font-semibold ${
                                (report.current_earnings ?? 0) >= 0 ? 'text-blue-700' : 'text-red-600'
                              }`}
                            >
                              {formatNumber(report.current_earnings)}
                            </td>
                            <td className="p-2.5" />
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
                            <td colSpan="2" className="p-3 text-xs">
                              TOTAL EKUITAS
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-blue-800">
                              Rp {formatNumber(totalEquityCalculated)}
                            </td>
                            <td className="p-3" />
                          </tr>
                          <tr className="border-t-2 border-gray-400 bg-indigo-50 font-bold text-indigo-950">
                            <td colSpan="2" className="p-3 text-xs">
                              TOTAL KEWAJIBAN &amp; EKUITAS
                            </td>
                            <td className="p-3 text-right font-mono text-sm text-indigo-900">
                              Rp {formatNumber(report.total_liability_equity)}
                            </td>
                            <td className="p-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Drill-down Modal */}
      {selectedAccountForDetail && (
        <BalanceAccountDetailModal
          isOpen={Boolean(selectedAccountForDetail)}
          onClose={() => setSelectedAccountForDetail(null)}
          account={selectedAccountForDetail}
          settingId={settingId}
          settingName={settings.find((s) => String(s.id) === String(settingId))?.nama_perusahaan || ''}
          tanggal={tanggal}
        />
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas akunting dan per tanggal, lalu klik Tampilkan Neraca.
        </div>
      )}
    </div>
  );
}
