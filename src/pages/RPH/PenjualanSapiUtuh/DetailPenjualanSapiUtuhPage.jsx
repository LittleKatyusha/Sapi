import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, User, Truck, Scissors, CreditCard,
  Beef, Calendar, Phone, MapPin, Package, FileText, Image as ImageIcon,
  Edit2, Printer, AlertCircle, Weight, Tag, Receipt, Home, RotateCcw, CheckCircle2,
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

const fmtRp = (v) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

const DetailRow = ({ label, value, icon: Icon, full }) => (
  <div className={`flex items-start gap-3 py-2.5 ${full ? 'col-span-full' : ''}`}>
    {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium break-words">{value || '-'}</p>
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, color, action, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md hover:border-gray-200">
    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color.icon}`} />
        </div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatPill = ({ label, value, tone = 'gray', icon: Icon }) => {
  const tones = {
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  };
  return (
    <div className={`px-4 py-3 rounded-xl border ${tones[tone]} flex items-center gap-3`}>
      {Icon && <Icon className="w-5 h-5 opacity-70 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-sm font-bold mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
};

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

  const grandTotal = (data.total_harga || 0) + (data.biaya_kirim || 0) + (data.biaya_potong || 0);
  const totalEkor = data.details?.filter(d => Number(d.status) !== 2).length || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1600px] mx-auto space-y-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <button onClick={() => navigate('/')} className="hover:text-gray-700 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Beranda
          </button>
          <span className="text-gray-300">/</span>
          <button onClick={() => navigate('/rph/penjualan-sapi-utuh')} className="hover:text-gray-700">
            Penjualan Sapi Utuh
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium">Detail</span>
        </nav>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/rph/penjualan-sapi-utuh')}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition shrink-0"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{data.no_transaksi}</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${s.bg} ${s.text} border ${s.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${b.bg} ${b.text} border ${b.border}`}>
                    {b.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {data.tanggal_transaksi}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> PIC: {data.pic || '-'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> {penjualLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data.status_transaksi === 'draft' && (
                <button
                  onClick={() => navigate(`/rph/penjualan-sapi-utuh/edit/${pid}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <Printer className="w-4 h-4" /> Cetak
              </button>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
            <StatPill label="Total Berat" value={`${data.total_berat || 0} kg`} tone="amber" icon={Weight} />
            <StatPill label="Jumlah Ekor" value={`${totalEkor} ekor`} tone="sky" icon={Beef} />
            <StatPill label="Total Harga" value={fmtRp(data.total_harga)} tone="emerald" icon={Receipt} />
            <StatPill label="Grand Total" value={fmtRp(grandTotal)} tone="violet" icon={ShoppingCart} />
          </div>
        </div>

        {/* Info Grid - 4 columns on xl */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Transaksi */}
          <SectionCard title="Transaksi" icon={User} color={{ bg: 'bg-blue-50', icon: 'text-blue-600' }}>
            <div className="grid grid-cols-1 gap-x-4">
              <DetailRow label="PIC" value={data.pic} icon={User} />
              <DetailRow label="Penjual" value={penjualLabel} icon={Tag} />
              <DetailRow label="Pembeli" value={data.nama_pembeli} icon={User} />
              <DetailRow label="No HP Pembeli" value={data.no_hp_pembeli} icon={Phone} />
              <DetailRow label="Tipe Penjualan" value={data.tipe_penjualan?.toUpperCase()} icon={CreditCard} />
              <DetailRow label="Jangka Waktu" value={data.jangka_waktu} icon={Calendar} />
              <DetailRow label="Tanggal" value={data.tanggal_transaksi} icon={Calendar} />
              {data.reseller && (
                <DetailRow label="Reseller" value={`${data.reseller.nama} (${data.reseller.kode})`} icon={Tag} />
              )}
              {data.keterangan && (
                <div className="pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Keterangan" value={data.keterangan} icon={FileText} full />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pengiriman */}
          <SectionCard title="Pengiriman" icon={Truck} color={{ bg: 'bg-orange-50', icon: 'text-orange-600' }}>
            <div className="grid grid-cols-1 gap-x-4">
              <DetailRow label="Metode" value={data.pengiriman} icon={Truck} />
              <DetailRow label="Tanggal Terima" value={data.tanggal_terima || '-'} icon={Calendar} />
              <DetailRow label="Tempat Terima" value={data.tempat_terima || '-'} icon={MapPin} />
              {(data.pengiriman === 'dikirim' || data.pengiriman === 'dipotong_rph_dikirim') && (
                <>
                  <DetailRow label="Penerima" value={data.nama_penerima || '-'} icon={User} />
                  <DetailRow label="No HP Penerima" value={data.no_hp_penerima || '-'} icon={Phone} />
                  <DetailRow label="Biaya Kirim" value={data.biaya_kirim ? fmtRp(data.biaya_kirim) : '-'} icon={CreditCard} />
                </>
              )}
              {(data.pengiriman === 'dikirim' || data.pengiriman === 'dipotong_rph_dikirim') && data.alamat_pengiriman && (
                <div className="pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Alamat Pengiriman" value={data.alamat_pengiriman} icon={MapPin} full />
                </div>
              )}
              {data.status_pengiriman === 'return' && data.alasan_return && (
                <div className="pt-2 mt-2 border-t border-red-100">
                  <DetailRow label="Alasan Return" value={data.alasan_return} icon={AlertCircle} full />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pemotongan */}
          <SectionCard title="Pemotongan" icon={Scissors} color={{ bg: 'bg-purple-50', icon: 'text-purple-600' }}>
            <div className="grid grid-cols-1 gap-x-4">
              <DetailRow label="Jenis" value={data.jenis_pemotongan} icon={Scissors} />
              <DetailRow label="Biaya Potong" value={data.biaya_potong ? fmtRp(data.biaya_potong) : '-'} icon={CreditCard} />
              <DetailRow label="Tanggal Potong" value={data.tanggal_potong || '-'} icon={Calendar} />
              <DetailRow label="Packing" value={data.packing} icon={Package} />
              {data.catatan && (
                <div className="pt-2 mt-2 border-t border-gray-50">
                  <DetailRow label="Catatan" value={data.catatan} icon={FileText} full />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Pembayaran */}
          <SectionCard title="Pembayaran" icon={CreditCard} color={{ bg: 'bg-teal-50', icon: 'text-teal-600' }}>
            <div className="grid grid-cols-1 gap-x-4">
              <DetailRow label="Nominal" value={fmtRp(data.nominal_pembayaran)} icon={CreditCard} />
              <DetailRow label="Metode" value={data.metode_pembayaran || '-'} icon={CreditCard} />
              <DetailRow label="Nama Pembayar" value={data.nama_pembayar || '-'} icon={User} />
              <DetailRow label="DP" value={fmtRp(data.dp_amount)} icon={Receipt} />
              <DetailRow label="Sisa" value={fmtRp(data.sisa_pembayaran)} icon={AlertCircle} />
              {data.bukti_bayar_url && (
                <div className="pt-2 mt-2 border-t border-gray-50">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Bukti Pembayaran</p>
                  <a href={data.bukti_bayar_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <ImageIcon className="w-4 h-4" /> Lihat Bukti Bayar
                  </a>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Detail Sapi Table - full width */}
        <SectionCard
          title="Detail Sapi"
          icon={Beef}
          color={{ bg: 'bg-red-50', icon: 'text-red-600' }}
          action={<span className="text-xs font-medium text-gray-400">{totalEkor} ekor</span>}
        >
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 font-medium uppercase tracking-wider bg-gray-50/50">
                  <th className="text-left px-5 py-3 w-12">No.</th>
                  <th className="text-left px-5 py-3">Eartag & Supplier</th>
                  <th className="text-left px-5 py-3">Merk</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Berat</th>
                  <th className="text-right px-5 py-3">Harga/kg</th>
                  <th className="text-right px-5 py-3">Harga Jual</th>
                  <th className="text-right px-5 py-3">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.details?.map((d, i) => {
                  const isReturn = Number(d.status) === 2;
                  const returnStrike = isReturn ? 'line-through text-gray-400' : '';
                  return (
                  <tr key={d.id || i} className={`border-b border-gray-50 transition ${isReturn ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-emerald-50/30'}`}>
                    <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Tag className={`w-3.5 h-3.5 ${isReturn ? 'text-red-600' : 'text-emerald-600'}`} />
                          <span className={`font-mono font-semibold ${isReturn ? 'text-red-700 line-through' : 'text-gray-800'}`}>{d.no_eartag || '-'}</span>
                        </div>
                        {d.eartag_supplier && (
                          <div className="flex items-center gap-1.5 pl-5">
                            <span className="text-[11px] text-gray-400">Supplier:</span>
                            <span className={`font-mono text-xs ${returnStrike}`}>{d.eartag_supplier}</span>
                          </div>
                        )}
                        {isReturn && (
                          <div className="flex flex-wrap items-center gap-1.5 pl-5 mt-0.5">
                            {d.tgl_return && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                <Calendar className="w-3 h-3" /> {d.tgl_return}
                              </span>
                            )}
                            {d.kondisi_return && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-medium">
                                <AlertCircle className="w-3 h-3" /> {d.kondisi_return}
                              </span>
                            )}
                            {d.catatan_return && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-500 italic">
                                "{d.catatan_return}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-3 ${isReturn ? 'text-red-400 line-through' : 'text-gray-600'}`}>{d.merk || '-'}</td>
                    <td className="px-5 py-3">
                      {isReturn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-semibold">
                          <RotateCcw className="w-3 h-3" /> Return
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 ${returnStrike}`}>
                        <Weight className="w-3.5 h-3.5 text-gray-400" />
                        {d.berat} kg
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right ${returnStrike}`}>{fmtRp(d.harga_per_kg)}</td>
                    <td className={`px-5 py-3 text-right ${returnStrike}`}>{fmtRp(d.harga_jual)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${isReturn ? 'text-red-600 line-through' : 'text-emerald-600'}`}>{fmtRp(d.subtotal)}</td>
                  </tr>
                  );
                })}
                {!data.details?.length && (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center text-gray-400">
                      <Beef className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Tidak ada detail sapi</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {data.details?.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                    <td colSpan="4" className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Total {totalEkor} Ekor
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">
                      {data.total_berat || 0} kg
                    </td>
                    <td colSpan="2" className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Total Harga
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600 text-base">
                      {fmtRp(data.total_harga)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </SectionCard>

        {/* Summary Bar */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-lg p-5 sm:p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold opacity-90">Ringkasan Pembayaran</p>
                <p className="text-xs opacity-75">{data.total_berat || 0} kg • {totalEkor} ekor</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Total Harga</p>
                <p className="text-base font-bold mt-0.5">{fmtRp(data.total_harga)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Biaya Kirim</p>
                <p className="text-base font-bold mt-0.5">{fmtRp(data.biaya_kirim)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Biaya Potong</p>
                <p className="text-base font-bold mt-0.5">{fmtRp(data.biaya_potong)}</p>
              </div>
              <div className="border-l border-white/20 pl-4 lg:pl-8">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Grand Total</p>
                <p className="text-xl font-bold mt-0.5">{fmtRp(grandTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPenjualanSapiUtuhPage;
