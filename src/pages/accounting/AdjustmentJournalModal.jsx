import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import accountingService from '../../services/accountingService';

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const statusClass = (status) => {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-700';
    case 'submitted': return 'bg-blue-100 text-blue-700';
    case 'posted': return 'bg-green-100 text-green-700';
    case 'void': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

/**
 * Daftar jurnal penyesuaian (drill-down kolom "Penyesuaian" kertas kerja).
 * - Tanpa prop `account`: semua jurnal penyesuaian pada periode.
 * - Dengan prop `account`: hanya jurnal yang menyentuh akun tersebut, dan
 *   total debit/kredit tie-out dengan sel kolom penyesuaian akun itu.
 */
export default function AdjustmentJournalModal({
  isOpen,
  onClose,
  settingId,
  settingName,
  tanggalFrom,
  tanggalTo,
  account,
  adjustmentLabels = {},
  onOpenJournalPage,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  // Filter multi-tipe: kosong = semua tipe penyesuaian ditampilkan.
  const [typeFilter, setTypeFilter] = useState([]);

  useEffect(() => {
    if (!isOpen || !settingId) return undefined;

    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        setData(null);
        setExpandedId(null);
        setTypeFilter([]);
        const response = await accountingService.getTrialBalanceAdjustments({
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
          coa_id: account?.id ? Number(account.id) : undefined,
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        });
        if (isMounted) setData(response?.data ?? null);
      } catch (e) {
        if (isMounted) setError(e.message || 'Gagal memuat jurnal penyesuaian.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, settingId, account, tanggalFrom, tanggalTo]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const journals = useMemo(() => data?.journals ?? [], [data]);
  const types = useMemo(() => data?.adjustment_journal_types ?? [], [data]);
  // Tipe yang benar-benar muncul di data (untuk chip filter).
  const availableTypes = useMemo(
    () => types.filter((type) => journals.some((journal) => journal.tipe_jurnal === type)),
    [types, journals]
  );
  const visibleJournals = useMemo(
    () => (typeFilter.length === 0
      ? journals
      : journals.filter((journal) => typeFilter.includes(journal.tipe_jurnal))),
    [journals, typeFilter]
  );
  // Ringkasan dihitung dari jurnal yang sedang tampil agar tie-out dengan filter.
  const visibleTotals = useMemo(
    () => visibleJournals.reduce(
      (acc, journal) => ({
        debit: acc.debit + Number(journal.debit || 0),
        credit: acc.credit + Number(journal.credit || 0),
      }),
      { debit: 0, credit: 0 },
    ),
    [visibleJournals]
  );
  const net = visibleTotals.debit - visibleTotals.credit;
  const netLabel = net < 0 ? 'Kredit' : 'Debit';
  const typeLabel = (type) => adjustmentLabels[type] || type;
  const toggleType = (type) => setTypeFilter((current) => (
    current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
  ));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-3 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={account ? `Jurnal penyesuaian akun ${account.nama_akun}` : 'Daftar jurnal penyesuaian'}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/75 p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <FileText className="mr-1 inline h-3.5 w-3.5" />
                Jurnal Penyesuaian
              </span>
              {account?.kode_akun && (
                <span className="rounded-md bg-indigo-100 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-800">
                  {account.kode_akun}
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {account?.nama_akun || 'Semua Akun'}
              </h2>
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
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Jumlah Jurnal</span>
              <p className="mt-0.5 text-lg font-bold text-gray-800">{visibleJournals.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Mutasi Debit</span>
              <p className="mt-0.5 text-lg font-bold text-emerald-700">Rp {formatNumber(visibleTotals.debit)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Mutasi Kredit</span>
              <p className="mt-0.5 text-lg font-bold text-rose-700">Rp {formatNumber(visibleTotals.credit)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Neto Kolom Penyesuaian</span>
              <p className="mt-0.5 text-lg font-bold text-amber-900">
                Rp {formatNumber(Math.abs(net))}{' '}
                <span className="text-xs font-semibold uppercase">({netLabel})</span>
              </p>
            </div>
          </div>
        )}

        {/* Filter multi-tipe */}
        {!loading && !error && data && availableTypes.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-white px-4 py-2 text-[11px]">
            <span className="font-medium text-gray-500">Filter tipe:</span>
            <button
              type="button"
              onClick={() => setTypeFilter([])}
              className={`rounded-full border px-2.5 py-0.5 font-medium transition-colors ${
                typeFilter.length === 0
                  ? 'border-amber-300 bg-amber-100 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Semua
            </button>
            {availableTypes.map((type) => {
              const active = typeFilter.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-2.5 py-0.5 font-medium transition-colors ${
                    active
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title={type}
                >
                  {typeLabel(type)}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent"></div>
              <p className="mt-3 text-sm font-medium text-gray-500">Memuat jurnal penyesuaian...</p>
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

          {!loading && !error && visibleJournals.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
              Tidak ada jurnal penyesuaian pada filter/periode ini.
            </div>
          )}

          {!loading && !error && visibleJournals.map((journal) => {
            const open = expandedId === journal.id;
            return (
              <div key={journal.id} className="overflow-hidden rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : journal.id)}
                  className="flex w-full flex-wrap items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                  <span className="font-mono text-xs font-semibold text-indigo-700">
                    {journal.nomor_jurnal || 'DRAFT'}
                  </span>
                  <span className="text-xs text-gray-500">{journal.tanggal}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                    {typeLabel(journal.tipe_jurnal)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${statusClass(journal.status)}`}>
                    {journal.status}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-600">
                    {journal.keterangan || '-'}
                  </span>
                  <span className="w-28 shrink-0 text-right font-mono text-xs text-emerald-700">
                    {formatNumber(journal.debit)}
                  </span>
                  <span className="w-28 shrink-0 text-right font-mono text-xs text-rose-700">
                    {formatNumber(journal.credit)}
                  </span>
                </button>


                {open && (
                  <div className="border-t border-gray-100 bg-gray-50/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/80 text-gray-600">
                        <tr>
                          <th scope="col" className="w-24 p-2 font-semibold">Kode</th>
                          <th scope="col" className="p-2 font-semibold">Nama Akun</th>
                          <th scope="col" className="p-2 font-semibold">Keterangan</th>
                          <th scope="col" className="w-32 p-2 text-right font-semibold">Debit</th>
                          <th scope="col" className="w-32 p-2 text-right font-semibold">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(journal.lines ?? []).map((line) => {
                          const isTarget = account?.id && Number(line.coa_id) === Number(account.id);
                          return (
                            <tr key={line.id} className={isTarget ? 'bg-amber-50' : undefined}>
                              <td className="p-2 font-mono text-gray-600">{line.kode_akun}</td>
                              <td className={`p-2 ${isTarget ? 'font-semibold text-amber-900' : 'text-gray-800'}`}>
                                {line.nama_akun}
                              </td>
                              <td className="p-2 text-gray-500">{line.keterangan || '-'}</td>
                              <td className="whitespace-nowrap p-2 text-right font-mono tabular-nums text-gray-800">
                                {line.debit ? formatNumber(line.debit) : '–'}
                              </td>
                              <td className="whitespace-nowrap p-2 text-right font-mono tabular-nums text-gray-800">
                                {line.credit ? formatNumber(line.credit) : '–'}
                              </td>
                            </tr>
                          );
                        })}
                        {account?.id && (
                          <tr className="bg-gray-100/60 text-xs font-semibold text-gray-700">
                            <td colSpan={3} className="p-2 text-right">
                              Subtotal akun {account.kode_akun}
                            </td>
                            <td className="whitespace-nowrap p-2 text-right font-mono tabular-nums">
                              {formatNumber(journal.debit)}
                            </td>
                            <td className="whitespace-nowrap p-2 text-right font-mono tabular-nums">
                              {formatNumber(journal.credit)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-gray-500">
            Sumber: kolom Penyesuaian kertas kerja (tanpa jurnal penutup). Tipe:{' '}
            <span className="font-medium text-gray-700" title={types.join(', ')}>
              {types.map(typeLabel).join(', ') || '-'}
            </span>
          </p>
          <div className="flex items-center gap-2">
            {onOpenJournalPage && (
              <button
                type="button"
                onClick={() => {
                  onOpenJournalPage(types[0] || 'ADJUSTMENT');
                  onClose();
                }}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Buka di Jurnal Umum
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

