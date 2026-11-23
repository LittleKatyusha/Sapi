import { useEffect, useMemo, useState } from 'react';
import { X, Search, Users, FileText, AlertCircle, Receipt } from 'lucide-react';
import accountingService from '../../services/accountingService';

/**
 * Popup rincian akun Neraca: saldo per tanggal, rincian per pihak (piutang /
 * hutang siapa saja) dan daftar transaksi pembentuk saldo akun.
 */
export default function BalanceSheetDetailModal({
  isOpen,
  onClose,
  account,
  settingId,
  settingName,
  tanggal,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen || !account?.id || !settingId) return;

    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        setSearch('');
        setData(null);
        const res = await accountingService.getBalanceSheetDetail({
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
          coa_id: Number(account.id),
          tanggal,
        });
        if (isMounted) setData(res?.data ?? null);
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err.message || 'Gagal memuat rincian akun neraca.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, account, settingId, tanggal]);

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  const items = useMemo(() => data?.items ?? [], [data]);
  const counterparties = useMemo(() => data?.counterparties ?? [], [data]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      [item.pihak, item.keterangan, item.nomor_jurnal, item.nama_item, item.kategori]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [items, search]);

  if (!isOpen || !account) return null;

  const endingBalance = Number(data?.ending_balance || 0);
  const counterpartyTotal = Number(data?.counterparty_total || 0);
  const selisih = counterpartyTotal - endingBalance;
  const isAr = data?.counterparty_type === 'ar';
  const isAp = data?.counterparty_type === 'ap';

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
              {account.tipe && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {account.tipe}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {settingName ? `${settingName} • ` : ''}
              Posisi per <span className="font-medium text-gray-700">{tanggal || data?.as_of || 'kini'}</span>
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
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Saldo per Tanggal</span>
              <p className="mt-0.5 text-lg font-bold text-gray-900">Rp {formatNumber(endingBalance)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Total Debit</span>
              <p className="mt-0.5 text-lg font-bold text-emerald-700">Rp {formatNumber(data.total_debit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Total Kredit</span>
              <p className="mt-0.5 text-lg font-bold text-rose-700">Rp {formatNumber(data.total_credit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Transaksi</span>
              <p className="mt-0.5 text-lg font-bold text-indigo-700">{data.total_transactions ?? 0}</p>
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
              {(isAr || isAp) && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-semibold text-gray-800">
                        Rincian {isAr ? 'Piutang' : 'Hutang'} per Pihak
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500">
                      Sumber: subledger {isAr ? 'AR' : 'AP'} per {data.as_of || tanggal}
                    </span>
                  </div>

                  {counterparties.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">
                      Belum ada rincian per pihak pada subledger {isAr ? 'piutang' : 'hutang'} untuk tanggal ini.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100/60 text-xs text-gray-600">
                          <tr>
                            <th className="w-12 p-3 font-semibold">No</th>
                            <th className="p-3 font-semibold">Nama Pihak</th>
                            <th className="w-28 p-3 font-semibold">Tipe</th>
                            <th className="w-36 p-3 font-semibold">Aktivitas Terakhir</th>
                            <th className="w-40 p-3 text-right font-semibold">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {counterparties.map((cp, idx) => (
                            <tr key={`${cp.counterparty_type}-${cp.counterparty_id}-${cp.counterparty_name}`} className="hover:bg-gray-50/60">
                              <td className="p-3 text-gray-500">{idx + 1}</td>
                              <td className="p-3 font-medium text-gray-900">{cp.counterparty_name}</td>
                              <td className="p-3 text-xs uppercase text-gray-500">{cp.counterparty_type || '-'}</td>
                              <td className="p-3 text-gray-600">{cp.last_activity || '-'}</td>
                              <td className={`p-3 text-right font-mono font-semibold ${cp.outstanding < 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                                Rp {formatNumber(cp.outstanding)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-gray-100 font-bold text-gray-900">
                            <td colSpan="4" className="p-3 text-sm">Total Per Pihak</td>
                            <td className="p-3 text-right font-mono">Rp {formatNumber(counterpartyTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {counterparties.length > 0 && Math.abs(selisih) > 0.01 && (
                    <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-700">
                      Total subledger Rp {formatNumber(counterpartyTotal)} berbeda dengan saldo akun di GL Rp{' '}
                      {formatNumber(endingBalance)} (selisih Rp {formatNumber(Math.abs(selisih))}). Rincian per pihak
                      bersumber dari subledger, transaksi di bawah bersumber dari jurnal umum.
                    </p>
                  )}
                </section>
              )}

              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Transaksi Pembentuk Saldo</h3>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari pihak, keterangan, no jurnal..."
                      className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="max-h-[45vh] overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-gray-100/95 text-gray-600 backdrop-blur">
                      <tr>
                        <th className="w-24 p-3 font-semibold">Tanggal</th>
                        <th className="w-40 p-3 font-semibold">No. Jurnal</th>
                        <th className="w-40 p-3 font-semibold">Pihak</th>
                        <th className="p-3 font-semibold">Keterangan</th>
                        <th className="w-28 p-3 text-right font-semibold">Debit</th>
                        <th className="w-28 p-3 text-right font-semibold">Kredit</th>
                        <th className="w-32 p-3 text-right font-semibold">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-gray-400">
                            <FileText className="mx-auto mb-1 h-6 w-6 text-gray-300" />
                            {items.length === 0 ? 'Belum ada transaksi pada akun ini.' : 'Tidak ada transaksi yang sesuai pencarian.'}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/60">
                            <td className="whitespace-nowrap p-2.5 text-gray-600">{item.tanggal}</td>
                            <td className="whitespace-nowrap p-2.5 font-mono text-gray-700">{item.nomor_jurnal}</td>
                            <td className="p-2.5 text-gray-800">
                              {item.pihak ? (
                                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                                  {item.pihak}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-gray-700">{item.keterangan || '-'}</td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-emerald-700">
                              {Number(item.debit || 0) ? formatNumber(item.debit) : '-'}
                            </td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-rose-700">
                              {Number(item.credit || 0) ? formatNumber(item.credit) : '-'}
                            </td>
                            <td className="whitespace-nowrap p-2.5 text-right font-mono text-gray-900">
                              {formatNumber(item.saldo_berjalan)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <p className="text-xs text-gray-500">
            {filteredItems.length} dari {items.length} transaksi ditampilkan
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
