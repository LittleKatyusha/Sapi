import { useEffect, useState, useMemo } from 'react';
import { X, Search, Layers, List, ChevronDown, ChevronRight, Folder, FileText, AlertCircle } from 'lucide-react';
import accountingService from '../../services/accountingService';

export default function AccountDetailModal({
  isOpen,
  onClose,
  account,
  settingId,
  settingName,
  tanggalFrom,
  tanggalTo,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'all'
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    if (!isOpen || !account || !settingId) return;

    let isMounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        setSearch('');
        setCollapsedGroups({});
        const res = await accountingService.getIncomeStatementDetail({
          setting_id: Number(settingId),
          coa_id: Number(account.id),
          tanggal_from: tanggalFrom || undefined,
          tanggal_to: tanggalTo || undefined,
        });
        if (isMounted) {
          setData(res?.data ?? null);
        }
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err.message || 'Gagal memuat rincian transaksi akun.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, account, settingId, tanggalFrom, tanggalTo]);

  const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

  const toggleGroup = (kategori) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [kategori]: !prev[kategori],
    }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const all = {};
    (data?.groups ?? []).forEach((g) => {
      all[g.kategori] = true;
    });
    setCollapsedGroups(all);
  };

  const filteredGroups = useMemo(() => {
    if (!data?.groups) return [];
    if (!search.trim()) return data.groups;

    const q = search.toLowerCase();
    return data.groups
      .map((group) => {
        const matchesCategory = group.kategori.toLowerCase().includes(q);
        const filteredItems = group.items.filter(
          (item) =>
            matchesCategory ||
            (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
            (item.nomor_jurnal && item.nomor_jurnal.toLowerCase().includes(q)) ||
            String(item.amount).includes(q)
        );
        if (!filteredItems.length) return null;
        const total = filteredItems.reduce((acc, it) => acc + (it.amount || 0), 0);
        return {
          ...group,
          total: Math.round(total * 100) / 100,
          count: filteredItems.length,
          items: filteredItems,
        };
      })
      .filter(Boolean);
  }, [data, search]);

  const filteredAllItems = useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;

    const q = search.toLowerCase();
    return data.items.filter(
      (item) =>
        (item.kategori && item.kategori.toLowerCase().includes(q)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        (item.nomor_jurnal && item.nomor_jurnal.toLowerCase().includes(q)) ||
        String(item.amount).includes(q)
    );
  }, [data, search]);

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50/75 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800">
                {account.kode_akun}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{account.nama_akun}</h2>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  account.tipe === 'Pendapatan' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {account.tipe}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {settingName ? `${settingName} • ` : ''}
              Periode: <span className="font-medium text-gray-700">{tanggalFrom || 'Awal'}</span> s/d{' '}
              <span className="font-medium text-gray-700">{tanggalTo || 'Kini'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Metric Cards */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50/40 border-b border-gray-100 text-sm">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Nilai</span>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  account.tipe === 'Pendapatan' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Rp {formatNumber(data.total_amount)}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Jumlah Transaksi</span>
              <p className="text-lg font-bold text-gray-800 mt-0.5">{data.total_transactions} transaksi</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kelompok / Kategori</span>
              <p className="text-lg font-bold text-indigo-600 mt-0.5">{(data.groups ?? []).length} kelompok</p>
            </div>
          </div>
        )}

        {/* Toolbar: Search & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-white">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari keterangan, nomor jurnal, kategori..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'grouped' && (
              <div className="flex items-center text-xs text-gray-500 mr-2 gap-1.5">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Buka Semua
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Tutup Semua
                </button>
              </div>
            )}

            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Dikelompokkan</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Semua Transaksi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-500 font-medium">Memuat rincian transaksi...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Terjadi Kesalahan</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Grouped View */}
              {viewMode === 'grouped' && (
                <div className="space-y-3">
                  {filteredGroups.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 border border-dashed rounded-xl">
                      <Folder className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm">Tidak ada transaksi yang sesuai pencarian.</p>
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const isCollapsed = collapsedGroups[group.kategori];
                      return (
                        <div
                          key={group.kategori}
                          className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                        >
                          {/* Group Card Header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.kategori)}
                            className="w-full flex items-center justify-between p-3.5 bg-gray-50/75 hover:bg-gray-100/75 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-indigo-600" />
                              )}
                              <span className="font-semibold text-gray-800 text-sm">{group.kategori}</span>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                {group.count} item
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-gray-900">
                                Rp {formatNumber(group.total)}
                              </span>
                            </div>
                          </button>

                          {/* Group Items Table */}
                          {!isCollapsed && (
                            <div className="border-t border-gray-200 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-100/60 text-gray-600 border-b border-gray-200">
                                  <tr>
                                    <th className="p-2.5 font-semibold w-24">Tanggal</th>
                                    <th className="p-2.5 font-semibold w-36">No. Jurnal</th>
                                    <th className="p-2.5 font-semibold">Keterangan / Uraian</th>
                                    <th className="p-2.5 font-semibold text-right w-32">Nominal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {group.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                      <td className="p-2.5 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                                      <td className="p-2.5 font-mono text-gray-700 whitespace-nowrap">
                                        {item.nomor_jurnal}
                                      </td>
                                      <td className="p-2.5 text-gray-800">
                                        <p className="line-clamp-2">{item.keterangan || '-'}</p>
                                      </td>
                                      <td className="p-2.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                                        Rp {formatNumber(item.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* All Transactions Flat View */}
              {viewMode === 'all' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="p-3 font-semibold w-24">Tanggal</th>
                        <th className="p-3 font-semibold w-36">No. Jurnal</th>
                        <th className="p-3 font-semibold w-36">Kelompok</th>
                        <th className="p-3 font-semibold">Keterangan</th>
                        <th className="p-3 font-semibold text-right w-28">Debit</th>
                        <th className="p-3 font-semibold text-right w-28">Kredit</th>
                        <th className="p-3 font-semibold text-right w-28">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAllItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-gray-400">
                            <FileText className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                            Tidak ada transaksi.
                          </td>
                        </tr>
                      ) : (
                        filteredAllItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-2.5 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                            <td className="p-2.5 font-mono text-gray-700 whitespace-nowrap">{item.nomor_jurnal}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                                {item.kategori}
                              </span>
                            </td>
                            <td className="p-2.5 text-gray-800">{item.keterangan || '-'}</td>
                            <td className="p-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                              {formatNumber(item.debit)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                              {formatNumber(item.credit)}
                            </td>
                            <td className="p-2.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                              {formatNumber(item.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <p className="text-xs text-gray-500">
            Total {filteredAllItems.length} transaksi ditampilkan
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
