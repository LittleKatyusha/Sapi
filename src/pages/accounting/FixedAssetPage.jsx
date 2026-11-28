import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Trash2, Pencil, PackagePlus } from 'lucide-react';
import accountingService from '../../services/accountingService';
import EditAssetModal from './EditAssetModal';

const fmt = (v) => Number(v || 0).toLocaleString('id-ID');

/** Local (not UTC) YYYY-MM-DD, so the default date does not shift a day in WIB. */
const todayLocal = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};

const STATUS_LABEL = {
  active: 'Aktif',
  fully_depreciated: 'Habis Susut',
  disposed: 'Dilepas',
};

const STATUS_CLASS = {
  active: 'bg-green-100 text-green-700',
  fully_depreciated: 'bg-amber-100 text-amber-800',
  disposed: 'bg-red-100 text-red-700',
};

export default function FixedAssetPage() {
  const [settings, setSettings] = useState([]);
  const [sid, setSid] = useState('');
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [running, setRunning] = useState(false);

  const [depDate, setDepDate] = useState(todayLocal());

  // Revaluation modal state
  const [revalueModal, setRevalueModal] = useState({ open: false, asset: null, nilai_baru: '', catatan: '' });

  // Disposal modal state
  const [disposeModal, setDisposeModal] = useState({ open: false, asset: null, tanggal: '', nilai_disposal: '', reason: '' });

  // Edit / configure asset modal state
  const [editModal, setEditModal] = useState({ open: false, asset: null });

  useEffect(() => {
    (async () => {
      try {
        const [sr, cr] = await Promise.all([accountingService.getSettings(), accountingService.getCoa()]);
        setSettings(sr?.data ?? []);
        setAccounts((cr?.data ?? []).filter((a) => a.is_posting && a.is_active));
        if (sr?.data?.length) setSid(String(sr.data[0].id));
      } catch (err) {
        setError(err.message || 'Gagal memuat data master akuntansi.');
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!sid) return;
    setLoading(true);
    setError('');
    try {
      const r = await accountingService.getAssets({ setting_id: Number(sid) });
      setAssets(r?.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sid]);

  useEffect(() => {
    load();
  }, [load]);

  const depreciate = async () => {
    if (!sid || running) return;
    setError('');
    setSuccess('');
    setRunning(true);
    try {
      const r = await accountingService.runDepreciation({ setting_id: Number(sid), tanggal: depDate });
      const result = r?.data ?? {};
      const posted = result.posted ?? 0;
      const failed = result.failed ?? [];

      if (failed.length) {
        setError(
          `${posted} jurnal diposting, ${failed.length} aset gagal: ` +
            failed.map((f) => `${f.asset} (${f.reason})`).join('; ')
        );
      } else {
        setSuccess(
          posted > 0
            ? `Depresiasi selesai: ${posted} jurnal aset susut diposting.`
            : 'Tidak ada periode depresiasi baru untuk diposting.'
        );
      }
      load();
    } catch (e) {
      setError(e.message || 'Gagal menjalankan depresiasi.');
    } finally {
      setRunning(false);
    }
  };

  const handleOpenRevalue = (asset) => {
    setRevalueModal({
      open: true,
      asset,
      nilai_baru: asset.nilai_pasar_terkini ?? asset.harga_perolehan,
      catatan: '',
    });
  };

  const submitRevalue = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await accountingService.revalueAsset(revalueModal.asset.id, {
        nilai_pasar_terkini: Number(revalueModal.nilai_baru),
        catatan: revalueModal.catatan,
        tanggal: todayLocal(),
      });
      setSuccess(`Nilai pasar aset ${revalueModal.asset.nama_aset} berhasil diperbarui dan jurnal revaluasi diposting.`);
      setRevalueModal({ open: false, asset: null, nilai_baru: '', catatan: '' });
      load();
    } catch (err) {
      setError(err.message || 'Gagal memperbarui nilai pasar.');
    }
  };

  const handleOpenDispose = (asset) => {
    setDisposeModal({
      open: true,
      asset,
      tanggal: todayLocal(),
      nilai_disposal: '',
      reason: '',
    });
  };

  const submitDispose = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await accountingService.disposeAsset(disposeModal.asset.id, {
        tanggal: disposeModal.tanggal,
        nilai_disposal: Number(disposeModal.nilai_disposal || 0),
        reason: disposeModal.reason,
      });
      setSuccess(`Aset ${disposeModal.asset.nama_aset} berhasil dilepas.`);
      setDisposeModal({ open: false, asset: null, tanggal: '', nilai_disposal: '', reason: '' });
      load();
    } catch (err) {
      setError(err.message || 'Gagal melepas aset.');
    }
  };

  const handleOpenEdit = (asset) => {
    setEditModal({ open: true, asset });
  };

  const totalBookValue = useMemo(
    () =>
      assets
        .filter((a) => a.status !== 'disposed')
        .reduce((sum, a) => {
          const val = Number(
            a.nilai_buku ??
              (a.tipe_valuasi === 'apresiasi'
                ? (a.nilai_pasar_terkini ?? a.harga_perolehan)
                : (!a.tipe_valuasi || a.tipe_valuasi === 'depresiasi'
                    ? a.harga_perolehan - (a.akumulasi_depresiasi || 0)
                    : a.harga_perolehan))
          );
          return sum + (isNaN(val) ? 0 : val);
        }, 0),
    [assets]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Aset (Aset Tetap & Investasi)</h1>
          <p className="text-sm text-gray-500">
            Pencatatan aset dengan penyusutan berkala (mobil/mesin) atau kenaikan nilai pasar (emas/tanah).
          </p>
          <p className="mt-1 text-xs font-medium text-indigo-600">
            Aset baru otomatis dibuat dari menu Pembelian Lain-Lain → tab Pembelian Aset.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {settings.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama_perusahaan} ({s.entitas})
              </option>
            ))}
          </select>

          <Link
            to="/ho/pembelian-lain-lain"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Input dari Pembelian Lain-Lain</span>
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Eksekusi Depresiasi Bulanan */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-amber-900 text-sm">Hitung Penyusutan Bulanan (Aset Susut Saja)</h3>
          <p className="text-xs text-amber-700">
            Otomatis membuat jurnal beban depresiasi untuk semua periode yang belum terposting. Periode yang sudah
            diposting tidak akan diulang.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={depDate}
            onChange={(e) => setDepDate(e.target.value)}
            disabled={running}
            className="border border-amber-300 rounded px-2.5 py-1 text-sm bg-white disabled:opacity-60"
          />
          <button
            onClick={depreciate}
            disabled={!sid || running}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded text-sm transition disabled:opacity-60 cursor-pointer"
          >
            {running && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {running ? 'Memproses...' : 'Jalankan Depresiasi'}
          </button>
        </div>
      </div>

      {/* Tabel Aset */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-base">Daftar Kepemilikan Aset</h2>
          <span className="text-xs text-gray-500 font-medium">
            Total: {assets.length} aset · Nilai buku aktif: Rp {fmt(totalBookValue)}
          </span>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Memuat data aset...</p>
        ) : assets.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">Belum ada aset terdaftar pada entitas ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="p-3">Kode & Nama</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Kode Inventaris</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Penanggung Jawab</th>
                  <th className="p-3 text-center">Kondisi</th>
                  <th className="p-3 text-center">Jumlah</th>
                  <th className="p-3">Tipe Valuasi</th>
                  <th className="p-3 text-right">Harga Beli</th>
                  <th className="p-3 text-right">Akum. Susut</th>
                  <th className="p-3 text-right">Nilai Sekarang</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {assets.map((a) => {
                  const isSusut = !a.tipe_valuasi || a.tipe_valuasi === 'depresiasi';
                  const isNaik = a.tipe_valuasi === 'apresiasi';
                  const currentVal = Number(
                    a.nilai_buku ??
                      (isNaik
                        ? (a.nilai_pasar_terkini ?? a.harga_perolehan)
                        : (isSusut ? a.harga_perolehan - (a.akumulasi_depresiasi || 0) : a.harga_perolehan))
                  );

                  return (
                    <tr key={a.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{a.nama_aset}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span>{a.kode_aset}</span>
                          {a.ref_table === 'tr_pembelian_ho_lainlain' && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Auto dari Pembelian
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 capitalize text-gray-600">{a.kategori || 'Lainnya'}</td>
                      <td className="p-3 font-mono text-xs">{a.kode_inventaris || '-'}</td>
                      <td className="p-3 text-xs">{a.lokasi || '-'}</td>
                      <td className="p-3 text-xs">{a.penanggung_jawab || '-'}</td>
                      <td className="p-3 text-center text-xs capitalize">{a.kondisi ? String(a.kondisi).replace('_', ' ') : '-'}</td>
                      <td className="p-3 text-center text-xs">{a.jumlah ?? 1}</td>
                      <td className="p-3">
                        {isSusut && (
                          a.umur_bulan && Number(a.umur_bulan) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Susut ({a.umur_bulan} bln)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ Belum Diatur
                            </span>
                          )
                        )}
                        {isNaik && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Apresiasi / Naik
                          </span>
                        )}
                        {a.tipe_valuasi === 'tetap' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            Nilai Tetap
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">{fmt(a.harga_perolehan)}</td>
                      <td className="p-3 text-right text-gray-500">
                        {isSusut ? fmt(a.akumulasi_depresiasi) : '-'}
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {fmt(currentVal)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_CLASS[a.status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {a.status === 'disposed' ? (
                          <span className="text-xs text-gray-400">-</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded transition cursor-pointer font-medium border ${
                                (!a.umur_bulan || Number(a.umur_bulan) <= 0) && isSusut
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 font-semibold shadow-xs'
                                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                              title="Atur / Edit parameter aset"
                            >
                              <Pencil className="h-3 w-3" />
                              {(!a.umur_bulan || Number(a.umur_bulan) <= 0) && isSusut ? 'Atur Umur' : 'Edit'}
                            </button>
                            {isNaik && (
                              <button
                                onClick={() => handleOpenRevalue(a)}
                                className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1 rounded transition cursor-pointer"
                              >
                                Update Harga Pasar
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDispose(a)}
                              className="inline-flex items-center gap-1 bg-gray-100 hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 text-xs px-2.5 py-1 rounded transition cursor-pointer"
                              title="Lepas / jual aset"
                            >
                              <Trash2 className="h-3 w-3" />
                              Lepas
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Revaluasi Nilai Pasar */}
      {revalueModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Update Nilai Pasar (Revaluasi)</h3>
            <p className="text-sm text-gray-600">
              Aset: <strong className="text-gray-800">{revalueModal.asset?.nama_aset}</strong> ({revalueModal.asset?.kode_aset})
            </p>
            <form onSubmit={submitRevalue} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Beli Awal (Rp)</label>
                <input
                  type="text"
                  disabled
                  value={fmt(revalueModal.asset?.harga_perolehan)}
                  className="bg-gray-100 border border-gray-300 rounded px-3 py-1.5 text-sm w-full text-gray-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nilai Pasar Baru (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={revalueModal.nilai_baru}
                  onChange={(e) => setRevalueModal({ ...revalueModal, nilai_baru: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full font-semibold"
                  placeholder="Masukkan estimasi harga pasar terkini"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan / Alasan Penyesuaian</label>
                <textarea
                  rows="2"
                  value={revalueModal.catatan}
                  onChange={(e) => setRevalueModal({ ...revalueModal, catatan: e.target.value })}
                  placeholder="Misal: Penyesuaian harga Antam per gram hari ini"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                />
              </div>
              <p className="text-xs text-gray-500">
                Selisih akan otomatis dijurnal: kenaikan ke Surplus Revaluasi, penurunan memakai surplus terlebih dahulu.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevalueModal({ open: false, asset: null, nilai_baru: '', catatan: '' })}
                  className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded text-sm transition cursor-pointer"
                >
                  Simpan Nilai Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pelepasan Aset */}
      {disposeModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Lepas / Jual Aset</h3>
            <p className="text-sm text-gray-600">
              Aset: <strong className="text-gray-800">{disposeModal.asset?.nama_aset}</strong> ({disposeModal.asset?.kode_aset})
            </p>
            <p className="text-xs text-gray-500">
              Nilai buku saat ini: Rp {fmt(disposeModal.asset?.nilai_buku)}
            </p>
            <form onSubmit={submitDispose} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Pelepasan</label>
                <input
                  type="date"
                  required
                  value={disposeModal.tanggal}
                  onChange={(e) => setDisposeModal({ ...disposeModal, tanggal: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nilai Jual / Disposal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={disposeModal.nilai_disposal}
                  onChange={(e) => setDisposeModal({ ...disposeModal, nilai_disposal: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full font-semibold"
                  placeholder="0 jika aset dihapuskan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alasan *</label>
                <textarea
                  rows="2"
                  required
                  value={disposeModal.reason}
                  onChange={(e) => setDisposeModal({ ...disposeModal, reason: e.target.value })}
                  placeholder="Misal: Dijual ke pihak ketiga / rusak berat"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisposeModal({ open: false, asset: null, tanggal: '', nilai_disposal: '', reason: '' })}
                  className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-1.5 rounded text-sm transition cursor-pointer"
                >
                  Proses Pelepasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Atur Parameter Aset */}
      <EditAssetModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, asset: null })}
        onSuccess={() => {
          setSuccess(`Parameter aset ${editModal.asset?.nama_aset} berhasil diperbarui.`);
          load();
        }}
        asset={editModal.asset}
        accounts={accounts}
      />
    </div>
  );
}
