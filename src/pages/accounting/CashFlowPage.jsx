import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Printer,
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  Building,
  PiggyBank,
  Eye,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import accountingService from '../../services/accountingService';

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const now = new Date();
const todayStr = formatLocalDate(now);
const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

export default function CashFlowPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggalFrom, setTanggalFrom] = useState(monthStartStr);
  const [tanggalTo, setTanggalTo] = useState(todayStr);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Drilldown modal state
  const [selectedAccountModal, setSelectedAccountModal] = useState(null);

  // Expanded groups state: key = `${sectionTitle}-${direction}-${groupLabel}`
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
    const curr = new Date();
    if (preset === 'this_month') {
      setTanggalFrom(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-01`);
      setTanggalTo(formatLocalDate(curr));
    } else if (preset === 'last_month') {
      const lm = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
      const lastDay = new Date(curr.getFullYear(), curr.getMonth(), 0).getDate();
      const lmMonth = String(lm.getMonth() + 1).padStart(2, '0');
      setTanggalFrom(`${lm.getFullYear()}-${lmMonth}-01`);
      setTanggalTo(`${lm.getFullYear()}-${lmMonth}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'this_year') {
      setTanggalFrom(`${curr.getFullYear()}-01-01`);
      setTanggalTo(formatLocalDate(curr));
    }
  };

  // Uniform whole Rupiah without decimals (PSAK requirement)
  const formatCurrency = (value) => {
    const num = Math.round(Number(value || 0));
    return (num < 0 ? '- ' : '') + 'Rp ' + Math.abs(num).toLocaleString('id-ID');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;
    const lines = [
      ['Kategori', 'Sub-Kategori / Kelompok', 'Kode Akun', 'Nama Akun', 'Arus Kas (Rp)'].join(','),
      ['"Saldo Kas Awal"', '""', '""', '""', `"${Math.round(report.opening_balance)}"`].join(','),
      ['"--- AKTIVITAS OPERASI ---"', '""', '""', '""', '""'].join(','),
      ...(report.operations.inflows || []).map((r) =>
        ['"Operasi - Penerimaan"', `"${r.group_label || 'Penerimaan'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${Math.round(r.amount)}"`].join(',')
      ),
      ...(report.operations.outflows || []).map((r) =>
        ['"Operasi - Pengeluaran"', `"${r.group_label || 'Pengeluaran'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${Math.round(r.amount)}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Operasi"', '""', '""', '""', `"${Math.round(report.operations.net)}"`].join(','),
      ['"--- AKTIVITAS INVESTASI ---"', '""', '""', '""', '""'].join(','),
      ...(report.investing.inflows || []).map((r) =>
        ['"Investasi - Penerimaan"', `"${r.group_label || 'Penerimaan'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${Math.round(r.amount)}"`].join(',')
      ),
      ...(report.investing.outflows || []).map((r) =>
        ['"Investasi - Pengeluaran"', `"${r.group_label || 'Pengeluaran'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${Math.round(r.amount)}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Investasi"', '""', '""', '""', `"${Math.round(report.investing.net)}"`].join(','),
      ['"--- AKTIVITAS PENDANAAN ---"', '""', '""', '""', '""'].join(','),
      ...(report.financing.inflows || []).map((r) =>
        ['"Pendanaan - Penerimaan"', `"${r.group_label || 'Penerimaan'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"${Math.round(r.amount)}"`].join(',')
      ),
      ...(report.financing.outflows || []).map((r) =>
        ['"Pendanaan - Pengeluaran"', `"${r.group_label || 'Pengeluaran'}"`, `"${r.kode_akun}"`, `"${r.nama_akun}"`, `"-${Math.round(r.amount)}"`].join(',')
      ),
      ['"Total Bersih Aktivitas Pendanaan"', '""', '""', '""', `"${Math.round(report.financing.net)}"`].join(','),
      ['"Kenaikan (Penurunan) Kas Bersih"', '""', '""', '""', `"${Math.round(report.net_change)}"`].join(','),
      ['"Saldo Kas Akhir"', '""', '""', '""', `"${Math.round(report.ending_balance)}"`].join(','),
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

  // Grouped transaction renderer with collapsible constituent accounts & journal drill-down
  const TransactionGroupBlock = ({ sectionTitle, direction, groups, fallbackItems, totalAmount, isOutflow }) => {
    // If backend grouped_inflows/outflows provided, use it; otherwise build from fallbackItems
    let displayGroups = groups;
    if (!displayGroups || displayGroups.length === 0) {
      if (fallbackItems && fallbackItems.length > 0) {
        const map = {};
        fallbackItems.forEach((item) => {
          const g = item.group_label || (isOutflow ? 'Pengeluaran Operasional' : 'Penerimaan Operasional');
          if (!map[g]) map[g] = { label: g, total: 0, accounts: [] };
          map[g].total += item.amount;
          map[g].accounts.push(item);
        });
        displayGroups = Object.values(map);
      } else {
        displayGroups = [];
      }
    }

    const hasData = displayGroups.length > 0;

    return (
      <div className="space-y-2">
        <div className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider ${isOutflow ? 'text-red-700' : 'text-green-700'}`}>
          <span className="flex items-center gap-1.5">
            {isOutflow ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            {isOutflow ? 'Arus Kas Keluar (Pengeluaran)' : 'Arus Kas Masuk (Penerimaan)'}
          </span>
          <span className="font-mono">{formatCurrency(totalAmount)}</span>
        </div>

        {hasData ? (
          <div className="rounded-lg border border-gray-100 divide-y divide-gray-100 bg-gray-50/30 overflow-hidden">
            {displayGroups.map((grp) => {
              const groupKey = `${sectionTitle}-${direction}-${grp.label}`;
              const isExpanded = expandedGroups[groupKey] !== false; // default open

              return (
                <div key={grp.label} className="bg-white">
                  {/* Group Header (Business Transaction Label) */}
                  <div
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50/80 transition select-none"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm text-gray-800">{grp.label}</span>
                      <span className="text-xs text-gray-400">({grp.accounts.length} akun)</span>
                    </div>
                    <span className={`font-mono text-sm font-semibold ${isOutflow ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(grp.total)}
                    </span>
                  </div>

                  {/* Constituent Accounts Table */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/40 px-3 py-2">
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-gray-100">
                          {grp.accounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-white/80 transition">
                              <td className="py-1.5 px-2 font-mono text-gray-500 w-24">
                                {acc.kode_akun}
                              </td>
                              <td className="py-1.5 px-2 text-gray-700">
                                {acc.nama_akun}
                              </td>
                              <td className={`py-1.5 px-2 text-right font-mono font-medium ${isOutflow ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(acc.amount)}
                              </td>
                              <td className="py-1.5 px-2 text-right w-24">
                                {acc.journals && acc.journals.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAccountModal({
                                        ...acc,
                                        group_label: grp.label,
                                        isOutflow,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition"
                                  >
                                    <Eye className="h-3 w-3" /> Jurnal ({acc.journals.length})
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-2 px-3 text-xs italic text-gray-400 bg-gray-50 rounded">
            Tidak ada transaksi kas pada periode ini.
          </p>
        )}
      </div>
    );
  };

  // Activity Section (always rendered explicitly per PSAK 2)
  const ActivitySection = ({ title, icon: Icon, sectionData, badgeColor }) => {
    const isNetPositive = sectionData.net >= 0;

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${badgeColor}`} />
            <h2 className="font-semibold text-gray-800">{title}</h2>
          </div>
          <span className={`text-sm font-bold font-mono ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(sectionData.net)}
          </span>
        </div>

        <div className="p-4 space-y-5">
          <TransactionGroupBlock
            sectionTitle={title}
            direction="inflow"
            groups={sectionData.grouped_inflows}
            fallbackItems={sectionData.inflows}
            totalAmount={sectionData.total_inflows}
            isOutflow={false}
          />

          <TransactionGroupBlock
            sectionTitle={title}
            direction="outflow"
            groups={sectionData.grouped_outflows}
            fallbackItems={sectionData.outflows}
            totalAmount={sectionData.total_outflows}
            isOutflow={true}
          />
        </div>

        <div className="border-t bg-gray-50/70 px-4 py-2.5 flex justify-between items-center text-sm">
          <span className="font-medium text-gray-700">Arus Kas Bersih {title}</span>
          <span className={`font-bold font-mono ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
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
            Metode Langsung (Direct Method) sesuai PSAK 2: Aktivitas Operasi, Investasi, dan Pendanaan.
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
            />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Sampai Tanggal
            <input
              type="date"
              value={tanggalTo}
              onChange={(e) => setTanggalTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
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
            Tahun Berjalan (01 Jan)
          </button>
        </div>
      </section>

      {/* Negative Cash Alert Banner */}
      {report && (report.ending_balance < 0 || report.is_negative_cash) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-amber-950">
                Peringatan: Saldo Kas Akhir Negatif ({formatCurrency(report.ending_balance)})
              </p>
              <p className="text-amber-800 leading-relaxed">
                Secara fisik, uang kas riil tidak mungkin minus. Laporan ini cocok secara matematis dengan buku besar, namun posisi saldo kas negatif mengindikasikan adanya transaksi yang belum dicatat:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-xs text-amber-900 pt-1">
                <li><strong>Saldo Awal Belum Masuk:</strong> Saldo kas/bank per awal periode belum diinput lewat jurnal pembuka (<span className="font-mono">Kas D / Modal C</span>).</li>
                <li><strong>Sumber Dana Vendor Belum Dicatat:</strong> Pengeluaran vendor Rp 2,62 M kemungkinan dibayar dari setoran modal, pinjaman, atau rekening bank lain yang belum masuk jurnal penerimaannya.</li>
                <li><strong>Salah Akun Kas:</strong> Periksa apakah pengeluaran dibebankan ke akun <span className="font-mono">1010 Kas</span> padahal riilnya keluar dari bank lain.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
              <p className="mt-2 text-lg font-bold font-mono text-gray-900">{formatCurrency(report.opening_balance)}</p>
              <p className="mt-0.5 text-xs text-gray-400">Kas & bank sebelum periode</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Operasi</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className={`mt-2 text-lg font-bold font-mono ${report.operations.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(report.operations.net)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Aktivitas operasional</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Investasi</span>
                <Building className="h-4 w-4 text-amber-500" />
              </div>
              <p className={`mt-2 text-lg font-bold font-mono ${report.investing.net >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatCurrency(report.investing.net)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Aset tetap & peralatan</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-500">Arus Kas Pendanaan</span>
                <PiggyBank className="h-4 w-4 text-purple-500" />
              </div>
              <p className={`mt-2 text-lg font-bold font-mono ${report.financing.net >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(report.financing.net)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Modal & pinjaman</p>
            </div>

            <div className={`rounded-xl border p-4 shadow-sm ${report.is_balanced ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-gray-600">Saldo Akhir</span>
                {report.is_balanced ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="mt-2 text-lg font-bold font-mono text-gray-900">{formatCurrency(report.ending_balance)}</p>
              <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${report.is_balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {report.is_balanced ? 'Sesuai Buku Besar' : 'Selisih Terdeteksi'}
              </span>
            </div>
          </section>

          {/* 3 Explicit PSAK 2 Detail Activity Sections */}
          <section className="space-y-4">
            <ActivitySection
              title="Aktivitas Operasi"
              icon={TrendingUp}
              badgeColor="text-emerald-600"
              sectionData={report.operations}
            />

            <ActivitySection
              title="Aktivitas Investasi"
              icon={Building}
              badgeColor="text-amber-600"
              sectionData={report.investing}
            />

            <ActivitySection
              title="Aktivitas Pendanaan"
              icon={PiggyBank}
              badgeColor="text-purple-600"
              sectionData={report.financing}
            />
          </section>

          {/* Reconciliation & Account Breakdown */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Reconciliation Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h3 className="font-semibold text-gray-800">
                  Rekonsiliasi Perubahan Kas
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${report.is_balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {report.is_balanced ? 'Selisih: Rp 0' : `Selisih: ${formatCurrency(report.variance)}`}
                </span>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Saldo Kas & Setara Kas Awal</span>
                  <span className="font-mono font-medium">{formatCurrency(report.opening_balance)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Arus Kas Bersih Aktivitas Operasi</span>
                  <span className={`font-mono font-medium ${report.operations.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.operations.net)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Arus Kas Bersih Aktivitas Investasi</span>
                  <span className={`font-mono font-medium ${report.investing.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.investing.net)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Arus Kas Bersih Aktivitas Pendanaan</span>
                  <span className={`font-mono font-medium ${report.financing.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(report.financing.net)}
                  </span>
                </div>
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

      {/* Drilldown Modal: Journal Detail Contributing to a Cash Flow Account Line */}
      {selectedAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Rincian Jurnal Kas: {selectedAccountModal.nama_akun} ({selectedAccountModal.kode_akun})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Kelompok: {selectedAccountModal.group_label} &bull; Total Kas Terlibat: {formatCurrency(selectedAccountModal.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccountModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nomor Jurnal</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 text-right">Nilai Alokasi Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedAccountModal.journals || []).map((jnl, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="py-2 px-3 whitespace-nowrap text-gray-600">{jnl.tanggal}</td>
                        <td className="py-2 px-3 font-mono font-medium text-indigo-700 whitespace-nowrap">
                          {jnl.nomor_jurnal}
                        </td>
                        <td className="py-2 px-3 text-gray-800">{jnl.keterangan || '-'}</td>
                        <td className={`py-2 px-3 text-right font-mono font-semibold whitespace-nowrap ${selectedAccountModal.isOutflow ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(jnl.amount)}
                        </td>
                      </tr>
                    ))}
                    {(!selectedAccountModal.journals || selectedAccountModal.journals.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-gray-400">
                          Tidak ada rincian jurnal tersedia.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="border-t bg-gray-50 font-bold">
                    <tr>
                      <td colSpan="3" className="py-2.5 px-3 text-gray-800">Total</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${selectedAccountModal.isOutflow ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedAccountModal.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-gray-50 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAccountModal(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
