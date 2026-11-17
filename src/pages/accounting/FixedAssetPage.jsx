import { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import accountingService from '../../services/accountingService';
import CreateAssetModal from './CreateAssetModal';

const fmt = (v) => Number(v || 0).toLocaleString('id-ID');

export default function FixedAssetPage() {
  const [settings, setSettings] = useState([]);
  const [sid, setSid] = useState('');
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [depDate, setDepDate] = useState(new Date().toISOString().slice(0, 10));

  // Revaluation modal state
  const [revalueModal, setRevalueModal] = useState({ open: false, asset: null, nilai_baru: '', catatan: '' });

  useEffect(() => {
    (async () => {
      try {
        const [sr, cr] = await Promise.all([accountingService.getSettings(), accountingService.getCoa()]);
        setSettings(sr?.data ?? []);
        setAccounts((cr?.data ?? []).filter((a) => a.is_posting));
        if (sr?.data?.length) setSid(String(sr.data[0].id));
      } catch (err) {
        setError(err.message || 'Gagal memuat data master akuntansi.');
      }
    })();
  }, []);

  const load = async () => {
    if (!sid) return;
    setLoading(true);
    setError('');
    try {
      const r = await accountingService.getAssets({ setting_id: Number(sid) });
      setAssets(r?.data ?? []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [sid]);

  const depreciate = async () => {
    setError('');
    setSuccess('');
    try {
      const r = await accountingService.runDepreciation({ setting_id: Number(sid), tanggal: depDate });
      setSuccess(`Depresiasi selesai: ${r?.data?.posted ?? 0} jurnal aset susut diposting.`);
      load();
    } catch (e) {
      setError(e.message || 'Gagal menjalankan depresiasi.');
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
      });
      setSuccess(`Nilai pasar aset ${revalueModal.asset.nama_aset} berhasil diperbarui.`);
      setRevalueModal({ open: false, asset: null, nilai_baru: '', catatan: '' });
      load();
    } catch (err) {
      setError(err.message || 'Gagal memperbarui nilai pasar.');
    }
  };

  const currentSetting = useMemo(
    () => settings.find((s) => String(s.id) === String(sid)),
    [settings, sid]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Aset (Aset Tetap & Investasi)</h1>
          <p className="text-sm text-gray-500">
            Pencatatan aset dengan penyusutan berkala (mobil/mesin) atau kenaikan nilai pasar (emas/tanah).
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

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!sid}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aset Baru</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Eksekusi Depresiasi Bulanan */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-amber-900 text-sm">Hitung Penyusutan Bulanan (Aset Susut Saja)</h3>
          <p className="text-xs text-amber-700">Otomatis membuat jurnal beban depresiasi untuk kendaraan/mesin aktif.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={depDate}
            onChange={(e) => setDepDate(e.target.value)}
            className="border border-amber-300 rounded px-2.5 py-1 text-sm bg-white"
          />
          <button
            onClick={depreciate}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded text-sm transition cursor-pointer"
          >
            Jalankan Depresiasi
          </button>
        </div>
      </div>

      {/* Tabel Aset */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 text-base">Daftar Kepemilikan Aset</h2>
          <span className="text-xs text-gray-500 font-medium">Total: {assets.length} aset</span>
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
                  const currentVal = isNaik
                    ? (a.nilai_pasar_terkini ?? a.harga_perolehan)
                    : isSusut
                    ? (a.harga_perolehan - (a.akumulasi_depresiasi || 0))
                    : a.harga_perolehan;

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
                      <td className="p-3">
                        {isSusut && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            📉 Susut ({a.umur_bulan || 0} bln)
                          </span>
                        )}
                        {isNaik && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            📈 Apresiasi / Naik
                          </span>
                        )}
                        {a.tipe_valuasi === 'tetap' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            ⏹️ Nilai Tetap
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
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            a.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : a.status === 'disposed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isNaik && a.status === 'active' && (
                          <button
                            onClick={() => handleOpenRevalue(a)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-2.5 py-1 rounded transition"
                          >
                            Update Harga Pasar
                          </button>
                        )}
                        {!isNaik && <span className="text-xs text-gray-400">-</span>}
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
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevalueModal({ open: false, asset: null, nilai_baru: '', catatan: '' })}
                  className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded text-sm transition"
                >
                  Simpan Nilai Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Aset Baru */}
      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setSuccess('Aset berhasil ditambahkan.');
          load();
        }}
        selectedSettingId={sid}
        settingName={currentSetting ? `${currentSetting.nama_perusahaan} (${currentSetting.entitas})` : ''}
        accounts={accounts}
      />
    </div>
  );
}
