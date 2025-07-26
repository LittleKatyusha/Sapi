import { useState, useEffect, useMemo } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

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
    
    const { getAuthHeader } = useAuthSecure();

    const fetchParameterData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeaders = getAuthHeader();
            if (!authHeaders.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }

            console.log('Fetching centralized parameter data...');
            
            // Use the new centralized parameter endpoint
            const response = await fetch('https://puput-api.ternasys.com/api/master/parameter/data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'api-key': '92b1d1ee96659e5b9630a51808b9372c',
                    ...authHeaders
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Token tidak valid atau sudah expired');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
                } else if (response.status === 404) {
                    throw new Error('Endpoint tidak ditemukan');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            console.log('✅ Parameter data response:', result);
            
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
                console.log('✅ Parameter data loaded successfully:', data);
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

    useEffect(() => {
        fetchParameterData();
    }, []);

    // Create select options for each parameter type
    const eartagOptions = useMemo(() => {
        return parameterData.eartag.map(item => ({
            value: item.id,
            label: item.name || item.kode || item.id
        }));
    }, [parameterData.eartag]);

    const supplierOptions = useMemo(() => {
        return parameterData.supplier.map(item => ({
            value: item.id,
            label: item.name,
            pid: item.pid || item.id // Keep PID for compatibility with existing logic
        }));
    }, [parameterData.supplier]);

    const officeOptions = useMemo(() => {
        return parameterData.office.map(item => ({
            value: item.id,
            label: item.name
        }));
    }, [parameterData.office]);

    const klasifikasiHewanOptions = useMemo(() => {
        return parameterData.klasifikasihewan.map(item => ({
            value: item.id,
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
        error,
        
        // Actions
        refetch: fetchParameterData
    };
};

export default useParameterSelect;