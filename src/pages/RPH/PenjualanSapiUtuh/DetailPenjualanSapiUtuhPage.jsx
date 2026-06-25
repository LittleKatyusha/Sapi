import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, User, Truck, Scissors, CreditCard,
  Beef, Calendar, Phone, MapPin, Package, FileText, Image,
  Edit2, Printer
} from 'lucide-react';
import usePenjualanSapiUtuh from '../../../hooks/usePenjualanSapiUtuh';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  cancelled: { label: 'Batal', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-400' },
};

const BAYAR_CONFIG = {
  lunas: { label: 'Lunas', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  dp: { label: 'DP', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
  belum_bayar: { label: 'Belum Bayar', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

const DetailRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '-'}</p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, color, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
      <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color.icon}`} />
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const DetailPenjualanSapiUtuhPage = () => {
  const navigate = useNavigate();
  const { pid } = useParams();
  const { loading, fetchDetail } = usePenjualanSapiUtuh();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const result = await fetchDetail(pid);
    if (result.success) setData(result.data);
  }, [fetchDetail, pid]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const s = STATUS_CONFIG[data.status_transaksi] || STATUS_CONFIG.draft;
  const b = BAYAR_CONFIG[data.status_pembayaran] || BAYAR_CONFIG.belum_bayar;
  const penjualLabel = { cv_puput: 'CV Puput', reseller: 'Reseller' }[data.penjual] || data.penjual;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/rph/penjualan-sapi-utuh')}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{data.no_transaksi}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.bg} ${s.text} border ${s.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
                  {b.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.tanggal_transaksi} • PIC: {data.pic || '-'} • {penjualLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.status_transaksi === 'draft' && (
              <button
                onClick={() => navigate(`/rph/penjualan-sapi-utuh/edit/${pid}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Transaksi */}
          <SectionCard title="Transaksi" icon={User} color={{ bg: 'bg-blue-50', icon: 'text-blue-600' }}>
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow label="PIC" value={data.pic} icon={User} />
              <DetailRow label="Penjual" value={penjualLabel} />
              <DetailRow label="Pembeli" value={data.nama_pembeli} icon={User} />
              <DetailRow label="No HP Pembeli" value={data.no_hp_pembeli} icon={Phone} />
              <DetailRow label="Tipe" value={data.tipe_penjualan?.toUpperCase()} />
              <DetailRow label="Jangka Waktu" value={data.jangka_waktu} />
              <DetailRow label="Tanggal" value={data.tanggal_transaksi} icon={Calendar} />
              {data.reseller && (
                <DetailRow label="Reseller" value={`${data.reseller.nama} (${data.reseller.kode})`} />
              )}
              {data.keterangan && (
                <div className="col-span-2 pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Keterangan" value={data.keterangan} icon={FileText} />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pengiriman */}
          <SectionCard title="Pengiriman" icon={Truck} color={{ bg: 'bg-orange-50', icon: 'text-orange-600' }}>
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Metode" value={data.pengiriman} icon={Truck} />
              <DetailRow label="Tanggal Terima" value={data.tanggal_terima || '-'} icon={Calendar} />
              <DetailRow label="Tempat Terima" value={data.tempat_terima} />
              <DetailRow label="Penerima" value={data.nama_penerima || '-'} icon={User} />
              <DetailRow label="No HP Penerima" value={data.no_hp_penerima || '-'} icon={Phone} />
              <DetailRow label="Biaya Kirim" value={data.biaya_kirim ? `Rp ${data.biaya_kirim.toLocaleString('id-ID')}` : '-'} icon={CreditCard} />
              {data.alamat_pengiriman && (
                <div className="col-span-2 pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Alamat Pengiriman" value={data.alamat_pengiriman} icon={MapPin} />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pemotongan */}
          <SectionCard title="Pemotongan" icon={Scissors} color={{ bg: 'bg-purple-50', icon: 'text-purple-600' }}>
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Jenis" value={data.jenis_pemotongan} icon={Scissors} />
              <DetailRow label="Biaya Potong" value={data.biaya_potong ? `Rp ${data.biaya_potong.toLocaleString('id-ID')}` : '-'} icon={CreditCard} />
              <DetailRow label="Tanggal Potong" value={data.tanggal_potong || '-'} icon={Calendar} />
              <DetailRow label="Packing" value={data.packing} icon={Package} />
              {data.catatan && (
                <div className="col-span-2 pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Catatan" value={data.catatan} icon={FileText} />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pembayaran */}
          <SectionCard title="Pembayaran" icon={CreditCard} color={{ bg: 'bg-teal-50', icon: 'text-teal-600' }}>
            <div className="grid grid-cols-2 gap-x-6">
              <DetailRow label="Nominal" value={`Rp ${data.nominal_pembayaran?.toLocaleString('id-ID') || 0}`} icon={CreditCard} />
              <DetailRow label="Metode" value={data.metode_pembayaran || '-'} />
              <DetailRow label="Nama Pembayar" value={data.nama_pembayar || '-'} icon={User} />
              <DetailRow label="DP" value={`Rp ${data.dp_amount?.toLocaleString('id-ID') || 0}`} />
              <DetailRow label="Sisa" value={`Rp ${data.sisa_pembayaran?.toLocaleString('id-ID') || 0}`} />
              {data.bukti_bayar_url && (
                <div className="col-span-2 pt-2 mt-2 border-t border-gray-50">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Bukti Pembayaran</p>
                  <a href={data.bukti_bayar_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Image className="w-4 h-4" /> Lihat Bukti Bayar
                  </a>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Detail Sapi */}
        <SectionCard title="Detail Sapi" icon={Beef} color={{ bg: 'bg-red-50', icon: 'text-red-600' }}>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  <th className="text-left px-5 py-3">No. Eartag</th>
                  <th className="text-left px-5 py-3">Merk</th>
                  <th className="text-right px-5 py-3">Berat (kg)</th>
                  <th className="text-right px-5 py-3">Harga/kg</th>
                  <th className="text-right px-5 py-3">Harga Jual</th>
                  <th className="text-right px-5 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.details?.map((d, i) => (
                  <tr key={d.id || i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{d.no_eartag || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{d.merk || '-'}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{d.berat}</td>
                    <td className="px-5 py-3 text-right text-gray-700">Rp {d.harga_per_kg?.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-right text-gray-700">Rp {d.harga_jual?.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">Rp {d.subtotal?.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
                {!data.details?.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-sm">Tidak ada detail sapi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Total */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Ringkasan Pembayaran</p>
                <p className="text-xs text-gray-500">{data.total_berat} kg • {data.details?.length || 0} ekor</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 text-right">
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase">Total Harga</p>
                <p className="text-lg font-bold text-emerald-600">Rp {data.total_harga?.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase">Biaya Kirim</p>
                <p className="text-sm font-semibold text-gray-700">Rp {data.biaya_kirim?.toLocaleString('id-ID') || 0}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase">Biaya Potong</p>
                <p className="text-sm font-semibold text-gray-700">Rp {data.biaya_potong?.toLocaleString('id-ID') || 0}</p>
              </div>
              <div className="border-l border-gray-200 pl-6 sm:pl-10">
                <p className="text-[11px] text-gray-400 font-medium uppercase">Grand Total</p>
                <p className="text-xl font-bold text-gray-900">
                  Rp {((data.total_harga || 0) + (data.biaya_kirim || 0) + (data.biaya_potong || 0)).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPenjualanSapiUtuhPage;
