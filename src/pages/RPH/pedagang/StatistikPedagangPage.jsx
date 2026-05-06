import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Wallet, TrendingUp, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Activity, RefreshCw,
  Store, PiggyBank, CreditCard, Banknote
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import usePedagangStatistics from './hooks/usePedagangStatistics';
import { formatCurrency, getStatusBadgeClasses, getStatusLabel } from './utils/formatters';

const STATUS_COLORS = {
  1: '#10b981', // Deposit - emerald
  2: '#f59e0b', // Peringatan - amber
  3: '#f43f5e', // Macet - rose
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const SummaryCard = ({ icon: Icon, label, value, subValue, colorClass, iconColorClass, trend }) => (
  <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
    <div className="flex items-start justify-between">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon className={`w-5 h-5 ${iconColorClass}`} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-green-50 text-green-700' : trend === 'down' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend === 'up' ? 'Naik' : trend === 'down' ? 'Turun' : 'Stabil'}
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-0.5 truncate">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
    <div className="px-5 sm:px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-red-500" />}
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
      </div>
    </div>
    <div className="p-4 sm:p-5">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-800">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const StatistikPedagangPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = usePedagangStatistics();

  const summary = data?.summary || {};
  const byStatus = useMemo(() => data?.by_status || [], [data?.by_status]);
  const byPasar = useMemo(() => {
    const list = data?.by_pasar || [];
    return [...list].sort((a, b) => (b.total_saldo_akhir || 0) - (a.total_saldo_akhir || 0));
  }, [data?.by_pasar]);
  const topSaldo = useMemo(() => data?.top_saldo || [], [data?.top_saldo]);
  const saldoTrend = useMemo(() => data?.saldo_trend || [], [data?.saldo_trend]);

  const statusChartData = useMemo(() =>
    byStatus.map(item => ({
      name: item.label || getStatusLabel(item.status),
      value: item.jumlah,
      status: item.status,
      total_saldo_akhir: item.total_saldo_akhir,
      total_saldo_keseluruhan: item.total_saldo_keseluruhan,
      avg_saldo_akhir: item.avg_saldo_akhir,
    })),
    [byStatus]
  );

  const topSaldoChartData = useMemo(() =>
    [...topSaldo].sort((a, b) => (b.saldo_akhir || 0) - (a.saldo_akhir || 0)).slice(0, 10).map(item => ({
      name: item.nama_alias,
      saldo_akhir: item.saldo_akhir || 0,
      saldo_keseluruhan: item.saldo_keseluruhan || 0,
      status: item.status_pedagang,
    })),
    [topSaldo]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Memuat statistik pedagang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="w-full px-2 sm:px-4 lg:px-6 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/RPH/pedagang')}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Kembali ke Data Pedagang"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  Statistik Pedagang
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Ringkasan data dan analitik pedagang
                </p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="bg-gray-100 text-gray-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 font-medium text-sm sm:text-base self-start sm:self-auto"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Activity className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-700 text-sm font-medium">Perhatian</p>
                <p className="text-amber-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <SummaryCard
            icon={Users}
            label="Total Pedagang"
            value={summary.total_pedagang ?? 0}
            colorClass="bg-blue-100"
            iconColorClass="text-blue-600"
          />
          <SummaryCard
            icon={Wallet}
            label="Total Saldo Akhir"
            value={formatCurrency(summary.total_saldo_akhir ?? 0)}
            colorClass="bg-emerald-100"
            iconColorClass="text-emerald-600"
          />
          <SummaryCard
            icon={PiggyBank}
            label="Total Saldo Keseluruhan"
            value={formatCurrency(summary.total_saldo_keseluruhan ?? 0)}
            colorClass="bg-purple-100"
            iconColorClass="text-purple-600"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Total Angkatan"
            value={formatCurrency(summary.total_angkatan ?? 0)}
            colorClass="bg-amber-100"
            iconColorClass="text-amber-600"
          />
          <SummaryCard
            icon={Banknote}
            label="Total Setoran"
            value={formatCurrency(summary.total_setoran ?? 0)}
            colorClass="bg-sky-100"
            iconColorClass="text-sky-600"
          />
          <SummaryCard
            icon={BarChart3}
            label="Rata-rata Saldo Akhir"
            value={formatCurrency(summary.avg_saldo_akhir ?? 0)}
            colorClass="bg-indigo-100"
            iconColorClass="text-indigo-600"
          />
          <SummaryCard
            icon={ArrowUpRight}
            label="Saldo Tertinggi"
            value={formatCurrency(summary.max_saldo_akhir ?? 0)}
            colorClass="bg-green-100"
            iconColorClass="text-green-600"
            trend="up"
          />
          <SummaryCard
            icon={ArrowDownRight}
            label="Saldo Terendah"
            value={formatCurrency(summary.min_saldo_akhir ?? 0)}
            colorClass="bg-rose-100"
            iconColorClass="text-rose-600"
            trend="down"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Status Distribution */}
            <SectionCard title="Distribusi Status Pedagang" icon={Activity}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Status</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Total Saldo</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Rata-rata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byStatus.map((item) => (
                        <tr key={item.status} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClasses(item.status)}`}>
                              {item.label || getStatusLabel(item.status)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-gray-800">{item.jumlah}</td>
                          <td className="py-2 px-2 text-right font-medium text-gray-800">{formatCurrency(item.total_saldo_akhir)}</td>
                          <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(item.avg_saldo_akhir)}</td>
                        </tr>
                      ))}
                      {byStatus.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada data status</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionCard>

            {/* Top Merchants */}
            <SectionCard title="Top 10 Pedagang (Saldo Akhir Tertinggi)" icon={CreditCard}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSaldoChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={80}
                    />
                    <Tooltip
                      content={
                        <CustomTooltip formatter={(v) => formatCurrency(v)} />
                      }
                    />
                    <Bar dataKey="saldo_akhir" name="Saldo Akhir" radius={[0, 6, 6, 0]}>
                      {topSaldoChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Market Breakdown */}
            <SectionCard title="Breakdown per Pasar" icon={Store}>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byPasar} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="pasar"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                      content={
                        <CustomTooltip formatter={(v) => formatCurrency(v)} />
                      }
                    />
                    <Bar dataKey="total_saldo_akhir" name="Saldo Akhir" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="total_saldo_keseluruhan" name="Saldo Keseluruhan" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Saldo Trend */}
            <SectionCard title="Tren Saldo" icon={TrendingUp}>
              <div className="h-80">
                {saldoTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={saldoTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSaldoAkhir" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSaldoKeseluruhan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAngkatan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="bulan"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(v) => {
                          if (!v) return '';
                          const [year, month] = v.split('-');
                          return `${month}/${year}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        content={
                          <CustomTooltip formatter={(v) => formatCurrency(v)} />
                        }
                      />
                      <Legend iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="total_saldo_akhir"
                        name="Saldo Akhir"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSaldoAkhir)"
                      />
                      <Area
                        type="monotone"
                        dataKey="total_saldo_keseluruhan"
                        name="Saldo Keseluruhan"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSaldoKeseluruhan)"
                      />
                      <Area
                        type="monotone"
                        dataKey="total_angkatan"
                        name="Angkatan"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAngkatan)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>Belum ada data tren saldo</p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Tables Section */}
        <div className="space-y-4">
          {/* Market Breakdown Table */}
          <SectionCard title="Detail Breakdown per Pasar" icon={Store}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 rounded-tl-lg">Pasar</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Pedagang</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Saldo Awal</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Angkatan</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Setoran</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Saldo Akhir</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600 rounded-tr-lg">Saldo Keseluruhan</th>
                  </tr>
                </thead>
                <tbody>
                  {byPasar.map((item, idx) => (
                    <tr key={item.pasar || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-800">{item.pasar || '-'}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{item.jumlah_pedagang ?? 0}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.total_saldo_awal)}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.total_angkatan)}</td>
                      <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.total_setoran)}</td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">{formatCurrency(item.total_saldo_akhir)}</td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">{formatCurrency(item.total_saldo_keseluruhan)}</td>
                    </tr>
                  ))}
                  {byPasar.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">Tidak ada data pasar</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Top Merchants Table */}
          <SectionCard title="Detail Top 10 Pedagang" icon={CreditCard}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 rounded-tl-lg">No</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">ID Pedagang</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Nama</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Pasar</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Saldo Akhir</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600 rounded-tr-lg">Saldo Keseluruhan</th>
                  </tr>
                </thead>
                <tbody>
                  {topSaldo.map((item, idx) => (
                    <tr key={item.pid || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-xs text-gray-500">{item.id_pedagang || '-'}</td>
                      <td className="py-3 px-3 font-medium text-gray-800">{item.nama_alias || '-'}</td>
                      <td className="py-3 px-3 text-gray-600">{item.pasar || '-'}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(item.status_pedagang)}`}>
                          {item.status_label || getStatusLabel(item.status_pedagang)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">{formatCurrency(item.saldo_akhir)}</td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">{formatCurrency(item.saldo_keseluruhan)}</td>
                    </tr>
                  ))}
                  {topSaldo.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">Tidak ada data pedagang</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StatistikPedagangPage;
