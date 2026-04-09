import React from 'react';
import { Package } from 'lucide-react';
import usePersediaanOvk from '../hooks/usePersediaanOvk';

const PersediaanOvkTable = () => {
  const { persediaanData, loading, error, refresh } = usePersediaanOvk();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600">Memuat data persediaan OVK...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!persediaanData || persediaanData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-12 flex flex-col items-center justify-center text-gray-400">
        <Package className="w-16 h-16 mb-4" />
        <span>Belum ada data persediaan OVK</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-700 tracking-wide w-12">No</th>
              <th className="px-4 py-3 text-left text-[13px] font-semibold text-gray-700 tracking-wide border-r border-gray-200">Nama Produk</th>
              <th className="px-4 py-3 text-center text-[13px] font-semibold text-gray-700 tracking-wide border-r border-gray-200">Satuan</th>
              <th className="px-4 py-3 text-center text-[13px] font-semibold text-gray-700 tracking-wide border-r border-gray-200">Jumlah Stok</th>
              <th className="px-4 py-3 text-right text-[13px] font-semibold text-gray-700 tracking-wide">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {persediaanData.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-all duration-200"
              >
                <td className="px-4 py-3 text-[13px] text-gray-600 border-r border-gray-100">{index + 1}</td>
                <td className="px-4 py-3 text-[13px] border-r border-gray-100">
                  <div className="font-medium text-gray-900">{item.nama_produk}</div>
                </td>
                <td className="px-4 py-3 text-center border-r border-gray-100">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700">
                    {item.satuan}
                  </span>
                </td>
                <td className="px-4 py-3 text-center border-r border-gray-100">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-700">
                    {item.jumlah}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-medium text-gray-900">
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
