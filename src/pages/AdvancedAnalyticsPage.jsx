import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Warehouse, Beef,
  Users, Package, RefreshCw, Activity, AlertCircle, Loader2, ChevronRight
} from 'lucide-react';
import DashboardService from '../services/dashboardService';

const metricMeta = {
  total_pembelian: { title: 'Pembelian', icon: ShoppingCart, color: 'text-rose-600' },
  total_penjualan: { title: 'Penjualan', icon: DollarSign, color: 'text-emerald-600' },
  outstanding_hutang: { title: 'Outstanding Hutang', icon: TrendingDown, color: 'text-amber-600' },
  outstanding_piutang: { title: 'Outstanding Piutang', icon: TrendingUp, color: 'text-blue-600' },
  stok_ternak: { title: 'Stok Ternak', icon: Beef, color: 'text-rose-600' },
  penjualan_boning: { title: 'Penjualan Boning', icon: DollarSign, color: 'text-emerald-600' },
  penjualan_karkas: { title: 'Penjualan Karkas', icon: DollarSign, color: 'text-blue-600' },
  piutang_pedagang: { title: 'Piutang Pedagang', icon: Users, color: 'text-amber-600' },
  stok_feedmil: { title: 'Stok Feedmil', icon: Package, color: 'text-rose-600' },
  stok_ovk: { title: 'Stok OVK', icon: Warehouse, color: 'text-blue-600' },
  total_distribusi: { title: 'Total Distribusi', icon: Activity, color: 'text-emerald-600' }
};

const formatCurrency = (value) => `Rp ${(Number(value || 0) / 1000000).toFixed(1)} Jt`;

const AdvancedAnalyticsPage = () => {
  const [dashboard, setDashboard] = useState({ ho: null, rph: null, warehouse: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeKPI, setActiveKPI] = useState('total_penjualan');
  const [viewMode, setViewMode] = useState('chart');
  const [dateRange, setDateRange] = useState('This Month');
  const [activeFilters, setActiveFilters] = useState({ location: 'All' });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await DashboardService.getAll({ period: dateRange, location: activeFilters.location });
      setDashboard(data);
    } catch (e) {
      setError(e?.message || 'Gagal memuat dashboard');
    } finally {
      setLoading(false);
    }
  }, [dateRange, activeFilters.location]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);


  const trendData = useMemo(() => {
    const ho = dashboard.ho?.data?.summary || {};
    const rph = dashboard.rph?.data?.summary || {};
    const warehouse = dashboard.warehouse?.data?.summary || {};
    return [
      { name: 'HO', sales: Number(ho.total_penjualan || 0), purchases: Number(ho.total_pembelian || 0) },
      { name: 'RPH', sales: Number(rph.penjualan_boning || 0) + Number(rph.penjualan_karkas || 0), purchases: Number(rph.stok_ternak || 0) },
      { name: 'WH', sales: Number(warehouse.total_distribusi || 0), purchases: Number(warehouse.stok_feedmil || 0) + Number(warehouse.stok_ovk || 0) },
    ];
  }, [dashboard]);

  const topCards = useMemo(() => {
    const ho = dashboard.ho?.data?.summary || {};
    const rph = dashboard.rph?.data?.summary || {};
    const warehouse = dashboard.warehouse?.data?.summary || {};
    return [
      { key: 'total_penjualan', value: ho.total_penjualan || 0 },
      { key: 'outstanding_hutang', value: ho.outstanding_hutang || 0 },
      { key: 'piutang_pedagang', value: rph.piutang_pedagang || 0 },
      { key: 'total_distribusi', value: warehouse.total_distribusi || 0 }
    ];
  }, [dashboard]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500"><Loader2 className="animate-spin mr-2" size={18} />Memuat dashboard...</div>;
  if (error) return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 flex items-center gap-2"><AlertCircle size={18} />{error}<button onClick={loadDashboard} className="ml-auto text-sm font-medium underline">Retry</button></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real API dashboard → HO / RPH / Warehouse</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
          <button onClick={loadDashboard} className="p-2 hover:bg-gray-100 rounded-md"><RefreshCw size={16} /></button>
          {[{ id: 'chart', label: 'Charts' }, { id: 'table', label: 'Table' }].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${viewMode === v.id ? 'bg-rose-500 text-white' : 'text-gray-600'}`}>{v.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap bg-white rounded-lg p-4 border border-gray-200">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border rounded-md px-3 py-1.5 text-sm">
          {['This Month', 'This Quarter', 'This Year'].map(v => <option key={v}>{v}</option>)}
        </select>
        {['All', 'HO', 'RPH', 'Warehouse'].map(v => <button key={v} onClick={() => setActiveFilters({ location: v })} className={`px-3 py-1.5 text-xs rounded-md ${activeFilters.location === v ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{v}</button>)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map(card => {
          const meta = metricMeta[card.key];
          const Icon = meta.icon;
          return <button key={card.key} onClick={() => setActiveKPI(card.key)} className={`bg-white rounded-lg p-4 text-left border-2 ${activeKPI === card.key ? 'border-rose-500' : 'border-transparent'}`}><div className="flex items-center justify-between"><Icon size={18} className={meta.color} /><span className="text-xs text-gray-400">{meta.title}</span></div><div className="mt-3 text-2xl font-bold text-gray-800">{formatCurrency(card.value)}</div><div className="text-xs text-gray-500 mt-1">{card.source}</div></button>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-800">API Trend</h3><ChevronRight size={16} className="text-gray-400" /></div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => formatCurrency(v)} /><Legend /><Area dataKey="sales" fill="#fee2e2" stroke="#ef4444" /><Line type="monotone" dataKey="purchases" stroke="#10b981" /><Line type="monotone" dataKey="sales" stroke="#ef4444" dot={false} /></ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">RPH Summary</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {Object.entries(dashboard.rph?.data?.summary || {}).map(([k, v]) => <div key={k} className="flex justify-between"><span>{metricMeta[k]?.title || k}</span><span className="font-medium text-gray-800">{Number(v).toLocaleString('id-ID')}</span></div>)}
          </div>
        </div>
      </div>

      {viewMode === 'table' && <div className="bg-white rounded-lg border border-gray-200 overflow-hidden"><div className="p-4 border-b font-semibold text-gray-800">Raw API Response</div><pre className="p-4 text-xs overflow-auto">{JSON.stringify(dashboard, null, 2)}</pre></div>}
    </div>
  );
};

export default AdvancedAnalyticsPage;
