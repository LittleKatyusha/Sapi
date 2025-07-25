import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity, Plus, Download, Search } from 'lucide-react';
import DataTable from 'react-data-table-component';

const KeuanganPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample data untuk demo
  const transactionData = [
    {
      id: 1,
      tanggal: '2024-01-15',
      kategori: 'Pemasukan',
      deskripsi: 'Penjualan daging sapi grade A - 500kg',
      jumlah: 15000000,
      status: 'completed',
      outlet: 'Outlet Menteng'
    },
    {
      id: 2,
      tanggal: '2024-01-14',
      kategori: 'Pengeluaran',
      deskripsi: 'Pembelian sapi hidup - 2 ekor',
      jumlah: -12000000,
      status: 'completed',
      supplier: 'CV Ternak Jaya'
    },
    {
      id: 3,
      tanggal: '2024-01-13',
      kategori: 'Pemasukan',
      deskripsi: 'Penjualan daging sapi grade B - 300kg',
      jumlah: 8500000,
      status: 'completed',
      outlet: 'Outlet Kemang'
    },
    {
      id: 4,
      tanggal: '2024-01-12',
      kategori: 'Pengeluaran',
      deskripsi: 'Biaya operasional boning (listrik, air)',
      jumlah: -2500000,
      status: 'completed',
      kategori_detail: 'Operasional'
    },
    {
      id: 5,
      tanggal: '2024-01-11',
      kategori: 'Pemasukan',
      deskripsi: 'Penjualan tulang dan jeroan - 200kg',
      jumlah: 3500000,
      status: 'completed',
      outlet: 'Outlet Senayan'
    }
  ];

  // Kolom untuk DataTable
  const columns = useMemo(() => [
    {
      name: 'Tanggal',
      selector: row => row.tanggal,
      sortable: true,
      width: '120px',
      cell: row => (
        <span className="text-sm text-gray-600">
          {new Date(row.tanggal).toLocaleDateString('id-ID')}
        </span>
      )
    },
    {
      name: 'Kategori',
      selector: row => row.kategori,
      sortable: true,
      width: '130px',
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.kategori === 'Pemasukan' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {row.kategori}
        </span>
      )
    },
    {
      name: 'Deskripsi',
      selector: row => row.deskripsi,
      sortable: true,
      wrap: true,
      cell: row => (
        <div className="py-2">
          <div className="text-sm font-medium text-gray-900">{row.deskripsi}</div>
          {row.outlet && (
            <div className="text-xs text-blue-600">{row.outlet}</div>
          )}
          {row.supplier && (
            <div className="text-xs text-purple-600">{row.supplier}</div>
          )}
        </div>
      )
    },
    {
      name: 'Jumlah',
      selector: row => row.jumlah,
      sortable: true,
      width: '150px',
      right: true,
      cell: row => (
        <span className={`font-mono font-bold text-sm ${
          row.jumlah > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.jumlah > 0 ? '+' : ''}Rp {Math.abs(row.jumlah).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '100px',
      cell: row => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Selesai
        </span>
      )
    }
  ], []);

  // Filter data berdasarkan search
  const filteredData = useMemo(() => {
    return transactionData.filter(item =>
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactionData, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-gray-900">Rp 45,230,000</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% dari bulan lalu
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-gray-900">Rp 32,145,000</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.3% dari bulan lalu
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Keuntungan Bersih</p>
              <p className="text-2xl font-bold text-gray-900">Rp 13,085,000</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +28.9% dari bulan lalu
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transaksi Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
              <p className="text-sm text-yellow-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15 dari bulan lalu
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Transaksi Keuangan</h3>
              <p className="text-sm text-gray-500 mt-1">Kelola semua transaksi keuangan operasional boning</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Transaksi
              </button>
            </div>
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
                placeholder="Cari transaksi berdasarkan deskripsi atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            highlightOnHover
            responsive
            striped
            noDataComponent={
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data transaksi</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Mulai dengan menambahkan transaksi keuangan pertama Anda.
                </p>
              </div>
            }
            customStyles={{
              header: {
                style: {
                  backgroundColor: '#f9fafb',
                  fontWeight: '600'
                }
              },
              rows: {
                style: {
                  '&:hover': {
                    backgroundColor: '#f9fafb'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default KeuanganPage;
