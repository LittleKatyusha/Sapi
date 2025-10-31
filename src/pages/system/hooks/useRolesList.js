import { useState, useEffect, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const useRolesList = () => {
    const { getAuthHeader } = useAuthSecure();
    const [rolesList, setRolesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRolesList = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            // Use HttpClient with API_ENDPOINTS for proper environment handling
            const queryParams = new URLSearchParams({
                'start': '0',
                'length': '1000',
                'draw': Date.now().toString(),
                'search[value]': '',
                'order[0][column]': '0',
                'order[0][dir]': 'asc',
                '_t': Date.now().toString() // Cache busting
            });
            
            // Use the same approach as useRoles hook
            const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.ROLES}/data?${queryParams.toString()}`);
            
            if (result.data && Array.isArray(result.data)) {
                // Collect all unique roles for dropdown
                const allRoles = new Map();
                
                console.log('[DEBUG] Processing roles data:', result.data);
                
                result.data.forEach(role => {
                    console.log('[DEBUG] Processing role:', role);
                    
                    // Include all roles (both parent and child roles) for better flexibility
                    // Each role can potentially be a parent to another role
                    
                    if (role.id) {
                        // Check if we should use parent_role or child_role as the main name
                        const roleName = role.child_role || role.parent_role || 'Unknown Role';
                        
                        // Avoid duplicates by ID
                        if (!allRoles.has(role.id)) {
                            console.log('[DEBUG] Adding role:', roleName, 'with ID:', role.id);
                            
                            allRoles.set(role.id, {
                                value: role.id, // Use ID as value for consistency
                                label: roleName, // Display name
                                description: role.description || '',
                                pid: role.pid,
                                parentRole: role.parent_role, // Keep original parent role name
                                childRole: role.child_role || null // Keep child role name if exists
                            });
                        }
                    }
                });
                
                // Convert map to array and sort by label
                const uniqueRoles = Array.from(allRoles.values()).sort((a, b) => 
                    a.label.localeCompare(b.label)
                );
                
                console.log('[DEBUG] Final unique roles:', uniqueRoles);
                
                setRolesList(uniqueRoles);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('[ERROR] Error fetching roles list:', err);
            setError(err.message || 'Failed to fetch roles list');
            setRolesList([]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        fetchRolesList();
    }, [fetchRolesList]);

    return {
        rolesList,
        loading,
        error,
        refetch: fetchRolesList
    };
};

export default useRolesList;
