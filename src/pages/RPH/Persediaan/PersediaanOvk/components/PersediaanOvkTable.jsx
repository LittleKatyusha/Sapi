import React from 'react';
import { Package, Search } from 'lucide-react';
import usePersediaanOvk from '../hooks/usePersediaanOvk';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

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
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
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
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="px-6 py-4 text-left font-semibold w-16">No</th>
              <th className="px-6 py-4 text-left font-semibold">Nama OVK</th>
              <th className="px-6 py-4 text-center font-semibold w-32">Jumlah (PCS)</th>
              <th className="px-6 py-4 text-right font-semibold w-40">Harga (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {persediaanData.map((item, index) => (
              <tr
                key={item.id}
                className="hover:bg-blue-50/50 transition-colors"
              >
                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.namaOvk}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {item.stok?.toLocaleString('id-ID')} PCS
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  {formatCurrency(item.hargaSatuan)}
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
