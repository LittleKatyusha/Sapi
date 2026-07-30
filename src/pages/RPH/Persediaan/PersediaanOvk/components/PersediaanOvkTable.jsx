import React from 'react';
import { Package } from 'lucide-react';
import usePersediaanOvk from '../hooks/usePersediaanOvk';

const PersediaanOvkTable = () => {
  const { persediaanData, loading, error, refresh } = usePersediaanOvk();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
        <span className="text-sm text-gray-500">Memuat data persediaan OVK...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <button
          onClick={refresh}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!persediaanData || persediaanData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 flex flex-col items-center justify-center text-gray-400">
        <Package className="w-10 h-10 mb-2" />
        <span className="text-sm">Belum ada data persediaan OVK</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wide w-10">No</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tracking-wide border-r border-gray-200">Nama Produk</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide border-r border-gray-200">Satuan</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 tracking-wide border-r border-gray-200">Jumlah Stok</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 tracking-wide">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {persediaanData.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2 text-xs text-gray-500 border-r border-gray-100">{index + 1}</td>
                <td className="px-3 py-2 text-xs border-r border-gray-100">
                  <div className="font-medium text-gray-900">{item.nama_produk}</div>
                </td>
                <td className="px-3 py-2 text-center border-r border-gray-100">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                    {item.satuan}
                  </span>
                </td>
                <td className="px-3 py-2 text-center border-r border-gray-100">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium border border-green-200 bg-green-50 text-green-700">
                    {item.jumlah}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-xs font-medium text-gray-900">
                  Rp {item.nominal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersediaanOvkTable;
