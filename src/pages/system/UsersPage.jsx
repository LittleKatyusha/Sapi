import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, Users } from 'lucide-react';

import useUsers from './hooks/useUsers';
import ActionButton from './components/ActionButton';

// Import modals
import AddEditUserModal from './users/modals/AddEditUserModal';
import UserDetailModal from './users/modals/UserDetailModal';
import DeleteConfirmationModal from './users/modals/DeleteConfirmationModal';
import ResetPasswordModal from './users/modals/ResetPasswordModal';

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
            minHeight: '60px',
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

const UsersPage = () => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    
    const {
        users: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        roles,
        fetchUsers,
        fetchRoles,
        createUser,
        updateUser,
        deleteUser,
        resetUserPassword,
    } = useUsers();

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers, fetchRoles]);

    const handleEdit = (user) => {
        console.log('Edit user:', user);
        setSelectedUser(user);
        setIsEditModalOpen(true);
        setOpenMenuId(null); // Close action menu
    };

    const handleDelete = (user) => {
        console.log('Delete user:', user);
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null); // Close action menu
    };

    const handleDetail = (user) => {
        console.log('View user detail:', user);
        setSelectedUser(user);
        setIsDetailModalOpen(true);
        setOpenMenuId(null); // Close action menu
    };

    const handleResetPasswordModal = (user) => {
        console.log('Reset password for user:', user);
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
        setOpenMenuId(null); // Close action menu
    };

    // Modal handlers
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedUser(null);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setSelectedUser(null);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    // Save handlers for modals
    const handleSaveUser = useCallback(async (userData, isEdit) => {
        try {
            let result;
            if (isEdit && selectedUser) {
                result = await updateUser(selectedUser.pubid || selectedUser.id, userData);
            } else {
                result = await createUser(userData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                // Close modals
                setIsEditModalOpen(false);
                setIsAddModalOpen(false);
                setSelectedUser(null);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan data'
            });
        }
    }, [selectedUser, updateUser, createUser]);

    const handleDeleteUser = useCallback(async (user) => {
        try {
            const result = await deleteUser(user.pubid || user.id);
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menghapus user'
            });
        }
    }, [deleteUser]);

    const handleResetPassword = useCallback(async (user, newPassword) => {
        try {
            const result = await resetUserPassword(user, newPassword);
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat reset password'
            });
        }
    }, [resetUserPassword]);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const columns = useMemo(() => [
        {
            name: 'User',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="flex items-center">
                    <img className="w-8 h-8 rounded-full mr-3" src={row.photoUrl || `https://ui-avatars.com/api/?name=${row.name}&background=random`} alt={row.name} />
                    <div>
                        <div className="font-bold">{row.name}</div>
                        <div className="text-sm text-gray-500">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            name: 'NIK',
            selector: row => row.nik,
            sortable: true,
            cell: row => (
                <span className="text-gray-900">
                    {row.nik || '-'}
                </span>
            )
        },
        {
            name: 'Jabatan',
            selector: row => row.position,
            sortable: true,
            cell: row => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    row.position 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {row.position || 'Tidak Ada Jabatan'}
                </span>
            )
        },
        {
            name: 'Aksi',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    onResetPassword={handleResetPasswordModal}
                    isActive={openMenuId === (row.id || row.pubid)}
                />
            ),
            ignoreRowClick: true,
        },
    ], [openMenuId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                <Users size={28} />
                                Manajemen Pengguna
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pengguna sistem
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Pengguna
                            </button>
                        </div>
                    </div>
                </div>


                <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari pengguna..."
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
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Tidak Aktif</option>
                                    <option value="verified">Verified</option>
                                    <option value="unverified">Unverified</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        customStyles={customTableStyles}
                        progressPending={loading}
                        progressComponent={
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        }
                        noDataComponent={
                            <div className="text-center py-12">
                                {error ? (
                                    <div className="text-red-600">
                                        <p className="text-lg font-semibold">Error</p>
                                        <p className="text-sm">{error}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-lg">Tidak ada data pengguna ditemukan</p>
                                )}
                            </div>
                        }
                        responsive
                        highlightOnHover
                        pointerOnHover
                    />
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                        notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900">
                                        {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        onClick={() => setNotification(null)}
                                        className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddEditUserModal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={isAddModalOpen ? handleCloseAddModal : handleCloseEditModal}
                onSave={handleSaveUser}
                editData={isEditModalOpen ? selectedUser : null}
                loading={loading}
                roles={roles}
            />

            <UserDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                user={selectedUser}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteUser}
                user={selectedUser}
                loading={loading}
            />

            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={handleCloseResetPasswordModal}
                onConfirm={handleResetPassword}
                user={selectedUser}
                loading={loading}
            />
        </div>
    );
};

export default UsersPage;
