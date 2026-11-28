import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';
import TrialBalanceDetailModal from './TrialBalanceDetailModal';

const today = new Date().toISOString().slice(0, 10);

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
  // dan saldo akhir (sebelum vs sesudah penyesuaian).
  const [worksheet, setWorksheet] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  // Parameter laporan yang sedang ditampilkan — dipakai popup detail agar angkanya
  // selalu tie-out dengan baris pada tabel (walau filter diubah tanpa "Tampilkan").
  const [reportParams, setReportParams] = useState(null);

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
      const params = {
        setting_id: settingId === 'all' ? 'all' : Number(settingId),
        tanggal_from: tanggalFrom || undefined,
        tanggal_to: tanggalTo || undefined,
        worksheet: worksheet || undefined,
      };
      const response = await accountingService.getTrialBalance(params);
      setReport(response?.data ?? null);
      setReportParams({ settingId, tanggalFrom, tanggalTo, worksheet });
    } catch (e) {
      setReport(null);
      setError(e.message || 'Gagal memuat neraca saldo.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Neraca Saldo</h1>
        <p className="mt-1 text-sm text-gray-500">Keseimbangan saldo debit dan kredit seluruh Chart of Accounts.</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-5 md:items-end md:p-6">
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
          Dari Tanggal <span className="text-xs text-gray-500">(kosongkan = saldo kumulatif)</span>
          <input type="date" value={tanggalFrom} onChange={(e) => setTanggalFrom(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="text-sm text-gray-700">
          Sampai Tanggal
          <input type="date" value={tanggalTo} onChange={(e) => setTanggalTo(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 md:pb-2">
          <input
            type="checkbox"
            checked={worksheet}
            onChange={(e) => setWorksheet(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span>
            Kertas Kerja
            <span className="ml-1 block text-xs text-gray-500">sebelum &amp; sesudah penyesuaian</span>
          </span>
        </label>
        <button type="button" onClick={() => navigate('/akuntansi/opname-perlengkapan')}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Opname Perlengkapan
        </button>
        <button type="button" onClick={() => navigate('/akuntansi/rekonsiliasi-perlengkapan')}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
          Rekonsiliasi Perlengkapan
        </button>
        <button type="button" onClick={loadReport} disabled={loading || !settingId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
      </section>

      {report && report.mode === 'worksheet' && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Kertas kerja neraca saldo — kolom <strong>Mutasi Transaksi</strong> vs <strong>Penyesuaian</strong>.
            Tipe penyesuaian: {(report.adjustment_journal_types ?? []).join(', ')}.
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-2" rowSpan={2}>Kode Akun</th>
                  <th className="p-2" rowSpan={2}>Nama Akun</th>
                  <th className="p-2 text-center" colSpan={2}>Saldo Awal</th>
                  <th className="p-2 text-center" colSpan={2}>Mutasi Transaksi</th>
                  <th className="p-2 text-center" colSpan={2}>Penyesuaian</th>
                  <th className="p-2 text-center" colSpan={2}>Saldo Akhir</th>
                </tr>
                <tr>
                  <th className="p-1 text-right text-xs">Debit</th>
                  <th className="p-1 text-right text-xs">Kredit</th>
                  <th className="p-1 text-right text-xs">Debit</th>
                  <th className="p-1 text-right text-xs">Kredit</th>
                  <th className="p-1 text-right text-xs">Debit</th>
                  <th className="p-1 text-right text-xs">Kredit</th>
                  <th className="p-1 text-right text-xs">Debit</th>
                  <th className="p-1 text-right text-xs">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(report.accounts ?? []).map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="p-2 font-mono">{account.kode_akun}</td>
                    <td className="p-2">{account.nama_akun}</td>
                    <td className="p-2 text-right">{formatNumber(account.saldo_awal_debit)}</td>
                    <td className="p-2 text-right">{formatNumber(account.saldo_awal_credit)}</td>
                    <td className="p-2 text-right">{formatNumber(account.mutasi_debit)}</td>
                    <td className="p-2 text-right">{formatNumber(account.mutasi_credit)}</td>
                    <td className="p-2 text-right">{formatNumber(account.penyesuaian_debit)}</td>
                    <td className="p-2 text-right">{formatNumber(account.penyesuaian_credit)}</td>
                    <td className="p-2 text-right font-medium">{formatNumber(account.saldo_akhir_debit)}</td>
                    <td className="p-2 text-right font-medium">{formatNumber(account.saldo_akhir_credit)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-gray-50 font-bold">
                  <td colSpan={2} className="p-2 text-right">Total</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.saldo_awal_debit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.saldo_awal_credit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.mutasi_debit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.mutasi_credit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.penyesuaian_debit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.penyesuaian_credit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.saldo_akhir_debit)}</td>
                  <td className="p-2 text-right">{formatNumber(report.totals?.saldo_akhir_credit)}</td>
                </tr>
                <tr className="bg-gray-100 text-xs font-semibold">
                  <td colSpan={10} className="p-3 text-center">
                    Status:{' '}
                    <span className={report.is_balanced ? 'text-green-700' : 'text-red-700'}>
                      {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report && report.mode !== 'worksheet' && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Kode Akun</th>
                  <th className="p-3">Nama Akun</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Kredit</th>
                  <th className="w-24 p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(report.accounts ?? []).map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono">{account.kode_akun}</td>
                    <td className="p-3">{account.nama_akun}</td>
                    <td className="p-3 text-right">{formatNumber(account.debit)}</td>
                    <td className="p-3 text-right">{formatNumber(account.credit)}</td>
                    <td className="w-24 p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100"
                        title="Lihat rincian transaksi pembentuk saldo akun"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-gray-50 font-bold">
                  <td colSpan="2" className="p-3 text-right">Total</td>
                  <td className="p-3 text-right">{formatNumber(report.total_debit)}</td>
                  <td className="p-3 text-right">{formatNumber(report.total_credit)}</td>
                  <td className="p-3" />
                </tr>
                <tr className="bg-gray-100 text-xs font-semibold">
                  <td colSpan="5" className="p-3 text-center">
                    Status:{' '}
                    <span className={report.is_balanced ? 'text-green-700' : 'text-red-700'}>
                      {report.is_balanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
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
        settingId={reportParams?.settingId ?? settingId}
        settingName={
          (reportParams?.settingId ?? settingId) === 'all'
            ? 'Konsolidasi Semua Entitas'
            : settings.find((s) => String(s.id) === String(reportParams?.settingId ?? settingId))?.nama_perusahaan || ''
        }
        tanggalFrom={reportParams?.tanggalFrom ?? tanggalFrom}
        tanggalTo={reportParams?.tanggalTo ?? tanggalTo}
      />
    </div>
  );
}
