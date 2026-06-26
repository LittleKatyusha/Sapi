import React, { useState, useEffect } from 'react';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';
import BaseModal from '../../../../../components/shared/modals/BaseModal';
import SearchableSelect from '../../../../../components/shared/SearchableSelect';

const METODE_OPTIONS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer_bca', label: 'Transfer BCA' },
  { value: 'transfer_bni', label: 'Transfer BNI' },
  { value: 'transfer_bri', label: 'Transfer BRI' },
];

const formatRupiah = (val) => {
  return 'Rp ' + (val || 0).toLocaleString('id-ID');
};

const parseNumber = (str) => {
  if (!str) return 0;
  return parseFloat(str.replace(/[^0-9]/g, '')) || 0;
};

const PembayaranModal = ({ isOpen, onClose, row, onSubmit, loading }) => {
  const [nominal, setNominal] = useState('');
  const [metode, setMetode] = useState('');
  const [namaPembayar, setNamaPembayar] = useState('');
  const [errors, setErrors] = useState({});

  const grandTotal = (row?.total_harga || 0) + (row?.biaya_kirim || 0) + (row?.biaya_potong || 0);
  const sisa = row?.sisa_pembayaran || 0;
  const sudahBayar = row?.nominal_pembayaran || 0;

  useEffect(() => {
    if (isOpen) {
      setNominal('');
      setMetode('');
      setNamaPembayar(row?.nama_pembeli || '');
      setErrors({});
    }
  }, [isOpen, row]);

  const handleNominalChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setNominal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
    if (errors.nominal) setErrors((p) => ({ ...p, nominal: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const nominalValue = parseNumber(nominal);

    if (!nominalValue || nominalValue <= 0) {
      newErrors.nominal = 'Nominal pembayaran wajib diisi';
    } else if (nominalValue > sisa) {
      newErrors.nominal = `Nominal tidak boleh melebihi sisa ${formatRupiah(sisa)}`;
    }
    if (!metode) newErrors.metode = 'Pilih metode pembayaran';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      pid: row?.pid,
      nominal_pembayaran: nominalValue,
      metode_pembayaran: metode,
      nama_pembayar: namaPembayar || undefined,
    });
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Pembayaran / Pelunasan" maxWidth="max-w-md" loading={loading}>
      <form onSubmit={handleSubmit}>
        {/* Info Card */}
        <div className="bg-slate-50 rounded-lg p-4 mb-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">No. Transaksi</span>
            <span className="text-sm font-bold text-gray-800">{row?.no_transaksi}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Pembeli</span>
            <span className="text-sm text-gray-700">{row?.nama_pembeli || '-'}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Total Tagihan</span>
            <span className="text-sm font-bold text-gray-800">{formatRupiah(grandTotal)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Sudah Dibayar</span>
            <span className="text-sm text-emerald-600 font-semibold">{formatRupiah(sudahBayar)}</span>
          </div>
          <div className="border-t border-slate-200 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-bold uppercase">Sisa Hutang</span>
            <span className="text-lg font-bold text-red-500">{formatRupiah(sisa)}</span>
          </div>
        </div>

        {/* Nominal */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pembayaran</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
            <input
              type="text"
              value={nominal}
              onChange={handleNominalChange}
              placeholder="0"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
            />
          </div>
          {errors.nominal && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.nominal}
            </p>
          )}
        </div>

        {/* Metode */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
          <SearchableSelect
            options={METODE_OPTIONS}
            value={metode}
            onChange={(val) => {
              setMetode(val || '');
              if (errors.metode) setErrors((p) => ({ ...p, metode: '' }));
            }}
            placeholder="Pilih metode"
            isClearable={false}
          />
          {errors.metode && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.metode}
            </p>
          )}
        </div>

        {/* Nama Pembayar */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pembayar <span className="text-gray-400 font-normal">(opsional)</span></label>
          <input
            type="text"
            value={namaPembayar}
            onChange={(e) => setNamaPembayar(e.target.value)}
            placeholder="Nama orang yang membayar"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Bayar
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default PembayaranModal;
