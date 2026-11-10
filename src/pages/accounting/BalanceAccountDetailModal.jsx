import { useEffect, useState, useMemo } from 'react';
import { X, Search, Layers, List, ChevronDown, ChevronRight, Folder, FileText, AlertCircle, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import accountingService from '../../services/accountingService';

export default function BalanceAccountDetailModal({
  isOpen,
  onClose,
  account,
  settingId,
  settingName,
  tanggal,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'grouped'
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
        const res = await accountingService.getBalanceSheetDetail({
          setting_id: Number(settingId),
          coa_id: Number(account.id),
          tanggal: tanggal || undefined,
        });
        if (isMounted) {
          setData(res?.data ?? null);
        }
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err.message || 'Gagal memuat rincian transaksi akun neraca.');
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
  }, [isOpen, account, settingId, tanggal]);

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
            (item.nama_item && item.nama_item.toLowerCase().includes(q)) ||
            (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
            (item.nomor_jurnal && item.nomor_jurnal.toLowerCase().includes(q)) ||
            String(item.debit).includes(q) ||
            String(item.credit).includes(q)
        );
        if (!filteredItems.length) return null;
        return {
          ...group,
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
        (item.nama_item && item.nama_item.toLowerCase().includes(q)) ||
        (item.kategori && item.kategori.toLowerCase().includes(q)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q)) ||
        (item.nomor_jurnal && item.nomor_jurnal.toLowerCase().includes(q)) ||
        String(item.debit).includes(q) ||
        String(item.credit).includes(q) ||
        String(item.saldo_berjalan).includes(q)
    );
  }, [data, search]);

  if (!isOpen || !account) return null;

  const isAsset = account.tipe === 'Aset';
  const isLiability = account.tipe === 'Kewajiban';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="flex flex-col w-full max-w-6xl xl:max-w-7xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
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
                  isAsset ? 'bg-emerald-100 text-emerald-700' : isLiability ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {account.tipe} (Saldo Normal: {account.normal_balance})
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {settingName ? `${settingName} • ` : ''}
              Posisi Neraca per: <span className="font-medium text-gray-700">{tanggal || 'Kini'}</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50/40 border-b border-gray-100 text-sm">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Saldo Akhir Akun</span>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  isAsset ? 'text-emerald-700' : isLiability ? 'text-amber-700' : 'text-blue-700'
                }`}
              >
                Rp {formatNumber(data.ending_balance)}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <ArrowDownLeft className="h-3 w-3 text-emerald-600" /> Total Mutasi Debit
              </span>
              <p className="text-lg font-bold text-gray-800 mt-0.5">Rp {formatNumber(data.total_debit)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-red-600" /> Total Mutasi Kredit
              </span>
              <p className="text-lg font-bold text-gray-800 mt-0.5">Rp {formatNumber(data.total_credit)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Transaksi</span>
              <p className="text-lg font-bold text-indigo-600 mt-0.5">{data.total_transactions} jurnal</p>
            </div>
          </div>
        )}

        {/* Counterparty / Subledger Breakdown if Available */}
        {data?.counterparties && data.counterparties.length > 0 && (
          <div className="bg-indigo-50/40 border-b border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Rincian Rekanan / Rekap Subledger Terkait ({data.counterparties.length} rekanan)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto">
              {data.counterparties.map((cp, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-indigo-200/60 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-800 line-clamp-1">{cp.counterparty_name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{cp.counterparty_type?.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 whitespace-nowrap ml-2">
                    Rp {formatNumber(cp.outstanding)}
                  </span>
                </div>
              ))}
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
              placeholder="Cari item, keterangan, nomor jurnal, nominal..."
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
                onClick={() => setViewMode('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Semua Transaksi</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Dikelompokkan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
              <p className="mt-3 text-sm text-gray-500 font-medium">Memuat rincian transaksi akun neraca...</p>
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
                                {group.count} transaksi
                              </span>
                            </div>
                            <div className="text-right text-xs space-x-3">
                              <span className="text-gray-500">Deb: <strong className="font-mono text-gray-800">Rp {formatNumber(group.total_debit)}</strong></span>
                              <span className="text-gray-500">Kre: <strong className="font-mono text-gray-800">Rp {formatNumber(group.total_credit)}</strong></span>
                            </div>
                          </button>

                          {!isCollapsed && (
                            <div className="border-t border-gray-200 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-100/60 text-gray-600 border-b border-gray-200">
                                  <tr>
                                    <th className="p-2.5 font-semibold w-24">Tanggal</th>
                                    <th className="p-2.5 font-semibold w-36">No. Jurnal</th>
                                    <th className="p-2.5 font-semibold w-32">Nama Item</th>
                                    <th className="p-2.5 font-semibold text-right w-24">Qty</th>
                                    <th className="p-2.5 font-semibold">Keterangan / Uraian</th>
                                    <th className="p-2.5 font-semibold text-right w-28">Debit</th>
                                    <th className="p-2.5 font-semibold text-right w-28">Kredit</th>
                                    <th className="p-2.5 font-semibold text-right w-28">Saldo</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {group.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                      <td className="p-2.5 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                                      <td className="p-2.5 font-mono text-gray-700 whitespace-nowrap">{item.nomor_jurnal}</td>
                                      <td className="p-2.5 whitespace-nowrap">
                                        {item.nama_item && item.nama_item !== '-' ? (
                                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-xs">
                                            {item.nama_item}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-right whitespace-nowrap">
                                        {item.qty != null ? (
                                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs">
                                            {formatNumber(item.qty)} {item.satuan || ''}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-gray-800">{item.keterangan || '-'}</td>
                                      <td className="p-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                                        {formatNumber(item.debit)}
                                      </td>
                                      <td className="p-2.5 text-right font-mono text-gray-600 whitespace-nowrap">
                                        {formatNumber(item.credit)}
                                      </td>
                                      <td className="p-2.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                                        {formatNumber(item.saldo_berjalan)}
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
                        <th className="p-3 font-semibold w-32">Nama Item</th>
                        <th className="p-3 font-semibold text-right w-24">Qty</th>
                        <th className="p-3 font-semibold w-32">Kelompok</th>
                        <th className="p-3 font-semibold">Keterangan</th>
                        <th className="p-3 font-semibold text-right w-28">Debit</th>
                        <th className="p-3 font-semibold text-right w-28">Kredit</th>
                        <th className="p-3 font-semibold text-right w-28">Saldo Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAllItems.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-8 text-center text-gray-400">
                            <FileText className="h-6 w-6 mx-auto mb-1 text-gray-300" />
                            Tidak ada transaksi untuk akun ini.
                          </td>
                        </tr>
                      ) : (
                        filteredAllItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="p-2.5 text-gray-600 whitespace-nowrap">{item.tanggal}</td>
                            <td className="p-2.5 font-mono text-gray-700 whitespace-nowrap">{item.nomor_jurnal}</td>
                            <td className="p-2.5 whitespace-nowrap">
                              {item.nama_item && item.nama_item !== '-' ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                                  {item.nama_item}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              {item.qty != null ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                                  {formatNumber(item.qty)} {item.satuan || ''}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
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
                              {formatNumber(item.saldo_berjalan)}
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
            Total {filteredAllItems.length} transaksi pembentuk saldo neraca
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
