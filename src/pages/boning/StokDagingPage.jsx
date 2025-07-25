import React from 'react';
import { Package, Thermometer, Clock, AlertTriangle } from 'lucide-react';

const StokDagingPage = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stok</p>
              <p className="text-2xl font-bold text-gray-900">2,450 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Thermometer className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fresh Stock</p>
              <p className="text-2xl font-bold text-gray-900">1,850 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mendekati Expired</p>
              <p className="text-2xl font-bold text-gray-900">320 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stok Minimum</p>
              <p className="text-2xl font-bold text-gray-900">8 item</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Stok Daging Boning</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Kelola inventaris daging hasil olahan boning dengan sistem tracking real-time.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <Package className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="text-sm font-semibold text-blue-900">Inventory Tracking</h4>
              <p className="text-xs text-blue-700 mt-1">
                Real-time tracking stok berdasarkan grade, potongan, dan lokasi penyimpanan
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade A:</span>
                  <span className="font-medium text-blue-900">850 kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade B:</span>
                  <span className="font-medium text-blue-900">980 kg</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Grade C:</span>
                  <span className="font-medium text-blue-900">620 kg</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <Thermometer className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-green-900">Cold Storage Management</h4>
              <p className="text-xs text-green-700 mt-1">
                Monitor suhu, kelembaban, dan kondisi penyimpanan daging
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Freezer 1:</span>
                  <span className="font-medium text-green-900">-18°C ✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Freezer 2:</span>
                  <span className="font-medium text-green-900">-20°C ✓</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-800">Chiller:</span>
                  <span className="font-medium text-green-900">2°C ✓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <Clock className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="text-sm font-semibold text-yellow-900">Expiry Management</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Sistem FIFO dan alert untuk produk mendekati tanggal kadaluarsa
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <AlertTriangle className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="text-sm font-semibold text-red-900">Stock Alerts</h4>
              <p className="text-xs text-red-700 mt-1">
                Notifikasi otomatis untuk stok minimum dan kebutuhan restock
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              <Package className="w-5 h-5 mr-2" />
              Kelola Stok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokDagingPage;
