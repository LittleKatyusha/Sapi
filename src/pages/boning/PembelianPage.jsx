import React, { useState } from 'react';
import { ShoppingCart, Plus, Package, TrendingUp, Truck, Clock, CheckCircle, Search } from 'lucide-react';

const PembelianPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample data untuk orders
  const orderData = [
    {
      id: 'PO-2024-001',
      tanggal: '2024-01-15',
      supplier: 'CV Ternak Sejahtera',
      item: 'Sapi Hidup Grade A - 2 Ekor',
      jumlah: 24000000,
      status: 'completed',
      statusColor: 'green'
    },
    {
      id: 'PO-2024-002',
      tanggal: '2024-01-14',
      supplier: 'PT Alat Dapur Jaya',
      item: 'Pisau Potong Professional Set',
      jumlah: 3500000,
      status: 'shipped',
      statusColor: 'purple'
    },
    {
      id: 'PO-2024-003',
      tanggal: '2024-01-13',
      supplier: 'CV Peternakan Makmur',
      item: 'Sapi Hidup Grade B - 3 Ekor',
      jumlah: 30000000,
      status: 'pending',
      statusColor: 'yellow'
    },
    {
      id: 'PO-2024-004',
      tanggal: '2024-01-12',
      supplier: 'PT Sanitasi Prima',
      item: 'Cleaning Supplies & Disinfectant',
      jumlah: 2500000,
      status: 'completed',
      statusColor: 'green'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'pending':
        return Clock;
      default:
        return Clock;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'shipped':
        return 'Dikirim';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const filteredOrders = orderData.filter(order =>
    order.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <p className="text-sm font-medium text-gray-600">Total Pembelian</p>
              <p className="text-2xl font-bold text-gray-900">Rp 125,000,000</p>
              <p className="text-sm text-blue-600">Bulan ini</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Order Selesai</p>
              <p className="text-2xl font-bold text-gray-900">21</p>
              <p className="text-sm text-green-600">dari 24 order</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-sm text-yellow-600">Menunggu konfirmasi</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dalam Pengiriman</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-purple-600">Estimasi sampai hari ini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manajemen Pembelian Boning</h3>
              <p className="text-sm text-gray-500 mt-1">Kelola pembelian sapi hidup, alat potong, dan supplies operasional</p>
            </div>
            <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Order Baru
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari order berdasarkan ID, supplier, atau item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Order Terbaru</h4>
            
            {/* Order Items */}
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-${order.statusColor}-100 rounded-lg flex items-center justify-center`}>
                        <StatusIcon className={`h-5 w-5 text-${order.statusColor}-600`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.item}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{order.supplier}</span>
                          <span>•</span>
                          <span>{order.id}</span>
                          <span>•</span>
                          <span>{new Date(order.tanggal).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        Rp {order.jumlah.toLocaleString('id-ID')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${order.statusColor}-100 text-${order.statusColor}-800`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada order ditemukan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Coba ubah kata kunci pencarian atau buat order baru.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Kategori Sapi Hidup</h4>
                  <p className="text-xs text-blue-700">Grade A, B, C tersedia</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-900">Alat & Equipment</h4>
                  <p className="text-xs text-green-700">Pisau, mesin, dll</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <ShoppingCart className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900">Supplies</h4>
                  <p className="text-xs text-purple-700">Sanitasi, kemasan, dll</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PembelianPage;
