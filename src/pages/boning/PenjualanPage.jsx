import React from 'react';
import { TrendingUp, Package, Users, DollarSign, BarChart3, Target } from 'lucide-react';

const PenjualanPage = () => {
  return (
    <div className="space-y-6">
      {/* Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Penjualan Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">Rp 18,500,000</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Daging Terjual</p>
              <p className="text-2xl font-bold text-gray-900">1,245 kg</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Customer Aktif</p>
              <p className="text-2xl font-bold text-gray-900">142</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <TrendingUp className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Penjualan Boning</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Modul untuk mengelola penjualan hasil olahan daging sapi ke berbagai outlet dan customer.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <Package className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="text-sm font-semibold text-blue-900">Manajemen Stok</h4>
              <p className="text-xs text-blue-700 mt-1">
                Kelola stok daging hasil boning berdasarkan grade dan potongan
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <Users className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-green-900">Customer Management</h4>
              <p className="text-xs text-green-700 mt-1">
                Kelola data customer, outlet, dan distributor
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="text-sm font-semibold text-purple-900">Sales Analytics</h4>
              <p className="text-xs text-purple-700 mt-1">
                Analisis performa penjualan dan trend pasar
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <Target className="h-8 w-8 text-orange-600 mb-3" />
              <h4 className="text-sm font-semibold text-orange-900">Target & KPI</h4>
              <p className="text-xs text-orange-700 mt-1">
                Monitor target penjualan dan pencapaian KPI
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              <TrendingUp className="w-5 h-5 mr-2" />
              Mulai Penjualan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenjualanPage;
