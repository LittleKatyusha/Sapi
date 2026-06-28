import React from 'react';
import { ShoppingCart, X, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const ProdukDetailTable = ({ detailProduk, onQtyChange, onRemove, onAddProduk, isJenisPenjualanSelected }) => {
    const hasItems = detailProduk.length > 0;

    return (
        <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Detail Produk</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {hasItems ? `${detailProduk.length} item ditambahkan` : 'Belum ada produk dipilih'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onAddProduk()}
                    disabled={!isJenisPenjualanSelected}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isJenisPenjualanSelected
                            ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <Plus size={14} />
                    Tambah Produk
                </button>
            </div>

            {!isJenisPenjualanSelected && (
                <div className="px-5 py-2 bg-amber-50/60 border-b border-amber-100 text-xs text-amber-700">
                    Pilih jenis penjualan terlebih dahulu untuk menambahkan produk.
                </div>
            )}

            {!hasItems ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <ShoppingCart size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Belum ada produk</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                        {isJenisPenjualanSelected
                            ? 'Klik "Tambah Produk" untuk memilih produk yang akan dijual.'
                            : 'Pilih jenis penjualan terlebih dahulu, lalu tambahkan produk.'}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">No</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Beli</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">%</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Jual</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">QTY</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Subtotal</th>
                                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detailProduk.map((item, index) => {
                                    const qty = parseFloat(item.qty) || 0;
                                    const subtotal = (item.produk?.hargaJual || 0) * qty;
                                    return (
                                        <tr key={item.produk?.id || `${index}-${item.produk?.label}`} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                                            <td className="px-4 py-3 min-w-[180px]">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.produk?.label}</p>
                                                <p className="text-xs text-gray-500">{item.produk?.produk}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-right text-gray-500 whitespace-nowrap tabular-nums">{formatCurrency(item.produk?.hargaBeli || 0)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs text-gray-500">{item.produk?.persentase}%</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap tabular-nums">{formatCurrency(item.produk?.hargaJual || 0)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => onQtyChange(index, e.target.value)}
                                                    placeholder="0"
                                                    step="0.01"
                                                    min="0"
                                                    className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-center text-sm tabular-nums"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap tabular-nums">{formatCurrency(subtotal)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => onRemove(index)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                    title="Hapus"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="sm:hidden divide-y divide-gray-100">
                        {detailProduk.map((item, index) => {
                            const qty = parseFloat(item.qty) || 0;
                            const subtotal = (item.produk?.hargaJual || 0) * qty;
                            return (
                                <div key={item.produk?.id || `${index}-${item.produk?.label}`} className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.produk?.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.produk?.produk}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(index)}
                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            title="Hapus"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex items-end justify-between gap-3">
                                        <div className="text-xs text-gray-500">
                                            <p>Harga Jual: <span className="font-medium text-gray-900">{formatCurrency(item.produk?.hargaJual || 0)}</span></p>
                                            <p className="mt-0.5">Harga Beli: {formatCurrency(item.produk?.hargaBeli || 0)} ({item.produk?.persentase}%)</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => onQtyChange(index, e.target.value)}
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-center text-sm tabular-nums"
                                            />
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-xs text-gray-400">Subtotal</p>
                                                <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(subtotal)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
};

export default ProdukDetailTable;