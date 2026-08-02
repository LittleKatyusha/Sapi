import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  FileText,
  Loader2,
  Save,
  ShoppingCart,
  X
} from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import usePersetujuanRphSelect from '../Pembelian Sapi/hooks/usePersetujuanRphSelect';
import useParameterSelect from '../Pembelian Sapi/hooks/useParameterSelect';
import PilihPakanOvkModal from './modals/PilihPakanOvkModal';
import RphPembelianService from '../../../../services/rphPembelianService';

const PAGE_VARIANTS = {
  universal: {
    key: 'universal',
    entityName: 'Pembelian',
    pageTitle: 'Tambah Pembelian RPH',
    subtitle:
      'Pilih jenis pembelian terlebih dahulu, lalu lengkapi data dan item yang akan diajukan.',
    itemFieldLabel: 'Pilih Produk',
    itemSelectLabel: 'Produk',
    itemPlaceholder: 'Pilih Produk',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian bila diperlukan',
    ctaText: 'Simpan Pengajuan',
    helperTitle: 'Persediaan Produk',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan item atau melihat persediaan produk yang tersedia.',
    emptySelectionText: 'Belum ada produk yang dipilih',
    itemPreviewLabel: 'Produk terpilih',
    accentClass: 'from-slate-500 via-slate-400 to-slate-600',
    softAccentClass: 'from-slate-50 via-white to-slate-100',
    iconBgClass: 'bg-slate-100 text-slate-700',
    ctaClass: 'from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700'
  },
  pakan: {
    key: 'pakan',
    entityName: 'Bahan Baku',
    pageTitle: 'Tambah Pembelian Bahan Baku',
    subtitle:
      'Ajukan kebutuhan pembelian bahan baku RPH dengan alur yang ringkas, jelas, dan mudah ditindaklanjuti.',
    itemFieldLabel: 'Pilih Bahan Baku',
    itemSelectLabel: 'Bahan Baku',
    itemPlaceholder: 'Pilih Bahan Baku',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian bahan baku bila diperlukan',
    ctaText: 'Ajukan ke Feedmill & Simpan',
    helperTitle: 'Persediaan Bahan Baku',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan item atau melihat persediaan bahan baku yang tersedia.',
    emptySelectionText: 'Belum ada bahan baku yang dipilih',
    itemPreviewLabel: 'Bahan Baku terpilih',
    accentClass: 'from-emerald-500 via-green-500 to-cyan-500',
    softAccentClass: 'from-emerald-50 via-white to-cyan-50',
    iconBgClass: 'bg-emerald-100 text-emerald-700',
    ctaClass: 'from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700'
  },
  ovk: {
    key: 'ovk',
    entityName: 'OVK',
    pageTitle: 'Tambah Pembelian OVK',
    subtitle:
      'Ajukan kebutuhan pembelian OVK RPH agar proses persetujuan dan pencatatan permintaan tetap terstruktur.',
    itemFieldLabel: 'Pilih OVK',
    itemSelectLabel: 'OVK',
    itemPlaceholder: 'Pilih OVK',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian OVK bila diperlukan',
    ctaText: 'Ajukan OVK & Simpan',
    helperTitle: 'Persediaan OVK',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan item atau melihat persediaan OVK yang tersedia.',
    emptySelectionText: 'Belum ada OVK yang dipilih',
    itemPreviewLabel: 'OVK terpilih',
    accentClass: 'from-violet-500 via-fuchsia-500 to-cyan-500',
    softAccentClass: 'from-violet-50 via-white to-cyan-50',
    iconBgClass: 'bg-violet-100 text-violet-700',
    ctaClass: 'from-violet-500 to-cyan-600 hover:from-violet-600 hover:to-cyan-700'
  },
  hewan: {
    key: 'hewan',
    entityName: 'Hewan',
    pageTitle: 'Tambah Pembelian Hewan',
    subtitle:
      'Beli hewan secara langsung dari vendor sebagai reseller RPH dengan mudah.',
    itemFieldLabel: 'Pilih Hewan',
    itemSelectLabel: 'Jenis Hewan',
    itemPlaceholder: 'Pilih Hewan',
    mengetahuiLabel: 'Mengetahui',
    notesLabel: 'Catatan',
    notesPlaceholder: 'Tambahkan catatan pembelian hewan bila diperlukan',
    ctaText: 'Ajukan Hewan & Simpan',
    helperTitle: 'Jenis Hewan',
    helperDescription:
      'Klik area ini untuk membuka modal pemilihan jenis hewan yang akan dibeli.',
    emptySelectionText: 'Belum ada jenis hewan yang dipilih',
    itemPreviewLabel: 'Hewan terpilih',
    accentClass: 'from-amber-500 via-orange-500 to-red-500',
    softAccentClass: 'from-amber-50 via-white to-orange-50',
    iconBgClass: 'bg-amber-100 text-amber-700',
    ctaClass: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value || 0);

const FormField = ({ label, helperText, required = false, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-700">
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {children}
    {helperText ? <p className="text-[11px] text-gray-400">{helperText}</p> : null}
  </div>
);


const AddPembelianPakanOvkPage = () => {
  const navigate = useNavigate();
  const { type, id, pubid } = useParams();

  const detailId = id || pubid;
  const isEditMode = Boolean(detailId);


  const baseConfig = PAGE_VARIANTS.universal;
  const jenisPembelianOptions = useMemo(
    () => [
      { label: 'Feedmill', value: 1 },
      { label: 'OVK', value: 2 },
      { label: 'Hewan', value: 3 }
    ],
    []
  );
  const tipePembayaranOptions = useMemo(
    () => [
      { label: 'Kas', value: 1 },
      { label: 'Kredit', value: 2 }
    ],
    []
  );
  const [selectedJenisPembelian, setSelectedJenisPembelian] = useState(null);
  const config = selectedJenisPembelian === 1
    ? PAGE_VARIANTS.pakan
    : selectedJenisPembelian === 2
      ? PAGE_VARIANTS.ovk
      : selectedJenisPembelian === 3
        ? PAGE_VARIANTS.hewan
        : baseConfig;
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedMengetahui, setSelectedMengetahui] = useState(null);
  const [tipePembayaran, setTipePembayaran] = useState(1);
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemOptions, setItemOptions] = useState([]);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [itemErrorMessage, setItemErrorMessage] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [hasAppliedDetailItems, setHasAppliedDetailItems] = useState(false);
  const [skipResetOnJenis, setSkipResetOnJenis] = useState(false);

  const isItemSelectionDisabled = !selectedJenisPembelian;
  const isPersetujuanDisabled = isItemSelectionDisabled;

  const { persetujuanOptions, loading: persetujuanLoading } = usePersetujuanRphSelect();
  const { officeOptions: supplierOptions, loading: supplierLoading } = useParameterSelect(isEditMode, {}, [], null, ['office']);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    let isActive = true;

    const fetchItems = async () => {
      if (!selectedJenisPembelian) {
        setItemOptions([]);
        setItemErrorMessage('');
        setIsItemLoading(false);
        return;
      }

      setIsItemLoading(true);
      setItemErrorMessage('');

      const response = await RphPembelianService.getProdukOptions(selectedJenisPembelian);

      if (!isActive) return;

      setItemOptions(response.data || []);

      if (!response.success) {
        setItemErrorMessage(response.message || 'Gagal memuat daftar produk.');
      }

      setIsItemLoading(false);
    };

    fetchItems();

    return () => {
      isActive = false;
    };
  }, [selectedJenisPembelian]);

  useEffect(() => {
    if (isEditMode || !type) return;
    if (type === 'pakan') {
      setSelectedJenisPembelian(1);
    } else if (type === 'ovk') {
      setSelectedJenisPembelian(2);
    }
  }, [type, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !detailId) return;
    let isActive = true;

    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await RphPembelianService.getDetail(detailId);
        if (!isActive) return;

        if (response.success && response.data?.length) {
          const detail = Array.isArray(response.data) ? response.data[0] : response.data;
          setSkipResetOnJenis(true);
          setSelectedJenisPembelian(detail.id_jenis_pembelian_rph ?? null);
          setSelectedMengetahui(
            detail.id_persetujuan_rph ?? detail.id_persetujuan ?? detail.id_mengetahui ?? null
          );
          setTipePembayaran(detail.tipe_pembayaran ?? 1);
          setSelectedSupplier(detail.id_pemasok ?? null);
          setNotes(detail.keterangan ?? detail.note ?? '');
          setDetailItems(Array.isArray(detail.detail) ? detail.detail : detail.details || []);
        } else {
          setNotification({
            type: 'error',
            message: response.message || 'Gagal memuat data detail'
          });
        }
      } catch (error) {
        console.error('Error loading pembelian detail:', error);
        if (isActive) {
          setNotification({ type: 'error', message: 'Gagal memuat data untuk edit' });
        }
      } finally {
        if (isActive) setIsLoadingDetail(false);
      }
    };

    fetchDetail();

    return () => {
      isActive = false;
    };
  }, [isEditMode, detailId]);

  useEffect(() => {
    if (isItemSelectionDisabled) {
      setIsItemModalOpen(false);
    }
  }, [isItemSelectionDisabled]);

  useEffect(() => {
    if (!selectedJenisPembelian) {
      return;
    }

    if (skipResetOnJenis) {
      setSkipResetOnJenis(false);
      return;
    }

    setSelectedItems([]);
  }, [selectedJenisPembelian, skipResetOnJenis]);

  useEffect(() => {
    if (!isEditMode || hasAppliedDetailItems || detailItems.length === 0) return;
    if (itemOptions.length === 0) return;

    const normalizeId = (value) => (value === null || value === undefined ? '' : String(value));

    const mappedItems = detailItems
      .map((detail) => {
        const detailIdValue = detail.id_produk ?? detail.id ?? detail.pid;
        const detailSatuanValue = detail.id_satuan ?? detail._original?.id_satuan ?? null;
        const detailHargaValue = Number(detail.harga ?? detail.price ?? 0);

        // Composite match (id_produk + id_satuan + harga) — item yang sama
        // bisa punya satuan berbeda (MINYAK LITER vs DUS) DAN satuan yang sama
        // bisa punya harga berbeda (batch/supplier beda). Match id+satuan saja
        // akan ambil row harga pertama, bikin stok & key backend tidak cocok.
        const option = itemOptions.find(
          (item) =>
            normalizeId(item.id) === normalizeId(detailIdValue) &&
            normalizeId(item.id_satuan) === normalizeId(detailSatuanValue) &&
            Number(item.price ?? item.harga ?? 0) === detailHargaValue
        ) ?? itemOptions.find(
          (item) =>
            normalizeId(item.id) === normalizeId(detailIdValue) &&
            normalizeId(item.id_satuan) === normalizeId(detailSatuanValue)
        ) ?? itemOptions.find(
          (item) =>
            normalizeId(item.id) === normalizeId(detailIdValue) ||
            Number(item.id) === Number(detailIdValue)
        );

        if (!option) return null;

        // Use stored detail.harga (MAX of original batch prices) — NOT
        // option.price (current warehouse stock price). The original purchase
        // may have bought at a different batch price than what's in warehouse
        // now. Using current price makes the edit total mismatch the stored
        // harga_total in the header.
        const storedPrice = Number(detail.harga ?? detail.price ?? 0);

        return {
          ...option,
          // Pertahankan id_satuan & harga dari detail lama agar key
          // (produk|satuan|harga) backend tetap cocok dan item tidak dianggap baru.
          id_satuan: detailSatuanValue ?? option.id_satuan,
          qty: Number(detail.jumlah ?? detail.qty ?? 0),
          price: storedPrice || option.price
        };
      })
      .filter(Boolean);

    setSelectedItems(mappedItems);
    setHasAppliedDetailItems(true);
  }, [detailItems, itemOptions, hasAppliedDetailItems, isEditMode]);

  const handleApplyItems = (items) => {
    setSelectedItems(items);
    setIsItemModalOpen(false);
  };

  // Key unik = (id_produk, id_satuan, harga). Item yang sama dengan satuan
  // sama tapi harga berbeda harus diperlakukan sebagai baris terpisah.
  const itemKey = (item) => `${item.id}|${item.id_satuan ?? ''}|${item.price ?? item.harga ?? 0}`;

  const handleRemoveItem = (item) => {
    const key = itemKey(item);
    setSelectedItems((prev) => prev.filter((it) => itemKey(it) !== key));
  };

  const handleQtyChange = (item, qty) => {
    const value = qty === '' ? '' : Number(qty);
    const key = itemKey(item);
    setSelectedItems((prev) => prev.map((it) =>
      itemKey(it) === key ? { ...it, qty: value } : it
    ));
  };

  const handleBack = () => navigate('/rph/pembelian-pakan-ovk');

  const handleNavigateWithRefresh = (message) => {
    navigate('/rph/pembelian-pakan-ovk', {
      state: {
        fromEdit: Boolean(isEditMode),
        fromAdd: !isEditMode,
        message
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Client-side validation — fail fast without round-tripping to the API.
    if (!selectedJenisPembelian) {
      setNotification({ type: 'error', message: 'Jenis pembelian wajib dipilih.' });
      return;
    }
    if (!selectedMengetahui) {
      setNotification({ type: 'error', message: 'Mengetahui wajib dipilih.' });
      return;
    }
    if (!tipePembayaran) {
      setNotification({ type: 'error', message: 'Tipe pembayaran wajib dipilih.' });
      return;
    }
    if (Number(tipePembayaran) === 2 && (selectedSupplier == null || selectedSupplier === '')) {
      setNotification({ type: 'error', message: 'Supplier wajib dipilih untuk pembayaran kredit.' });
      return;
    }
    if (selectedItems.length === 0) {
      setNotification({ type: 'error', message: 'Minimal 1 item harus dipilih.' });
      return;
    }
    const invalidQty = selectedItems.find((item) => !Number(item.qty) || Number(item.qty) <= 0);
    if (invalidQty) {
      setNotification({ type: 'error', message: `Jumlah untuk ${invalidQty.name} harus lebih dari 0.` });
      return;
    }

    const parsedSupplier = selectedSupplier != null && selectedSupplier !== ''
      ? parseInt(selectedSupplier, 10)
      : null;

    const payload = {
      id_jenis_pembelian_rph: selectedJenisPembelian ?? null,
      id_persetujuan_rph: selectedMengetahui ?? null,
      tipe_pembayaran: tipePembayaran ?? null,
      keterangan: notes?.trim() || null,
      items: selectedItems.map((item) => {
        const parsedId = Number(
          item.id ?? item.id_produk ?? item._original?.id_produk ?? item._original?.id
        );
        const parsedSatuan = Number(item.id_satuan ?? item._original?.id_satuan);
        const parsedHarga = Number(item.price ?? item.harga ?? item._original?.harga ?? 0);
        return {
          id_produk: Number.isFinite(parsedId) ? parsedId : null,
          id_satuan: Number.isFinite(parsedSatuan) ? parsedSatuan : null,
          jumlah: Number(item.qty ?? item.jumlah ?? 0),
          harga: Number.isFinite(parsedHarga) ? parsedHarga : 0
        };
      })
    };

    // Only send id_pemasok for kredit; omit null so integer validation does not fail
    if (Number(tipePembayaran) === 2 && Number.isFinite(parsedSupplier)) {
      payload.id_pemasok = parsedSupplier;
    }

    if (isEditMode) {
      payload.pid = detailId;
    }

    setIsSubmitting(true);
    setNotification({
      type: 'info',
      message: isEditMode ? 'Memperbarui data...' : 'Menyimpan data...'
    });

    const result = isEditMode
      ? await RphPembelianService.updatePembelian(payload)
      : await RphPembelianService.storePembelian(payload);

    if (result.success) {
      setNotification({
        type: 'success',
        message: result.message || 'Data berhasil disimpan'
      });
      setIsSubmitting(false);
      setTimeout(() => {
        handleNavigateWithRefresh(result.message || 'Data berhasil disimpan');
      }, 1200);
      return;
    }

    const detailMessage =
      result?.data?.data?.details ||
      result?.data?.details ||
      result?.message ||
      'Gagal menyimpan pembelian';

    const normalizeStockMessage = (message) => {
      if (!message) return message;
      const match = String(message).match(/produk\s+(.+?)\s+stok/i);
      if (match?.[1]) {
        return `${match[1]} stok tidak cukup`;
      }
      return message;
    };

    setNotification({
      type: 'error',
      message: normalizeStockMessage(detailMessage)
    });
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!notification) return;
    // Don't auto-dismiss info notifications — they represent in-flight
    // operations (e.g. "Menyimpan...") that should persist until the
    // operation completes and replaces them with success/error.
    if (notification.type === 'info') return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  if (isLoadingDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-2 text-sm font-medium text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  const pageTitle = isEditMode
    ? config.pageTitle.replace('Tambah', 'Edit')
    : config.pageTitle;
  const actionText = isEditMode ? 'Perbarui Data' : config.ctaText;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="w-full space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className={`rounded-lg p-2 ${config.iconBgClass}`}>
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-gray-900">
                    {pageTitle}
                  </h1>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {config.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="submit"
                form="pembelian-pakan-ovk-form"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSubmitting ? 'Menyimpan...' : actionText}
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <form
            id="pembelian-pakan-ovk-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Data Pengajuan</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Isi data utama pembelian dan lengkapi catatan sesuai kebutuhan.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <FormField
                  label="Pilih Jenis Pembelian"
                  helperText="Pilih jenis pembelian sebelum memilih item."
                  required
                >
                  <SearchableSelect
                    value={selectedJenisPembelian}
                    onChange={setSelectedJenisPembelian}
                    options={jenisPembelianOptions}
                    placeholder="Pilih Jenis Pembelian"
                    isDisabled={isEditMode}
                  />
                </FormField>

                <FormField
                  label={config.mengetahuiLabel}
                  helperText="Pilih pihak yang mengetahui pengajuan ini."
                  required
                >
                  <SearchableSelect
                    value={selectedMengetahui}
                    onChange={setSelectedMengetahui}
                    options={persetujuanOptions.filter((option) => option.value !== '')}
                    placeholder={
                      persetujuanLoading
                        ? 'Loading...'
                        : isPersetujuanDisabled
                          ? 'Pilih jenis pembelian terlebih dahulu'
                          : `Pilih ${config.mengetahuiLabel}`
                    }
                    isLoading={persetujuanLoading}
                    isDisabled={persetujuanLoading || isPersetujuanDisabled}
                  />
                </FormField>

                <FormField
                  label="Tipe Pembayaran"
                  helperText="Pilih tipe pembayaran yang digunakan."
                  required
                >
                  <SearchableSelect
                    value={tipePembayaran}
                    onChange={setTipePembayaran}
                    options={tipePembayaranOptions}
                    placeholder="Pilih Tipe Pembayaran"
                    isDisabled={isItemSelectionDisabled}
                  />
                </FormField>

                {tipePembayaran === 2 && (
                    <FormField label="Pilih Supplier" required>
                        <SearchableSelect
                            value={selectedSupplier}
                            onChange={setSelectedSupplier}
                            options={supplierOptions}
                            placeholder="Pilih Supplier"
                            isLoading={supplierLoading}
                        />
                    </FormField>
                )}

                <div className="md:col-span-3">
                  <FormField
                    label={config.notesLabel}
                    helperText="Catatan ini bersifat opsional dan dapat digunakan untuk kebutuhan internal."
                  >
                    <div className="relative">
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        placeholder={config.notesPlaceholder}
                      />
                      <div className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                        <FileText className="h-3 w-3" />
                        {notes.length}/255
                      </div>
                    </div>
                  </FormField>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Detail Produk ({selectedItems.length} item)
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedItems.length === 0
                      ? config.emptySelectionText
                      : `Total ${selectedItems.length} item dipilih dari modal.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(true)}
                  disabled={isItemSelectionDisabled}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isItemSelectionDisabled
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Tambah Produk
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr className="border-b border-gray-100">
                      <th className="w-10 px-3 py-2 text-left font-semibold">Pilih</th>
                      <th className="px-3 py-2 text-left font-semibold">Nama Produk</th>
                      <th className="px-3 py-2 text-left font-semibold">Produk</th>
                      <th className="px-3 py-2 text-right font-semibold">Harga</th>
                      <th className="px-3 py-2 text-center font-semibold">Jumlah</th>
                      <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                      <th className="w-10 px-3 py-2 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-400">
                          {config.emptySelectionText}
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item) => {
                        const qty = Number(item.qty ?? 0);
                        const price = Number(item.price ?? 0);
                        const subtotal = qty * price;
                        return (
                          <tr key={itemKey(item)} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-3 py-2">
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-700">{item.name}</td>
                            <td className="px-3 py-2 text-gray-600">{item.product || '-'}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(item.price)}</td>
                            <td className="px-3 py-2 text-center text-gray-700">
                              <input
                                type="number"
                                min="1"
                                value={item.qty ?? ''}
                                onChange={(e) => handleQtyChange(item, e.target.value)}
                                className="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-700">{formatCurrency(subtotal)}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Hapus ${item.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {selectedItems.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 bg-gray-50">
                        <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold text-gray-600">
                          Total
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3 text-center text-xs font-bold text-gray-700">
                          {selectedItems.reduce((acc, it) => acc + (Number(it.qty ?? 0) || 0), 0)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-emerald-700">
                          {formatCurrency(
                            selectedItems.reduce(
                              (acc, it) => acc + (Number(it.qty ?? 0) || 0) * (Number(it.price ?? 0) || 0),
                              0
                            )
                          )}
                        </td>
                        <td className="px-3 py-3" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>

          </form>
        </div>
      </div>

      {notification && (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={`w-full max-w-sm overflow-hidden rounded-xl border-l-4 bg-white shadow-lg ring-1 ring-black/5 ${
              notification.type === 'success'
                ? 'border-emerald-500'
                : notification.type === 'info'
                  ? 'border-sky-500'
                  : 'border-red-500'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : notification.type === 'info'
                      ? 'bg-sky-50 text-sky-600'
                      : 'bg-red-50 text-red-600'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : notification.type === 'info' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {notification.type === 'success'
                    ? 'Berhasil!'
                    : notification.type === 'info'
                      ? 'Memproses...'
                      : 'Error!'}
                </p>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <PilihPakanOvkModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        items={itemOptions}
        initialSelected={selectedItems}
        onApply={handleApplyItems}
        title={config.helperTitle}
        accentClass={config.accentClass}
        isLoading={isItemLoading}
        errorMessage={itemErrorMessage}
      />
    </div>
  );
};

export default AddPembelianPakanOvkPage;