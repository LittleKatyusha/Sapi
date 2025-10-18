import { useState, useCallback, useEffect } from 'react';
import usePoRph from './usePoRph';
import usePembelianHOMock from './usePembelianHOMock';

/**
 * Wrapper hook for Pembelian HO that can switch between mock and real API
 * This allows for gradual migration from mock to real API
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.useMockData - Whether to use mock data (default: false)
 * @param {number} options.officeId - Office ID for fetching nota (required for real API)
 * @returns {Object} All hook functions and state
 */
const usePembelianHO = (options = {}) => {
    const { useMockData = false, officeId } = options;
    
    // State to track which mode we're using
    const [dataMode, setDataMode] = useState(useMockData ? 'mock' : 'api');
    
    // Get both hooks
    const mockHook = usePembelianHOMock();
    const apiHook = usePoRph();
    
    // Select which hook to use based on mode
    const activeHook = dataMode === 'mock' ? mockHook : apiHook;
    
    // Function to toggle between mock and API mode
    const toggleDataMode = useCallback(() => {
        setDataMode(prev => prev === 'mock' ? 'api' : 'mock');
        console.log(`Switched to ${dataMode === 'mock' ? 'API' : 'Mock'} mode`);
    }, [dataMode]);
    
    // Auto-fetch nota when using API mode and officeId is provided
    useEffect(() => {
        if (dataMode === 'api' && officeId && apiHook.fetchAvailableNota) {
            apiHook.fetchAvailableNota(officeId);
        }
    }, [dataMode, officeId, apiHook]);
    
    // Map API hook functions to maintain compatibility
    const mappedHook = {
        // Data - use from active hook
        pembelian: activeHook.poList || activeHook.pembelian || [],
        allPembelian: activeHook.poList || activeHook.pembelian || [],
        availableNota: activeHook.availableNota || [],
        
        // Loading states
        loading: activeHook.loading,
        isSearching: activeHook.isSearching,
        deleteLoading: activeHook.deleteLoading,
        createLoading: activeHook.createLoading,
        updateLoading: activeHook.updateLoading,
        detailLoading: activeHook.detailLoading,
        
        // Error states
        error: activeHook.error,
        searchError: activeHook.searchError,
        notaError: activeHook.notaError,
        
        // Search and filter state
        searchTerm: activeHook.searchTerm,
        setSearchTerm: activeHook.setSearchTerm,
        filterStatus: activeHook.filterStatus,
        setFilterStatus: activeHook.setFilterStatus,
        dateRange: activeHook.dateRange,
        setDateRange: activeHook.setDateRange,
        
        // Pagination
        serverPagination: activeHook.serverPagination || activeHook.pagination,
        
        // Statistics
        stats: activeHook.stats,
        
        // Main operations - map to appropriate functions
        fetchPembelian: activeHook.fetchPembelian || activeHook.fetchPoList,
        createPembelian: activeHook.createPembelian || activeHook.createPo,
        updatePembelian: activeHook.updatePembelian || activeHook.updatePo,
        deletePembelian: activeHook.deletePembelian || activeHook.deletePo,
        getPembelianDetail: activeHook.getPembelianDetail || activeHook.getPoDetail,
        
        // Additional operations from mock that might be needed
        createDetail: activeHook.createDetail || (async () => ({ 
            success: false, 
            message: 'Detail operations not supported in API mode yet' 
        })),
        updateDetail: activeHook.updateDetail || (async () => ({ 
            success: false, 
            message: 'Detail operations not supported in API mode yet' 
        })),
        deleteDetail: activeHook.deleteDetail || (async () => ({ 
            success: false, 
            message: 'Detail operations not supported in API mode yet' 
        })),
        saveHeaderOnly: activeHook.saveHeaderOnly || (async () => ({ 
            success: false, 
            message: 'Header-only save not supported in API mode yet' 
        })),
        saveDetailsOnly: activeHook.saveDetailsOnly || (async () => ({ 
            success: false, 
            message: 'Details-only save not supported in API mode yet' 
        })),
        
        // Search and filter handlers
        handleSearch: activeHook.handleSearch,
        clearSearch: activeHook.clearSearch,
        handleFilter: activeHook.handleFilter,
        handleDateRangeFilter: activeHook.handleDateRangeFilter,
        clearDateRange: activeHook.clearDateRange,
        handlePageChange: activeHook.handlePageChange,
        handlePerPageChange: activeHook.handlePerPageChange,
        
        // Additional API-specific functions
        fetchAvailableNota: dataMode === 'api' ? apiHook.fetchAvailableNota : null,
        
        // Mode management
        dataMode,
        toggleDataMode,
        isUsingMockData: dataMode === 'mock',
        isUsingApiData: dataMode === 'api'
    };
    
    return mappedHook;
};

export default usePembelianHO;
