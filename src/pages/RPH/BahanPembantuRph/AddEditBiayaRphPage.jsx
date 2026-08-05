import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  ReceiptText,
  Loader2,
  X,
  AlertCircle,
  Hash
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
      <div className="flex h-screen flex-col bg-slate-50 overflow-hidden items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
        {/* === Sticky Header === */}
        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={handleBack}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">
                    {isEditMode ? 'Edit Biaya RPH' : 'Tambah Biaya RPH'}
                  </h1>
                  <p className="text-xs text-slate-500 truncate hidden sm:block">
                    {isEditMode ? 'Perbarui data biaya operasional RPH' : 'Tambahkan data biaya operasional RPH baru'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </header>

        {/* === Main Content === */}
        <div className="flex-1 min-h-0 overflow-auto p-4 sm:px-6">
          <div className="flex flex-col gap-4">
            {/* Data Biaya Section */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-emerald-600" />
                  Data Biaya
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Item Biaya *</label>
                  <SearchableSelect
                    value={formData.id_item_lain}
                    onChange={(v) => handleChange('id_item_lain', String(v))}
                    options={biayaItemOptions}
                    placeholder={itemLoading ? 'Memuat...' : 'Pilih item biaya'}
                    isLoading={itemLoading}
                    isDisabled={itemLoading}
                    maxMenuHeight={210}
                  />
                  {itemError && <p className="text-[10px] text-orange-500 mt-1">{itemError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Bayar *</label>
                  <input
                    type="text"
                    value={formData.nama_bayar}
                    onChange={(e) => handleChange('nama_bayar', e.target.value)}
                    maxLength={100}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none"
                    placeholder="Masukkan nama pembayaran"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tgl Pembayaran *</label>
                  <input
                    type="date"
                    value={formData.tanggal_pembayaran}
                    onChange={(e) => handleChange('tanggal_pembayaran', e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={formData.harga ? formatNumber(parseNumber(formData.harga)) : ''}
                      onChange={(e) => handleCurrencyChange('harga', e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none text-right tabular-nums"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Pembelian *</label>
                  <SearchableSelect
                    value={formData.jenis_pembelian}
                    onChange={(v) => handleChange('jenis_pembelian', String(v))}
                    options={jenisPembelianOptions}
                    placeholder="Pilih jenis"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bank Pengirim {String(formData.jenis_pembelian) === '1' && '*'}
                  </label>
                  {String(formData.jenis_pembelian) === '1' ? (
                    <SearchableSelect
                      value={formData.bank_pengirim}
                      onChange={(v) => handleChange('bank_pengirim', String(v))}
                      options={filteredBankOptions}
                      placeholder={banksLoading ? 'Memuat...' : 'Pilih Bank'}
                      isLoading={banksLoading}
                      isDisabled={banksLoading}
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value="[001] KAS"
                        readOnly
                        disabled
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peruntukkan</label>
                  <input
                    type="text"
                    value={formData.peruntukkan}
                    onChange={(e) => handleChange('peruntukkan', e.target.value)}
                    maxLength={100}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none"
                    placeholder="Masukkan peruntukkan (opsional)"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => handleChange('keterangan', e.target.value)}
                    rows={3}
                    maxLength={255}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none resize-none"
                    placeholder="Catatan tambahan (opsional, maks 255 karakter)"
                  />
                </div>
              </div>
            </section>
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
    </>
  );
};

export default AddEditBiayaRphPage;
