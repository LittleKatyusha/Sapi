import React, { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ApiDebugPanel = ({ testApiConnection, fetchEartags, loading, error, serverPagination }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        setTestResult(null);
        
        try {
            const result = await testApiConnection();
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: `Test error: ${error.message}`
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleRefreshData = async () => {
        setIsRefreshing(true);
        try {
            await fetchEartags(1, 100); // Fetch all data with pagination
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!isExpanded) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                    <Eye className="w-4 h-4" />
                    Debug API
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">API Debug Panel</h3>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <EyeOff className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {/* API Status */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        {error ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        <span className="font-medium">Status API</span>
                    </div>
                    <p className="text-sm text-gray-600">
                        {error ? error : 'API berjalan normal'}
                    </p>
                </div>

                {/* Test Connection */}
                <div className="space-y-2">
                    <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </button>

                    {testResult && (
                        <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {testResult.success ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="font-medium text-sm">
                                    {testResult.success ? 'Success' : 'Failed'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{testResult.message}</p>
                        </div>
                    )}
                </div>

                {/* Refresh Data */}
                <button
                    onClick={handleRefreshData}
                    disabled={isRefreshing || loading}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${(isRefreshing || loading) ? 'animate-spin' : ''}`} />
                    {isRefreshing || loading ? 'Refreshing...' : 'Refresh Data'}
                </button>

                {/* API Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">API Endpoint</h4>
                    <p className="text-xs text-gray-600 break-all">
                        https://puput-api.ternasys.com/api/master/eartag/data
                    </p>
                </div>

                {/* Server Pagination Info */}
                {serverPagination && (
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <h4 className="font-medium text-sm mb-2 text-indigo-800">Server Pagination</h4>
                        <div className="space-y-1 text-xs text-indigo-700">
                            <div>Current Page: {serverPagination.currentPage}</div>
                            <div>Total Pages: {serverPagination.totalPages}</div>
                            <div>Total Items: {serverPagination.totalItems}</div>
                            <div>Per Page: {serverPagination.perPage}</div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                            <span className="text-sm text-blue-700">Loading data...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiDebugPanel;