import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Plus, Trash2, Wallet } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const today = () => new Date().toISOString().split('T')[0];

const SetoranKarkasModal = ({
  isOpen,
  onClose,
  penjualan,
  setoranList = [],
  loading = false,
  actionLoading = false,
  onFetch,
  onStore,
  onDelete,
}) => {
  const [form, setForm] = useState({
    nilai_setoran: '',
    tgl_setoran: today(),
    metode_pembayaran: 'TUNAI',
    nomor_referensi: '',
    keterangan: '',
  });
  const [error, setError] = useState('');

  const pid = penjualan?.pid || penjualan?.penjualan?.pid;

  useEffect(() => {
    if (!isOpen || !pid || !onFetch) return;
    onFetch(pid);
  }, [isOpen, pid, onFetch]);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      nilai_setoran: '',
      tgl_setoran: today(),
      metode_pembayaran: 'TUNAI',
      nomor_referensi: '',
      keterangan: '',
    });
    setError('');
  }, [isOpen]);

  const totalSetoran = useMemo(
    () => setoranList.reduce((sum, row) => sum + Number(row.nilai_setoran || 0), 0),
    [setoranList]
  );

  const totalTagihan = Number(penjualan?.total_bayar || penjualan?.penjualan?.total_bayar || 0);
  const sisaTagihan = Math.max(0, totalTagihan - totalSetoran);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const nilai = Number(form.nilai_setoran || 0);
    if (!pid) {
      setError('Data penjualan tidak valid');
      return;
    }
    if (nilai <= 0) {
      setError('Nilai setoran wajib lebih dari 0');
      return;
    }

    const res = await onStore?.({
      pid_penjualan: pid,
      nilai_setoran: nilai,
      tgl_setoran: form.tgl_setoran,
      metode_pembayaran: form.metode_pembayaran,
      nomor_referensi: form.nomor_referensi,
      keterangan: form.keterangan,
    });

    if (res?.success) {
      setForm({
        nilai_setoran: '',
        tgl_setoran: today(),
        metode_pembayaran: 'TUNAI',
        nomor_referensi: '',
        keterangan: '',
      });
      await onFetch?.(pid);
    } else {
      setError(res?.message || 'Gagal menyimpan setoran');
    }
  };

  const remove = async (row) => {
    if (!row?.pid) return;
    const ok = window.confirm(`Hapus setoran ${formatCurrency(row.nilai_setoran)}?`);
    if (!ok) return;

    const res = await onDelete?.(row.pid);
    if (res?.success) await onFetch?.(pid);
    else setError(res?.message || 'Gagal menghapus setoran');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Wallet size={20} />
              Kelola Setoran
            </h2>
            <p className="text-sm text-gray-500">
              {penjualan?.nota_sistem || penjualan?.penjualan?.nota_sistem || '-'} ·{' '}
              {penjualan?.nama_pedagang || penjualan?.pedagang?.nama_alias || '-'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded border bg-gray-50 p-4">
            <div className="text-xs uppercase text-gray-500">Total Tagihan</div>
            <div className="text-lg font-semibold">{formatCurrency(totalTagihan)}</div>
          </div>
          <div className="rounded border bg-green-50 p-4">
            <div className="text-xs uppercase text-gray-500">Total Setoran</div>
            <div className="text-lg font-semibold text-green-700">{formatCurrency(totalSetoran)}</div>
          </div>
          <div className="rounded border bg-orange-50 p-4">
            <div className="text-xs uppercase text-gray-500">Sisa Tagihan</div>
            <div className="text-lg font-semibold text-orange-700">{formatCurrency(sisaTagihan)}</div>
          </div>
        </div>

        <form onSubmit={submit} className="border-y bg-gray-50 px-6 py-4">
          {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nilai Setoran</label>
              <input
                type="number"
                min="0"
                value={form.nilai_setoran}
                onChange={(e) => setForm((f) => ({ ...f, nilai_setoran: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
              <input
                type="date"
                value={form.tgl_setoran}
                onChange={(e) => setForm((f) => ({ ...f, tgl_setoran: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Metode</label>
              <select
                value={form.metode_pembayaran}
                onChange={(e) => setForm((f) => ({ ...f, metode_pembayaran: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="TUNAI">Tunai</option>
                <option value="TRANSFER BCA">Transfer BCA</option>
                <option value="TRANSFER BNI">Transfer BNI</option>
                <option value="TRANSFER BRI">Transfer BRI</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">No. Referensi</label>
              <input
                value={form.nomor_referensi}
                onChange={(e) => setForm((f) => ({ ...f, nomor_referensi: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Opsional"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Tambah
              </button>
            </div>
          </div>

          <div className="mt-3">
            <input
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Keterangan setoran (opsional)"
            />
          </div>
        </form>

        <div className="max-h-[360px] overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 animate-spin" size={18} />
              Memuat setoran...
            </div>
          ) : setoranList.length === 0 ? (
            <div className="rounded border border-dashed py-8 text-center text-sm text-gray-500">
              Belum ada setoran.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Nilai</th>
                  <th className="px-3 py-2">Metode</th>
                  <th className="px-3 py-2">Referensi</th>
                  <th className="px-3 py-2">Keterangan</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {setoranList.map((row) => (
                  <tr key={row.pid || row.id} className="border-b">
                    <td className="px-3 py-2">{row.tgl_setoran || '-'}</td>
                    <td className="px-3 py-2 font-medium">{formatCurrency(row.nilai_setoran)}</td>
                    <td className="px-3 py-2">{row.metode_pembayaran || '-'}</td>
                    <td className="px-3 py-2">{row.nomor_referensi || '-'}</td>
                    <td className="px-3 py-2">{row.keterangan || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => remove(row)}
                        disabled={actionLoading}
                        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-60"
                        title="Hapus setoran"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetoranKarkasModal;
