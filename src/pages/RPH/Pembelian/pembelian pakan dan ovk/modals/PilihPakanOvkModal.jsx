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

  const getDefaultPrice = (item) => item.priceOptions?.[0] ?? item.price ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    const next = {};
    initialSelected.forEach((item) => {
      next[item.id] = {
        selected: true,
        qty: item.qty || 1,
        price: item.price || getDefaultPrice(item)
      };
    });
    setSelectedMap(next);
    setSearchTerm('');
  }, [isOpen, initialSelected]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter((item) =>
      [item.name, item.product]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lower))
    );
  }, [items, searchTerm]);

  const handleSelectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        next[item.id] = {
          selected: true,
          qty: next[item.id]?.qty || 1,
          price: next[item.id]?.price || getDefaultPrice(item)
        };
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((item) => {
        delete next[item.id];
      });
      return next;
    });
  };

  const handleToggleSelect = (item) => {
    setSelectedMap((prev) => {
      const current = prev[item.id];
      const next = { ...prev };
      if (current?.selected) {
        delete next[item.id];
        return next;
      }
      next[item.id] = {
        selected: true,
        qty: current?.qty || 1,
        price: current?.price || getDefaultPrice(item)
      };
      return next;
    });
  };

  const handleQtyChange = (item, qty) => {
    setSelectedMap((prev) => ({
      ...prev,
      [item.id]: {
        selected: true,
        qty: Math.max(1, qty || 1),
        price: prev[item.id]?.price || getDefaultPrice(item)
      }
    }));
  };

  const handlePriceChange = (item, price) => {
    setSelectedMap((prev) => ({
      ...prev,
      [item.id]: {
        selected: true,
        qty: prev[item.id]?.qty || 1,
        price: Number(price)
      }
    }));
  };

  const selectedItems = useMemo(() => {
    return Object.entries(selectedMap)
      .filter(([, value]) => value.selected)
      .map(([id, value]) => {
        const item = items.find((entry) => entry.id === id);
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
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Produk</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Harga</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Stok</th>
                  <th className="border-b border-slate-200 px-3 py-2 text-left">Jumlah Pembelian</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                      Memuat data produk...
                    </td>
                  </tr>
                )}
                {!isLoading && errorMessage && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
                      {errorMessage}
                    </td>
                  </tr>
                )}
                {!isLoading && !errorMessage && filteredItems.map((item) => {
                  const current = selectedMap[item.id];
                  const isSelected = Boolean(current?.selected);
                  const hasPriceOptions = (item.priceOptions || []).length > 0;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 transition hover:bg-emerald-50/50 ${
                        isSelected ? 'bg-emerald-50' : ''
                      }`}
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
                      <td className="px-3 py-2 font-semibold text-slate-700">{item.name}</td>
                      <td className="px-3 py-2 text-slate-600">{item.product || '-'}</td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-slate-500">
                          {formatCurrency(getDefaultPrice(item))}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{item.qty ?? item.stock ?? '-'}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={current?.qty ?? 1}
                          onChange={(event) => handleQtyChange(item, Number(event.target.value))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
                        />
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !errorMessage && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
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