import { useState, useEffect, useCallback, useMemo } from 'react';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * Hook untuk mengelola menu dynamic dari backend
 * Terintegrasi dengan sistem permission dan caching
 */
export const useDynamicMenu = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration (5 menit)
  const CACHE_DURATION = 5 * 60 * 1000;


  /**
   * Filter menu items to only show accessible ones
   */
  const filterAccessibleMenus = (menuItems) => {
    return menuItems.filter(item => {
      // If menu has access info, check has_access
      if (item.has_access !== undefined) {
        return item.has_access;
      }
      
      // If no access info, assume accessible (for backward compatibility)
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? filterAccessibleMenus(item.children) : []
    }));
  };

  /**
   * Fetch menu tree dari backend berdasarkan role user
   */
  const fetchMenuTree = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache jika tidak force refresh
      if (!forceRefresh && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
        return;
      }

      setLoading(true);
      setError(null);

      // Get user role from localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const userRoleId = storedUser?.roles_id;

      if (!userRoleId) {
        console.warn('User role not found, using default menu');
        // Fallback to default menu without role filtering
        const response = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/tree`);
        
        if (response.status === 'ok' && response.data) {
          // Normalize URLs - add leading slash and correct path mapping
          const normalizeMenuUrls = (items) => {
            return items.map(item => ({
              ...item,
              url: item.url && item.url !== '#' ? 
                normalizeUrl(item.url) : 
                item.url,
              children: item.children ? normalizeMenuUrls(item.children) : item.children
            }));
          };
          
          // URL mapping function
          const normalizeUrl = (url) => {
            // Remove leading slash if exists
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            
            // Map menu URLs to correct route paths
            const urlMapping = {
              'dashboard': '/dashboard',
              'pembelian': '/ho/pembelian',
              'pembelian-feedmil': '/ho/pembelian-feedmil',
              'pembelian-ovk': '/ho/pembelian-ovk',
              'penjualan': '/ho/penjualan',
              'kandang-office': '/master-data/kandang-office',
              'jenis-hewan': '/master-data/jenis-hewan',
              'klasifikasi-hewan': '/master-data/klasifikasi-hewan',
              'klasifikasi-ovk': '/master-data/klasifikasi-ovk',
              'klasifikasi-feedmil': '/master-data/klasifikasi-feedmil',
              'supplier': '/master-data/supplier',
              'pelanggan': '/master-data/pelanggan',
              'outlet': '/master-data/outlet',
              'produk-gds': '/master-data/produk-gds',
              'eartag': '/master-data/eartag',
              'nota-supplier': '/reports/nota-supplier',
              'semua-supplier': '/reports/semua-supplier',
              'pajak': '/reports/pajak',
              'settings': '/settings'
            };
            
            return urlMapping[cleanUrl] || `/${cleanUrl}`;
          };
          
          const normalizedData = normalizeMenuUrls(response.data);
          setMenuTree(normalizedData);
          setLastFetch(Date.now());
          return;
        } else {
          throw new Error('Failed to load default menu');
        }
      }

      // Fetch menu tree with role access information
      // Try with include_access parameter first
      let response;
      try {
        // Build URL manually to handle boolean parameters correctly
        // Laravel boolean validation only accepts: true, false, 1, 0, '1', '0'
        // NOT 'true' or 'false' strings
        const baseUrl = `${API_ENDPOINTS.SYSTEM.MENU}/tree`;
        const url = `${baseUrl}?role_id=${userRoleId}&include_access=1`;
        
        response = await HttpClient.get(url);
      } catch (error) {
        // If include_access fails, try without it and get access matrix separately
        console.warn('Failed to get menu with access info, trying alternative approach:', error.message);
        
        const [menuResponse, accessMatrixResponse] = await Promise.all([
          HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/tree`),
          HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/access-matrix`)
        ]);
        
        // Merge menu data with access information
        if (menuResponse.status === 'ok' && accessMatrixResponse.status === 'ok') {
          const menuData = menuResponse.data;
          const accessMatrix = accessMatrixResponse.data;
          
          // Find role in access matrix
          const roleAccess = accessMatrix.find(role => role.role_id === userRoleId);
          
          if (roleAccess) {
            // Add access information to menu items
            const addAccessInfo = (items) => {
              return items.map(item => {
                const menuAccess = roleAccess.menus.find(menu => menu.menu_id === item.id);
                return {
                  ...item,
                  has_access: menuAccess ? menuAccess.has_access : false,
                  access_type: menuAccess ? menuAccess.access_type : 'none',
                  children: item.children ? addAccessInfo(item.children) : []
                };
              });
            };
            
            response = {
              status: 'ok',
              data: addAccessInfo(menuData)
            };
          } else {
            // If role not found in access matrix, use menu without access info
            response = menuResponse;
          }
        } else {
          throw new Error('Failed to get menu data');
        }
      }
      
      if (response.status === 'ok' && response.data) {
        
        // Normalize URLs - add leading slash and correct path mapping
        const normalizeMenuUrls = (items) => {
          return items.map(item => ({
            ...item,
            url: item.url && item.url !== '#' ? 
              normalizeUrl(item.url) : 
              item.url,
            children: item.children ? normalizeMenuUrls(item.children) : item.children
          }));
        };
        
        // URL mapping function
        const normalizeUrl = (url) => {
          // Remove leading slash if exists
          const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
          
          // Map menu URLs to correct route paths
          const urlMapping = {
            'dashboard': '/dashboard',
            'pembelian': '/ho/pembelian',
            'pembelian-feedmil': '/ho/pembelian-feedmil',
            'pembelian-ovk': '/ho/pembelian-ovk',
            'penjualan': '/ho/penjualan',
            'kandang-office': '/master-data/kandang-office',
            'jenis-hewan': '/master-data/jenis-hewan',
            'klasifikasi-hewan': '/master-data/klasifikasi-hewan',
            'klasifikasi-ovk': '/master-data/klasifikasi-ovk',
            'klasifikasi-feedmil': '/master-data/klasifikasi-feedmil',
            'supplier': '/master-data/supplier',
            'pelanggan': '/master-data/pelanggan',
            'outlet': '/master-data/outlet',
            'produk-gds': '/master-data/produk-gds',
            'eartag': '/master-data/eartag',
            'nota-supplier': '/reports/nota-supplier',
            'semua-supplier': '/reports/semua-supplier',
            'pajak': '/reports/pajak',
            'permission-management': '/system/permission-management',
            'settings': '/settings'
          };
          
          return urlMapping[cleanUrl] || `/${cleanUrl}`;
        };
        
        const normalizedData = normalizeMenuUrls(response.data);
        
        // Debug: Log the menu data
        console.log('useDynamicMenu - Raw menu data:', normalizedData);
        
        // Show accessible menus
        const accessibleMenus = filterAccessibleMenus(normalizedData);
        
        // Debug: Log the filtered menu data
        console.log('useDynamicMenu - Filtered menu data:', accessibleMenus);
        
        setMenuTree(accessibleMenus);
        setLastFetch(Date.now());
        
        // Cache ke localStorage untuk offline support
        localStorage.setItem('menuTree', JSON.stringify({
          data: accessibleMenus,
          timestamp: Date.now()
        }));
        
      } else {
        throw new Error(response.message || 'Failed to load menu tree');
      }
    } catch (err) {
      setError(err.message);
      
      // Fallback ke cache jika ada
      const cached = loadFromCache();
      if (cached) {
        setMenuTree(cached);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load menu dari cache localStorage
   */
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem('menuTree');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check apakah cache masih valid (1 hari)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          // Normalize URLs dari cache juga
          const normalizeMenuUrls = (items) => {
            return items.map(item => ({
              ...item,
              url: item.url && item.url !== '#' ? 
                normalizeUrl(item.url) : 
                item.url,
              children: item.children ? normalizeMenuUrls(item.children) : item.children
            }));
          };
          
          // URL mapping function (same as above)
          const normalizeUrl = (url) => {
            const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
            const urlMapping = {
              'dashboard': '/dashboard',
              'pembelian': '/ho/pembelian',
              'pembelian-feedmil': '/ho/pembelian-feedmil',
              'pembelian-ovk': '/ho/pembelian-ovk',
              'penjualan': '/ho/penjualan',
              'kandang-office': '/master-data/kandang-office',
              'jenis-hewan': '/master-data/jenis-hewan',
              'klasifikasi-hewan': '/master-data/klasifikasi-hewan',
              'klasifikasi-ovk': '/master-data/klasifikasi-ovk',
              'klasifikasi-feedmil': '/master-data/klasifikasi-feedmil',
              'supplier': '/master-data/supplier',
              'pelanggan': '/master-data/pelanggan',
              'outlet': '/master-data/outlet',
              'produk-gds': '/master-data/produk-gds',
              'eartag': '/master-data/eartag',
              'nota-supplier': '/reports/nota-supplier',
              'semua-supplier': '/reports/semua-supplier',
              'pajak': '/reports/pajak',
              'permission-management': '/system/permission-management',
              'settings': '/settings',
              'system': '#', // Parent menu
              'parameter': '/system/parameters'
            };
            return urlMapping[cleanUrl] || `/${cleanUrl}`;
          };
          
          const normalizedData = normalizeMenuUrls(data);
          return filterAccessibleMenus(normalizedData);
        }
      }
    } catch (err) {
      // Silent fail for cache loading
    }
    return null;
  }, []);

  /**
   * Clear cache menu
   */
  const clearCache = useCallback(() => {
    localStorage.removeItem('menuTree');
    setLastFetch(null);
  }, []);

  /**
   * Refresh menu tree
   */
  const refreshMenu = useCallback(() => {
    return fetchMenuTree(true);
  }, []);

  /**
   * Get breadcrumb untuk path tertentu
   */
  const getBreadcrumb = useCallback((currentPath) => {
    const findBreadcrumb = (items, path = []) => {
      for (const item of items) {
        const newPath = [...path, { nama: item.nama, url: item.url }];
        
        if (item.url === currentPath) {
          return newPath;
        }
        
        if (item.children && item.children.length > 0) {
          const found = findBreadcrumb(item.children, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findBreadcrumb(menuTree) || [];
  }, [menuTree]);

  /**
   * Find menu item by URL
   */
  const findMenuItem = useCallback((url) => {
    const findItem = (items) => {
      for (const item of items) {
        if (item.url === url) return item;
        
        if (item.children && item.children.length > 0) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findItem(menuTree);
  }, [menuTree]);

  /**
   * Get menu statistics
   */
  const menuStats = useMemo(() => {
    const countItems = (items) => {
      let total = 0;
      let withUrl = 0;
      let parents = 0;
      
      for (const item of items) {
        total++;
        if (item.url) withUrl++;
        if (item.children && item.children.length > 0) {
          parents++;
          const childStats = countItems(item.children);
          total += childStats.total;
          withUrl += childStats.withUrl;
          parents += childStats.parents;
        }
      }
      
      return { total, withUrl, parents };
    };

    return countItems(menuTree);
  }, [menuTree]);

  /**
   * Check if menu has permission based on backend data
   */
  const hasPermission = useCallback((menuItem) => {
    // Check if menu has access info from backend
    if (menuItem.has_access !== undefined) {
      return menuItem.has_access;
    }
    
    // If no access info, assume accessible (for backward compatibility)
    return true;
  }, []);

  /**
   * Filter menu berdasarkan permission
   */
  const filterMenuByPermission = useCallback((items) => {
    return items
      .filter(item => hasPermission(item))
      .map(item => ({
        ...item,
        children: item.children ? filterMenuByPermission(item.children) : []
      }));
  }, [hasPermission]);

  /**
   * Get filtered menu tree (dengan permission)
   */
  const filteredMenuTree = useMemo(() => {
    const filtered = filterMenuByPermission(menuTree);
    console.log('useDynamicMenu - Final filtered menu tree:', filtered);
    return filtered;
  }, [menuTree, filterMenuByPermission]);

  // Load menu saat component mount
  useEffect(() => {
    // Fetch dari server dengan force refresh untuk memastikan data fresh
    fetchMenuTree(true);
  }, []); // Empty dependency array to run only once on mount

  return {
    // Data
    menuTree: filteredMenuTree,
    rawMenuTree: menuTree,
    loading,
    error,
    
    // Stats
    menuStats,
    lastFetch,
    
    // Methods
    refreshMenu,
    clearCache,
    getBreadcrumb,
    findMenuItem,
    hasPermission,
    
    // Utils
    isEmpty: menuTree.length === 0,
    isStale: lastFetch && (Date.now() - lastFetch > CACHE_DURATION)
  };
};

export default useDynamicMenu;
