import { useState, useCallback, useMemo } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const API_BASE = API_ENDPOINTS.SYSTEM.MENU;

const useMenus = () => {
    const { getAuthHeader } = useAuthSecure();
    
    // Main data states
    const [allMenus, setAllMenus] = useState([]);
    const [menuTree, setMenuTree] = useState([]);
    const [menuOptions, setMenuOptions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [stats, setStats] = useState({
        total_menus: 0,
        root_menus: 0,
        child_menus: 0,
        max_depth: 0,
        menus_with_url: 0,
        menus_without_url: 0
    });
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterParent, setFilterParent] = useState('');

    // Server pagination state untuk DataTables format
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // Fetch menus dari API dengan DataTables server-side pagination format
    const fetchMenus = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // DataTables pagination parameters
            const start = (page - 1) * perPage;
            const queryParams = new URLSearchParams({
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': '1',
                'search[value]': '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc',
                '_t': Date.now().toString() // Force no-cache
            });
            
            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);
            
            let dataArray = [];
            
            // Handle response format: {"status":"ok","data":{"draw":1,"recordsTotal":29,"recordsFiltered":29,"data":[...]}}
            if (result.status === 'ok' && result.data) {
                if (Array.isArray(result.data)) {
                    // Direct array format
                    dataArray = result.data;
                } else if (result.data.data && Array.isArray(result.data.data)) {
                    // Nested DataTables format
                    dataArray = result.data.data;
                } else {
                    throw new Error(`Format response API tidak sesuai. Data structure: ${JSON.stringify(result.data).substring(0, 200)}...`);
                }
            } else if (result.draw && result.data && Array.isArray(result.data)) {
                // Fallback untuk format DataTables langsung
                dataArray = result.data;
            } else {
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state
            const totalRecords = result.data?.recordsTotal || dataArray.length;
            const filteredRecords = result.data?.recordsFiltered || dataArray.length;
            
            setServerPagination({
                currentPage: page,
                totalPages: Math.ceil(filteredRecords / perPage),
                totalItems: filteredRecords,
                perPage: perPage
            });
            
            if (dataArray.length >= 0) {
                // Debug log to check data structure
                if (process.env.NODE_ENV === 'development') {
                    console.log('Menu data loaded:', dataArray);
                    console.log('First few items:', dataArray.slice(0, 3));
                }
                setAllMenus(dataArray);
                setError(null);
            }
            
        } catch (err) {
            console.error('Error fetching menus:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal memuat data menu.';
            setError(errorMessage);
            setAllMenus([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Fetch menu tree
    const fetchMenuTree = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            // Use the same data endpoint but with tree structure
            const queryParams = new URLSearchParams({
                'start': '0',
                'length': '1000',
                'draw': '1',
                'search[value]': '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc',
                '_t': Date.now().toString() // Force no-cache
            });
            
            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);
            
            if (result.status === 'ok' && result.data && result.data.data) {
                const flatData = result.data.data;
                
                // Convert flat data to tree structure
                const buildTree = (items, parentId = null, depth = 0) => {
                    return items
                        .filter(item => {
                            if (parentId === null) {
                                return item.parent_name === '-';
                            }
                            return item.parent_name !== '-' && items.find(p => p.nama === item.parent_name)?.pid === parentId;
                        })
                        .map(item => ({
                            ...item,
                            depth,
                            children: buildTree(items, item.pid, depth + 1)
                        }))
                        .sort((a, b) => a.sequence_order - b.sequence_order);
                };
                
                const treeData = buildTree(flatData);
                setMenuTree(treeData);
            } else {
                throw new Error('Gagal memuat struktur menu.');
            }
            
        } catch (err) {
            console.error('Error fetching menu tree:', err);
            setMenuTree([]);
        }
    }, [getAuthHeader]);

    // Fetch menu options untuk dropdown
    const fetchMenuOptions = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                return;
            }
            
            const result = await HttpClient.get(`${API_BASE}/options?_t=${Date.now()}`);
            
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                setMenuOptions(result.data);
            }
            
        } catch (err) {
            console.error('Error fetching menu options:', err);
            setMenuOptions([]);
        }
    }, [getAuthHeader]);

    // Fetch roles untuk access management
    const fetchRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                return;
            }
            
            const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.ROLES}/data?_t=${Date.now()}`);
            
            let rolesData = [];
            if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                rolesData = result.data;
            } else if (result.draw && result.data && Array.isArray(result.data)) {
                rolesData = result.data;
            }
            
            setRoles(rolesData);
            
        } catch (err) {
            console.error('Error fetching roles:', err);
            setRoles([]);
        }
    }, [getAuthHeader]);

    // Get menu statistics
    const getMenuStatistics = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                return;
            }
            
            const result = await HttpClient.get(`${API_BASE}/statistics?_t=${Date.now()}`);
            
            if (result.status === 'ok' && result.data) {
                setStats(result.data);
            }
            
        } catch (err) {
            console.error('Error fetching menu statistics:', err);
        }
    }, [getAuthHeader]);

    // Create menu
    const createMenu = useCallback(async (menuData) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }

            // Preprocess data - ensure URL has default value if empty
            const processedData = {
                ...menuData,
                url: menuData.url && menuData.url.trim() ? menuData.url.trim() : '#'
            };

            const result = await HttpClient.post(`${API_BASE}/store`, processedData);

            if (result.status === 'ok') {
                // Refresh all data from server (no cache)
                await fetchMenusWithDependencies();
                return result.data;
            } else {
                throw new Error(result.message || 'Gagal membuat menu.');
            }

        } catch (err) {
            console.error('Error creating menu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal membuat menu.';
            throw new Error(errorMessage);
        }
    }, [getAuthHeader, fetchMenus, fetchMenuTree, fetchMenuOptions, getMenuStatistics]);

    // Update menu
    const updateMenu = useCallback(async (pid, menuData) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }

            // Preprocess data - ensure URL has default value if empty
            const processedData = {
                ...menuData,
                url: menuData.url && menuData.url.trim() ? menuData.url.trim() : '#'
            };

            const result = await HttpClient.post(`${API_BASE}/update`, {
                pid,
                ...processedData
            });

            if (result.status === 'ok') {
                // Refresh all data from server (no cache)
                await fetchMenusWithDependencies();
                return result.data;
            } else {
                throw new Error(result.message || 'Gagal memperbarui menu.');
            }

        } catch (err) {
            console.error('Error updating menu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal memperbarui menu.';
            throw new Error(errorMessage);
        }
    }, [getAuthHeader, fetchMenus, fetchMenuTree, fetchMenuOptions, getMenuStatistics]);

    // Delete menu
    const deleteMenu = useCallback(async (pid) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }

            const result = await HttpClient.post(`${API_BASE}/hapus`, { pid });

            if (result.status === 'ok') {
                // Refresh all data from server (no cache)
                await fetchMenusWithDependencies();
                return true;
            } else {
                throw new Error(result.message || 'Gagal menghapus menu.');
            }

        } catch (err) {
            console.error('Error deleting menu:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal menghapus menu.';
            throw new Error(errorMessage);
        }
    }, [getAuthHeader, fetchMenus, fetchMenuTree, fetchMenuOptions, getMenuStatistics]);

    // Reorder menus
    const reorderMenus = useCallback(async (menuIds, parentId = null) => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }

            const result = await HttpClient.post(`${API_BASE}/reorder`, {
                menu_ids: menuIds,
                parent_id: parentId
            });

            if (result.status === 'ok') {
                // Refresh all data from server (no cache)
                await fetchMenusWithDependencies();
                return true;
            } else {
                throw new Error(result.message || 'Gagal mengurutkan ulang menu.');
            }

        } catch (err) {
            console.error('Error reordering menus:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Gagal mengurutkan ulang menu.';
            throw new Error(errorMessage);
        }
    }, [getAuthHeader, fetchMenus, fetchMenuTree, fetchMenuOptions]);

    // Enhanced fetchMenus dengan auto-load dependencies
    const fetchMenusWithDependencies = useCallback(async () => {
        await Promise.all([
            fetchMenus(),
            fetchMenuTree(),
            fetchMenuOptions(),
            getMenuStatistics()
        ]);
    }, [fetchMenus, fetchMenuTree, fetchMenuOptions, getMenuStatistics]);

    // Filter menus berdasarkan search term dan parent filter
    const menus = useMemo(() => {
        let filtered = [...allMenus];

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(menu =>
                menu.nama?.toLowerCase().includes(term) ||
                menu.url?.toLowerCase().includes(term) ||
                menu.parent_name?.toLowerCase().includes(term)
            );
        }

        // Apply parent filter
        if (filterParent) {
            // Filter berdasarkan parent yang dipilih
            filtered = filtered.filter(menu => {
                // Jika filterParent adalah 'root', tampilkan menu tanpa parent
                if (filterParent === 'root') {
                    return !menu.parent_name || menu.parent_name === '-';
                }
                // Jika filterParent adalah PID tertentu, filter berdasarkan parent
                return menu.parent_name && menuOptions.find(opt => opt.pid === filterParent)?.nama === menu.parent_name;
            });
        }

        return filtered;
    }, [allMenus, searchTerm, filterParent, menuOptions]);

    return {
        // Data
        menus,
        allMenus,
        menuTree,
        menuOptions,
        roles,
        setRoles,
        stats,
        
        // Loading states
        loading,
        error,
        
        // Filter states
        searchTerm,
        setSearchTerm,
        filterParent,
        setFilterParent,
        
        // Server pagination
        serverPagination,
        
        // Actions
        fetchMenus: fetchMenusWithDependencies,
        fetchRoles,
        createMenu,
        updateMenu,
        deleteMenu,
        reorderMenus,
        getMenuStatistics,
        
        // Additional utilities
        refreshMenus: fetchMenusWithDependencies,
        clearFilters: () => {
            setSearchTerm('');
            setFilterParent('');
        }
    };
};

export default useMenus;
