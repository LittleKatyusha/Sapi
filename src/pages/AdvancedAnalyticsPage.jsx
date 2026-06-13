import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Warehouse, Beef,
  Users, Package, Calendar, Filter, RefreshCw, ChevronDown, ChevronUp,
  Download, Eye, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';

const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
const CHART_COLORS = {
  primary: '#ef4444',
  secondary: '#10b981',
  tertiary: '#3b82f6',
  quaternary: '#f59e0b',
  grid: '#f3f4f6',
  text: '#6b7280'
};

const kpiData = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: 'Rp 2.45 M',
    change: '+18.2%',
    trend: 'up',
    sparkline: [30, 40, 35, 50, 49, 60, 70, 65, 80],
    icon: <DollarSign size={20} />,
    compareTo: 'vs prev month'
  },
  {
    id: 'sales',
    title: 'Sales Volume',
    value: 'Rp 345 Jt',
    change: '+12.5%',
    trend: 'up',
    sparkline: [20, 30, 25, 40, 35, 50, 45, 60, 55],
    icon: <ShoppingCart size={20} />,
    compareTo: 'vs prev month'
  },
  {
    id: 'livestock',
    title: 'Livestock Count',
    value: '152 Ekor',
    change: '+8.3%',
    trend: 'up',
    sparkline: [100, 105, 110, 108, 115, 120, 125, 130, 152],
    icon: <Beef size={20} />,
    compareTo: 'vs prev month'
  },
  {
    id: 'stock',
    title: 'Meat Stock',
    value: '1.2 Ton',
    change: '-4.2%',
    trend: 'down',
    sparkline: [1500, 1400, 1450, 1350, 1300, 1250, 1280, 1200],
    icon: <Warehouse size={20} />,
    compareTo: 'vs prev month'
  }
];

const monthlyData = [
  { month: 'Jan', sales: 400, purchases: 240, profit: 160, target: 380 },
  { month: 'Feb', sales: 300, purchases: 139, profit: 161, target: 350 },
  { month: 'Mar', sales: 200, purchases: 980, profit: -780, target: 400 },
  { month: 'Apr', sales: 278, purchases: 390, profit: -112, target: 360 },
  { month: 'Mei', sales: 189, purchases: 480, profit: -291, target: 340 },
  { month: 'Jun', sales: 239, purchases: 380, profit: -141, target: 380 },
  { month: 'Jul', sales: 349, purchases: 430, profit: -81, target: 400 },
  { month: 'Agt', sales: 420, purchases: 350, profit: 70, target: 420 },
  { month: 'Sep', sales: 380, purchases: 320, profit: 60, target: 400 },
  { month: 'Okt', sales: 450, purchases: 380, profit: 70, target: 450 },
  { month: 'Nov', sales: 480, purchases: 400, profit: 80, target: 480 },
  { month: 'Des', sales: 520, purchases: 420, profit: 100, target: 500 }
];

const categoryData = [
  { name: 'Sapi', value: 45, color: COLORS[0] },
  { name: 'Kambing', value: 25, color: COLORS[1] },
  { name: 'Domba', value: 20, color: COLORS[2] },
  { name: 'Kerbau', value: 10, color: COLORS[3] }
];

const supplierData = [
  { supplier: 'CV Sumber Makmur', value: 85000000, percentage: 35 },
  { supplier: 'PT Agrinusa', value: 62000000, percentage: 25 },
  { supplier: 'UD Sejahtera', value: 48000000, percentage: 20 },
  { supplier: 'CV Bersaudara', value: 30000000, percentage: 12 },
  { supplier: 'Others', value: 20000000, percentage: 8 }
];

const drillDownData = {
  Q1: { Jan: { target: 380, actual: 400 }, Feb: { target: 350, actual: 300 }, Mar: { target: 400, actual: 200 } },
  Q2: { Apr: { target: 360, actual: 278 }, Mei: { target: 340, actual: 189 }, Jun: { target: 380, actual: 239 } },
  Q3: { Jul: { target: 400, actual: 349 }, Agt: { target: 420, actual: 420 }, Sep: { target: 400, actual: 380 } },
  Q4: { Okt: { target: 450, actual: 450 }, Nov: { target: 480, actual: 480 }, Des: { target: 500, actual: 520 } }
};

const MiniChart = ({ data, color, height = 35 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data.map((v, i) => ({ v, i }))}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} fill={`url(#gradient-${color})`} strokeWidth={1.5} />
    </AreaChart>
  </ResponsiveContainer>
);

