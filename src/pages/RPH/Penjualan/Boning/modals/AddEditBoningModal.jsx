import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import SearchableSelect from '../../../../../components/shared/SearchableSelect';

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Tunai (Cash)' },
  { value: 'BANK', label: 'Kredit (Bank)' },
];
const SHIPPING_OPTIONS = [
  { value: 'DIAMBIL', label: 'Diambil' },
  { value: 'DIANTAR', label: 'Diantar' },
];

const createEmptyDetail = () => ({
  id_item_potong: '',
  jumlah_kg: '',
  harga_jual: '',
  loadingHarga: false,
});

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0));

const formatNumber = (value, digits = 3) => Number(value || 0).toFixed(digits);
const formatMoneyInput = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '');
  return raw ? Number(raw).toLocaleString('id-ID') : '';
};
const parseMoneyInput = (value) => String(value ?? '').replace(/[^\d]/g, '');

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20';
const isPedagangAtCreditLimit = (item) => Number(item?.is_dispensasi || 0) !== 1 && Number(item?.limit_kredit || 0) > 0 && Number(item?.saldo_beku || 0) >= Number(item.limit_kredit);

const AddEditBoningModal = ({
  isOpen,
  fullPage = false,
  onClose,
  onSubmit,
  editData,
  pedagangList,
  boningItems,
  itemPotongOptions,
  bankOptions,
  pengirimOptions,
  kendaraanOptions,
  fetchHarga,
  fetchPedagangHarga,
  loading,
  masterLoading,
  idOffice,
}) => {
  const [form, setForm] = useState({
    id_pedagang: '',
    tgl_penjualan: new Date().toISOString().split('T')[0],
    tipe_pembayaran: 'CASH',
    jumlah_pembayaran: '',
    gunakan_saldo: false,
    penggunaan_saldo: '',
    id_syarat_pembelian: '',
    tanggal_pembayaran: '',
    pengiriman: 'DIAMBIL',
    biaya_pengiriman: '',
    alamat_pengiriman: '',
    id_pengirim: '',
    id_kendaraan_ekspedisi: '',
    nama_penerima: '',
    catatan: '',
  });
  const [details, setDetails] = useState([createEmptyDetail()]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pedagangHargaMap, setPedagangHargaMap] = useState({});

  const isEdit = Boolean(editData?.penjualan?.pid);

  const pedagangSelectOptions = useMemo(() => pedagangList.map((item) => ({
    value: String(item.id),
    label: item.label || `${item.nama_alias || item.nama_identitas} - ${item.id_pedagang}`,
    disabled: !isEdit && isPedagangAtCreditLimit(item),
  })), [pedagangList, isEdit]);

  const itemOptions = useMemo(() => {
    const selectedEditItems = (editData?.detail_items || []).map((item) => ({
      id_item_potong: Number(item.id_item_potong || 0),
      nama_item: item.nama_item || '-',
      stok_tersedia: Number(item.stok_tersedia || 0),
      label: item.nama_item || '-',
    }));
    const merged = [...boningItems, ...(itemPotongOptions || []), ...selectedEditItems];
    const seen = new Set();

    return merged
      .filter((item) => {
        const key = String(item.id_item_potong);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((item) => ({
        value: String(item.id_item_potong),
        label: `${item.nama_item || '-'} - Stok: ${Math.round(Number(item.stok_tersedia || 0))} Kg`,
      }));
  }, [boningItems, editData?.detail_items, itemPotongOptions]);

  const getItemOptionsForRow = (index) => {
    const currentValue = String(details[index]?.id_item_potong || '');
    const usedByOtherRows = new Set(
      details
        .map((detail, detailIndex) => (detailIndex === index ? '' : String(detail.id_item_potong || '')))
        .filter(Boolean)
    );

    return itemOptions.filter((option) => option.value === currentValue || !usedByOtherRows.has(option.value));
  };

  const bankSelectOptions = useMemo(() => bankOptions.map((item) => ({
    value: String(item.id),
    label: item.label || item.nama,
  })), [bankOptions]);

  const pengirimSelectOptions = useMemo(() => pengirimOptions.map((item) => ({
    value: String(item.id),
    label: item.label || item.nama,
  })), [pengirimOptions]);

  const kendaraanSelectOptions = useMemo(() => kendaraanOptions.map((item) => ({
    value: String(item.id),
    label: item.label || `${item.jenis_kendaraan} - ${item.plat_nomor}`,
  })), [kendaraanOptions]);

  const stockMap = useMemo(() => boningItems.reduce((acc, item) => {
    acc[String(item.id_item_potong)] = Number(item.stok_tersedia || 0);
    return acc;
  }, {}), [boningItems]);

  const selectedPedagang = useMemo(
    () => pedagangList.find((item) => String(item.id) === String(form.id_pedagang)) || null,
    [pedagangList, form.id_pedagang]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && editData?.penjualan) {
      const header = editData.penjualan;
      setForm({
        id_pedagang: String(header.id_pedagang || ''),
        tgl_penjualan: header.tgl_penjualan || new Date().toISOString().split('T')[0],
        tipe_pembayaran: String(header.tipe_pembayaran) === '2' ? 'BANK' : 'CASH',
        // P3: jumlah_pembayaran di-default dari total_terbayar (kas riil), bukan total_bayar (kini grand total tagihan).
        // Cek null/undefined eksplisit agar kas cicilan (0) ditangani benar & tak salah jatuh ke tagihan penuh
        // yang akan mengubah transaksi cicilan menjadi cash secara tidak sengaja saat diedit.
        jumlah_pembayaran: String(header.total_terbayar !== null && header.total_terbayar !== undefined ? header.total_terbayar : ''),
        gunakan_saldo: Number(header.penggunaan_saldo || 0) > 0,
        penggunaan_saldo: Number(header.penggunaan_saldo || 0) > 0 ? String(header.penggunaan_saldo) : '',
        id_syarat_pembelian: header.id_syarat_pembelian ? String(header.id_syarat_pembelian) : '',
        tanggal_pembayaran: '',
        pengiriman: header.pengiriman || 'DIAMBIL',
        biaya_pengiriman: header.biaya_pengiriman !== null && header.biaya_pengiriman !== undefined ? String(header.biaya_pengiriman) : '',
        alamat_pengiriman: header.alamat_pengiriman || '',
        id_pengirim: header.id_pengirim ? String(header.id_pengirim) : '',
        id_kendaraan_ekspedisi: header.id_kendaraan_ekspedisi ? String(header.id_kendaraan_ekspedisi) : '',
        nama_penerima: header.nama_penerima || '',
        catatan: header.keterangan || '',
      });
      setDetails((editData.detail_items || []).map((item) => ({
        id_item_potong: String(item.id_item_potong || ''),
        jumlah_kg: String(item.jumlah_kg || ''),
        harga_jual: String(item.harga_jual || ''),
        loadingHarga: false,
      })) || [createEmptyDetail()]);
    } else {
      setForm({
        id_pedagang: '',
        tgl_penjualan: new Date().toISOString().split('T')[0],
        tipe_pembayaran: 'CASH',
        jumlah_pembayaran: '',
        gunakan_saldo: false,
        penggunaan_saldo: '',
        id_syarat_pembelian: '',
        tanggal_pembayaran: '',
        pengiriman: 'DIAMBIL',
        biaya_pengiriman: '',
        alamat_pengiriman: '',
        id_pengirim: '',
        id_kendaraan_ekspedisi: '',
        nama_penerima: '',
        catatan: '',
      });
      setDetails([createEmptyDetail()]);
    }

    setErrors({});
    setSubmitting(false);
    setPedagangHargaMap({});
  }, [editData, isEdit, isOpen]);

  const loadPedagangHargaMap = useCallback(async (pedagangPid) => {
    if (!pedagangPid || typeof fetchPedagangHarga !== 'function') {
      setPedagangHargaMap({});
      return {};
    }

    const res = await fetchPedagangHarga(pedagangPid);
    if (!res.success) return {};

    const nextMap = (res.data?.harga || []).reduce((acc, item) => {
      acc[String(item.id_item_potong)] = String(item.nominal ?? item.harga_jual ?? '');
      return acc;
    }, {});

    setPedagangHargaMap(nextMap);
    setDetails((prev) => prev.map((detail) => {
      if (!detail.id_item_potong || nextMap[String(detail.id_item_potong)] === undefined) {
        return detail;
      }

      return {
        ...detail,
        harga_jual: String(nextMap[String(detail.id_item_potong)] || ''),
      };
    }));

    return nextMap;
  }, [fetchPedagangHarga]);

  useEffect(() => {
    let cancelled = false;

    const loadPedagangHarga = async () => {
      if (!isOpen || !selectedPedagang?.pid || typeof fetchPedagangHarga !== 'function') {
        setPedagangHargaMap({});
        return;
      }

      await loadPedagangHargaMap(selectedPedagang.pid);
      if (cancelled) return;
    };

    loadPedagangHarga();

    return () => {
      cancelled = true;
    };
  }, [fetchPedagangHarga, isOpen, selectedPedagang, loadPedagangHargaMap]);

  const totals = useMemo(() => {
    const totalBerat = details.reduce((sum, item) => sum + Number(item.jumlah_kg || 0), 0);
    const totalHargaItem = details.reduce((sum, item) => sum + (Number(item.jumlah_kg || 0) * Number(parseMoneyInput(item.harga_jual) || 0)), 0);
    const biayaPengiriman = form.pengiriman === 'DIANTAR' ? Number(parseMoneyInput(form.biaya_pengiriman) || 0) : 0;
    return {
      totalBerat,
      totalHargaItem,
      biayaPengiriman,
      grandTotal: totalHargaItem + biayaPengiriman,
    };
  }, [details, form.biaya_pengiriman, form.pengiriman]);

  const itemUsedWeight = useMemo(() => details.reduce((acc, item) => {
    const key = String(item.id_item_potong || '');
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + Number(item.jumlah_kg || 0);
    return acc;
  }, {}), [details]);
  const maxPenggunaanSaldo = Math.min(Number(selectedPedagang?.saldo_keseluruhan || 0), totals.grandTotal);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDetail = (index, field, value) => {
    setDetails((prev) => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const syncHarga = async (index, itemId, pedagangId) => {
    if (!itemId || !pedagangId) return;

    updateDetail(index, 'loadingHarga', true);
    const res = await fetchHarga({
      id_pedagang: Number(pedagangId),
      id_item_potong: Number(itemId),
    });

    if (res.success && res.data) {
      const hargaJual = res.data.harga_jual ?? res.data.nominal ?? '';
      updateDetail(index, 'harga_jual', hargaJual !== '' && hargaJual !== null ? String(hargaJual) : '');
    }

    updateDetail(index, 'loadingHarga', false);
  };

  const fillHargaFromPedagangMap = (index, itemId) => {
    const hargaJual = pedagangHargaMap[String(itemId)];
    if (hargaJual === undefined) return false;

    updateDetail(index, 'harga_jual', String(hargaJual || ''));
    return true;
  };

  const handlePedagangChange = async (value) => {
    const pedagangId = value || '';
    setForm((prev) => ({
      ...prev,
      id_pedagang: pedagangId,
    }));

    if (!pedagangId) {
      setPedagangHargaMap({});
      setDetails((prev) => prev.map((detail) => ({ ...detail, harga_jual: '' })));
      return;
    }

    await Promise.all(details.map(async (detail, index) => {
      if (detail.id_item_potong) {
        await syncHarga(index, detail.id_item_potong, pedagangId);
      }
    }));
  };

  const handleItemChange = async (index, value) => {
    updateDetail(index, 'id_item_potong', value || '');

    if (!value) {
      updateDetail(index, 'harga_jual', '');
      return;
    }

    let filledFromMap = fillHargaFromPedagangMap(index, value);

    if (!filledFromMap && selectedPedagang?.pid) {
      const latestMap = await loadPedagangHargaMap(selectedPedagang.pid);
      if (latestMap[String(value)] !== undefined) {
        updateDetail(index, 'harga_jual', String(latestMap[String(value)] || ''));
        filledFromMap = true;
      }
    }

    if (value && form.id_pedagang && !filledFromMap) {
      await syncHarga(index, value, form.id_pedagang);
    }
  };

  const handleJumlahKgChange = async (index, value) => {
    updateDetail(index, 'jumlah_kg', value);

    const detail = details[index];
    if (!detail?.id_item_potong || !form.id_pedagang || !value) return;

    await syncHarga(index, detail.id_item_potong, form.id_pedagang);
  };

  const addDetailRow = () => setDetails((prev) => [...prev, createEmptyDetail()]);
  const removeDetailRow = (index) => setDetails((prev) => prev.filter((_, idx) => idx !== index));

  const validate = () => {
    const nextErrors = {};

    if (!form.id_pedagang) nextErrors.id_pedagang = 'Pedagang wajib dipilih.';
    if (form.gunakan_saldo && Number(form.penggunaan_saldo || 0) <= 0) nextErrors.penggunaan_saldo = 'Nominal penggunaan saldo wajib lebih dari 0.';
    if (form.gunakan_saldo && Number(form.penggunaan_saldo || 0) > totals.grandTotal) nextErrors.penggunaan_saldo = 'Nominal penggunaan saldo tidak boleh melebihi total tagihan.';
    if (!form.tgl_penjualan) nextErrors.tgl_penjualan = 'Tanggal penjualan wajib diisi.';
    if (!details.length) nextErrors.details = 'Minimal satu item penjualan wajib diisi.';

    details.forEach((item, index) => {
      const key = String(item.id_item_potong || '');
      const jumlah = Number(item.jumlah_kg || 0);
      const harga = Number(parseMoneyInput(item.harga_jual) || 0);
      const stok = stockMap[key] || 0;
      const totalDipakai = itemUsedWeight[key] || 0;

      if (!key) nextErrors[`details.${index}.id_item_potong`] = 'Item potong boning wajib dipilih.';
      if (!jumlah || jumlah <= 0) nextErrors[`details.${index}.jumlah_kg`] = 'Jumlah kilogram wajib lebih dari 0.';
      if (!harga || harga <= 0) nextErrors[`details.${index}.harga_jual`] = 'Harga jual wajib lebih dari 0.';
      if (key && stok > 0 && totalDipakai > stok) {
        nextErrors[`details.${index}.jumlah_kg`] = 'Jumlah kilogram melebihi stok tersedia.';
      }
    });

    if (form.tipe_pembayaran === 'BANK') {
      if (!form.id_syarat_pembelian) nextErrors.id_syarat_pembelian = 'Syarat pembayaran wajib dipilih untuk pembayaran bank.';

      // R-06: Hard-block cicilan bila melampaui limit kredit pedagang (mirror guard backend).
      // Hanya ditegakkan bila limit_kredit > 0 (0 = tidak diset) dan bukan dispensasi aktif.
      if (selectedPedagang && Number(selectedPedagang.limit_kredit) > 0 && Number(selectedPedagang.is_dispensasi) !== 1) {
        const limit = Number(selectedPedagang.limit_kredit);
        const saldoAkhir = Number(selectedPedagang.saldo_akhir) || 0;
        // Piutang lama hanya dikurangi bila pedagang TIDAK berubah pada edit (same-trader via id_pedagang).
        const isSameTrader = isEdit && Number(editData?.penjualan?.id_pedagang) === Number(form.id_pedagang);
        const oldPiutang = (isSameTrader && String(editData?.penjualan?.tipe_pembayaran) === '2')
          ? (Number(editData?.penjualan?.total_harga || 0) + Number(editData?.penjualan?.biaya_pengiriman || 0) - Number(editData?.penjualan?.total_terbayar || 0))
          : 0;
        const eksposur = saldoAkhir - oldPiutang + totals.grandTotal;
        if (eksposur > limit) {
          nextErrors.tipe_pembayaran = `Transaksi ditolak: total piutang (${formatCurrency(eksposur)}) melebihi limit kredit pedagang (${formatCurrency(limit)})`;
        }
      }
    }

    if (form.pengiriman === 'DIANTAR') {
      if (form.biaya_pengiriman === '' || Number(parseMoneyInput(form.biaya_pengiriman) || 0) < 0) {
        nextErrors.biaya_pengiriman = 'Biaya pengiriman wajib diisi jika pengiriman diantar.';
      }
      if (!form.alamat_pengiriman) nextErrors.alamat_pengiriman = 'Alamat pengiriman wajib diisi jika pengiriman diantar.';
      if (!form.id_pengirim) nextErrors.id_pengirim = 'Pengirim wajib dipilih jika pengiriman diantar.';
      if (!form.id_kendaraan_ekspedisi) nextErrors.id_kendaraan_ekspedisi = 'Kendaraan ekspedisi wajib dipilih jika pengiriman diantar.';
      if (!form.nama_penerima) nextErrors.nama_penerima = 'Nama penerima wajib diisi jika pengiriman diantar.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    ...(isEdit ? { pid: editData.penjualan.pid } : {}),
    id_rph: idOffice,
    id_pedagang: Number(form.id_pedagang),
    tgl_penjualan: form.tgl_penjualan,
    details: details.map((item) => ({
      id_item_potong: Number(item.id_item_potong),
      jumlah_kg: Number(item.jumlah_kg || 0),
      harga_jual: Number(parseMoneyInput(item.harga_jual) || 0),
    })),
    tipe_pembayaran: form.tipe_pembayaran,
    jumlah_pembayaran: form.tipe_pembayaran === 'CASH' ? Number(form.jumlah_pembayaran || 0) : null,
    penggunaan_saldo: form.gunakan_saldo ? Number(form.penggunaan_saldo || 0) : 0,
    id_syarat_pembelian: form.tipe_pembayaran === 'BANK' ? Number(form.id_syarat_pembelian) : null,
    tanggal_pembayaran: form.tipe_pembayaran === 'BANK' ? form.tanggal_pembayaran : null,
    pengiriman: form.pengiriman,
    biaya_pengiriman: form.pengiriman === 'DIANTAR' ? Number(parseMoneyInput(form.biaya_pengiriman) || 0) : null,
    alamat_pengiriman: form.pengiriman === 'DIANTAR' ? form.alamat_pengiriman : null,
    id_pengirim: form.pengiriman === 'DIANTAR' ? Number(form.id_pengirim) : null,
    id_kendaraan_ekspedisi: form.pengiriman === 'DIANTAR' ? Number(form.id_kendaraan_ekspedisi) : null,
    nama_penerima: form.pengiriman === 'DIANTAR' ? form.nama_penerima : null,
    catatan: form.catatan || null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(buildPayload());
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={fullPage ? 'min-h-screen bg-slate-50' : 'fixed inset-0 z-[1200] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6'} onClick={fullPage ? undefined : onClose}>
      <div className={fullPage ? 'min-h-screen w-full overflow-hidden bg-white' : 'w-full max-w-6xl rounded-3xl bg-white shadow-2xl'} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Penjualan Boning' : 'Tambah Penjualan Boning'}</h2>
            <p className="mt-1 text-sm text-slate-500">Kelola transaksi boning, pembayaran, dan pengiriman dalam satu form.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Pedagang</label>
                <SearchableSelect
                  options={pedagangSelectOptions}
                  value={form.id_pedagang}
                  onChange={handlePedagangChange}
                  placeholder="Pilih pedagang"
                  isLoading={masterLoading}
                  accentColor="red"
                />
                {errors.id_pedagang && <p className="mt-1 text-xs text-rose-600">{errors.id_pedagang}</p>}

              {selectedPedagang && (
                <>
                  {Number(selectedPedagang.is_dispensasi) === 1 && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md font-semibold text-xs">
                      Pedagang memiliki dispensasi aktif.
                    </div>
                  )}
                  {Number(selectedPedagang.is_dispensasi) !== 1 && Number(selectedPedagang.limit_kredit) > 0 && (
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Limit Kredit:</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(Number(selectedPedagang.limit_kredit))}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Total Piutang Berjalan:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(Number(selectedPedagang.saldo_akhir) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 border-t border-gray-200 pt-1">
                        <span>Sisa Limit Kredit:</span>
                        <span className={`font-bold ${Number(selectedPedagang.limit_kredit) - (Number(selectedPedagang.saldo_beku) || 0) <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatCurrency(Math.max(0, Number(selectedPedagang.limit_kredit) - (Number(selectedPedagang.saldo_beku) || 0)))}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tanggal Penjualan</label>
                <input type="date" value={form.tgl_penjualan} onChange={(event) => updateForm('tgl_penjualan', event.target.value)} className={inputClass} />
                {errors.tgl_penjualan && <p className="mt-1 text-xs text-rose-600">{errors.tgl_penjualan}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tipe Pembayaran</label>
                <SearchableSelect
                  value={form.tipe_pembayaran}
                  onChange={(value) => setForm((prev) => ({
                    ...prev,
                    tipe_pembayaran: value || 'CASH',
                    jumlah_pembayaran: value === 'BANK' ? '' : prev.jumlah_pembayaran,
                    id_syarat_pembelian: value === 'CASH' ? '' : prev.id_syarat_pembelian,
                    tanggal_pembayaran: value === 'CASH' ? '' : prev.tanggal_pembayaran,
                  }))}
                  options={PAYMENT_OPTIONS}
                  placeholder="Pilih pembayaran"
                  accentColor="red"
                  isClearable={false}
                />
                {errors.tipe_pembayaran && <p className="mt-1 text-xs text-rose-600">{errors.tipe_pembayaran}</p>}
              </div>

              {form.tipe_pembayaran === 'CASH' ? null : (
                <div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Syarat Pembayaran</label>
                    <SearchableSelect
                      options={bankSelectOptions}
                      value={form.id_syarat_pembelian}
                      onChange={(value) => updateForm('id_syarat_pembelian', value || '')}
                      placeholder="Pilih bank"
                      accentColor="red"
                    />
                    {errors.id_syarat_pembelian && <p className="mt-1 text-xs text-rose-600">{errors.id_syarat_pembelian}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Pengiriman</label>
                <SearchableSelect
                  value={form.pengiriman}
                  onChange={(value) => setForm((prev) => ({
                    ...prev,
                    pengiriman: value || 'DIAMBIL',
                    biaya_pengiriman: value === 'DIAMBIL' ? '' : prev.biaya_pengiriman,
                    alamat_pengiriman: value === 'DIAMBIL' ? '' : prev.alamat_pengiriman,
                    id_pengirim: value === 'DIAMBIL' ? '' : prev.id_pengirim,
                    id_kendaraan_ekspedisi: value === 'DIAMBIL' ? '' : prev.id_kendaraan_ekspedisi,
                    nama_penerima: value === 'DIAMBIL' ? '' : prev.nama_penerima,
                  }))}
                  options={SHIPPING_OPTIONS}
                  placeholder="Pilih pengiriman"
                  accentColor="red"
                  isClearable={false}
                />
              </div>

              {form.pengiriman === 'DIANTAR' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Biaya Pengiriman</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInput(form.biaya_pengiriman)}
                        onChange={(event) => updateForm('biaya_pengiriman', parseMoneyInput(event.target.value))}
                        className={inputClass}
                        placeholder="0"
                      />
                      {errors.biaya_pengiriman && <p className="mt-1 text-xs text-rose-600">{errors.biaya_pengiriman}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Nama Penerima</label>
                      <input value={form.nama_penerima} onChange={(event) => updateForm('nama_penerima', event.target.value)} className={inputClass} placeholder="Nama penerima" />
                      {errors.nama_penerima && <p className="mt-1 text-xs text-rose-600">{errors.nama_penerima}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Alamat Pengiriman</label>
                    <textarea value={form.alamat_pengiriman} onChange={(event) => updateForm('alamat_pengiriman', event.target.value)} rows={3} className={`${inputClass} min-h-[96px]`} placeholder="Alamat tujuan pengiriman" />
                    {errors.alamat_pengiriman && <p className="mt-1 text-xs text-rose-600">{errors.alamat_pengiriman}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Pengirim</label>
                      <SearchableSelect
                        options={pengirimSelectOptions}
                        value={form.id_pengirim}
                        onChange={(value) => updateForm('id_pengirim', value || '')}
                        placeholder="Pilih pengirim"
                        accentColor="red"
                      />
                      {errors.id_pengirim && <p className="mt-1 text-xs text-rose-600">{errors.id_pengirim}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Kendaraan Ekspedisi</label>
                      <SearchableSelect
                        options={kendaraanSelectOptions}
                        value={form.id_kendaraan_ekspedisi}
                        onChange={(value) => updateForm('id_kendaraan_ekspedisi', value || '')}
                        placeholder="Pilih kendaraan"
                        accentColor="red"
                      />
                      {errors.id_kendaraan_ekspedisi && <p className="mt-1 text-xs text-rose-600">{errors.id_kendaraan_ekspedisi}</p>}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Catatan</label>
                <textarea value={form.catatan} onChange={(event) => updateForm('catatan', event.target.value)} rows={4} className={`${inputClass} min-h-[112px]`} placeholder="Catatan transaksi" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detail Item Penjualan</h3>
                <p className="text-sm text-slate-500">Harga jual per kg terisi otomatis dari data harga pedagang dan tetap bisa diedit.</p>
              </div>
              <button type="button" onClick={addDetailRow} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                <Plus className="h-4 w-4" /> Tambah Item
              </button>
            </div>

            {errors.details && <p className="mb-3 text-sm text-rose-600">{errors.details}</p>}

            <div className="space-y-4">
              {details.map((item, index) => {
                const stokTersedia = stockMap[String(item.id_item_potong || '')] || 0;
                const subtotal = Number(item.jumlah_kg || 0) * Number(parseMoneyInput(item.harga_jual) || 0);
                return (
                  <div key={`detail-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-4 lg:grid-cols-[2.2fr_1fr_1fr_auto]">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Item Potong Boning</label>
                        <SearchableSelect
                          options={getItemOptionsForRow(index)}
                          value={item.id_item_potong}
                          onChange={(value) => handleItemChange(index, value)}
                          placeholder="Pilih item potong"
                          accentColor="red"
                          isDisabled={isEdit && Boolean(editData?.detail_items?.[index])}
                        />
                        {isEdit && editData?.detail_items?.[index] && <p className="mt-1 text-xs text-amber-600">Item potong lama dikunci saat edit transaksi.</p>}
                        {item.id_item_potong && <p className="mt-1 text-xs text-slate-500">Stok tersedia: {Math.round(stokTersedia)} Kg</p>}
                        {errors[`details.${index}.id_item_potong`] && <p className="mt-1 text-xs text-rose-600">{errors[`details.${index}.id_item_potong`]}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Jumlah (Kg)</label>
                        <input type="number" min="0" step="0.001" value={item.jumlah_kg} onChange={(event) => handleJumlahKgChange(index, event.target.value)} className={inputClass} placeholder="0.000" />
                        {errors[`details.${index}.jumlah_kg`] && <p className="mt-1 text-xs text-rose-600">{errors[`details.${index}.jumlah_kg`]}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Harga Jual / Kg</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatMoneyInput(item.harga_jual)}
                            onChange={(event) => updateDetail(index, 'harga_jual', parseMoneyInput(event.target.value))}
                            className={inputClass}
                            placeholder="0"
                          />
                          {item.loadingHarga && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-rose-500" />}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Harga per 1 Kg. Total item dihitung otomatis dari jumlah Kg x harga per Kg.</p>
                        {errors[`details.${index}.harga_jual`] && <p className="mt-1 text-xs text-rose-600">{errors[`details.${index}.harga_jual`]}</p>}
                      </div>

                      <div className="flex items-end">
                        <button type="button" onClick={() => removeDetailRow(index)} disabled={details.length === 1 || isEdit} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-500">Subtotal item</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t bg-sky-50 px-5 py-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-sky-900"><input type="checkbox" checked={form.gunakan_saldo} onChange={(e) => setForm((prev) => ({ ...prev, gunakan_saldo: e.target.checked, penggunaan_saldo: e.target.checked ? prev.penggunaan_saldo : '' }))} /> Gunakan saldo pedagang</label>
            <div className="mt-2 flex max-w-md gap-2"><input type="text" inputMode="numeric" required={form.gunakan_saldo} disabled={!form.gunakan_saldo} value={formatMoneyInput(form.penggunaan_saldo)} onChange={(e) => updateForm('penggunaan_saldo', String(Math.min(Number(parseMoneyInput(e.target.value) || 0), totals.grandTotal)))} className={inputClass} placeholder="Nominal saldo" /><button type="button" disabled={!form.gunakan_saldo} onClick={() => updateForm('penggunaan_saldo', String(maxPenggunaanSaldo))} className="rounded-lg border border-sky-300 px-3 text-xs font-bold text-sky-700 disabled:opacity-50">Maks</button></div>
            <p className="mt-1 text-xs text-sky-700">Saldo tersedia: {formatCurrency(Number(selectedPedagang?.saldo_keseluruhan || 0))}</p>
            {errors.penggunaan_saldo && <p className="mt-1 text-xs text-rose-600">{errors.penggunaan_saldo}</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Total Berat</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{formatNumber(totals.totalBerat, 0)} Kg</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Total Harga Item</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(totals.totalHargaItem)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">Biaya Pengiriman</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{formatCurrency(totals.biayaPengiriman)}</div>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-sm text-rose-600">Grand Total Tagihan</div>
              <div className="mt-1 text-lg font-bold text-rose-700">{formatCurrency(totals.grandTotal)}</div>
              <div className="mt-2 border-t border-rose-200 pt-2 text-xs text-rose-600">Sisa Tagihan</div>
              <div className="text-lg font-bold text-rose-700">{formatCurrency(Math.max(totals.grandTotal - (form.gunakan_saldo ? Number(form.penggunaan_saldo || 0) : 0), 0))}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={onClose} disabled={loading || submitting} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              Batal
            </button>
            <button type="submit" disabled={loading || submitting} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
              {(loading || submitting) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditBoningModal;
