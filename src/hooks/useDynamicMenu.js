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
   * Filter out System menu from the menu tree
   */
  const filterSystemMenu = (menuItems) => {
    // Remove System menu and its children
    return menuItems.filter(item => 
      !(item.nama && item.nama.toLowerCase().includes('system'))
    );
  };

  /**
   * Fetch menu tree dari backend
   */
  const fetchMenuTree = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache jika tidak force refresh
      if (!forceRefresh && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
        return;
      }

      setLoading(true);
      setError(null);

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
        
        // Filter out System menu
        const menuWithoutSystem = filterSystemMenu(normalizedData);
        
        setMenuTree(menuWithoutSystem);
        setLastFetch(Date.now());
        
        // Cache ke localStorage untuk offline support
        localStorage.setItem('menuTree', JSON.stringify({
          data: menuWithoutSystem,
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
  }, [lastFetch, CACHE_DURATION]);

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
              'settings': '/settings',
              'system': '#', // Parent menu
              'parameter': '/system/parameters'
            };
            return urlMapping[cleanUrl] || `/${cleanUrl}`;
          };
          
          const normalizedData = normalizeMenuUrls(data);
          return filterSystemMenu(normalizedData);
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
  }, [fetchMenuTree]);

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
   * Check if menu has permission (placeholder for future implementation)
   */
  const hasPermission = useCallback((menuItem) => {
    // TODO: Implement permission check dengan backend
    // Untuk sekarang return true untuk semua menu
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
    return filterMenuByPermission(menuTree);
  }, [menuTree, filterMenuByPermission]);

  // Load menu saat component mount
  useEffect(() => {
    // Load dari cache terlebih dahulu untuk UX yang lebih baik
    const cached = loadFromCache();
    if (cached) {
      setMenuTree(cached);
      setLoading(false);
    }
    
    // Fetch dari server
    fetchMenuTree();
  }, [fetchMenuTree, loadFromCache]);

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
