import { useEffect, useMemo, useState } from 'react';
import { X, Search, FileText, AlertCircle, Receipt, Scale, Layers } from 'lucide-react';
import accountingService from '../../services/accountingService';

/**
 * Popup rincian akun Neraca Saldo: saldo awal periode, mutasi debit/kredit,
 * saldo akhir, dan daftar transaksi pembentuk angka pada neraca saldo.
 */
export default function TrialBalanceDetailModal({
  isOpen,
  onClose,
  account,
  settingId,
  settingName,
  tanggalFrom,
  tanggalTo,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Filter cepat saat salah satu kelompok (pihak/kategori) diklik.
  const [groupFilter, setGroupFilter] = useState(null);

  useEffect(() => {
    if (!isOpen || !account?.id || !settingId) return;

    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        setSearch('');
        setGroupFilter(null);
        setData(null);
        const res = await accountingService.getTrialBalanceDetail({
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
          coa_id: Number(account.id),
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        });
        if (isMounted) setData(res?.data ?? null);
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err.message || 'Gagal memuat rincian akun neraca saldo.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, account, settingId, tanggalFrom, tanggalTo]);

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  const rows = useMemo(() => data?.rows ?? [], [data]);

  // Klasifikasi dari backend: per pihak (akun piutang/hutang) atau per kategori biaya.
  const classification = data?.classification ?? null;
  const classificationGroups = useMemo(() => classification?.groups ?? [], [classification]);
  const isCounterparty = classification?.type === 'counterparty';
  const rowGroupLabel = (row) => (isCounterparty ? row.pihak : row.kategori) || 'Tanpa Pihak';

  const filteredRows = useMemo(() => {
    let result = rows;
    if (groupFilter) {
      result = result.filter((row) => ((isCounterparty ? row.pihak : row.kategori) || 'Tanpa Pihak') === groupFilter);
    }
    if (!search.trim()) return result;

    const q = search.toLowerCase();
    return result.filter((row) =>
      [row.nomor_jurnal, row.keterangan, row.tipe_jurnal, row.tanggal, row.pihak, row.kategori]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [rows, search, groupFilter, isCounterparty]);

  if (!isOpen || !account) return null;

  const openingBalance = Number(data?.opening_balance || 0);
  const endingBalance = Number(data?.ending_balance || 0);
  const tipe = data?.account?.tipe || account.tipe || '';
  const normalBalance = data?.account?.normal_balance || account.normal_balance || 'D';
  const debitOnTrialBalance = Number(account.debit || 0);
  const creditOnTrialBalance = Number(account.credit || 0);
  // Nilai yang tampil di kolom neraca saldo = mutasi neto periode pada sisi
  // sesuai saldo normal akun (bukan saldo kumulatif buku besar).
  const trialBalanceSide = debitOnTrialBalance > 0 || creditOnTrialBalance === 0 ? 'Debit' : 'Kredit';
  const trialBalanceValue = trialBalanceSide === 'Debit' ? debitOnTrialBalance : creditOnTrialBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Rincian akun ${account.nama_akun}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/75 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-indigo-100 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-800">
                {account.kode_akun}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{account.nama_akun}</h2>
              {tipe && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {tipe}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {settingName ? `${settingName} • ` : ''}
              Periode <span className="font-medium text-gray-700">{tanggalFrom || 'Awal'}</span> s/d{' '}
              <span className="font-medium text-gray-700">{tanggalTo || 'Kini'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ringkasan */}
        {data && (
          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50/40 p-4 text-sm md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Mutasi Debit (Periode)</span>
              <p className="mt-0.5 text-lg font-bold text-emerald-700">Rp {formatNumber(data.total_debit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Mutasi Kredit (Periode)</span>
              <p className="mt-0.5 text-lg font-bold text-rose-700">Rp {formatNumber(data.total_credit)}</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">Saldo Neto (Neraca Saldo)</span>
              <p className="mt-0.5 text-lg font-bold text-indigo-900">
                Rp {formatNumber(trialBalanceValue)}{' '}
                <span className="text-xs font-semibold uppercase">({trialBalanceSide})</span>
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Jumlah Transaksi</span>
              <p className="mt-0.5 text-lg font-bold text-gray-800">{rows.length} transaksi</p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-sm font-medium text-gray-500">Memuat rincian akun...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Terjadi Kesalahan</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-[11px] text-indigo-800">
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div className="space-y-0.5">
                  <p>
                    Angka di kolom neraca saldo = <span className="font-semibold">saldo neto mutasi periode ini</span>:{' '}
                    <span className="font-semibold">Debit Rp {formatNumber(debitOnTrialBalance)}</span>
                    {' • '}
                    <span className="font-semibold">Kredit Rp {formatNumber(creditOnTrialBalance)}</span>
                    {' '}(saldo normal akun: {normalBalance === 'D' ? 'Debit' : 'Kredit'}).
                  </p>
                  <p className="text-indigo-700/80">
                    Kolom <span className="font-semibold">Saldo Kumulatif</span> memakai saldo berjalan buku besar
                    (termasuk transaksi sebelum periode): awal Rp {formatNumber(openingBalance)} → akhir{' '}
                    Rp {formatNumber(endingBalance)}.
                  </p>
                </div>
              </div>

              {classification && classificationGroups.length > 0 && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-800">{classification.label}</h3>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {classificationGroups.length} {isCounterparty ? 'pihak' : 'kategori'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Total neto:{' '}
                      <span className="font-semibold text-gray-800">Rp {formatNumber(classification.total_net)}</span>
                    </span>
                  </div>
                  <div className="max-h-[32vh] overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-gray-100/95 text-gray-600 backdrop-blur">
                        <tr>
                          <th className="w-10 p-3 font-semibold">No</th>
                          <th className="p-3 font-semibold">{isCounterparty ? 'Pihak / Pedagang' : 'Kategori'}</th>
                          {isCounterparty && <th className="w-24 p-3 font-semibold">Tipe</th>}
                          <th className="w-32 p-3 text-right font-semibold">Mutasi Debit</th>
                          <th className="w-32 p-3 text-right font-semibold">Mutasi Kredit</th>
                          <th className="w-32 p-3 text-right font-semibold">Neto Periode</th>
                          {isCounterparty && (
                            <th className="w-36 p-3 text-right font-semibold">Outstanding s/d {tanggalTo || 'kini'}</th>
                          )}
                          <th className="w-16 p-3 text-right font-semibold">Trx</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {classificationGroups.map((group, index) => {
                          const active = groupFilter === group.label;
                          return (
                            <tr
                              key={group.label}
                              onClick={() => setGroupFilter(active ? null : group.label)}
                              className={`cursor-pointer transition-colors ${active ? 'bg-indigo-50' : 'hover:bg-gray-50/60'}`}
                              title="Klik untuk memfilter transaksi kelompok ini"
                            >
                              <td className="p-3 text-gray-500">{index + 1}</td>
                              <td className="p-3 font-medium text-gray-900">{group.label}</td>
                              {isCounterparty && (
                                <td className="p-3 text-[11px] uppercase text-gray-500">
                                  {group.counterparty_type || '-'}
                                </td>
                              )}
                              <td className="whitespace-nowrap p-3 text-right font-mono text-emerald-700">
                                {formatNumber(group.total_debit)}
                              </td>
                              <td className="whitespace-nowrap p-3 text-right font-mono text-rose-700">
                                {formatNumber(group.total_credit)}
                              </td>
                              <td className={`whitespace-nowrap p-3 text-right font-mono font-semibold ${Number(group.net) < 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                                {formatNumber(group.net)}
                              </td>
                              {isCounterparty && (
                                <td className="whitespace-nowrap p-3 text-right font-mono text-indigo-800">
                                  {group.outstanding === null || group.outstanding === undefined
                                    ? '-'
                                    : formatNumber(group.outstanding)}
                                </td>
                              )}
                              <td className="p-3 text-right text-gray-600">{group.count}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 bg-gray-100 font-bold text-gray-900">
                          <td colSpan={isCounterparty ? 3 : 2} className="p-3 text-sm">
                            Total {isCounterparty ? 'per Pihak' : 'per Kategori'}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right font-mono">{formatNumber(data.total_debit)}</td>
                          <td className="whitespace-nowrap p-3 text-right font-mono">{formatNumber(data.total_credit)}</td>
                          <td className="whitespace-nowrap p-3 text-right font-mono text-indigo-900">
                            {formatNumber(classification.total_net)}
                          </td>
                          {isCounterparty && <td className="p-3" />}
                          <td className="p-3 text-right">{rows.length}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="border-t border-gray-100 bg-gray-50/60 px-4 py-2 text-[11px] text-gray-500">
                    Klik salah satu baris untuk memfilter daftar transaksi di bawah.
                    {isCounterparty &&
                      ' Kolom outstanding = saldo kumulatif pihak tersebut s/d tanggal akhir (dari subledger AR/AP).'}
                  </p>
                </section>
              )}

              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Transaksi Pembentuk Saldo</h3>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    {groupFilter && (
                      <button
                        type="button"
                        onClick={() => setGroupFilter(null)}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-200"
                        title="Hapus filter kelompok"
                      >
                        {groupFilter}
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari no jurnal, keterangan, tipe..."
                        className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="max-h-[45vh] overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-gray-100/95 text-gray-600 backdrop-blur">
                      <tr>
                        <th className="w-24 p-3 font-semibold">Tanggal</th>
                        <th className="w-40 p-3 font-semibold">No. Jurnal</th>
                        <th className="w-32 p-3 font-semibold">Tipe</th>
                        <th className="w-40 p-3 font-semibold">{isCounterparty ? 'Pihak' : 'Klasifikasi'}</th>
                        <th className="p-3 font-semibold">Keterangan</th>
                        <th className="w-28 p-3 text-right font-semibold">Debit</th>
                        <th className="w-28 p-3 text-right font-semibold">Kredit</th>
                        <th className="w-32 p-3 text-right font-semibold">Saldo Kumulatif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="bg-gray-50/70">
                        <td colSpan="7" className="p-2.5 font-semibold text-gray-700">
                          Saldo awal kumulatif (sebelum periode)
                        </td>
                        <td className="whitespace-nowrap p-2.5 text-right font-mono font-semibold text-gray-900">
                          {formatNumber(openingBalance)}
                        </td>
                      </tr>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-gray-400">
                            <FileText className="mx-auto mb-1 h-6 w-6 text-gray-300" />
                            {rows.length === 0
                              ? 'Belum ada mutasi pada akun ini di periode terpilih.'
                              : 'Tidak ada transaksi yang sesuai pencarian.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, index) => (
                          <tr key={`${row.journal_id ?? 'row'}-${index}`} className="hover:bg-gray-50/60">
                            <td className="whitespace-nowrap p-2.5 text-gray-600">{row.tanggal}</td>
                            <td className="whitespace-nowrap p-2.5 font-mono text-gray-700">{row.nomor_jurnal}</td>
                            <td className="p-2.5">
                              {row.tipe_jurnal ? (
                                <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase text-gray-600">
                                  {row.tipe_jurnal}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-gray-700">{row.keterangan || '-'}</td>
                            <td className="whitespace-nowrap p-2.5">
                              {rowGroupLabel(row) ? (
                                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                  {rowGroupLabel(row)}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-emerald-700">
                              {Number(row.debit || 0) ? formatNumber(row.debit) : '-'}
                            </td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-rose-700">
                              {Number(row.credit || 0) ? formatNumber(row.credit) : '-'}
                            </td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-gray-900">
                              {formatNumber(row.saldo_berjalan)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-100 font-bold text-gray-900">
                        <td colSpan="5" className="p-3 text-sm">
                          Total Mutasi Periode{' '}
                          <span className="text-[11px] font-normal text-gray-600">
                            (neto = kolom neraca saldo)
                          </span>
                        </td>
                        <td className="whitespace-nowrap p-3 text-right font-mono">{formatNumber(data.total_debit)}</td>
                        <td className="whitespace-nowrap p-3 text-right font-mono">{formatNumber(data.total_credit)}</td>
                        <td className="whitespace-nowrap p-3 text-right font-mono text-indigo-900">
                          {formatNumber(trialBalanceValue)}{' '}
                          <span className="text-[10px] font-semibold uppercase">({trialBalanceSide})</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <p className="text-xs text-gray-500">
            {filteredRows.length} dari {rows.length} transaksi ditampilkan
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}



