import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Search, Square, X } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

const PilihPakanOvkModal = ({
  isOpen,
  onClose,
  items = [],
  initialSelected = [],
  onApply,
  title = 'Persediaan',
  accentClass = 'from-emerald-600 to-emerald-500',
  isLoading = false,
  errorMessage = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMap, setSelectedMap] = useState({});

  // Warehouse stock is keyed by (id_produk, id_satuan, price) — same product can
  // appear in multiple satuan (e.g. MINYAK LITER vs DUS) AND same product+satuan
  // can have different prices (different batches/suppliers). Using id+satuan
  // alone makes one checkbox toggle every row of that product+satuan, even
  // when prices differ.
  const getDefaultPrice = (item) => item.priceOptions?.[0] ?? item.price ?? 0;
  const getRowKey = (item) => `${item.id}|${item.id_satuan ?? ''}|${getDefaultPrice(item)}`;

  // Qty already in this transaction (from initialSelected). In edit mode,
  // warehouse stock has already been reduced by these amounts, so the
  // effective available stock = current_warehouse_stock + already_taken.
  // Without this, editing a purchase shows "Melebihi stok" for the user's
  // own previously-saved qty.
  const initialQtyMap = useMemo(() => {
    const map = {};
    initialSelected.forEach((item) => {
      map[getRowKey(item)] = Number(item.qty ?? 0);
    });
    return map;
  }, [initialSelected]);

  useEffect(() => {
    if (!isOpen) return;
    const next = {};
    initialSelected.forEach((item) => {
      next[getRowKey(item)] = {
        selected: true,
        qty: item.qty ?? '',
        price: item.price || getDefaultPrice(item)
      };
    });
    setSelectedMap(next);
    setSearchTerm('');
  }, [isOpen, initialSelected]);

  // Extract base product name and satuan from display name.
  // Warehouse view returns names like "MINYAK (KG)" — we split so the
  // satuan gets its own column and same products group together when sorted.
  const splitNameSatuan = (item) => {
    const rawName = item.name || '';
    const match = rawName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (match) {
      return { baseName: match[1].trim(), satuan: match[2].trim() };
    }
    return { baseName: rawName, satuan: item.unit || '' };
  };

  const filteredItems = useMemo(() => {
    // In edit mode, an item may have warehouse stock 0 but still be in
    // the transaction (already taken). Show it so user can adjust/remove.
    const withStock = items.filter((item) => {
      const warehouseStock = Number(item.stock ?? item.qty ?? 0);
      const alreadyTaken = initialQtyMap[getRowKey(item)] ?? 0;
      return warehouseStock > 0 || alreadyTaken > 0;
    });
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      return withStock.filter((item) =>
        [item.name, item.product]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(lower))
      );
    }
    // Sort by base product name so same products (different satuan) group together.
    return [...withStock].sort((a, b) => {
      const aName = splitNameSatuan(a).baseName.toLowerCase();
      const bName = splitNameSatuan(b).baseName.toLowerCase();
      return aName.localeCompare(bName, 'id');
    });
  }, [items, searchTerm, initialQtyMap]);

  const handleSelectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        const key = getRowKey(item);
        next[key] = {
          selected: true,
          qty: next[key]?.qty ?? '',
          price: next[key]?.price || getDefaultPrice(item)
        };
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        delete next[getRowKey(item)];
      });
      return next;
    });
  };

  const handleToggleSelect = (item) => {
    const key = getRowKey(item);
    setSelectedMap((prev) => {
      const current = prev[key];
      const next = { ...prev };
      if (current?.selected) {
        delete next[key];
        return next;
      }
      next[key] = {
        selected: true,
        qty: current?.qty ?? '',
        price: current?.price || getDefaultPrice(item)
      };
      return next;
    });
  };

  const handleQtyChange = (item, qty) => {
    const key = getRowKey(item);
    setSelectedMap((prev) => ({
      ...prev,
      [key]: {
        selected: true,
        qty: qty === '' ? '' : qty,
        price: prev[key]?.price || getDefaultPrice(item)
      }
    }));
  };

  const selectedItems = useMemo(() => {
    return Object.entries(selectedMap)
      .filter(([, value]) => value.selected)
      .map(([key, value]) => {
        const item = items.find((entry) => getRowKey(entry) === key);
        if (!item) return null;
        return {
          ...item,
          qty: value.qty,
          price: value.price
        };
      })
      .filter(Boolean);
  }, [items, selectedMap]);

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.qty || 0),
    0
  );

  const handleApply = () => {
    if (onApply) {
      onApply(selectedItems);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`flex items-center justify-between bg-gradient-to-r ${accentClass} px-6 py-4 text-white`}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/80">Persediaan</p>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition hover:bg-white/15"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama produk, kode barang, atau pemasok..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Deselect Semua
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto px-6 pb-6 pt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-12 border-b border-slate-200 px-3 py-2 text-center">Pilih</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Nama Produk</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Satuan</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Produk</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-right">Harga</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-right">Stok Tersedia</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Jumlah Pembelian</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      Memuat data produk...
                    </td>
                  </tr>
                )}
                {!isLoading && errorMessage && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-red-600">
                      {errorMessage}
                    </td>
                  </tr>
                )}
                {!isLoading && !errorMessage && filteredItems.map((item, idx) => {
                  const rowKey = getRowKey(item);
                  const current = selectedMap[rowKey];
                  const isSelected = Boolean(current?.selected);
                  const { baseName, satuan } = splitNameSatuan(item);
                  const prevBaseName = idx > 0 ? splitNameSatuan(filteredItems[idx - 1]).baseName : null;
                  // Visual grouping: thicker top border when product changes.
                  const groupBorder = idx > 0 && prevBaseName !== baseName;

                  // Effective stock = warehouse stock + qty already in this
                  // transaction. In edit mode, warehouse stock was already
                  // reduced by the previous save, so we add back what's
                  // already allocated to this purchase.
                  const warehouseStock = Number(item.stock ?? item.qty ?? 0);
                  const alreadyTaken = initialQtyMap[rowKey] ?? 0;
                  const effectiveStock = warehouseStock + alreadyTaken;
                  const stockColor =
                    effectiveStock <= 0 ? 'bg-red-100 text-red-700 border-red-200'
                    : effectiveStock <= 5 ? 'bg-amber-100 text-amber-700 border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                  const enteredQty = Number(current?.qty ?? 0);
                  const isOverStock = enteredQty > 0 && enteredQty > effectiveStock;

                  return (
                    <tr
                      key={rowKey}
                      className={`border-b border-slate-100 transition hover:bg-emerald-50/50 ${
                        isSelected ? 'bg-emerald-50' : ''
                      } ${groupBorder ? 'border-t-2 border-t-slate-200' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item)}
                          className="rounded-md p-1 transition hover:bg-emerald-100"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{baseName}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {satuan || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{item.product || '-'}</td>
                      <td className="px-3 py-2 text-right text-sm text-slate-600">
                        {formatCurrency(getDefaultPrice(item))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${stockColor}`}>
                          <span className="opacity-70">Tersedia:</span>
                          <span>{effectiveStock}{satuan ? ` ${satuan}` : ''}</span>
                        </span>
                        {alreadyTaken > 0 && (
                          <p className="mt-1 text-[10px] font-medium text-slate-400">
                            {warehouseStock} gudang + {alreadyTaken} transaksi ini
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={effectiveStock || undefined}
                          value={current?.qty ?? ''}
                          onChange={(event) => handleQtyChange(item, event.target.value === '' ? '' : Number(event.target.value))}
                          className={`w-full rounded-lg border bg-white px-2 py-1.5 text-sm text-slate-700 ${
                            isOverStock ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100'
                          }`}
                          placeholder="0"
                        />
                        {isOverStock && (
                          <p className="mt-1 text-[10px] font-medium text-red-600">
                            Melebihi stok ({effectiveStock})
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !errorMessage && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      Data tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-700">
              {selectedItems.length} produk
            </span>{' '}
            dipilih • Total {formatCurrency(totalPrice)}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Pilih
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilihPakanOvkModal;