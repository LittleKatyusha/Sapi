import { useState, useEffect, useMemo } from 'react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';
import useSuppliersAPI from './useSuppliersAPI';

const useParameterSelect = () => {
    const [parameterData, setParameterData] = useState({
        eartag: [],
        supplier: [],
        office: [],
        klasifikasihewan: [],
        outlet: [],
        jenishewan: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Use the dedicated supplier hook for better filtering support
    const {
        supplierOptions: directSupplierOptions,
        loading: supplierLoading,
        error: supplierError,
        fetchSuppliersWithFilter
    } = useSuppliersAPI();
    
    const [isSupplierDataFetched, setIsSupplierDataFetched] = useState(false);

    // Lazy loading function specifically for supplier data - now uses direct supplier API
    const fetchSupplierData = async (jenisSupplier = null) => {
        // More specific caching logic
        if (isSupplierDataFetched && jenisSupplier === null) {
            console.log('📊 Supplier data already fetched (no filter), skipping...');
            return;
        }

        console.log('📊 Fetching supplier data (lazy loading) with filter:', jenisSupplier);
        
        try {
            // Use the direct supplier API with filter support
            await fetchSuppliersWithFilter(jenisSupplier);
            
            // Only mark as fetched if no specific filter (general data)
            if (jenisSupplier === null) {
                setIsSupplierDataFetched(true);
            }
            
            console.log('✅ Supplier data loaded via direct API');
        } catch (err) {
            console.error('Error fetching supplier data:', err);
            setError(err.message);
        }
    };

    const fetchParameterData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('📊 Fetching centralized parameter data...');
            
            // Use the new centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            console.log('✅ Parameter data response received');
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData({
                    eartag: data.eartag || [],
                    supplier: data.supplier || [],
                    office: data.office || [],
                    klasifikasihewan: data.klasifikasihewan || [],
                    outlet: data.outlet || [],
                    jenishewan: data.jenishewan || []
                });
                setIsSupplierDataFetched(true);
                console.log('✅ Parameter data loaded:', Object.keys(data).map(key => `${key}: ${data[key]?.length || 0} items`).join(', '));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            console.error('Error fetching parameter data:', err);
            setError(err.message);
            // Set empty data on error
            setParameterData({
                eartag: [],
                supplier: [],
                office: [],
                klasifikasihewan: [],
                outlet: [],
                jenishewan: []
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
            console.log('📊 Fetching non-supplier parameter data...');
            
            // Use the new centralized parameter endpoint
            const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.PARAMETER}/data`);
            
            console.log('✅ Parameter data response received');
            
            // Handle the response format from ParameterSelectController
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                const data = result.data[0]; // The controller returns data in an array
                setParameterData(prev => ({
                    ...prev,
                    eartag: data.eartag || [],
                    office: data.office || [],
                    klasifikasihewan: data.klasifikasihewan || [],
                    outlet: data.outlet || [],
                    jenishewan: data.jenishewan || []
                    // supplier: intentionally omitted for lazy loading
                }));
                console.log('✅ Non-supplier parameter data loaded:', Object.keys(data)
                    .filter(key => key !== 'supplier')
                    .map(key => `${key}: ${data[key]?.length || 0} items`).join(', '));
            } else {
                throw new Error('Invalid response format from parameter endpoint');
            }
        } catch (err) {
            console.error('Error fetching non-supplier parameter data:', err);
            setError(err.message);
            // Set empty data on error
            setParameterData(prev => ({
                ...prev,
                eartag: [],
                office: [],
                klasifikasihewan: [],
                outlet: [],
                jenishewan: []
            }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNonSupplierData();
    }, []);

    // Create select options for each parameter type
    const eartagOptions = useMemo(() => {
        return parameterData.eartag.map(item => ({
            value: item.pubid || item.id, // Use pubid first, fallback to id
            label: item.name || item.kode || item.id
        }));
    }, [parameterData.eartag]);

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

    const klasifikasiHewanOptions = useMemo(() => {
        return parameterData.klasifikasihewan.map(item => ({
            value: item.pubid || item.id, // Use pubid first, fallback to id
            label: item.name
        }));
    }, [parameterData.klasifikasihewan]);

    const outletOptions = useMemo(() => {
        return parameterData.outlet.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.outlet]);

    const jenisHewanOptions = useMemo(() => {
        return parameterData.jenishewan.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.jenishewan]);

    return {
        // Raw data
        parameterData,
        
        // Select options for dropdowns
        eartagOptions,
        supplierOptions,
        officeOptions,
        klasifikasiHewanOptions,
        outletOptions,
        jenisHewanOptions,
        
        // State
        loading,
        error: error || supplierError, // Combine errors from both sources
        supplierLoading,
        isSupplierDataFetched,
        
        // Actions
        refetch: fetchParameterData,
        fetchSupplierData
    };
};

export default useParameterSelect;