import { Fragment, useMemo } from 'react';
import { Eye, Layers } from 'lucide-react';
import {
  formatCell,
  formatNumber,
  hasAdjustment,
  isBalanced,
  isZero,
  sumRows,
  WORKSHEET_AMOUNT_KEYS,
} from './trialBalanceUtils';

const StageChip = ({ label, balanced, selisih, muted = false }) => (
  <span
    title={muted ? 'Tidak dihitung karena tanggal awal kosong (laporan saldo kumulatif)' : undefined}
    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium ${
      muted
        ? 'border-gray-200 bg-gray-100 text-gray-500'
        : balanced
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
    }`}
  >
    {label}: {muted ? 'n/a' : balanced ? 'seimbang' : `selisih ${formatNumber(selisih)}`}
  </span>
);

const TONE_HEAD = {
  plain: '',
  adjust: 'bg-amber-50 text-amber-900',
  profit: 'bg-emerald-50 text-emerald-900',
  balance: 'bg-indigo-50 text-indigo-900',
  closing: 'bg-rose-50 text-rose-900',
  final: 'bg-gray-100',
};

const TONE_CELL = {
  plain: 'text-gray-700',
  adjust: 'bg-amber-50/40 font-medium text-amber-900',
  profit: 'bg-emerald-50/40 text-emerald-900',
  balance: 'bg-indigo-50/30 text-indigo-900',
  closing: 'bg-rose-50/40 text-rose-900',
  final: 'bg-gray-50 font-semibold text-gray-900',
};

const AmountCell = ({ value, tone, clickable, onClick, label }) => {
  const className = `whitespace-nowrap p-2 text-right tabular-nums ${TONE_CELL[tone] || TONE_CELL.plain}`;

  if (!clickable || isZero(value)) {
    return <td className={className}>{formatCell(value)}</td>;
  }

  return (
    <td className={className}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title="Lihat jurnal penyesuaian akun ini"
        className="rounded px-1 font-semibold text-amber-900 underline decoration-amber-400 decoration-dotted underline-offset-2 hover:bg-amber-100"
      >
        {formatNumber(value)}
      </button>
    </td>
  );
};

export default function TrialBalanceWorksheetTable({
  report,
  accounts,
  visibleAccounts,
  groups,
  hiddenCount,
  entityLabel,
  includeClosing,
  showBreakdown,
  adjustmentLabels = {},
  onDetail,
  onOpenAdjustments,
}) {
  const totals = useMemo(() => report.totals ?? {}, [report]);

  // Kolom mengikuti kertas kerja: Neraca Saldo → Penyesuaian → NSD →
  // Laba Rugi / Neraca, ditambah Penutup + Saldo Akhir bila diminta.
  const columns = useMemo(() => {
    const cols = [];

    if (showBreakdown) {
      cols.push({ key: 'awal', label: 'Saldo Awal', debit: 'saldo_awal_debit', credit: 'saldo_awal_credit', tone: 'plain' });
      cols.push({ key: 'mutasi', label: 'Mutasi Transaksi', debit: 'mutasi_debit', credit: 'mutasi_credit', tone: 'plain' });
    } else {
      cols.push({
        key: 'sebelum',
        label: 'Neraca Saldo',
        hint: 'sebelum penyesuaian',
        debit: 'saldo_sebelum_penyesuaian_debit',
        credit: 'saldo_sebelum_penyesuaian_credit',
        tone: 'plain',
      });
    }

    cols.push({ key: 'penyesuaian', label: 'Jurnal Penyesuaian', debit: 'penyesuaian_debit', credit: 'penyesuaian_credit', tone: 'adjust' });
    cols.push({ key: 'nsd', label: 'NSD', hint: 'setelah penyesuaian', debit: 'nsd_debit', credit: 'nsd_credit', tone: 'plain' });
    cols.push({ key: 'laba_rugi', label: 'Laba Rugi', debit: 'laba_rugi_debit', credit: 'laba_rugi_credit', tone: 'profit' });
    cols.push({ key: 'neraca', label: 'Neraca', debit: 'neraca_debit', credit: 'neraca_credit', tone: 'balance' });

    if (includeClosing) {
      cols.push({ key: 'penutup', label: 'Penutup', hint: 'jurnal penutup', debit: 'penutup_debit', credit: 'penutup_credit', tone: 'closing' });
      cols.push({ key: 'akhir', label: 'Saldo Akhir', debit: 'saldo_akhir_debit', credit: 'saldo_akhir_credit', tone: 'final' });
    }

    return cols;
  }, [showBreakdown, includeClosing]);

  const columnCount = 2 + columns.length * 2 + 1;

  const stageChecks = useMemo(() => {
    const stages = [
      { label: 'Saldo awal', debit: totals.saldo_awal_debit, credit: totals.saldo_awal_credit, muted: !report.tanggal_from },
      { label: 'Mutasi transaksi', debit: totals.mutasi_debit, credit: totals.mutasi_credit },
      { label: 'Jurnal penyesuaian', debit: totals.penyesuaian_debit, credit: totals.penyesuaian_credit },
      { label: 'NSD', debit: totals.nsd_debit, credit: totals.nsd_credit },
      {
        label: 'Laba rugi + neraca',
        debit: Number(totals.laba_rugi_debit || 0) + Number(totals.neraca_debit || 0),
        credit: Number(totals.laba_rugi_credit || 0) + Number(totals.neraca_credit || 0),
      },
    ];

    if (includeClosing) {
      stages.push({ label: 'Saldo akhir', debit: totals.saldo_akhir_debit, credit: totals.saldo_akhir_credit });
    }

    return stages.map((stage) => ({
      ...stage,
      selisih: Number(stage.debit || 0) - Number(stage.credit || 0),
      balanced: isBalanced(stage.debit, stage.credit),
    }));
  }, [totals, includeClosing, report.tanggal_from]);


  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Kertas Kerja Neraca Saldo</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {entityLabel} · Periode <span className="font-medium">{report.tanggal_from || 'awal'}</span> s/d{' '}
            <span className="font-medium">{report.tanggal_to || 'kini'}</span> · {accounts.length} akun
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {hiddenCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 font-medium text-gray-700">
              <Layers className="h-3 w-3" /> {hiddenCount} akun tanpa saldo disembunyikan
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Baris kuning = akun tersentuh jurnal penyesuaian
          </span>
        </div>
      </div>

      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[80rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Kertas kerja neraca saldo: neraca saldo, jurnal penyesuaian, NSD, laba rugi, dan neraca per akun
          </caption>
          <thead className="sticky top-0 z-20 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" rowSpan={2} className="sticky left-0 z-30 w-24 bg-gray-50 p-2 text-left text-xs font-semibold">
                Kode
              </th>
              <th scope="col" rowSpan={2} className="sticky left-24 z-30 min-w-[15rem] bg-gray-50 p-2 text-left text-xs font-semibold">
                Nama Akun
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="colgroup"
                  colSpan={2}
                  title={column.hint}
                  className={`border-l border-gray-200 p-2 text-center text-xs font-semibold ${TONE_HEAD[column.tone] || ''}`}
                >
                  {column.label}
                  {column.hint && (
                    <span className="block text-[10px] font-normal text-gray-500">{column.hint}</span>
                  )}
                </th>
              ))}
              <th scope="col" rowSpan={2} className="w-20 p-2 text-center text-xs font-semibold">
                Aksi
              </th>
            </tr>
            <tr>
              {columns.map((column) => (
                <Fragment key={column.key}>
                  <th scope="col" className={`border-l border-gray-200 p-1 text-right text-[11px] font-medium ${TONE_HEAD[column.tone] || ''}`}>
                    Debit
                  </th>
                  <th scope="col" className={`p-1 text-right text-[11px] font-medium ${TONE_HEAD[column.tone] || ''}`}>
                    Kredit
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {visibleAccounts.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="p-10 text-center text-sm text-gray-400">
                  Tidak ada akun bersaldo pada periode ini.
                </td>
              </tr>
            )}

            {groups.map((group) => {
              const subtotal = sumRows(group.rows, WORKSHEET_AMOUNT_KEYS);
              return (
                <Fragment key={group.type || 'all'}>
                  {group.type && (
                    <tr className="bg-gray-100">
                      <td colSpan={columnCount} className="sticky left-0 p-2 text-[11px] font-bold uppercase tracking-wide text-gray-600">
                        {group.type}
                      </td>
                    </tr>
                  )}

                  {group.rows.map((account) => {
                    const adjusted = hasAdjustment(account);
                    const stickyBg = adjusted ? 'bg-amber-50' : 'bg-white';
                    return (
                      <tr key={account.id} className={adjusted ? 'bg-amber-50/60' : undefined}>
                        <td className={`sticky left-0 z-10 w-24 p-2 font-mono text-xs text-gray-600 ${stickyBg}`}>
                          {account.kode_akun}
                        </td>
                        <td className={`sticky left-24 z-10 p-2 ${stickyBg}`}>
                          <span className="font-medium text-gray-800">{account.nama_akun}</span>
                          {adjusted && (
                            <span className="ml-2 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                              JP
                            </span>
                          )}
                        </td>

                        {columns.map((column) => (
                          <Fragment key={column.key}>
                            <AmountCell
                              value={account[column.debit]}
                              tone={column.tone}
                              clickable={column.key === 'penyesuaian'}
                              onClick={() => onOpenAdjustments?.(account, 'debit')}
                              label={`Lihat jurnal penyesuaian debit akun ${account.kode_akun}`}
                            />
                            <AmountCell
                              value={account[column.credit]}
                              tone={column.tone}
                              clickable={column.key === 'penyesuaian'}
                              onClick={() => onOpenAdjustments?.(account, 'credit')}
                              label={`Lihat jurnal penyesuaian kredit akun ${account.kode_akun}`}
                            />
                          </Fragment>
                        ))}

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => onDetail(account)}
                            title={`Lihat rincian transaksi pembentuk saldo akun ${account.kode_akun}`}
                            className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {group.type && (
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-600">
                      <td className="sticky left-0 z-10 bg-gray-50 p-2" colSpan={2}>
                        Subtotal {group.type}
                      </td>
                      {columns.map((column) => (
                        <Fragment key={column.key}>
                          <td className="whitespace-nowrap p-2 text-right tabular-nums">
                            {formatNumber(subtotal[column.debit])}
                          </td>
                          <td className="whitespace-nowrap p-2 text-right tabular-nums">
                            {formatNumber(subtotal[column.credit])}
                          </td>
                        </Fragment>
                      ))}
                      <td />
                    </tr>
                  )}
                </Fragment>
              );
            })}

            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold text-gray-900">
              <td colSpan={2} className="sticky left-0 z-10 bg-gray-100 p-2 text-right">
                Total
              </td>
              {columns.map((column) => (
                <Fragment key={column.key}>
                  <td className="whitespace-nowrap p-2 text-right tabular-nums">
                    {formatNumber(totals[column.debit])}
                  </td>
                  <td className="whitespace-nowrap p-2 text-right tabular-nums">
                    {formatNumber(totals[column.credit])}
                  </td>
                </Fragment>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>


      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-700">Kontrol keseimbangan:</span>
          {stageChecks.map((stage) => (
            <StageChip
              key={stage.label}
              label={stage.label}
              balanced={stage.balanced}
              selisih={stage.selisih}
              muted={stage.muted}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
          <span>
            Laba bersih:{' '}
            <span className={`font-semibold ${Number(report.laba_bersih) < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {formatNumber(report.laba_bersih)}
            </span>
          </span>
          <span>
            Total Neraca: D {formatNumber(totals.neraca_debit)} / K {formatNumber(totals.neraca_credit)}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-2 text-[11px] text-gray-500">
        Tipe jurnal penyesuaian:{' '}
        <span className="font-medium text-gray-700" title={(report.adjustment_journal_types ?? []).join(', ')}>
          {(report.adjustment_journal_types ?? []).map((type) => adjustmentLabels[type] || type).join(', ') || '-'}
        </span>
        {' · '}
        {includeClosing
          ? 'Jurnal penutup (CLOSING) diikutkan pada kolom Penutup & Saldo Akhir.'
          : 'Jurnal penutup (CLOSING) tidak diikutkan — kolom NSD/Laba Rugi/Neraca adalah posisi sebelum penutupan.'}
      </div>
    </section>
  );
}

