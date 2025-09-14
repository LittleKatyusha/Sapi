import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import useSuppliersAPI from '../../pembelian/hooks/useSuppliersAPI';

const useParameterSelect = (isEditMode = false) => {
    const [parameterData, setParameterData] = useState({
        supplier: [],
        office: [],
        klasifikasiovk: [],
        farm: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Use the dedicated supplier hook for better filtering support
    const {
        supplierOptions: directSupplierOptions,
        loading: supplierLoading,
        error: supplierError,
        fetchSuppliersWithFilter
    } = useSuppliersAPI(null, 3); // kategori_supplier = 3 for OVK
    
    const [isSupplierDataFetched, setIsSupplierDataFetched] = useState(false);

    // Supplier data loading function - can be immediate or lazy based on context
    const fetchSupplierData = async (jenisSupplier = null, forceLoad = false) => {
        // Skip caching check if forceLoad is true (for edit mode)
        if (!forceLoad && isSupplierDataFetched && jenisSupplier === null) {
            console.log('📊 Supplier data already fetched (no filter), skipping...');
            return;
        }

        console.log('📊 Fetching supplier data with filter:', jenisSupplier, forceLoad ? '(forced load)' : '(lazy loading)');
        
        try {
            // Use the direct supplier API with filter support
            await fetchSuppliersWithFilter(jenisSupplier);
            
            // Only mark as fetched if no specific filter (general data)
            if (jenisSupplier === null) {
                setIsSupplierDataFetched(true);
            }
            
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchParameterData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use the centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData({
                    supplier: data.supplier || [],
                    office: data.office || [],
                    klasifikasiovk: data.klasifikasiovk || [],
                    farm: data.farm || []
                });
                setIsSupplierDataFetched(true);
                console.log('✅ Parameter data loaded:', Object.keys(data).map(key => `${key}: ${data[key]?.length || 0} items`).join(', '));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError(err.message);
            // Set empty data on error
            setParameterData({
                supplier: [],
                office: [],
                klasifikasiovk: [],
                farm: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch non-supplier data on mount
    const fetchNonSupplierData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use the centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData(prev => ({
                    ...prev,
                    office: data.office || [],
                    klasifikasiovk: data.klasifikasiovk || [],
                    farm: data.farm || []
                    // supplier: intentionally omitted for lazy loading
                }));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            setError(err.message);
            // Set empty data on error
            setParameterData(prev => ({
                ...prev,
                office: [],
                klasifikasiovk: [],
                farm: []
            }));
        } finally {
            setLoading(false);
        }
    };

    // Function to preload supplier data for edit mode
    const preloadSupplierForEdit = async () => {
        await fetchSupplierData(null, true); // Force load all suppliers
    };

    useEffect(() => {
        fetchNonSupplierData();
        
        // Only load supplier data once when component mounts
        // For edit mode, load all suppliers immediately
        // For add mode, use lazy loading when tipe pembelian is selected
        if (isEditMode) {
            console.log('📊 Edit mode detected: Loading all supplier data once');
            fetchSupplierData(null, true); // Force load all suppliers
        }
    }, [isEditMode]);

    // Use direct supplier options from the dedicated supplier hook
    const supplierOptions = useMemo(() => {
        // Prioritize direct supplier options if available, fallback to parameter data
        if (directSupplierOptions && directSupplierOptions.length > 0) {
            return directSupplierOptions;
        }
        
        // Fallback to parameter data supplier (for backward compatibility)
        return parameterData.supplier.map(item => ({
            value: item.id,
            label: item.name,
            pid: item.pid || item.id,
            jenis_supplier: item.jenis_supplier
        }));
    }, [directSupplierOptions, parameterData.supplier]);

    const officeOptions = useMemo(() => {
        return parameterData.office.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.office]);

    const klasifikasiOVKOptions = useMemo(() => {
        return parameterData.klasifikasiovk.map(item => ({
            value: item.id, // Use integer ID for backend validation
            label: item.name
        }));
    }, [parameterData.klasifikasiovk]);

    const farmOptions = useMemo(() => {
        return parameterData.farm.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.farm]);

    return {
        // Raw data
        parameterData,
        
        // Select options for dropdowns
        supplierOptions,
        officeOptions,
        klasifikasiOVKOptions,
        farmOptions,
        
        // State
        loading,
        error: error || supplierError, // Combine errors from both sources
        supplierLoading,
        isSupplierDataFetched,
        
        // Actions
        refetch: fetchParameterData,
        fetchSupplierData,
        preloadSupplierForEdit
    };
};

export default useParameterSelect;
