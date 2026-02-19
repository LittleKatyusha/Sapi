import React from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const ProdukDetailTable = ({ detailProduk, onQtyChange, onRemove, onAddProduk, isJenisPenjualanSelected }) => {
    return (
        <div className="bg-white p-6 shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Detail Produk ({detailProduk.length} item)</h2>
                <button
                    type="button"
                    onClick={() => onAddProduk()}
                    disabled={!isJenisPenjualanSelected}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        isJenisPenjualanSelected
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <ShoppingCart size={18} />
                    Tambah Produk
                </button>
            </div>

            {detailProduk.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="font-semibold">Belum ada produk ditambahkan</p>
                    <p className="text-sm mt-1">Klik "Tambah Produk" untuk memulai</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <colgroup>
                            <col style={{ width: '50px' }} />
                            <col />
                            <col style={{ width: '130px' }} />
                            <col style={{ width: '80px' }} />
                            <col style={{ width: '130px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '140px' }} />
                            <col style={{ width: '60px' }} />
                        </colgroup>
                        <thead>
                            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700 border-b-2 border-emerald-200">No</th>
                                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700 border-b-2 border-emerald-200">Produk</th>
                                <th className="px-3 py-3 text-right text-sm font-bold text-gray-700 border-b-2 border-emerald-200">Harga Beli</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">%</th>
                                <th className="px-3 py-3 text-right text-sm font-bold text-gray-700 border-b-2 border-emerald-200">Harga Jual</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">QTY <span className="text-red-500">*</span></th>
                                <th className="px-3 py-3 text-right text-sm font-bold text-gray-700 border-b-2 border-emerald-200">Subtotal</th>
                                <th className="px-3 py-3 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailProduk.map((item, index) => {
                                const qty = parseFloat(item.qty) || 0;
                                const subtotal = (item.produk?.hargaJual || 0) * qty;
                                return (
                                    <tr key={item.produk?.id || crypto.randomUUID()} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors">
                                        <td className="px-3 py-3 text-sm text-gray-700">{index + 1}</td>
                                        <td className="px-3 py-3">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{item.produk?.label}</p>
                                            <p className="text-xs text-gray-500">{item.produk?.produk}</p>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-right text-gray-700 whitespace-nowrap">{formatCurrency(item.produk?.hargaBeli || 0)}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                {item.produk?.persentase}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-sm text-right font-semibold text-emerald-700 whitespace-nowrap">{formatCurrency(item.produk?.hargaJual || 0)}</td>
                                        <td className="px-3 py-3 text-center">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => onQtyChange(index, e.target.value)}
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-2 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 text-center text-sm"
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-sm text-right font-bold text-gray-800 whitespace-nowrap">{formatCurrency(subtotal)}</td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onRemove(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <X size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProdukDetailTable;