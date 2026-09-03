import React, { useEffect, useState, useCallback } from 'react';
import { X, Home, Loader2 } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import KandangService from '../../../../services/kandangService';
import StokSapiService from '../../../../services/stokSapiService';
import StokDokaService from '../../../../services/stokDokaService';

const BulkAssignKandangModal = ({ isOpen, onClose, selectedPids = [], onSuccess, animalType = 'sapi' }) => {
  const isDoka = animalType === 'doka';
  const animalLabel = isDoka ? 'DOKA' : 'sapi';
  const [kandangOptions, setKandangOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKandang, setSelectedKandang] = useState('');

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await KandangService.getOptions();
    if (res.success) {
      setKandangOptions(res.data || []);
    } else {
      setError(res.message || 'Gagal memuat daftar kandang');
      setKandangOptions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedKandang('');
      setError(null);
      fetchOptions();
    }
  }, [isOpen, fetchOptions]);

  const handleSubmit = async () => {
    if (!selectedKandang) {
      setError('Pilih kandang terlebih dahulu');
      return;
    }
    if (!selectedPids.length) {
      setError(`Tidak ada ${animalLabel} yang dipilih`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = isDoka
      ? await StokDokaService.bulkAssignKandang(selectedPids, selectedKandang)
      : await StokSapiService.bulkAssignKandang(selectedPids, selectedKandang);
    setSubmitting(false);

    if (res.success) {
      onSuccess?.(res);
      onClose?.();
    } else {
      setError(res.message || 'Gagal assign kandang');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">Assign Kandang</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={submitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <p className="text-sm text-gray-600">
            Memilih <span className="font-semibold text-emerald-700">{selectedPids.length} {animalLabel}</span> untuk
            dimasukkan ke kandang.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Memuat daftar kandang...
            </div>
          ) : kandangOptions.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Belum ada kandang aktif. Tambah kandang dulu di menu Master Kandang.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Pilih Kandang</label>
              <SearchableSelect
                options={kandangOptions}
                value={selectedKandang}
                onChange={(val) => setSelectedKandang(val || '')}
                placeholder="— Pilih kandang —"
                isLoading={loading}
                isDisabled={submitting}
                isClearable={false}
                accentColor="green"
                required
              />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading || !selectedKandang || selectedPids.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Assign Kandang'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignKandangModal;
