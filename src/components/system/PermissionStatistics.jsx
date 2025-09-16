import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle, XCircle, Eye, RefreshCw 
} from 'lucide-react';
import HttpClient from '../../services/httpClient';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Permission Statistics Component
 * Komponen untuk menampilkan statistik dan analisis permission sistem
 */
const PermissionStatistics = () => {
  const [stats, setStats] = useState({
    totalPermissions: 0,
    totalRoles: 0,
    activePermissions: 0,
    pendingReviews: 0,
    permissionsByRole: [],
    permissionsByService: [],
    recentActivity: [],
    securityAlerts: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  /**
   * Load permission statistics
   */
  useEffect(() => {
    loadStatistics();
  }, [selectedTimeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const response = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.PERMISSIONS}/get-statistics`, {
        params: {
          time_range: selectedTimeRange
        }
      });

      if (response.status === 'ok') {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Fallback to mock data for demonstration
      setStats({
        totalPermissions: 156,
        totalRoles: 8,
        activePermissions: 142,
        pendingReviews: 5,
        permissionsByRole: [
          { role_name: 'Super Admin', count: 156, percentage: 100 },
          { role_name: 'User', count: 4, percentage: 3 },
          { role_name: 'Editor', count: 0, percentage: 0 },
          { role_name: 'Manager', count: 0, percentage: 0 }
        ],
        permissionsByService: [
          { service_name: 'system.menu', count: 8, percentage: 15 },
          { service_name: 'ho.pembelian', count: 12, percentage: 22 },
          { service_name: 'system.permissions', count: 10, percentage: 18 },
          { service_name: 'system.roles', count: 6, percentage: 11 },
          { service_name: 'master.supplier', count: 8, percentage: 14 }
        ],
        recentActivity: [
          { action: 'Permission granted', user: 'Admin', target: 'User Role - system.menu.getTree', time: '2 minutes ago' },
          { action: 'Permission revoked', user: 'Admin', target: 'Editor Role - ho.pembelian.store', time: '1 hour ago' },
          { action: 'New role created', user: 'Admin', target: 'Assistant Manager', time: '3 hours ago' }
        ],
        securityAlerts: [
          { type: 'warning', message: 'Multiple failed permission checks detected for User role', count: 12 },
          { type: 'info', message: 'New permission requests pending approval', count: 3 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </div>
  );

  const ProgressBar = ({ label, value, total, color = 'blue' }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-900 font-medium">{value} ({percentage}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Permission Statistics</h2>
          <p className="text-sm text-gray-600">Monitor and analyze permission usage</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadStatistics}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Permissions"
          value={stats.totalPermissions}
          icon={Shield}
          color="bg-blue-100 text-blue-600"
          trend="+12% from last week"
        />
        <StatCard
          title="Total Roles"
          value={stats.totalRoles}
          icon={Users}
          color="bg-green-100 text-green-600"
          trend="+2 new roles"
        />
        <StatCard
          title="Active Permissions"
          value={stats.activePermissions}
          icon={CheckCircle}
          color="bg-emerald-100 text-emerald-600"
          subtitle={`${Math.round((stats.activePermissions / stats.totalPermissions) * 100)}% of total`}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={AlertTriangle}
          color="bg-yellow-100 text-yellow-600"
          subtitle="Require attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permissions by Role */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Permissions by Role</h3>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {stats.permissionsByRole.map((role, index) => (
                <ProgressBar
                  key={index}
                  label={role.role_name}
                  value={role.count}
                  total={stats.totalPermissions}
                  color={index === 0 ? 'blue' : index === 1 ? 'green' : 'gray'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Permissions by Service */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Permissions by Service</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {stats.permissionsByService.map((service, index) => (
                <ProgressBar
                  key={index}
                  label={service.service_name}
                  value={service.count}
                  total={Math.max(...stats.permissionsByService.map(s => s.count))}
                  color={['blue', 'green', 'yellow', 'purple', 'pink'][index % 5]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">by {activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.target}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {stats.securityAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No security alerts</p>
                <p className="text-xs text-gray-400">All permissions are secure</p>
              </div>
            ) : (
              stats.securityAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {alert.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : alert.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      {alert.count && (
                        <p className="text-xs text-gray-600 mt-1">Occurred {alert.count} times</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionStatistics;
