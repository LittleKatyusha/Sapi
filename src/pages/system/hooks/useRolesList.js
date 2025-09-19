import { useState, useEffect, useCallback } from 'react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';

const useRolesList = () => {
    const { getAuthHeader } = useAuthSecure();
    const [rolesList, setRolesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRolesList = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Use the roles data endpoint with DataTables parameters to get all data
            const response = await fetch('/api/system/roles/data?start=0&length=1000&search[value]=', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.data && Array.isArray(result.data)) {
                // Collect only parent roles and remove duplicates by ID
                const allRoles = new Map();
                
                console.log('[DEBUG] Processing roles data:', result.data);
                
                result.data.forEach(role => {
                    console.log('[DEBUG] Processing role:', role);
                    
                    // Only add parent_role and remove duplicates by ID
                    if (role.parent_role && !allRoles.has(role.id)) {
                        console.log('[DEBUG] Adding parent role:', role.parent_role, 'with ID:', role.id);
                        // Create a combined label that includes both parent and child role names
                        let label = role.parent_role;
                        if (role.child_role) {
                            label += ` (${role.child_role})`;
                        }
                        
                        allRoles.set(role.id, {
                            value: role.id, // Use ID as value
                            label: label, // Combined label with parent and child role names
                            description: 'Parent Role',
                            pid: role.pid,
                            parentRole: role.parent_role, // Keep original parent role name
                            childRole: role.child_role || null // Keep child role name if exists
                        });
                    }
                });
                
                // Convert map to array
                const uniqueRoles = Array.from(allRoles.values());
                console.log('[DEBUG] Final unique parent roles:', uniqueRoles);
                
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
