import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Scale } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const today = new Date().toISOString().slice(0, 10);

const formatQty = (value) => Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 });

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function SuppliesReconciliationPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [sampai, setSampai] = useState(today);
  const [result, setResult] = useState(null);
  const [disclosure, setDisclosure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await accountingService.getSettings();
        const list = response?.data ?? [];
        setSettings(list);
        if (list.length) setSettingId(String(list[0].id));
      } catch (exception) {
        setError(exception?.message || 'Gagal memuat master akunting.');
      }
    })();
  }, []);

  const settingOptions = useMemo(
    () => settings.map((setting) => ({ id: setting.id, label: `${setting.nama_perusahaan} (${setting.entitas})` })),
    [settings]
  );

  const load = useCallback(async () => {
    if (!settingId) return;

    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getSuppliesReconciliation({
        setting_id: Number(settingId),
        sampai: sampai || undefined,
      });
      setResult(response?.data ?? null);

      // PSAK 14 — pengungkapan (kebijakan & nilai tercatat)
      try {
        const disc = await accountingService.getSuppliesDisclosure({
          setting_id: Number(settingId),
          sampai: sampai || undefined,
        });
        setDisclosure(disc?.data ?? null);
      } catch (error) {
        setDisclosure(null);
      }
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat rekonsiliasi perlengkapan.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [settingId, sampai]);

  useEffect(() => {
    load();
  }, [load]);

  const seimbang = result?.status === 'seimbang';
  const selisih = Number(result?.selisih ?? 0);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekonsiliasi Perlengkapan</h1>
          <p className="text-sm text-gray-500">
            Membandingkan saldo akun perlengkapan (118x) di buku besar dengan nilai kartu stok.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-gray-600">Unit / Setting</label>
          <SearchableSelect
            className="mt-1"
            options={settingOptions.map((option) => ({ value: String(option.id), label: option.label }))}
            value={settingId}
            onChange={(value) => setSettingId(value ?? '')}
            placeholder="Pilih unit"
            isClearable={false}
            isSearchable
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Posisi sampai tanggal</label>
          <input
            type="date"
            value={sampai}
            onChange={(event) => setSampai(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <div
            className={`w-full rounded-lg px-3 py-2 text-center text-sm font-semibold ${
              seimbang ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {result ? (seimbang ? 'Seimbang' : 'Selisih terdeteksi') : 'Belum ada data'}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Saldo akun 118x (buku besar)</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatMoney(result?.gl_perlengkapan)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Nilai kartu stok</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatMoney(result?.kartu_stok_nilai)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Selisih</p>
          <p className={`mt-1 text-xl font-semibold ${Math.abs(selisih) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
            {formatMoney(selisih)}
          </p>
        </div>
      </div>

      {/* Rincian kartu stok per barang */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">Rincian Kartu Stok per Barang</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Barang</th>
                <th className="px-3 py-2 text-right">Saldo qty</th>
                <th className="px-3 py-2 text-right">Harga terakhir</th>
                <th className="px-3 py-2 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(result?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-500">Belum ada barang perlengkapan.</td>
                </tr>
              )}
              {(result?.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 text-gray-800">
                    {item.nama} <span className="text-xs text-gray-500">{item.satuan}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatQty(item.saldo_qty)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(item.harga_terakhir)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{formatMoney(item.saldo_nilai)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={3}>Total nilai kartu stok</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(result?.kartu_stok_nilai)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Rincian buku besar akun 118x */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">Rincian Buku Besar Akun Perlengkapan (118x)</p>
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Jurnal</th>
                <th className="px-3 py-2 text-left">Akun</th>
                <th className="px-3 py-2 text-left">Tipe</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Kredit</th>
                <th className="px-3 py-2 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(result?.gl_mutations ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-gray-500">Belum ada mutasi akun 118x.</td>
                </tr>
              )}
              {(result?.gl_mutations ?? []).map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">{row.tanggal}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-800">{row.nomor_jurnal}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.kode_akun}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{row.tipe_jurnal}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-green-700">{row.debit ? formatMoney(row.debit) : '-'}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-700">{row.credit ? formatMoney(row.credit) : '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{row.keterangan}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={4}>Saldo akun 118x</td>
                <td className="px-3 py-2 text-right tabular-nums" colSpan={3}>{formatMoney(result?.gl_perlengkapan)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* PSAK 14 — pengungkapan kebijakan & nilai tercatat */}
      {disclosure && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-sm">
          <p className="mb-2 font-semibold text-indigo-800">Catatan PSAK 14 — Kebijakan Persediaan Perlengkapan</p>
          <ul className="mb-3 list-disc space-y-1 pl-5 text-indigo-900/80">
            <li><span className="font-medium">Metode biaya:</span> {disclosure.kebijakan?.metode}</li>
            <li><span className="font-medium">Pengukuran:</span> {disclosure.kebijakan?.pengukuran}</li>
            <li><span className="font-medium">Pengakuan beban:</span> {disclosure.kebijakan?.pengakuan_beban}</li>
            <li><span className="font-medium">Surplus opname:</span> {disclosure.kebijakan?.surplus}</li>
          </ul>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Nilai tercatat</p>
              <p className="font-semibold">{formatMoney(disclosure.nilai_tercatat)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Mutasi masuk</p>
              <p className="font-semibold">{formatMoney(disclosure.mutasi?.masuk)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Mutasi keluar</p>
              <p className="font-semibold">{formatMoney(disclosure.mutasi?.keluar)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Penurunan nilai</p>
              <p className="font-semibold text-red-600">{formatMoney(disclosure.mutasi?.penurunan_nilai)}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="mb-1 text-xs font-semibold text-gray-600">Mutasi cadangan penurunan nilai</p>
            <div className="grid gap-2 sm:grid-cols-4 text-xs">
              <div>
                <p className="text-gray-500">Saldo awal</p>
                <p className="font-semibold">{formatMoney(disclosure.cadangan_penurunan?.saldo_awal)}</p>
              </div>
              <div>
                <p className="text-gray-500">Penambahan</p>
                <p className="font-semibold text-red-600">{formatMoney(disclosure.cadangan_penurunan?.penambahan)}</p>
              </div>
              <div>
                <p className="text-gray-500">Pemulihan</p>
                <p className="font-semibold text-emerald-600">{formatMoney(disclosure.cadangan_penurunan?.pemulihan)}</p>
              </div>
              <div>
                <p className="text-gray-500">Saldo akhir</p>
                <p className="font-semibold">{formatMoney(disclosure.cadangan_penurunan?.saldo_akhir)}</p>
              </div>
            </div>
          </div>
          {(disclosure.barang ?? []).some((row) => Number(row.potensi_penurunan) > 0) && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠️ Ada barang dengan NRV di bawah biaya rata-rata — potensi penurunan nilai{' '}
              <strong>{formatMoney(disclosure.total_potensi_penurunan)}</strong>. Gunakan aksi “NRV” di Kartu Stok.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <p className="flex items-center gap-2 font-semibold text-gray-700">
          <Scale className="h-4 w-4" /> Cara membaca
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Selisih <strong>positif</strong>: buku besar lebih besar — biasanya karena penyesuaian manual tanpa qty
            (modal “darurat”) atau opname memakai harga lebih rendah dari harga perolehan.</li>
          <li>Selisih <strong>negatif</strong>: kartu stok lebih besar — stok fisik mungkin belum diopname atau ada
            pembelian yang belum dijurnal.</li>
          <li>Jalankan opname perlengkapan agar nilai dan qty kembali sinkron.</li>
        </ul>
      </div>
    </div>
  );
}
