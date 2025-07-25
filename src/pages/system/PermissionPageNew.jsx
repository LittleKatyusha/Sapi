import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, Shield } from 'lucide-react';

import usePermissions from './hooks/usePermissions';
import ActionButton from './components/ActionButton';
import AddEditPermissionModal from './modals/AddEditPermissionModal';
import customTableStyles from './constants/tableStyles';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
// import PermissionDetailModal from './modals/PermissionDetailModal';

const PermissionPage = () => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState(null);
    const {
        permissions: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        roles,
        fetchPermissions,
        fetchRoles,
        createPermission,
        updatePermission,
        deletePermission
    } = usePermissions();

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const handleEdit = (permission) => {
        setEditingPermission(permission);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPermission(null);
        setIsModalOpen(true);
    };

    const handleDelete = (permission) => {
        setPermissionToDelete(permission);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null); // Close action menu
    };

    const handleConfirmDelete = async () => {
        if (permissionToDelete) {
            const result = await deletePermission(permissionToDelete.pubid || permissionToDelete.id);
            if (result.success) {
                setIsDeleteModalOpen(false);
                setPermissionToDelete(null);
                // Data will refresh automatically through the hook
            } else {
                // Keep modal open to show error - user can try again or cancel
                alert(`Gagal menghapus permission: ${result.message}`);
            }
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setPermissionToDelete(null);
    };

    const handleDetail = (permission) => {
        // Logic to open detail modal
    };
    
    const handleSave = async (formData) => {
        let result;
        if (editingPermission) {
            result = await updatePermission(editingPermission.pubid, formData);
        } else {
            result = await createPermission(formData);
        }
        if (result.success) {
            setIsModalOpen(false);
            setEditingPermission(null);
            fetchPermissions();
        } else {
            // handle error (show notification, etc)
        }
    };

    const columns = useMemo(() => [
        {
            name: 'Service Name',
            selector: row => row.serviceName,
            sortable: true,
            minWidth: '180px',
            grow: 2.5,
            cell: row => (
                <div className="font-medium text-gray-900">
                    {row.serviceName}
                </div>
            )
        },
        {
            name: 'Value',
            selector: row => row.value,
            sortable: true,
            minWidth: '120px',
            grow: 1.5,
            cell: row => (
                <div className="text-gray-700">
                    {row.value}
                </div>
            )
        },
        {
            name: 'Function Name',
            selector: row => row.functionName,
            sortable: true,
            minWidth: '200px',
            grow: 3,
            cell: row => (
                <div className="font-medium text-gray-900">
                    {row.functionName}
                </div>
            )
        },
        {
            name: 'Method',
            selector: row => row.method,
            sortable: true,
            minWidth: '100px',
            grow: 1,
            center: true,
            cell: row => (
                <div className="flex justify-center">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-all duration-200 ${
                        row.method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                        row.method === 'POST' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                        row.method === 'PUT' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                        row.method === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                        'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}>
                        {row.method}
                    </span>
                </div>
            )
        },
        {
            name: 'Aksi',
            minWidth: '120px',
            grow: 1.2,
            center: true,
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === row.id}
                />
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ], [openMenuId, handleEdit, handleDelete, handleDetail]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 h-full flex flex-col">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 flex-shrink-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                <Shield size={28} />
                                Manajemen Permission
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola izin akses sistem
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <button
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                                onClick={handleAdd}
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Permission
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-6 flex-shrink-0">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Permissions</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Services</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.services}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Methods</h3>
                        <p className="text-xl sm:text-3xl font-bold">{Object.keys(stats.methods || {}).length}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100 flex-shrink-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari permission..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                                >
                                    <option value="all">Semua Method</option>
                                    <option value="get">GET</option>
                                    <option value="post">POST</option>
                                    <option value="put">PUT</option>
                                    <option value="delete">DELETE</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-hidden flex flex-col flex-1" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        paginationPerPage={20}
                        paginationRowsPerPageOptions={[10, 20, 30, 50]}
                        customStyles={customTableStyles}
                        conditionalRowStyles={[
                            {
                                when: row => openMenuId === row.id,
                                style: {
                                    backgroundColor: '#e0e7ff',
                                    '&:hover': {
                                        backgroundColor: '#e0e7ff',
                                    },
                                },
                            },
                        ]}
                        progressPending={loading}
                        progressComponent={
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            </div>
                        }
                        noDataComponent={
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="text-center">
                                    {error ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data permission ditemukan</p>
                                    )}
                                </div>
                            </div>
                        }
                        responsive
                        highlightOnHover
                        pointerOnHover
                        dense={false}
                    />
                </div>
            </div>
            <AddEditPermissionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingPermission(null); }}
                onSave={handleSave}
                editData={editingPermission}
                loading={loading}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Hapus Permission"
                description={`Apakah Anda yakin ingin menghapus permission "${permissionToDelete?.serviceName} - ${permissionToDelete?.functionName}"?`}
                loading={loading}
            />
        </div>
    );
};

export default PermissionPage;
