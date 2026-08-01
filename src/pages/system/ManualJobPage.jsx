import React, { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Database, RefreshCw, Download, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import manualJobService from '../../services/manualJobService';

const customTableStyles = {
    header: {
        style: {
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            fontSize: '1.25rem',
            fontWeight: 'bold',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#F9FAFB',
            borderBottom: '2px solid #E5E7EB',
            fontSize: '0.875rem',
            color: '#4B5563',
            minHeight: '48px',
        },
    },
    rows: {
        style: {
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
                borderBottomColor: '#E5E7EB',
            },
            minHeight: '56px',
            transition: 'background-color 0.2s ease',
            '&:hover': {
                backgroundColor: '#F3F4F6',
            },
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid #E5E7EB',
            padding: '0.5rem 1rem',
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '250px',
            fontSize: '1.125rem',
            color: '#6B7280',
        },
    },
};

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const StatusBadge = ({ status }) => {
    const styles = {
        success: { bg: '#D1FAE5', color: '#065F46', icon: <CheckCircle size={14} /> },
        failed: { bg: '#FEE2E2', color: '#991B1B', icon: <XCircle size={14} /> },
        pending: { bg: '#FEF3C7', color: '#92400E', icon: <Loader2 size={14} className="animate-spin" /> },
    };
    const s = styles[status] || styles.pending;
    return (
        <span
            style={{
                backgroundColor: s.bg,
                color: s.color,
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
            }}
        >
            {s.icon}
            {status}
        </span>
    );
};

const TypeBadge = ({ type, frequency }) => {
    const isManual = type === 'manual';
    const label = isManual ? 'Manual' : (frequency || 'Scheduled');
    const bg = isManual ? '#DBEAFE' : '#E0E7FF';
    const color = isManual ? '#1E40AF' : '#3730A3';
    return (
        <span
            style={{
                backgroundColor: bg,
                color,
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
            }}
        >
            {label}
        </span>
    );
};

const ManualJobPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        perPage: 20,
        total: 0,
    });

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const fetchHistory = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page,
                per_page: pagination.perPage,
            };
            if (filterType) params.type = filterType;
            if (filterStatus) params.status = filterStatus;

            const response = await manualJobService.getHistory(params);
            const data = response?.data || response;
            setHistory(data?.data || []);
            setPagination((prev) => ({
                ...prev,
                page: data?.current_page || 1,
                total: data?.total || 0,
            }));
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Gagal memuat history backup';
            setError(msg);
            showNotification('error', msg);
        } finally {
            setLoading(false);
        }
    }, [pagination.perPage, filterType, filterStatus]);

    useEffect(() => {
        fetchHistory(1);
    }, [fetchHistory]);

    const handleBackup = async () => {
        if (!window.confirm('Jalankan backup database manual sekarang? Proses ini membutuhkan beberapa detik.')) {
            return;
        }
        try {
            setBackupLoading(true);
            await manualJobService.triggerBackup({
                path: 'database-backups/manual',
                retention: 365,
            });
            showNotification('success', 'Backup manual berhasil dijalankan');
            fetchHistory(1);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Gagal menjalankan backup manual';
            showNotification('error', msg);
        } finally {
            setBackupLoading(false);
        }
    };

    const columns = [
        {
            name: 'Waktu',
            selector: (row) => row.created_at,
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span>{formatDateTime(row.created_at)}</span>
                </div>
            ),
        },
        {
            name: 'Tipe',
            selector: (row) => row.type,
            sortable: true,
            cell: (row) => <TypeBadge type={row.type} frequency={row.frequency} />,
        },
        {
            name: 'Filename',
            selector: (row) => row.filename,
            sortable: true,
            cell: (row) => (
                <div className="font-mono text-xs text-gray-700">{row.filename}</div>
            ),
        },
        {
            name: 'Route (MinIO Path)',
            selector: (row) => row.path,
            sortable: true,
            cell: (row) => (
                <div className="font-mono text-xs text-gray-600">
                    {row.path}/{row.filename}
                </div>
            ),
        },
        {
            name: 'Ukuran',
            selector: (row) => row.size_bytes,
            sortable: true,
            cell: (row) => <span>{formatBytes(row.size_bytes)}</span>,
        },
        {
            name: 'Status',
            selector: (row) => row.status,
            sortable: true,
            cell: (row) => <StatusBadge status={row.status} />,
        },
        {
            name: 'Dipicu Oleh',
            selector: (row) => row.triggered_by?.name,
            cell: (row) => (
                <span className="text-sm text-gray-700">
                    {row.triggered_by?.name || (row.triggered_by ? `User #${row.triggered_by}` : 'System')}
                </span>
            ),
        },
        {
            name: 'Pesan',
            selector: (row) => row.message,
            cell: (row) => (
                <div className="text-xs text-gray-500 max-w-xs truncate" title={row.message || ''}>
                    {row.message || '-'}
                </div>
            ),
        },
    ];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Database size={24} className="text-blue-600" />
                            Manual Job - Database Backup
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Backup database manual & riwayat backup. Akses khusus Super Admin (roles_id = 404).
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchHistory(pagination.page)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {backupLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {backupLoading ? 'Memproses...' : 'Backup Sekarang'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div
                    className={`mb-4 p-3 rounded-lg text-sm ${
                        notification.type === 'success'
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                >
                    {notification.message}
                </div>
            )}

            {error && !notification && (
                <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
                    {error}
                </div>
            )}

            {/* Filter */}
            <div className="mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Tipe:</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">Semua</option>
                        <option value="manual">Manual</option>
                        <option value="scheduled">Scheduled</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                        <option value="">Semua</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={history}
                    progressPending={loading}
                    pagination
                    paginationServer
                    paginationTotalRows={pagination.total}
                    paginationPerPage={pagination.perPage}
                    onChangePage={(page) => fetchHistory(page)}
                    customStyles={customTableStyles}
                    noDataText="Belum ada riwayat backup"
                    highlightOnHover
                    dense
                />
            </div>
        </div>
    );
};

export default ManualJobPage;
