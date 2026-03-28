import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ReceiptText,
  Loader2,
  X,
  AlertCircle,
  Wallet,
  CalendarDays,
  FileText,
  CreditCard,
  UserCircle,
  Package
} from 'lucide-react';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import { useBanksAPILazy } from '../../../hooks/useBanksAPILazy';
import useItemLainLainSelect from '../../ho/pembelianLainLain/hooks/useItemLainLainSelect';
import BiayaRphService from '../../../services/biayaRphService';

const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(value);
};

const parseNumber = (value) => {
  if (!value) return '';
  return value.toString().replace(/\./g, '').replace(/,/g, '');
};

const jenisPembelianOptions = [
  { value: '1', label: 'Bank' },
  { value: '2', label: 'Kas' },
];

const KAS_BANK_ID = '1';

const normalizeJenisPembelian = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue === 'bank' || normalizedValue === '1') return '1';
  if (normalizedValue === 'kas' || normalizedValue === '2') return '2';

  return String(value);
};

const normalizeBankPengirim = (value) => {
  if (!value && value !== 0) return '';

  if (typeof value === 'object') {
    return value.id !== undefined && value.id !== null ? String(value.id) : '';
  }

  return String(value);
};

const normalizeDateForInput = (value) => {
  if (!value) return '';
  return String(value).split(' ')[0];
};

const AddEditBiayaRphPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { bankOptions, loading: banksLoading, fetchBanks } = useBanksAPILazy();
  const {
    itemLainLainOptions,
    loading: itemLoading,
    error: itemError,
  } = useItemLainLainSelect();

  const [formData, setFormData] = useState({
    id_item_lain: '',
    harga: '',
    keterangan: '',
    bank_pengirim: '',
    jenis_pembelian: '',
    nama_bayar: '',
    tanggal_pembayaran: '',
    peruntukkan: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  useEffect(() => {
    if (isEditMode && id) {
      loadEditData();
    }
  }, [id]);

  const loadEditData = async () => {
    setLoadingData(true);
    try {
      const result = await BiayaRphService.show(id);
      if (result.success && result.data) {
        const d = result.data;
        setFormData({
          id_item_lain: d.id_item_lain ? String(d.id_item_lain) : '',
          harga: d.harga ? String(d.harga) : '',
          keterangan: d.keterangan || '',
          bank_pengirim: normalizeBankPengirim(d.bank_pengirim),
          jenis_pembelian: normalizeJenisPembelian(d.jenis_pembelian),
          nama_bayar: d.nama_bayar || '',
          tanggal_pembayaran: normalizeDateForInput(d.tanggal_pembayaran),
          peruntukkan: d.peruntukkan || '',
        });
      } else {
        showNotification('error', result.message || 'Gagal memuat data');
      }
    } catch (error) {
      console.error('Error loading biaya RPH data:', error);
      showNotification('error', 'Gagal memuat data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'jenis_pembelian' && String(value) === '2') {
        updated.bank_pengirim = '';
      }
      return updated;
    });
  }, []);

  const handleCurrencyChange = useCallback((field, rawValue) => {
    const cleaned = rawValue.replace(/[^\d]/g, '');
    setFormData((prev) => ({ ...prev, [field]: cleaned ? formatNumber(cleaned) : '' }));
  }, []);

  const validateForm = () => {
    const checks = [
      [!formData.id_item_lain, 'Item biaya wajib dipilih'],
      [!formData.nama_bayar.trim(), 'Nama bayar wajib diisi'],
      [!formData.tanggal_pembayaran, 'Tanggal pembayaran wajib diisi'],
      [!formData.harga || parseFloat(parseNumber(formData.harga)) <= 0, 'Harga wajib diisi'],
      [!formData.jenis_pembelian, 'Jenis pembelian wajib dipilih'],
      [String(formData.jenis_pembelian) === '1' && !formData.bank_pengirim, 'Bank pengirim wajib dipilih untuk pembayaran Bank'],
    ];

    for (const [condition, message] of checks) {
      if (condition) {
        showNotification('error', message);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        id_item_lain: formData.id_item_lain,
        harga: parseFloat(parseNumber(formData.harga)),
        keterangan: formData.keterangan.trim(),
        bank_pengirim: String(formData.jenis_pembelian) === '1' ? formData.bank_pengirim : KAS_BANK_ID,
        jenis_pembelian: parseInt(formData.jenis_pembelian),
        nama_bayar: formData.nama_bayar.trim(),
        tanggal_pembayaran: formData.tanggal_pembayaran,
        peruntukkan: formData.peruntukkan.trim(),
      };
      if (isEditMode) payload.pid = id;

      const result = isEditMode
        ? await BiayaRphService.update(payload)
        : await BiayaRphService.store(payload);

      if (result.success) {
        showNotification('success', isEditMode ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
        setTimeout(() => navigate('/rph/bahan-pembantu-rph'), 1500);
      } else {
        showNotification('error', result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error submitting biaya RPH form:', error);
      showNotification('error', 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/rph/bahan-pembantu-rph');

  const filteredBankOptions = useMemo(() => {
    if (String(formData.jenis_pembelian) === '1') {
      return bankOptions.filter((option) => option.value !== '1');
    }
    return bankOptions;
  }, [bankOptions, formData.jenis_pembelian]);

  const biayaItemOptions = useMemo(
    () => itemLainLainOptions.filter((option) => option.originalData?.klasifikasi === 'BIAYA-BIAYA'),
    [itemLainLainOptions]
  );

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-none mx-0 space-y-6">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <ReceiptText className="w-8 h-8 text-emerald-600" />
                  {isEditMode ? 'Edit Biaya RPH Bank/Kas' : 'Tambah Biaya RPH Bank/Kas'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {isEditMode ? 'Perbarui data biaya bank/kas RPH' : 'Tambahkan data biaya bank/kas RPH baru'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-2xl px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-1 mb-5">
            <h2 className="text-lg font-bold text-gray-900">Data Biaya RPH</h2>
            <p className="text-sm text-gray-500">Lengkapi informasi pembayaran bank/kas untuk kebutuhan operasional.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Package className="w-4 h-4" />
                Item Biaya <span className="text-red-500 ml-1">*</span>
              </label>
              <SearchableSelect
                value={formData.id_item_lain}
                onChange={(v) => handleChange('id_item_lain', String(v))}
                options={biayaItemOptions}
                placeholder={itemLoading ? 'Memuat item...' : 'Pilih item biaya'}
                isLoading={itemLoading}
                isDisabled={itemLoading}
                maxMenuHeight={210}
              />
              {itemError && <p className="text-xs text-orange-500 mt-1">⚠️ {itemError}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <UserCircle className="w-4 h-4" />
                Nama Bayar <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.nama_bayar}
                onChange={(e) => handleChange('nama_bayar', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                placeholder="Masukkan nama pembayaran"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <CalendarDays className="w-4 h-4" />
                Tanggal Pembayaran <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal_pembayaran}
                onChange={(e) => handleChange('tanggal_pembayaran', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="w-4 h-4" />
                Harga <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                <input
                  type="text"
                  value={formData.harga ? formatNumber(parseNumber(formData.harga)) : ''}
                  onChange={(e) => handleCurrencyChange('harga', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200 text-right"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <CreditCard className="w-4 h-4" />
                Jenis Pembelian <span className="text-red-500 ml-1">*</span>
              </label>
              <SearchableSelect
                value={formData.jenis_pembelian}
                onChange={(v) => handleChange('jenis_pembelian', String(v))}
                options={jenisPembelianOptions}
                placeholder="Pilih jenis pembayaran"
              />
            </div>

            {String(formData.jenis_pembelian) === '1' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <CreditCard className="w-4 h-4" />
                  Bank Pengirim <span className="text-red-500 ml-1">*</span>
                </label>
                <SearchableSelect
                  value={formData.bank_pengirim}
                  onChange={(v) => handleChange('bank_pengirim', String(v))}
                  options={filteredBankOptions}
                  placeholder={banksLoading ? 'Memuat...' : 'Pilih Bank Pengirim'}
                  isLoading={banksLoading}
                  isDisabled={banksLoading}
                />
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4" />
                Peruntukkan
              </label>
              <input
                type="text"
                value={formData.peruntukkan}
                onChange={(e) => handleChange('peruntukkan', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                placeholder="Masukkan peruntukkan (opsional)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4" />
                Keterangan
              </label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                rows={3}
                maxLength={255}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none transition-all duration-200"
                placeholder="Catatan tambahan (opsional, maks 255 karakter)"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleBack}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl px-6 py-2.5 transition-all duration-200 font-semibold text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-2xl px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Data' : 'Simpan Data')}
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${
              notification.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="p-4 flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                </p>
                <p className="mt-0.5 text-sm text-gray-500">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditBiayaRphPage;
