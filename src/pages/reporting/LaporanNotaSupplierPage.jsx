import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, Hash, FileCheck, Search } from 'lucide-react';
import LaporanPembelianService from '../../services/laporanPembelianService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const LaporanNotaSupplierPage = () => {
  const [selectedNota, setSelectedNota] = useState('');
  const [notaOptions, setNotaOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load available nota numbers on component mount
  useEffect(() => {
    const loadNotaNumbers = async () => {
      setLoadingNotas(true);
      try {
        const result = await LaporanPembelianService.getAllNotaNumbers();
        
        if (result.success && result.data) {
          setNotaOptions(result.data);
        } else {
          console.error('Failed to load nota numbers');
          setNotaOptions([]);
        }
      } catch (error) {
        console.error('Error loading nota numbers:', error);
        setError('Gagal memuat daftar nota. Silakan refresh halaman.');
        setNotaOptions([]);
      } finally {
        setLoadingNotas(false);
      }
    };

    loadNotaNumbers();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedNota) {
      setError('Nota harus dipilih');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Backend expects 'id' parameter which should be the encrypted pubid
      const blob = await LaporanPembelianService.downloadPdfReport('getReportNotaSupplier', {
        id: selectedNota  // This should be the encrypted pubid from the dropdown
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LAPORAN_NOTA_SUPPLIER_${selectedNota}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Laporan berhasil diunduh');
    } catch (error) {
      console.error('Error downloading report:', error);
      setError(error.message || 'Terjadi kesalahan saat mengunduh laporan');
    } finally {
      setLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="mr-3 text-blue-600" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan per Nota Supplier</h1>
              <p className="text-gray-600 text-sm">Generate laporan pembelian berdasarkan nomor nota tertentu</p>
            </div>
          </div>
          <div className="hidden md:flex items-center bg-blue-50 px-4 py-2 rounded-lg">
            <Hash className="mr-2 text-blue-600" size={16} />
            <span className="text-blue-600 text-sm font-medium">
              {notaOptions.length} nota tersedia
            </span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nota Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Hash className="w-4 h-4 inline mr-2" />
                Pilih Nota Pembelian *
              </label>
              
              {loadingNotas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Memuat daftar nota...</span>
                </div>
              ) : (
                <SearchableSelect
                  value={selectedNota}
                  onChange={(value) => setSelectedNota(value)}
                  options={notaOptions.map(option => ({
                    ...option,
                    label: `${option.label} - ${option.supplier}`
                  }))}
                  placeholder={
                    notaOptions.length === 0
                      ? 'Tidak ada nota tersedia'
                      : 'Pilih nota yang ingin dilaporkan'
                  }
                  isLoading={loadingNotas}
                  isDisabled={loading || notaOptions.length === 0}
                  required
                  className="w-full"
                />
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                💡 Pilih nomor nota dari daftar pembelian yang tersedia
              </p>
              
              {notaOptions.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  <Search className="w-3 h-3 inline mr-1" />
                  Anda dapat mengetik untuk mencari nota tertentu
                </p>
              )}
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="mr-2 text-red-600" size={20} />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <FileCheck className="mr-2 text-green-600" size={20} />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !selectedNota || notaOptions.length === 0}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2" size={20} />
                    Unduh Laporan PDF
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Informasi Laporan</h3>
            <div className="text-blue-700 space-y-1">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Laporan akan menampilkan detail pembelian untuk nota yang dipilih
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Format laporan: PDF yang dapat langsung diunduh
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Laporan mencakup detail supplier, tanggal, dan informasi pembelian lengkap
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                Gunakan kotak pencarian untuk menemukan nota tertentu dengan cepat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {notaOptions.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Nota</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Hash className="text-blue-600 mr-2" size={20} />
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Nota</p>
                  <p className="text-2xl font-bold text-blue-800">{notaOptions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <FileText className="text-green-600 mr-2" size={20} />
                <div>
                  <p className="text-green-600 text-sm font-medium">Siap Dilaporkan</p>
                  <p className="text-2xl font-bold text-green-800">{notaOptions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Search className="text-purple-600 mr-2" size={20} />
                <div>
                  <p className="text-purple-600 text-sm font-medium">Pencarian</p>
                  <p className="text-2xl font-bold text-purple-800">Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanNotaSupplierPage;