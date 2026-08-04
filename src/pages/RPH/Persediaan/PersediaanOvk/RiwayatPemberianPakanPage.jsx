import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { ArrowLeft, AlertCircle, Loader2, ClipboardList, Calendar } from 'lucide-react';
import PersediaanPakanService from '../../../../services/persediaanPakanService';

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
};

const formatDateID = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const RiwayatPemberianPakanPage = () => {
  const navigate = useNavigate();
  const { pid } = useParams();

  const [sourceItem, setSourceItem] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [riwayatRows, setRiwayatRows] = useState([]);
  const [isLoadingRiwayat, setIsLoadingRiwayat] = useState(true);

  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!pid) return;
      const resp = await PersediaanPakanService.showResep(pid);
      if (!mounted) return;
      if (resp.success && resp.data) {
        setSourceItem(resp.data);
      } else {
        setLoadError(resp.message || 'Gagal memuat data resep');
      }
    })();
    return () => { mounted = false; };
  }, [pid]);

  const loadRiwayat = useCallback(async () => {
    if (!pid) return;
    setIsLoadingRiwayat(true);
    const resp = await PersediaanPakanService.getRiwayatPemberian(pid);
    if (resp.success) {
      setRiwayatRows(resp.data || []);
      if ((resp.data || []).length > 0) {
        setSelectedTanggal(resp.data[0].tgl_pemberian);
      }
    } else {
      setLoadError(resp.message || 'Gagal memuat riwayat pemberian');
    }
    setIsLoadingRiwayat(false);
  }, [pid]);

  useEffect(() => {
    loadRiwayat();
  }, [loadRiwayat]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!pid || !selectedTanggal) {
        setDetailData(null);
        return;
      }
      setIsLoadingDetail(true);
      setDetailError('');
      const resp = await PersediaanPakanService.getRiwayatPemberianDetail(pid, selectedTanggal);
      if (!mounted) return;
      if (resp.success) {
        setDetailData(resp.data);
      } else {
        setDetailError(resp.message || 'Gagal memuat detail');
        setDetailData(null);
      }
      setIsLoadingDetail(false);
    })();
    return () => { mounted = false; };
  }, [pid, selectedTanggal]);

  const tanggalOptions = useMemo(() => {
    const seen = new Set();
    const out = [];
    riwayatRows.forEach((r) => {
      if (r.tgl_pemberian && !seen.has(r.tgl_pemberian)) {
        seen.add(r.tgl_pemberian);
        out.push(r.tgl_pemberian);
      }
    });
    return out;
  }, [riwayatRows]);

  const tanggalSummary = useMemo(() => {
    const map = new Map();
    riwayatRows.forEach((r) => {
      const t = r.tgl_pemberian;
      if (!map.has(t)) {
        map.set(t, { tanggal: t, jumlah_sapi: 0 });
      }
      const e = map.get(t);
      e.jumlah_sapi += r.jumlah_sapi || 0;
    });
    // Preserve backend order (created_at descending)
    return Array.from(map.values());
  }, [riwayatRows]);

  const sapiColumns = useMemo(() => [
    {
      name: 'Code Eartag',
      selector: (row) => row.code_eartag || '-',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center rounded bg-sky-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-sky-700 border border-sky-200">
          {row.code_eartag || '-'}
        </span>
      ),
    },
    {
      name: 'Eartag',
      selector: (row) => row.eartag || '-',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-700">{row.eartag || '-'}</span>,
    },
    {
      name: 'Eartag Supplier',
      selector: (row) => row.eartag_supplier || '-',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-600">{row.eartag_supplier || '-'}</span>,
    },
    {
      name: 'Klasifikasi',
      selector: (row) => row.nama_klasifikasi || '-',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-600">{row.nama_klasifikasi || '-'}</span>,
    },
    {
      name: 'Kandang',
      selector: (row) => row.kode_kandang || '-',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.kode_kandang ? `${row.kode_kandang}${row.nama_kandang ? ' - ' + row.nama_kandang : ''}` : '-'}
        </span>
      ),
    },
    {
      name: 'Harga/Sapi',
      selector: (row) => row.harga || 0,
      sortable: true,
      right: true,
      cell: (row) => <span className="text-xs font-semibold text-emerald-700">{formatCurrency(row.harga)}</span>,
    },
  ], []);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/rph/persediaan-ovk')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Riwayat Pemberian Pakan</h1>
            <p className="text-xs text-slate-500">
              {sourceItem?.name ? `Resep: ${sourceItem.name}` : 'Detail pemberian per tanggal'}
            </p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 p-3 space-y-2">
        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Tanggal Pemberian
        </label>
        {isLoadingRiwayat ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat riwayat...
          </div>
        ) : tanggalOptions.length === 0 ? (
          <div className="text-sm text-slate-500 py-2">
            Belum ada pemberian pakan untuk resep ini.
          </div>
        ) : (
          <>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={selectedTanggal ? formatDateID(selectedTanggal) : '-'}
                className="w-full pl-9 pr-3 py-2 text-sm font-semibold border-2 border-slate-200 rounded-lg bg-slate-50 cursor-not-allowed outline-none text-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-center">
                <div className="text-[10px] text-emerald-600 uppercase font-semibold">Total Sapi</div>
                <div className="text-sm font-bold text-emerald-700">
                  {tanggalSummary.find((t) => t.tanggal === selectedTanggal)?.jumlah_sapi || 0}
                </div>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1.5 text-center">
                <div className="text-[10px] text-indigo-600 uppercase font-semibold">Tanggal</div>
                <div className="text-sm font-bold text-indigo-700">
                  {selectedTanggal ? formatDateID(selectedTanggal) : '-'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedTanggal && detailData && !isLoadingDetail && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Daftar Sapi Diberi Pakan
            </div>
            {detailData?.sapi && (
              <span className="text-[11px] text-slate-500">{detailData.sapi.length} sapi</span>
            )}
          </div>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Memuat data sapi...
            </div>
          ) : detailError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {detailError}
            </div>
          ) : detailData?.sapi && detailData.sapi.length > 0 ? (
            <DataTable
              columns={sapiColumns}
              data={detailData.sapi}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              dense
              highlightOnHover
              pointerOnHover
              noDataComponent="Tidak ada sapi pada tanggal ini"
            />
          ) : (
            <div className="text-sm text-slate-500 py-4 text-center">
              Tidak ada sapi diberi pakan pada tanggal ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiwayatPemberianPakanPage;
