import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Truck, Loader2, AlertCircle, PackageCheck, PackageOpen,
  MapPin, Calendar, Phone, User, Save
} from 'lucide-react';
import usePenjualanSapiUtuh from '../../../../hooks/usePenjualanSapiUtuh';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const PENGIRIMAN_OPTIONS = [
  { value: 'dikirim', label: 'Dikirim' },
  { value: 'dipotong_rph_dikirim', label: 'Dipotong di RPH dan Dikirim' },
  { value: 'dipotong_rph_diambil', label: 'Dipotong di RPH dan Diambil' },
  { value: 'diambil', label: 'Diambil' },
  { value: 'belum_diketahui', label: 'Belum Diketahui' },
];

const STATUS_CONFIG = {
  belum_berangkat: { label: 'Belum Berangkat', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  sudah_berangkat: { label: 'Sudah Berangkat', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  sudah_diterima: { label: 'Sudah Diterima', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');

const PengirimanPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { fetchDetail, updateDelivery } = usePenjualanSapiUtuh();

  const [penjualan, setPenjualan] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [notif, setNotif] = useState({ show: false, type: '', message: '' });

  const [formData, setFormData] = useState({
    pengiriman: '',
    tanggal_berangkat: '',
    tanggal_diterima: '',
    tanggal_terima: '',
    tempat_terima: '',
    biaya_kirim: '',
    alamat_pengiriman: '',
    nama_penerima: '',
    no_hp_penerima: '',
    nama_pengirim: '',
    status_pengiriman: 'belum_berangkat',
  });

  const loadData = async () => {
    const result = await fetchDetail(pid);
    if (result.success && result.data) {
      const d = result.data;
      setPenjualan(d);
      setFormData({
        pengiriman: d.pengiriman || 'belum_diketahui',
        tanggal_berangkat: d.tanggal_berangkat || '',
        tanggal_diterima: d.tanggal_diterima || '',
        tanggal_terima: d.tanggal_terima || '',
        tempat_terima: d.tempat_terima || '',
        biaya_kirim: d.biaya_kirim?.toString() || '',
        alamat_pengiriman: d.alamat_pengiriman || '',
        nama_penerima: d.nama_penerima || '',
        no_hp_penerima: d.no_hp_penerima || '',
        nama_pengirim: d.nama_pengirim || '',
        status_pengiriman: d.status_pengiriman || 'belum_berangkat',
      });
    }
  };

  useEffect(() => {
    if (pid) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'no_hp_penerima') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else if (name === 'biaya_kirim') {
      const num = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, [name]: num ? parseFloat(num).toLocaleString('id-ID') : '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (status) => {
    const updates = { status_pengiriman: status };
    const today = new Date().toISOString().split('T')[0];
    if (status === 'sudah_berangkat' && !formData.tanggal_berangkat) {
      updates.tanggal_berangkat = today;
    }
    if (status === 'sudah_diterima' && !formData.tanggal_diterima) {
      updates.tanggal_diterima = today;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const payload = {
      pid,
      status_pengiriman: formData.status_pengiriman,
      pengiriman: formData.pengiriman || undefined,
      tanggal_berangkat: formData.tanggal_berangkat || undefined,
      tanggal_diterima: formData.tanggal_diterima || undefined,
      tanggal_terima: formData.tanggal_terima || undefined,
      tempat_terima: formData.tempat_terima || undefined,
      biaya_kirim: formData.biaya_kirim ? parseFloat(formData.biaya_kirim.replace(/[^0-9]/g, '')) : undefined,
      alamat_pengiriman: formData.alamat_pengiriman || undefined,
      nama_penerima: formData.nama_penerima || undefined,
      no_hp_penerima: formData.no_hp_penerima || undefined,
      nama_pengirim: formData.nama_pengirim || undefined,
    };

    const result = await updateDelivery(payload);
    if (result.success) {
      setNotif({ show: true, type: 'success', message: 'Data pengiriman berhasil diperbarui' });
      setTimeout(() => {
        navigate('/rph/penjualan-sapi-utuh');
      }, 1200);
    } else {
      setNotif({ show: true, type: 'error', message: result.message || 'Gagal memperbarui pengiriman' });
    }
    setSubmitLoading(false);
  };

  const statusConfig = STATUS_CONFIG[formData.status_pengiriman] || STATUS_CONFIG.belum_berangkat;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-500" />
              Update Pengiriman
            </h1>
            <p className="text-sm text-gray-500">
              {penjualan?.no_transaksi} • {penjualan?.nama_pembeli}
            </p>
          </div>
        </div>

        {/* Notification */}
        {notif.show && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${notif.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{notif.message}</p>
            <button onClick={() => setNotif({ show: false })} className="ml-auto text-xs font-bold underline">Tutup</button>
          </div>
        )}

        {/* Transaction Info */}
        {penjualan && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Pembeli</p>
              <p className="text-sm font-bold text-gray-800">{penjualan.nama_pembeli || '-'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
              <p className="text-sm font-bold text-emerald-600">{formatRupiah(penjualan.total_harga)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Status Transaksi</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{penjualan.status_transaksi}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500 font-medium uppercase">Status Pengiriman</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-orange-600" />
                Ubah Status
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('belum_berangkat')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    formData.status_pengiriman === 'belum_berangkat'
                      ? 'bg-gray-50 border-gray-300 text-gray-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <PackageOpen className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold">Belum Berangkat</p>
                    <p className="text-xs text-gray-500">Menunggu pengiriman</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('sudah_berangkat')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    formData.status_pengiriman === 'sudah_berangkat'
                      ? 'bg-sky-50 border-sky-300 text-sky-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-sky-50 hover:border-sky-200'
                  }`}
                >
                  <PackageOpen className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold">Sudah Berangkat</p>
                    <p className="text-xs text-gray-500">Barang sudah dikirim</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('sudah_diterima')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    formData.status_pengiriman === 'sudah_diterima'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  <PackageCheck className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold">Sudah Diterima</p>
                    <p className="text-xs text-gray-500">Barang sampai tujuan</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  Detail Pengiriman
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipe Pengiriman</label>
                    <SearchableSelect
                      value={formData.pengiriman}
                      options={PENGIRIMAN_OPTIONS}
                      onChange={(val) => setFormData((prev) => ({ ...prev, pengiriman: val || '' }))}
                      placeholder="Pilih tipe pengiriman"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Biaya Kirim</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="text"
                        name="biaya_kirim"
                        value={formData.biaya_kirim}
                        onChange={handleChange}
                        placeholder="0"
                        disabled={formData.pengiriman === 'diambil' || formData.pengiriman === 'dipotong_rph_diambil' || formData.pengiriman === 'belum_diketahui'}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Berangkat
                    </label>
                    <input
                      type="date"
                      name="tanggal_berangkat"
                      value={formData.tanggal_berangkat}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Diterima
                    </label>
                    <input
                      type="date"
                      name="tanggal_diterima"
                      value={formData.tanggal_diterima}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Terima (Estimasi / Realisasi)
                    </label>
                    <input
                      type="date"
                      name="tanggal_terima"
                      value={formData.tanggal_terima}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Tempat Terima
                    </label>
                    <input
                      type="text"
                      name="tempat_terima"
                      value={formData.tempat_terima}
                      onChange={handleChange}
                      placeholder="Lokasi penerimaan"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {(formData.pengiriman === 'dikirim' || formData.pengiriman === 'dipotong_rph_dikirim') && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Alamat Pengiriman
                      </label>
                      <textarea
                        name="alamat_pengiriman"
                        value={formData.alamat_pengiriman}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Alamat lengkap pengiriman"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                      />
                    </div>
                  )}

                  {(formData.pengiriman === 'dikirim' || formData.pengiriman === 'dipotong_rph_dikirim') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Nama Penerima
                      </label>
                      <input
                        type="text"
                        name="nama_penerima"
                        value={formData.nama_penerima}
                        onChange={handleChange}
                        placeholder="Nama penerima"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}

                  {(formData.pengiriman === 'dikirim' || formData.pengiriman === 'dipotong_rph_dikirim') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> Nama Pengirim
                      </label>
                      <input
                        type="text"
                        name="nama_pengirim"
                        value={formData.nama_pengirim}
                        onChange={handleChange}
                        placeholder="Nama pengirim"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}

                  {(formData.pengiriman === 'dikirim' || formData.pengiriman === 'dipotong_rph_dikirim') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> No HP Penerima
                      </label>
                      <input
                        type="tel"
                        name="no_hp_penerima"
                        value={formData.no_hp_penerima}
                        onChange={handleChange}
                        placeholder="081234567890"
                        className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-bold hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50"
                  >
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitLoading ? 'Menyimpan...' : 'Simpan Pengiriman'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengirimanPage;