const KPICard = ({ data, onClick, isActive }) => {
  const trendColor = data.trend === 'up' ? 'text-emerald-500' : 'text-rose-500';
  const TrendIcon = data.trend === 'up' ? TrendingUp : TrendingDown;
  
  return (
    <div
      onClick={() => onClick(data.id)}
      className={`relative bg-white rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 
        ${isActive ? 'border-rose-500 shadow-lg shadow-rose-100' : 'border-transparent hover:border-gray-200 hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-rose-100' : 'bg-gray-100'}`}>
          <span className={isActive ? 'text-rose-600' : 'text-gray-600'}>{data.icon}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          data.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {data.change}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{data.title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{data.value}</p>
        <p className="text-xs text-gray-400 mt-1">{data.compareTo}</p>
      </div>
      <div className="absolute bottom-0 left-4 right-4 h-8">
        <MiniChart data={data.sparkline} color={isActive ? COLORS[0] : '#9ca3af'} />
      </div>
    </div>
  );
};

const FilterPanel = ({ activeFilters, setActiveFilters, dateRange, setDateRange }) => {
  const periods = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year', 'Custom'];
  
  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
          >
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          {['All', 'HO', 'RPH', 'Warehouse', 'Boning'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilters(prev => ({ ...prev, location: f }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFilters.location === f
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <Download size={16} className="text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DrillDownChart = ({ data, onDrillDown, drillLevel, setDrillLevel }) => {
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  
  const quarterlyData = useMemo(() => {
    return Object.entries(drillDownData).map(([q, months]) => ({
      name: q,
      target: Object.values(months).reduce((sum, m) => sum + m.target, 0),
      actual: Object.values(months).reduce((sum, m) => sum + m.actual, 0)
    }));
  }, []);
  
  const getMonthlyDataForQuarter = (quarter) => {
    return Object.entries(drillDownData[quarter] || {}).map(([month, data]) => ({
      name: month,
      ...data
    }));
  };
  
  const chartData = drillLevel === 'month' && selectedQuarter 
    ? getMonthlyDataForQuarter(selectedQuarter)
    : quarterlyData;
  
  const handleBarClick = (data) => {
    if (drillLevel === 'quarter') {
      setSelectedQuarter(data.name);
      setDrillLevel('month');
    } else {
      setSelectedQuarter(null);
      setDrillLevel('quarter');
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Sales vs Target Analysis</h3>
          <p className="text-xs text-gray-500 mt-1">
            {drillLevel === 'quarter' ? 'Click bars to drill down' : `Drilling into ${selectedQuarter}`}
          </p>
        </div>
        {drillLevel === 'month' && (
          <button
            onClick={() => { setDrillLevel('quarter'); setSelectedQuarter(null); }}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium"
          >
            ← Back to Quarterly View
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 12 }} axisLine={false} />
          <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value) => [`Rp ${value} Jt`, '']}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="target" fill="#e5e7eb" name="Target" radius={[4, 4, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
          <Bar dataKey="actual" fill={CHART_COLORS.primary} name="Actual" radius={[4, 4, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: Rp {entry.value} Jt
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdvancedAnalyticsPage = () => {
  const [activeKPI, setActiveKPI] = useState('revenue');
  const [drillLevel, setDrillLevel] = useState('quarter');
  const [activeFilters, setActiveFilters] = useState({ location: 'All', category: 'All' });
  const [dateRange, setDateRange] = useState('This Month');
  const [viewMode, setViewMode] = useState('chart');
  
  const filteredMonthlyData = useMemo(() => {
    return monthlyData;
  }, [activeFilters, dateRange]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time business intelligence & insights</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
          {[
            { id: 'chart', icon: <BarChart3 size={16} />, label: 'Charts' },
            { id: 'table', icon: <Eye size={16} />, label: 'Table' }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === v.id ? 'bg-rose-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>
      
      <FilterPanel
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map(kpi => (
          <KPICard
            key={kpi.id}
            data={kpi}
            onClick={setActiveKPI}
            isActive={activeKPI === kpi.id}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 border border-gray-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Revenue Trend Analysis</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-rose-500 rounded" />
                  <span className="text-gray-500">Sales</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded" />
                  <span className="text-gray-500">Purchases</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-blue-500 rounded" />
                  <span className="text-gray-500">Profit</span>
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={filteredMonthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="sales" stroke={CHART_COLORS.primary} fill="url(#salesGradient)" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={false} name="Purchases" />
                <Line type="monotone" dataKey="profit" stroke={CHART_COLORS.tertiary} strokeWidth={2} dot={{ r: 3 }} name="Profit" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Livestock Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}</span>
                <span className="text-xs font-medium text-gray-800 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DrillDownChart
          data={monthlyData}
          drillLevel={drillLevel}
          setDrillLevel={setDrillLevel}
        />
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Top Suppliers</h3>
            <button className="text-xs text-rose-500 hover:text-rose-600 font-medium">View All</button>
          </div>
          <div className="space-y-3">
            {supplierData.map((supplier, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{supplier.supplier}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${supplier.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{supplier.percentage}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800">Rp {(supplier.value / 1000000).toFixed(0)} Jt</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-rose-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Active Transactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">1,284</p>
          <p className="text-xs text-emerald-500 mt-1">+24 today</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Active Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">48</p>
          <p className="text-xs text-gray-500 mt-1">across all branches</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Pending Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">23</p>
          <p className="text-xs text-amber-500 mt-1">5 urgent</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-emerald-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Growth Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">18.5%</p>
          <p className="text-xs text-emerald-500 mt-1">vs last quarter</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
