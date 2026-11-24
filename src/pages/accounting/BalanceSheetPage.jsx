import { useEffect, useMemo, useState } from 'react';
import { Printer, Download, FileSpreadsheet, Eye } from 'lucide-react';
import accountingService from '../../services/accountingService';
import downloadPdf from '../../utils/downloadPdf';
import SearchableSelect from '../../components/shared/SearchableSelect';
import BalanceSheetDetailModal from './BalanceSheetDetailModal';

const today = new Date().toISOString().slice(0, 10);

export default function BalanceSheetPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [tanggal, setTanggal] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  const loadReport = async () => {
    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getBalanceSheet({
        setting_id: settingId === 'all' ? 'all' : Number(settingId),
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
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
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
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
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
          setting_id: settingId === 'all' ? 'all' : Number(settingId),
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

  const AccountTable = ({ title, rows, emptyText, footer, onDetail }) => (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="border-b bg-gray-50 p-3 font-semibold text-gray-800">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/60">
                <td className="p-3 font-mono">{row.kode_akun}</td>
                <td className="p-3">{row.nama_akun}</td>
                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                <td className="w-20 p-2 text-center">
                  <DetailButton onClick={() => onDetail(row)} />
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="4" className="p-4 text-center text-gray-500">{emptyText}</td></tr>}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t bg-gray-100 font-bold">
                <td colSpan="2" className="p-3">{footer.label}</td>
                <td className="p-3 text-right">{formatNumber(footer.amount)}</td>
                <td className="p-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );

  const DetailButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
      title="Lihat rincian per pihak & transaksi"
    >
      <Eye className="h-3.5 w-3.5" />
      <span>Detail</span>
    </button>
  );

  const handleDetail = (row) => {
    if (!row?.id) return;
    setSelectedAccount(row);
  };

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
              onDetail={handleDetail}
            />

            <div className="space-y-6">
              {/* Tabel Kewajiban 3 Sub-grup */}
              {(() => {
                const lancarLiabilities = (report.liabilities ?? []).filter(
                  (l) => l.sub_kategori === 'Kewajiban Lancar (Jangka Pendek)' || (!l.sub_kategori && Number(l.kode_akun) < 2500 && l.kode_akun !== '2140')
                );
                const panjangLiabilities = (report.liabilities ?? []).filter(
                  (l) => l.sub_kategori === 'Kewajiban Jangka Panjang' || (!l.sub_kategori && Number(l.kode_akun) >= 2500)
                );
                const lainLainLiabilities = (report.liabilities ?? []).filter(
                  (l) => l.sub_kategori === 'Hutang Lain-lain' || l.kode_akun === '2140'
                );

                const subtotalLancar = lancarLiabilities.reduce((s, r) => s + Number(r.amount || 0), 0);
                const subtotalPanjang = panjangLiabilities.reduce((s, r) => s + Number(r.amount || 0), 0);
                const subtotalLainLain = lainLainLiabilities.reduce((s, r) => s + Number(r.amount || 0), 0);
                const totalCalculatedEquity = Number(report.total_equity || 0) + Number(report.prior_earnings || 0) + Number(report.current_earnings || 0);

                return (
                  <>
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b bg-gray-50 p-3 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800">Kewajiban (Liabilitas)</h2>
                        <span className="text-xs font-semibold text-gray-500">
                          Total: {formatNumber(report.total_liability)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <tbody>
                            {/* 1. Hutang Lancar */}
                            <tr className="bg-slate-100 font-semibold text-slate-800">
                              <td colSpan="4" className="p-2.5 text-xs uppercase tracking-wide">
                                1. Kewajiban Lancar (&lt; 1 Tahun - Hutang Dagang &amp; Bank Pendek)
                              </td>
                            </tr>
                            {lancarLiabilities.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="p-3 pl-5 font-mono text-xs text-gray-600">{row.kode_akun}</td>
                                <td className="p-3">{row.nama_akun}</td>
                                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                                <td className="w-20 p-2 text-center"><DetailButton onClick={() => handleDetail(row)} /></td>
                              </tr>
                            ))}
                            {!lancarLiabilities.length && (
                              <tr><td colSpan="4" className="p-2 pl-5 text-xs italic text-gray-400">Tidak ada hutang lancar</td></tr>
                            )}
                            <tr className="border-b bg-slate-50 text-xs font-semibold text-slate-700">
                              <td colSpan="2" className="p-2 pl-5">Subtotal Kewajiban Lancar</td>
                              <td className="p-2 text-right">{formatNumber(subtotalLancar)}</td>
                              <td className="p-2" />
                            </tr>

                            {/* 2. Hutang Jangka Panjang */}
                            <tr className="bg-slate-100 font-semibold text-slate-800">
                              <td colSpan="4" className="p-2.5 text-xs uppercase tracking-wide">
                                2. Kewajiban Jangka Panjang (&gt; 1 Tahun - Bank &amp; Leasing)
                              </td>
                            </tr>
                            {panjangLiabilities.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="p-3 pl-5 font-mono text-xs text-gray-600">{row.kode_akun}</td>
                                <td className="p-3">{row.nama_akun}</td>
                                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                                <td className="w-20 p-2 text-center"><DetailButton onClick={() => handleDetail(row)} /></td>
                              </tr>
                            ))}
                            {!panjangLiabilities.length && (
                              <tr><td colSpan="4" className="p-2 pl-5 text-xs italic text-gray-400">Tidak ada hutang jangka panjang</td></tr>
                            )}
                            <tr className="border-b bg-slate-50 text-xs font-semibold text-slate-700">
                              <td colSpan="2" className="p-2 pl-5">Subtotal Kewajiban Jangka Panjang</td>
                              <td className="p-2 text-right">{formatNumber(subtotalPanjang)}</td>
                              <td className="p-2" />
                            </tr>

                            {/* 3. Hutang Lain-lain */}
                            <tr className="bg-slate-100 font-semibold text-slate-800">
                              <td colSpan="4" className="p-2.5 text-xs uppercase tracking-wide">
                                3. Hutang Lain-lain (Perusahaan ke Pribadi / Pemilik)
                              </td>
                            </tr>
                            {lainLainLiabilities.map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="p-3 pl-5 font-mono text-xs text-gray-600">{row.kode_akun}</td>
                                <td className="p-3">{row.nama_akun}</td>
                                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                                <td className="w-20 p-2 text-center"><DetailButton onClick={() => handleDetail(row)} /></td>
                              </tr>
                            ))}
                            {!lainLainLiabilities.length && (
                              <tr><td colSpan="4" className="p-2 pl-5 text-xs italic text-gray-400">Tidak ada hutang ke pihak pribadi / lain-lain</td></tr>
                            )}
                            <tr className="border-b bg-slate-50 text-xs font-semibold text-slate-700">
                              <td colSpan="2" className="p-2 pl-5">Subtotal Hutang Lain-lain</td>
                              <td className="p-2 text-right">{formatNumber(subtotalLainLain)}</td>
                              <td className="p-2" />
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 bg-gray-100 font-bold text-gray-900">
                              <td colSpan="2" className="p-3">TOTAL KEWAJIBAN</td>
                              <td className="p-3 text-right">{formatNumber(report.total_liability)}</td>
                              <td className="p-3" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </section>

                    {/* Tabel Ekuitas */}
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b bg-gray-50 p-3 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800">Ekuitas (Modal)</h2>
                        <span className="text-xs font-semibold text-gray-500">
                          Total: {formatNumber(totalCalculatedEquity)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y">
                            {(report.equities ?? []).map((row) => (
                              <tr key={row.id} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-xs text-gray-600">{row.kode_akun}</td>
                                <td className="p-3">{row.nama_akun}</td>
                                <td className="p-3 text-right">{formatNumber(row.amount)}</td>
                                <td className="w-20 p-2 text-center"><DetailButton onClick={() => handleDetail(row)} /></td>
                              </tr>
                            ))}
                            {!(report.equities ?? []).length && (
                              <tr><td colSpan="4" className="p-4 text-center text-gray-500">Tidak ada akun ekuitas.</td></tr>
                            )}
                            {Number(report.prior_earnings || 0) !== 0 && (
                              <tr className="bg-amber-50/50">
                                <td className="p-3 font-mono text-xs text-amber-700">-</td>
                                <td className="p-3 text-amber-900">Laba Ditahan (Akumulasi Tahun Lalu)</td>
                                <td className="p-3 text-right text-amber-900 font-medium">{formatNumber(report.prior_earnings)}</td>
                                <td className="p-3" />
                              </tr>
                            )}
                            <tr className="bg-indigo-50/40">
                              <td className="p-3 font-mono text-xs text-indigo-700">-</td>
                              <td className="p-3 text-indigo-900">Laba (Rugi) Periode Berjalan</td>
                              <td className="p-3 text-right text-indigo-900 font-medium">{formatNumber(report.current_earnings)}</td>
                              <td className="p-3" />
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="border-t bg-gray-100 font-bold text-gray-900">
                              <td colSpan="2" className="p-3">TOTAL EKUITAS</td>
                              <td className="p-3 text-right">{formatNumber(totalCalculatedEquity)}</td>
                              <td className="p-3" />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </section>

                    {/* Box Rangkuman Penutup: Total Kewajiban & Ekuitas */}
                    <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Total Pasiva</p>
                          <h3 className="text-base font-extrabold text-indigo-950">TOTAL KEWAJIBAN &amp; EKUITAS</h3>
                          <p className="text-xs text-indigo-700">
                            Kewajiban ({formatNumber(report.total_liability)}) + Ekuitas ({formatNumber(totalCalculatedEquity)})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-indigo-950 font-mono">
                            Rp {formatNumber(report.total_liability_equity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Row Rekapitulasi Sejajar di Bawah */}
          <section className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="flex items-center justify-between pr-0 md:pr-4">
                <span className="font-bold text-gray-700 uppercase tracking-wide text-sm">TOTAL ASET (AKTIVA)</span>
                <span className="text-xl font-bold font-mono text-gray-900">Rp {formatNumber(report.total_asset)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 md:pt-0 pl-0 md:pl-4">
                <span className="font-bold text-indigo-900 uppercase tracking-wide text-sm">TOTAL KEWAJIBAN &amp; EKUITAS (PASIVA)</span>
                <span className="text-xl font-bold font-mono text-indigo-900">Rp {formatNumber(report.total_liability_equity)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex flex-wrap items-center justify-between text-xs text-gray-500">
              <span>
                Selisih: Rp {formatNumber(Math.abs(Number(report.total_asset || 0) - Number(report.total_liability_equity || 0)))}
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full ${report.is_balanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {report.is_balanced ? '✓ NERACA SEIMBANG (BALANCED)' : '⚠ NERACA TIDAK SEIMBANG (UNBALANCED)'}
              </span>
            </div>
          </section>
        </>
      )}

      {!report && !loading && !error && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Pilih entitas dan tanggal, lalu klik Tampilkan.
        </div>
      )}

      <BalanceSheetDetailModal
        isOpen={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        settingId={settingId}
        settingName={
          settingId === 'all'
            ? 'Konsolidasi Semua Entitas'
            : settings.find((s) => String(s.id) === String(settingId))?.nama_perusahaan || ''
        }
        tanggal={tanggal}
      />
    </div>
  );
}
