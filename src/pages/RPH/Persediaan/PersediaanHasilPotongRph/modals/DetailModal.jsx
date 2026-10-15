import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const TablePagination = ({ page, totalPages, totalItems, perPage, onPageChange }) => {
  if (totalItems <= perPage) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
      <span>
        Menampilkan <b>{start}–{end}</b> dari <b>{totalItems}</b>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 font-semibold">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const DetailModal = ({ isOpen, onClose, data, type, loading }) => {
  const [detailPage, setDetailPage] = useState(1);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    if (isOpen) {
      setDetailPage(1);
      setRiwayatPage(1);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const typeLabels = {
    boning: 'Boning',
    sapi: 'Sapi',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  const detailsList = data?.detail || [];
  const totalDetails = detailsList.length;
  const totalDetailPages = Math.max(1, Math.ceil(totalDetails / perPage));
  const paginatedDetails = detailsList.slice((detailPage - 1) * perPage, detailPage * perPage);

  const riwayatList = data?.riwayat_opname || [];
  const totalRiwayat = riwayatList.length;
  const totalRiwayatPages = Math.max(1, Math.ceil(totalRiwayat / perPage));
  const paginatedRiwayat = riwayatList.slice((riwayatPage - 1) * perPage, riwayatPage * perPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <h3 className="text-base font-bold text-slate-900">Detail {typeLabels[type] || 'Hasil Potong'}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-sm text-slate-500 font-medium">Memuat data...</span>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">ID Item / Header</p>
                    <p className="font-bold text-slate-900 mt-0.5">{data.header?.id || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 font-medium">Nama</p>
                    <p className="font-bold text-slate-900 mt-0.5">{data.header?.name || '-'}</p>
                  </div>
                </div>
                {data.tgl_potong && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Tanggal Potong: </span>
                    <span className="font-bold text-slate-900">{data.tgl_potong}</span>
                  </div>
                )}
              </div>

              {/* Detail Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-800">Rincian Item</p>
                  <span className="text-xs text-slate-500 font-medium">{totalDetails} item</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold w-12">No</th>
                        <th className="px-3 py-2 text-left font-semibold">Nama / Asal Sapi</th>
                        <th className="px-3 py-2 text-right font-semibold w-28">Berat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedDetails.length > 0 ? (
                        paginatedDetails.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2 text-slate-500">
                              {(detailPage - 1) * perPage + index + 1}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-900">{item.name || '-'}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">{item.berat || 0} KG</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-4 py-6 text-center text-slate-400">
                            Tidak ada detail rincian
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    page={detailPage}
                    totalPages={totalDetailPages}
                    totalItems={totalDetails}
                    perPage={perPage}
                    onPageChange={setDetailPage}
                  />
                </div>
              </div>

              {/* Riwayat Opname / Penyesuaian Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-800">Riwayat Opname / Penyesuaian Stok</p>
                  <span className="text-xs text-slate-500 font-medium">{totalRiwayat} riwayat</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Waktu / Tanggal</th>
                        <th className="px-3 py-2 text-left font-semibold">Tipe</th>
                        <th className="px-3 py-2 text-right font-semibold">Selisih</th>
                        <th className="px-3 py-2 text-right font-semibold">Saldo Akhir</th>
                        <th className="px-3 py-2 text-left font-semibold">Alasan & Akun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedRiwayat.length > 0 ? (
                        paginatedRiwayat.map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                              <div>{r.tanggal}</div>
                              {r.waktu && <div className="text-[10px] text-slate-400">{r.waktu}</div>}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                r.tipe === 'PENGURANGAN' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {r.tipe === 'PENGURANGAN' ? 'Pengurangan' : 'Penambahan'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                              {r.tipe === 'PENGURANGAN' ? `−${r.jumlah}` : `+${r.jumlah}`} kg
                            </td>
                            <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-slate-900">{r.saldo} kg</td>
                            <td className="px-3 py-2 text-slate-600 break-words max-w-[180px]">{r.keterangan || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-400">
                            Belum ada riwayat opname untuk item ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <TablePagination
                    page={riwayatPage}
                    totalPages={totalRiwayatPages}
                    totalItems={totalRiwayat}
                    perPage={perPage}
                    onPageChange={setRiwayatPage}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Tidak ada data
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
