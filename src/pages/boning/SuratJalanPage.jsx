import React from 'react';
import { FileText, Truck, CheckCircle, Clock } from 'lucide-react';

const SuratJalanPage = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Surat Jalan</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Delivery</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">On Delivery</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">136</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-8">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Surat Jalan Management</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Kelola surat jalan pengiriman daging hasil boning dengan tracking real-time.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <FileText className="h-8 w-8 text-blue-600 mb-3" />
              <h4 className="text-sm font-semibold text-blue-900">Document Generation</h4>
              <p className="text-xs text-blue-700 mt-1">
                Generate surat jalan otomatis dengan detail produk, customer, dan driver
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Hari ini:</span>
                  <span className="font-medium text-blue-900">15 dokumen</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Minggu ini:</span>
                  <span className="font-medium text-blue-900">89 dokumen</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-800">Bulan ini:</span>
                  <span className="font-medium text-blue-900">356 dokumen</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <Truck className="h-8 w-8 text-purple-600 mb-3" />
              <h4 className="text-sm font-semibold text-purple-900">Delivery Tracking</h4>
              <p className="text-xs text-purple-700 mt-1">
                Real-time tracking pengiriman dengan update status dan lokasi
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-purple-800">Route A:</span>
                  <span className="font-medium text-purple-900">5 pengiriman</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-800">Route B:</span>
                  <span className="font-medium text-purple-900">3 pengiriman</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-purple-800">Express:</span>
                  <span className="font-medium text-purple-900">2 pengiriman</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-green-900">Delivery Confirmation</h4>
              <p className="text-xs text-green-700 mt-1">
                Konfirmasi penerimaan dengan digital signature dan foto bukti
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <Clock className="h-8 w-8 text-yellow-600 mb-3" />
              <h4 className="text-sm font-semibold text-yellow-900">Schedule Management</h4>
              <p className="text-xs text-yellow-700 mt-1">
                Penjadwalan pengiriman dengan optimasi rute dan waktu delivery
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors">
              <FileText className="w-5 h-5 mr-2" />
              Buat Surat Jalan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuratJalanPage;
