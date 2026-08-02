import React from 'react';
import { CreditCard, FileText, Truck, User, X } from 'lucide-react';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getHeader = (data) => data?.penjualan || {};
const getDetailItems = (data) => data?.detail_items || data?.details || data?.detail || [];
const getPedagangName = (data, header) => (
  header.nama_pedagang
  || data?.pedagang?.nama_alias
  || data?.pedagang?.nama_identitas
  || '-'
);
const getPedagangCode = (data, header) => (
  header.kode_pedagang
  || header.id_pedagang
  || data?.pedagang?.id_pedagang
  || '-'
);
const getPaymentStatus = (status) => {
  if (Number(status) === 1) return 'Lunas';
  if (Number(status) === 0) return 'DP';
  return 'Belum Bayar';
};
const getBankLabel = (header) => {
  if (!header.nama_bank) return '-';
  return `${header.nama_bank}${header.kode_bank ? ` (${header.kode_bank})` : ''}`;
};
const getSapiLabel = (item) => (
  item.code_eartag
  || item.eartag
  || item.eartag_sapi
  || item.id_pembelian_ho_detail
  || '-'
);
const getItemWeight = (item) => Number(item.berat_paha_depan_kg || 0) + Number(item.berat_paha_belakang_kg || 0);
const getItemPrice = (item) => Number(item.harga_karkas_aktual ?? item.harga_satuan ?? item.harga ?? 0);
const getItemSubtotal = (item) => {
  if (item.total_harga !== undefined && item.total_harga !== null) return Number(item.total_harga);
  const nominalKarkas = getItemWeight(item) * getItemPrice(item);
  const nominalKulit = item.perlakuan_kulit === 'DIAMBIL' ? Number(item.nominal_kulit || 0) : 0;
  return nominalKarkas + nominalKulit;
};

const DetailKarkasModal = ({ isOpen, onClose, data }) => {
  const header = getHeader(data);
  const detailItems = getDetailItems(data);

  if (!isOpen || !header) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detail Penjualan Karkas</h2>
            <p className="mt-1 text-sm text-slate-500">Informasi header transaksi, pengiriman, dan detail sapi.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500"><FileText className="h-4 w-4" /> No Kwitansi</div>
              <div className="font-mono text-sm font-semibold text-slate-800">{header.no_kwitansi || header.nota_sistem || '-'}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500"><User className="h-4 w-4" /> Pedagang</div>
              <div className="text-sm font-semibold text-slate-800">{getPedagangName(data, header)}</div>
              <div className="mt-1 text-xs text-slate-500">{getPedagangCode(data, header)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /> Pembayaran</div>
              <div className="text-sm font-semibold text-slate-800">{String(header.tipe_pembayaran) === '2' ? 'Bank' : 'Cash'}</div>
              <div className="mt-1 text-xs text-slate-500">Status: {getPaymentStatus(header.payment_status ?? header.status_pembayaran)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500"><Truck className="h-4 w-4" /> Pengiriman</div>
              <div className="text-sm font-semibold text-slate-800">{header.pengiriman || header.metode_pengiriman || '-'}</div>
              <div className="mt-1 text-xs text-slate-500">Tanggal: {formatDate(header.tanggal_penjualan || header.tgl_penjualan || header.tgl_pemotongan)}</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-900">Informasi Pembayaran</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3"><span>Total Berat</span><span className="font-semibold text-slate-900">{Number(header.total_berat || 0).toFixed(3)} Kg</span></div>
                <div className="flex justify-between gap-3"><span>Total Harga Item</span><span className="font-semibold text-slate-900">{formatCurrency(header.total_harga)}</span></div>
                <div className="flex justify-between gap-3"><span>Biaya Pengiriman</span><span className="font-semibold text-slate-900">{formatCurrency(header.biaya_pengiriman || header.biaya_kirim || header.ongkos_kirim)}</span></div>
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-3"><span>Grand Total Tagihan</span><span className="font-bold text-slate-950">{formatCurrency(header.total_bayar || header.total_tagihan)}</span></div>
                <div className="flex justify-between gap-3"><span>Saldo Pedagang Digunakan</span><span className="font-semibold text-sky-700">{formatCurrency(header.penggunaan_saldo || 0)}</span></div>
                <div className="flex justify-between gap-3"><span>Telah Dibayar</span><span className="font-semibold text-emerald-700">{formatCurrency(header.total_terbayar || header.nominal_pembayaran || 0)}</span></div>
                <div className="flex justify-between gap-3"><span>Sisa Tagihan</span><span className="font-semibold text-rose-700">{formatCurrency(header.sisa_pembayaran ?? Math.max(0, Number(header.total_bayar || header.total_tagihan || 0) - Number(header.total_terbayar || header.nominal_pembayaran || 0)))}</span></div>
                <div className="flex justify-between gap-3 border-t border-slate-100 pt-3"><span>Bank</span><span className="font-semibold text-slate-900">{getBankLabel(header)}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-900">Informasi Pengiriman</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3"><span>Metode</span><span className="font-semibold text-slate-900">{header.pengiriman || header.metode_pengiriman || '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Pengirim</span><span className="font-semibold text-slate-900">{header.nama_pengirim || '-'}</span></div>
                <div className="flex justify-between gap-3"><span>No HP Pengirim</span><span className="font-semibold text-slate-900">{header.no_hp_pengirim || '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Kendaraan</span><span className="font-semibold text-slate-900">{header.jenis_kendaraan ? `${header.jenis_kendaraan} - ${header.plat_nomor || '-'}` : '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Penerima</span><span className="font-semibold text-slate-900">{header.nama_penerima || '-'}</span></div>
                <div>
                  <div className="mb-1 text-slate-500">Alamat Pengiriman</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-800">{header.alamat_pengiriman || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {(header.keterangan || header.note) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="text-sm font-semibold text-amber-700">Catatan</div>
              <div className="mt-1 text-sm text-slate-700">{header.keterangan || header.note}</div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">Detail Sapi</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Sapi</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Berat Karkas (Kg)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Harga / Kg</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Kulit</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailItems.map((item, index) => (
                    <tr key={`${item.id_pembelian_ho_detail || item.id || index}-${index}`}>
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{getSapiLabel(item)}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{item.klasifikasi || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{getItemWeight(item).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(getItemPrice(item))}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{item.perlakuan_kulit || '-'}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{Number(item.berat_kulit_kg || item.berat_kulit || 0).toFixed(3)} Kg</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(getItemSubtotal(item))}</td>
                    </tr>
                  ))}
                  {!detailItems.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Detail sapi belum tersedia.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailKarkasModal;
