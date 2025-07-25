import React from 'react';
import { RotateCcw, AlertCircle, Package, TrendingDown } from 'lucide-react';

const ReturnPage = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Return</p>
              <p className="text-2xl font-bold text-gray-900">23 item</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Process</p>
              <p className="text-2xl font-bold text-gray-900">8 item</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Return Value</p>
              <p className="text-2xl font-bold text-gray-900">Rp 12,500,000</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Return Rate</p>
              <p className="text-2xl font-bold text-gray-900">2.3%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <RotateCcw className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Return Management</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Kelola proses return produk daging dari customer dengan sistem tracking lengkap.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
              <RotateCcw className="h-8 w-8 text-red-600 mb-3" />
              <h4 className="text-sm font-semibold text-red-900">Return Processing</h4>
              <p className="text-xs text-red-700 mt-1">
                Proses return dari customer dengan validasi kualitas dan dokumentasi lengkap
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-red-800">Quality Issue:</span>
                  <span className="font-medium text-red-900">15 kasus</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-800">Expired Product:</span>
                  <span className="font-medium text-red-900">5 kasus</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-800">Wrong Delivery:</span>
                  <span className="font-medium text-red-900">3 kasus</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <AlertCircle className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="text-sm font-semibold text-yellow-900">Quality Control</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Inspeksi kualitas produk return dan penentuan tindakan selanjutnya
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-800">Repackaging:</span>
                  <span className="font-medium text-yellow-900">8 item</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-800">Reprocessing:</span>
                  <span className="font-medium text-yellow-900">12 item</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-800">Disposal:</span>
                  <span className="font-medium text-yellow-900">3 item</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <Package className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="text-sm font-semibold text-blue-900">Refund Management</h4>
              <p className="text-xs text-blue-700 mt-1">
                Proses refund dan credit note untuk customer dengan approval workflow
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <TrendingDown className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-green-900">Return Analytics</h4>
              <p className="text-xs text-green-700 mt-1">
                Analisis trend return untuk improvement kualitas dan proses
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              <RotateCcw className="w-5 h-5 mr-2" />
              Process Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPage;
