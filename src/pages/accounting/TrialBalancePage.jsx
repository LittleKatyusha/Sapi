import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Layers,
  Printer,
  Scale,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';
import SearchableSelect from '../../components/shared/SearchableSelect';
import AdjustmentJournalModal from './AdjustmentJournalModal';
import TrialBalanceDetailModal from './TrialBalanceDetailModal';
import TrialBalanceWorksheetTable from './TrialBalanceWorksheetTable';
import {
  ADJUSTMENT_TYPE_LABELS,
  formatCell,
  formatNumber,
  groupAccounts,
  isBalanced,
  isZero,
  sumRows,
  WORKSHEET_AMOUNT_KEYS,
} from './trialBalanceUtils';

const today = new Date().toISOString().slice(0, 10);

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const BalanceBadge = ({ balanced }) => (
  <span
    role="status"
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
      balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {balanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
    {balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
  </span>
);

const DetailButton = ({ account, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={`Lihat rincian transaksi pembentuk saldo akun ${account.kode_akun}`}
    className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
  >
    <Eye className="h-3.5 w-3.5" />
    <span>Detail</span>
  </button>
);

export default function TrialBalancePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  // Neraca saldo = saldo kumulatif s/d tanggal. Dibiarkan kosong secara
  // default (bukan awal bulan berjalan) supaya saldo aset/kewajiban/ekuitas
  // tidak terpotong dan bisa direkonsiliasi ke Neraca.
  const [tanggalFrom, setTanggalFrom] = useState('');
  const [tanggalTo, setTanggalTo] = useState(today);
  // Kertas kerja: pisahkan saldo awal, mutasi transaksi, jurnal penyesuaian,
  // NSD, serta kolom Laba Rugi / Neraca.
  const [worksheet, setWorksheet] = useState(false);
  // Tampilkan saldo awal & mutasi sebagai kolom terpisah (default: satu kolom
  // "Neraca Saldo sebelum penyesuaian" agar tabel tidak terlalu lebar).
  const [showBreakdown, setShowBreakdown] = useState(false);
  // Jurnal penutup (CLOSING) dipisah dari penyesuaian; default tidak diikutkan.
  const [includeClosing, setIncludeClosing] = useState(false);
  // Akun bersaldo nol tetap dihitung backend (agar total tie-out), tetapi
  // disembunyikan default supaya kertas kerja tetap mudah dibaca.
  const [hideZero, setHideZero] = useState(true);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentAccount, setAdjustmentAccount] = useState(null);
  // Parameter laporan yang sedang ditampilkan — dipakai popup detail agar angkanya
  // selalu tie-out dengan baris pada tabel (walau filter diubah tanpa "Tampilkan").
  const [reportParams, setReportParams] = useState(null);
  const hasLoadedOnce = useRef(false);

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

  const loadReport = async (overrides = {}) => {
    const nextWorksheet = overrides.worksheet ?? worksheet;
    const nextIncludeClosing = overrides.includeClosing ?? includeClosing;

    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const params = {
        setting_id: settingId === 'all' ? 'all' : Number(settingId),
        tanggal_from: tanggalFrom || undefined,
        tanggal_to: tanggalTo || undefined,
        worksheet: nextWorksheet || undefined,
        include_closing: nextWorksheet && nextIncludeClosing ? 1 : undefined,
      };
      const response = await accountingService.getTrialBalance(params);
      setReport(response?.data ?? null);
      setReportParams({
        settingId,
        tanggalFrom,
        tanggalTo,
        worksheet: nextWorksheet,
        includeClosing: nextWorksheet && nextIncludeClosing,
      });
      hasLoadedOnce.current = true;
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat neraca saldo.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle mode kertas kerja / jurnal penutup langsung memuat ulang laporan
  // yang sedang tampil supaya kolom dan angka tidak pernah tidak sinkron.
  const reloadOnToggle = (overrides) => {
    if (!hasLoadedOnce.current) return;
    loadReport(overrides);
  };


  const activeParams = reportParams ?? { settingId, tanggalFrom, tanggalTo, worksheet, includeClosing };
  const activeSettingId = activeParams.settingId ?? settingId;
  const entityLabel =
    activeSettingId === 'all'
      ? 'Konsolidasi Semua Entitas'
      : settings.find((s) => String(s.id) === String(activeSettingId))?.nama_perusahaan || 'Entitas';
  const isWorksheet = report?.mode === 'worksheet';
  const accounts = useMemo(() => report?.accounts ?? [], [report]);

  const visibleAccounts = useMemo(() => {
    if (!report || !hideZero) return accounts;
    return accounts.filter((account) =>
      isWorksheet
        ? WORKSHEET_AMOUNT_KEYS.some((key) => !isZero(account[key]))
        : !isZero(account.debit) || !isZero(account.credit)
    );
  }, [report, accounts, hideZero, isWorksheet]);

  const groups = useMemo(() => groupAccounts(visibleAccounts), [visibleAccounts]);
  const hiddenCount = accounts.length - visibleAccounts.length;

  const reportBalanced = useMemo(() => {
    if (!report) return false;
    if (typeof report.is_balanced === 'boolean') return report.is_balanced;
    return isWorksheet
      ? isBalanced(report.totals?.saldo_akhir_debit, report.totals?.saldo_akhir_credit)
      : isBalanced(report.total_debit, report.total_credit);
  }, [report, isWorksheet]);

  const selisih = isWorksheet
    ? Number(report?.totals?.saldo_akhir_debit || 0) - Number(report?.totals?.saldo_akhir_credit || 0)
    : Number(report?.total_debit || 0) - Number(report?.total_credit || 0);

  // Pada mode kertas kerja, angka yang tie-out ke tabel adalah SALDO AKHIR /
  // NSD (setelah penyesuaian), bukan mutasi periode seperti neraca saldo biasa.
  const openDetail = (account) => {
    if (isWorksheet) {
      setSelectedAccount({
        ...account,
        debit: account.saldo_akhir_debit,
        credit: account.saldo_akhir_credit,
      });
      return;
    }
    setSelectedAccount(account);
  };

  const openAdjustments = (account = null) => {
    setAdjustmentAccount(account);
    setAdjustmentOpen(true);
  };

  const buildExportParams = () => ({
    setting_id: activeSettingId === 'all' ? 'all' : Number(activeSettingId),
    tanggal_from: activeParams.tanggalFrom || undefined,
    tanggal_to: activeParams.tanggalTo || undefined,
    worksheet: reportParams?.worksheet || undefined,
    include_closing: reportParams?.worksheet && reportParams?.includeClosing ? 1 : undefined,
  });

  const exportFilename = (extension) => {
    const slug = reportParams?.worksheet ? 'kertas-kerja-neraca-saldo' : 'neraca-saldo';
    const from = activeParams.tanggalFrom || 'awal';
    const to = activeParams.tanggalTo || 'kini';
    return `${slug}-${from}-sd-${to}.${extension}`;
  };

  const handlePrintPdf = async () => {
    if (!report) return;
    try {
      setExporting('print');
      setError('');
      const blob = await accountingService.exportTrialBalance(buildExportParams(), 'pdf');
      const fileUrl = URL.createObjectURL(blob);
      const printWindow = window.open(fileUrl, '_blank');
      if (!printWindow) {
        await downloadPdf(blob, exportFilename('pdf'));
      }
    } catch (e) {
      setError(e.message || 'Gagal mencetak PDF neraca saldo.');
    } finally {
      setExporting('');
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      setExporting('pdf');
      setError('');
      const blob = await accountingService.exportTrialBalance(buildExportParams(), 'pdf');
      await downloadPdf(blob, exportFilename('pdf'));
    } catch (e) {
      setError(e.message || 'Gagal mengunduh PDF neraca saldo.');
    } finally {
      setExporting('');
    }
  };

  const handleDownloadExcel = async () => {
    if (!report) return;
    try {
      setExporting('xlsx');
      setError('');
      const blob = await accountingService.exportTrialBalance(buildExportParams(), 'xlsx');
      triggerDownload(blob, exportFilename('xlsx'));
    } catch (e) {
      setError(e.message || 'Gagal mengunduh Excel neraca saldo.');
    } finally {
      setExporting('');
    }
  };


  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neraca Saldo</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Uji keseimbangan saldo debit–kredit seluruh Chart of Accounts. Aktifkan{' '}
            <span className="font-medium text-gray-700">Kertas Kerja</span> untuk melihat jurnal
            penyesuaian, NSD, serta pemisahan Laba Rugi / Neraca.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {report && <BalanceBadge balanced={reportBalanced} />}

          {report && (
            <>
              <button
                type="button"
                onClick={handlePrintPdf}
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <Printer className="h-4 w-4 text-gray-500" />
                <span>{exporting === 'print' ? 'Memproses...' : 'Cetak PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4 text-gray-500" />
                <span>{exporting === 'pdf' ? 'Mengunduh...' : 'Unduh PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>{exporting === 'xlsx' ? 'Mengunduh...' : 'Unduh Excel'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => openAdjustments(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            <FileText className="h-4 w-4" />
            <span>Jurnal Penyesuaian</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/akuntansi/opname-perlengkapan')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Opname Perlengkapan
          </button>
          <button
            type="button"
            onClick={() => navigate('/akuntansi/rekonsiliasi-perlengkapan')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
          >
            Rekonsiliasi
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}


      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Entitas Akunting</label>
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
            <input
              type="date"
              value={tanggalFrom}
              onChange={(e) => setTanggalFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </label>
          <label className="text-sm text-gray-700">
            Sampai Tanggal
            <input
              type="date"
              value={tanggalTo}
              onChange={(e) => setTanggalTo(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2"
            />
          </label>
          <button
            type="button"
            onClick={() => loadReport()}
            disabled={loading || !settingId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <Scale className="h-4 w-4" />
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={worksheet}
                onChange={(e) => {
                  const next = e.target.checked;
                  setWorksheet(next);
                  if (!next) setShowBreakdown(false);
                  reloadOnToggle({ worksheet: next });
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>
                Kertas Kerja (worksheet)
                <span className="block text-xs text-gray-500">
                  Penyesuaian, NSD, Laba Rugi / Neraca, dan kontrol keseimbangan per tahap.
                </span>
              </span>
            </label>

            {worksheet && (
              <>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showBreakdown}
                    onChange={(e) => setShowBreakdown(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Rincian saldo awal &amp; mutasi</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeClosing}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIncludeClosing(next);
                      reloadOnToggle({ includeClosing: next });
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <span>
                    Sertakan jurnal penutup (CLOSING)
                    <span className="block text-xs text-gray-500">
                      Default tidak diikutkan agar kolom NSD = posisi sebelum penutupan.
                    </span>
                  </span>
                </label>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={hideZero}
                onChange={(e) => setHideZero(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Sembunyikan akun tanpa saldo</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 sm:text-right">
            Tanggal awal kosong = saldo kumulatif s/d tanggal akhir.
            <span className="mt-0.5 block">Total selalu dihitung dari seluruh akun.</span>
          </p>
        </div>
      </section>

      {loading && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
          Memuat neraca saldo...
        </div>
      )}


      {report && isWorksheet && (
        <TrialBalanceWorksheetTable
          report={report}
          accounts={accounts}
          visibleAccounts={visibleAccounts}
          groups={groups}
          hiddenCount={hiddenCount}
          entityLabel={entityLabel}
          includeClosing={Boolean(reportParams?.includeClosing)}
          showBreakdown={showBreakdown}
          adjustmentLabels={ADJUSTMENT_TYPE_LABELS}
          onDetail={openDetail}
          onOpenAdjustments={(account) => openAdjustments(account)}
        />
      )}

      {report && !isWorksheet && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Neraca Saldo</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {entityLabel} · Periode <span className="font-medium">{report.tanggal_from || 'awal'}</span> s/d{' '}
                <span className="font-medium">{report.tanggal_to || 'kini'}</span> · {accounts.length} akun
              </p>
            </div>
            {hiddenCount > 0 && (
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                <Layers className="h-3 w-3" /> {hiddenCount} akun tanpa saldo disembunyikan
              </span>
            )}
          </div>

          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Neraca saldo per akun beserta total debit dan kredit</caption>
              <thead className="sticky top-0 z-20 border-b bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="sticky left-0 z-30 w-24 bg-gray-50 p-3 text-left text-xs font-semibold">
                    Kode
                  </th>
                  <th scope="col" className="sticky left-24 z-30 min-w-[15rem] bg-gray-50 p-3 text-left text-xs font-semibold">
                    Nama Akun
                  </th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold">Debit</th>
                  <th scope="col" className="p-3 text-right text-xs font-semibold">Kredit</th>
                  <th scope="col" className="w-24 p-3 text-center text-xs font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleAccounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-sm text-gray-400">
                      Tidak ada akun bersaldo pada periode ini.
                    </td>
                  </tr>
                )}
                {groups.map((group) => {
                  const subtotal = sumRows(group.rows, ['debit', 'credit']);
                  return (
                    <Fragment key={group.type || 'all'}>
                      {group.type && (
                        <tr className="bg-gray-100">
                          <td colSpan={5} className="sticky left-0 p-2 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                            {group.type}
                          </td>
                        </tr>
                      )}
                      {group.rows.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 w-24 bg-white p-3 font-mono text-xs text-gray-600">
                            {account.kode_akun}
                          </td>
                          <td className="sticky left-24 z-10 bg-white p-3">
                            <span className="font-medium text-gray-800">{account.nama_akun}</span>
                          </td>
                          <td className="whitespace-nowrap p-3 text-right tabular-nums text-gray-700">
                            {formatCell(account.debit)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right tabular-nums text-gray-700">
                            {formatCell(account.credit)}
                          </td>
                          <td className="w-24 p-2 text-center">
                            <DetailButton account={account} onClick={() => openDetail(account)} />
                          </td>
                        </tr>
                      ))}

                      {group.type && (
                        <tr className="bg-gray-50 text-xs font-semibold text-gray-600">
                          <td className="sticky left-0 z-10 bg-gray-50 p-2" colSpan={2}>
                            Subtotal {group.type}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right tabular-nums">
                            {formatNumber(subtotal.debit)}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right tabular-nums">
                            {formatNumber(subtotal.credit)}
                          </td>
                          <td />
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
                  <td colSpan={2} className="sticky left-0 z-10 bg-gray-100 p-3 text-right">
                    Total
                  </td>
                  <td className="whitespace-nowrap p-3 text-right tabular-nums">
                    {formatNumber(report.total_debit)}
                  </td>
                  <td className="whitespace-nowrap p-3 text-right tabular-nums">
                    {formatNumber(report.total_credit)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Selisih debit − kredit:{' '}
              <span className={`font-semibold ${isBalanced(selisih, 0) ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatNumber(selisih)}
              </span>
            </span>
            <span className="text-gray-500">
              Total dihitung dari seluruh akun (termasuk yang disembunyikan).
            </span>
          </div>
        </section>
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan rentang tanggal, lalu klik Tampilkan.
        </div>
      )}

      <TrialBalanceDetailModal
        isOpen={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        settingId={activeSettingId}
        settingName={entityLabel}
        tanggalFrom={activeParams.tanggalFrom ?? tanggalFrom}
        tanggalTo={activeParams.tanggalTo ?? tanggalTo}
      />

      <AdjustmentJournalModal
        isOpen={adjustmentOpen}
        onClose={() => {
          setAdjustmentOpen(false);
          setAdjustmentAccount(null);
        }}
        settingId={activeSettingId}
        settingName={entityLabel}
        tanggalFrom={activeParams.tanggalFrom ?? tanggalFrom}
        tanggalTo={activeParams.tanggalTo ?? tanggalTo}
        account={adjustmentAccount}
        adjustmentLabels={ADJUSTMENT_TYPE_LABELS}
        onOpenJournalPage={(type) => navigate(`/akuntansi/jurnal?tipe_jurnal=${type}`)}
      />
    </div>
  );
}

