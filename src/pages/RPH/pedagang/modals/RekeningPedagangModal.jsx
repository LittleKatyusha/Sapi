import React, { useState } from 'react';
import { X, FileText, Calendar, Printer, ChevronUp, ChevronDown } from 'lucide-react';

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const RekeningPedagangModal = ({ isOpen, onClose, pedagangData, onCetak }) => {
  const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [tahunInput, setTahunInput] = useState(() => String(new Date().getFullYear()));

  const clampTahun = (val) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, val));

  const handleTahunChange = (val) => {
    setTahunInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= MIN_YEAR && num <= MAX_YEAR) {
      setTahun(num);
    }
  };

  const handleTahunBlur = () => {
    const num = parseInt(tahunInput, 10);
    if (isNaN(num) || num < MIN_YEAR || num > MAX_YEAR) {
      const clamped = clampTahun(isNaN(num) ? new Date().getFullYear() : num);
      setTahun(clamped);
      setTahunInput(String(clamped));
    } else {
      setTahunInput(String(num));
    }
  };

  const incrementTahun = () => {
    const next = clampTahun(tahun + 1);
    setTahun(next);
    setTahunInput(String(next));
  };

  const decrementTahun = () => {
    const prev = clampTahun(tahun - 1);
    setTahun(prev);
    setTahunInput(String(prev));
  };

  if (!isOpen) return null;

  const handleCetak = async () => {
    setLoading(true);
    try {
      await onCetak({
        pid: pedagangData?.pid,
        bulan,
        tahun,
        nama_alias: pedagangData?.nama_alias,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md transform transition-all duration-300 scale-100 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Unduh Rekening</h3>
              <p className="text-gray-500 text-sm">Pilih periode rekening pedagang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Pedagang</p>
            <p className="text-base font-semibold text-gray-800">{pedagangData?.nama_alias || '-'}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="rekening-bulan">
                <Calendar className="w-4 h-4 inline mr-1.5 text-gray-400" />
                Bulan
              </label>
              <select
                id="rekening-bulan"
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={loading}
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="rekening-tahun">
                <Calendar className="w-4 h-4 inline mr-1.5 text-gray-400" />
                Tahun
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  id="rekening-tahun"
                  value={tahunInput}
                  onChange={(e) => handleTahunChange(e.target.value)}
                  onBlur={handleTahunBlur}
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-lg font-semibold"
                  disabled={loading}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={incrementTahun}
                    disabled={loading || tahun >= MAX_YEAR}
                    className="w-6 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={decrementTahun}
                    disabled={loading || tahun <= MIN_YEAR}
                    className="w-6 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  >
                    <ChevronDown className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <p className="text-sm text-emerald-700">
              Periode: <span className="font-semibold">{BULAN_OPTIONS.find(b => b.value === bulan)?.label} {tahun}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCetak}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 min-w-[160px] justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Memproses...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Cetak Rekening
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RekeningPedagangModal;
