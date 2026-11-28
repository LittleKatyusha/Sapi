import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Pencil, RefreshCw, TrendingDown } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const firstOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};
const today = new Date().toISOString().slice(0, 10);

const formatQty = (value) => Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 3 });
const formatMoney = (value) =>
  Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const TIPE_BADGE = {
  MASUK: 'bg-green-100 text-green-700',
  KELUAR: 'bg-red-100 text-red-700',
  ADJUST: 'bg-amber-100 text-amber-800',
};

export default function SuppliesStockCardPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ item_id: '', dari: firstOfMonth(), sampai: today });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [notice, setNotice] = useState('');

  const startRename = (item) => {
    setEditingId(item.id);
    setEditName(item.nama ?? '');
  };

  // PSAK 14 — penyesuaian nilai ke NRV (turun/pulih) melalui modal
  const [nrvModal, setNrvModal] = useState(null); // { item, nrv, catatan }
  const [nrvSaving, setNrvSaving] = useState(false);

  const openNrvModal = (item) => {
    setError('');
    setNotice('');
    setNrvModal({ item, nrv: item.nrv ?? '', catatan: '' });
  };

  const submitNrvModal = async () => {
    if (!nrvModal?.item) return;

    const nrv = Number(nrvModal.nrv);

    if (!Number.isFinite(nrv) || nrv < 0) {
      setError('NRV tidak valid.');
      return;
    }

    try {
      setNrvSaving(true);
      setError('');
      const response = await accountingService.writeDownSuppliesItem(nrvModal.item.id, {
        nrv,
        catatan: nrvModal.catatan || null,
      });
      const data = response?.data ?? response;
      setNotice(
        data?.status === 'tidak_ada_penurunan'
          ? data?.message ?? 'Tidak ada penyesuaian nilai.'
          : `${data?.arah === 'naik' ? 'Pemulihan' : 'Penurunan'} nilai ${Number(data?.nilai || 0).toLocaleString('id-ID')} diposting (jurnal #${data?.journal_id ?? '-'}); akumulasi penurunan sekarang ${Number(data?.akumulasi_penurunan || 0).toLocaleString('id-ID')}.`
      );
      setNrvModal(null);
      await loadItems();
      await loadReport();
    } catch (exception) {
      setError(exception?.message || 'Gagal memposting penyesuaian nilai.');
    } finally {
      setNrvSaving(false);
    }
  };

  const saveRename = async (itemId) => {
    const nama = editName.trim();

    if (!nama) {
      setError('Nama barang tidak boleh kosong.');
      return;
    }

    try {
      await accountingService.updateSuppliesItem(itemId, { nama });
      setEditingId(null);
      setEditName('');
      setError('');
      setNotice('Nama barang diperbarui.');
      await loadItems();
      await loadReport();
    } catch (exception) {
      setError(exception?.message || 'Gagal memperbarui nama barang.');
    }
  };

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

  const loadReport = useCallback(async () => {
    if (!settingId) return;

    try {
      setLoading(true);
      setError('');
      const params = {
        setting_id: Number(settingId),
        dari: filters.dari || undefined,
        sampai: filters.sampai || undefined,
      };
      if (filters.item_id) params.item_id = Number(filters.item_id);
      const response = await accountingService.getSuppliesStockCard(params);
      setReport(response?.data ?? null);
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat kartu stok.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [settingId, filters]);

  const loadItems = useCallback(async (id = settingId) => {
    if (!id) return;
    try {
      const response = await accountingService.getSuppliesItems({ setting_id: Number(id) });
      setItems(response?.data ?? []);
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat master perlengkapan.');
    }
  }, [settingId]);

  useEffect(() => {
    if (!settingId) return;
    loadItems(settingId);
    loadReport();
  }, [settingId, loadItems, loadReport]);

  const summary = report?.summary ?? {};
  const mutations = report?.mutations ?? [];
  const itemBalances = report?.items ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kartu Stok Perlengkapan</h1>
          <p className="text-sm text-gray-500">
            Mutasi masuk dari pembelian (COA 118x) dan keluar dari opname perlengkapan, beserta saldo berjalan.
          </p>
        </div>
        <button
          type="button"
          onClick={loadReport}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Unit / Setting</label>
          <SearchableSelect
            className="mt-1"
            options={settingOptions.map((option) => ({ value: String(option.id), label: option.label }))}
            value={settingId}
            onChange={(value) => {
              setSettingId(value ?? '');
              setFilters((prev) => ({ ...prev, item_id: '' }));
            }}
            placeholder="Pilih unit"
            isClearable={false}
            isSearchable
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Barang</label>
          <SearchableSelect
            className="mt-1"
            options={items.map((item) => ({ value: String(item.id), label: item.nama }))}
            value={filters.item_id}
            onChange={(value) => setFilters((prev) => ({ ...prev, item_id: value ?? '' }))}
            placeholder="Semua barang"
            isClearable
            isSearchable
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Dari tanggal</label>
          <input
            type="date"
            value={filters.dari}
            onChange={(event) => setFilters((prev) => ({ ...prev, dari: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Sampai tanggal</label>
          <input
            type="date"
            value={filters.sampai}
            onChange={(event) => setFilters((prev) => ({ ...prev, sampai: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total qty masuk</p>
          <p className="mt-1 text-xl font-semibold text-green-700">{formatQty(summary.total_masuk)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total qty keluar</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{formatQty(summary.total_keluar)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Nilai perolehan periode</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatMoney(summary.nilai_masuk)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FileSpreadsheet className="h-4 w-4" /> Saldo terkini per barang
        </p>
        {itemBalances.length === 0 && <p className="text-sm text-gray-500">Belum ada barang perlengkapan.</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {itemBalances.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <p className="flex items-center gap-1 font-medium text-gray-800">
                {editingId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveRename(item.id)}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setEditName(''); }}
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <span>{item.nama}</span>
                    <span className="text-xs text-gray-500">{item.satuan}</span>
                    <button
                      type="button"
                      onClick={() => startRename(item)}
                      title="Ubah nama barang"
                      className="ml-auto rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openNrvModal(item)}
                      title="Turunkan nilai ke NRV (PSAK 14)"
                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700"
                    >
                      <TrendingDown className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-600">
                Saldo {formatQty(item.saldo_qty)} · Nilai {formatMoney(item.saldo_nilai)} · Harga terakhir{' '}
                {formatMoney(item.harga_terakhir)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-gray-700">Mutasi</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Tanggal</th>
                <th className="px-3 py-2 text-left">Barang</th>
                <th className="px-3 py-2 text-left">Tipe</th>
                <th className="px-3 py-2 text-right">Masuk</th>
                <th className="px-3 py-2 text-right">Keluar</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2 text-right">Nilai</th>
                <th className="px-3 py-2 text-right">Saldo qty</th>
                <th className="px-3 py-2 text-right">Saldo nilai</th>
                <th className="px-3 py-2 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mutations.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-sm text-gray-500">
                    Tidak ada mutasi pada periode ini.
                  </td>
                </tr>
              )}
              {mutations.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-600">{row.tanggal}</td>
                  <td className="px-3 py-2 text-gray-800">{row.nama ?? `#${row.item_id}`}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${TIPE_BADGE[row.tipe] ?? 'bg-gray-100 text-gray-700'}`}>
                      {row.tipe}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-green-700">
                    {row.qty_masuk ? formatQty(row.qty_masuk) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-700">
                    {row.qty_keluar ? formatQty(row.qty_keluar) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.harga)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.nilai)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatQty(row.saldo_qty)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(row.saldo_nilai)}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{row.keterangan ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal penyesuaian NRV (PSAK 14) */}
      {nrvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Penyesuaian Nilai ke NRV</h3>
            <p className="mt-1 text-sm text-gray-500">
              {nrvModal.item.nama} — stok {formatQty(nrvModal.item.saldo_qty)} {nrvModal.item.satuan ?? ''}, nilai tercatat{' '}
              {formatMoney(nrvModal.item.saldo_nilai)}.
              {Number(nrvModal.item.saldo_qty) > 0 && (
                <> Biaya buku per unit {formatMoney(Number(nrvModal.item.saldo_nilai) / Number(nrvModal.item.saldo_qty))}.</>
              )}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">NRV per unit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nrvModal.nrv}
                  onChange={(event) => setNrvModal((prev) => ({ ...prev, nrv: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  NRV lebih kecil → penurunan nilai (DR 6298 / CR 1180). NRV lebih besar → pemulihan (maks. biaya semula).
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan (opsional)</label>
                <input
                  type="text"
                  value={nrvModal.catatan}
                  onChange={(event) => setNrvModal((prev) => ({ ...prev, catatan: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="mis. rusak ringan / harga pasar turun"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNrvModal(null)}
                disabled={nrvSaving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitNrvModal}
                disabled={nrvSaving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {nrvSaving ? 'Menyimpan…' : 'Posting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

