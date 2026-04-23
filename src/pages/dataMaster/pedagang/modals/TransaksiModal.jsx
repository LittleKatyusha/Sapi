import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Scissors, Calculator } from 'lucide-react';
import { CUT_PARTS } from '../constants/cutParts';
import { formatCurrency } from '../utils/formatters';
import PedagangService from '../../../../services/pedagangService';

const TransaksiModal = ({ isOpen, onClose, data, onSubmit, loading }) => {
  const [qtyData, setQtyData] = useState({});
  const [hargaData, setHargaData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Initialize empty qty
  useEffect(() => {
    if (isOpen) {
      const empty = {};
      CUT_PARTS.forEach(({ key }) => { empty[`qty_${key}`] = ''; });
      empty.ekor_karkas = '';
      setQtyData(empty);
      setHargaData({});
    }
  }, [isOpen]);

  // Fetch detail to get current harga when data changes
  useEffect(() => {
    if (isOpen && data?.pid) {
      const fetchHarga = async () => {
        setDetailLoading(true);
        try {
          const result = await PedagangService.show(data.pid);
          if (result.success && result.data?.harga) {
            setHargaData(result.data.harga);
          }
        } catch {
          // Silently fail - harga display is optional
        } finally {
          setDetailLoading(false);
        }
      };
      fetchHarga();
    }
  }, [isOpen, data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Allow only non-negative integers
    const finalValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setQtyData(prev => ({ ...prev, [name]: finalValue }));
  };

  // Calculate total angkatan (sum of qty * harga)
  const totalAngkatan = useMemo(() => {
    let total = 0;
    CUT_PARTS.forEach(({ key }) => {
      const qty = Number(qtyData[`qty_${key}`]) || 0;
      const harga = Number(hargaData[key]) || 0;
      total += qty * harga;
    });
    return total;
  }, [qtyData, hargaData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data) return;

    setIsSubmitting(true);
    try {
      const payload = { pid: data.pid };
      CUT_PARTS.forEach(({ key }) => {
        payload[`qty_${key}`] = Number(qtyData[`qty_${key}`]) || 0;
      });
      payload.ekor_karkas = Number(qtyData.ekor_karkas) || 0;

      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Transaksi Angkatan</h3>
              <p className="text-gray-500 text-sm">{data.nama_alias} — {data.id_pedagang}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-3"></div>
              <span className="text-gray-500">Memuat harga...</span>
            </div>
          ) : (
            <>
              {/* Ekor Karkas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="ekor-karkas">
                  Ekor Karkas
                </label>
                <input
                  id="ekor-karkas"
                  type="number"
                  name="ekor_karkas"
                  value={qtyData.ekor_karkas}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="0"
                  min="0"
                  disabled={isSubmitting}
                  inputMode="numeric"
                />
              </div>

              {/* Qty Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {CUT_PARTS.map(({ key, label }) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor={`qty-${key}`}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`qty-${key}`}
                        type="number"
                        name={`qty_${key}`}
                        value={qtyData[`qty_${key}`]}
                        onChange={handleInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0"
                        min="0"
                        disabled={isSubmitting}
                        inputMode="numeric"
                      />
                      {hargaData[key] != null && hargaData[key] !== '' && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatCurrency(hargaData[key])}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Angkatan */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Total Angkatan</span>
                </div>
                <span className="text-lg font-bold text-green-800">{formatCurrency(totalAngkatan)}</span>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || detailLoading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Transaksi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransaksiModal;
