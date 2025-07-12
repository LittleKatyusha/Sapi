import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { PackageCheck, Search, Eye, Info } from 'lucide-react';
import { DELIVERY_STATUSES } from '../constants';

/**
 * Badge component for displaying delivery status with appropriate styling and icons
 * @param {string} status - The delivery status to display
 */
const DeliveryStatusBadge = ({ status }) => {
    const config = useMemo(() => {
        const statusConfigs = {
            [DELIVERY_STATUSES.COMPLETED]: { 
                className: 'bg-green-100 text-green-800', 
                icon: <PackageCheck size={12} /> 
            },
            [DELIVERY_STATUSES.IN_TRANSIT]: { 
                className: 'bg-blue-100 text-blue-800', 
                icon: <Search size={12} /> 
            },
            [DELIVERY_STATUSES.APPROVED]: { 
                className: 'bg-cyan-100 text-cyan-800', 
                icon: <Eye size={12} /> 
            },
            [DELIVERY_STATUSES.PENDING]: { 
                className: 'bg-yellow-100 text-yellow-800', 
                icon: <Info size={12} /> 
            }
        };
        
        return statusConfigs[status] || { 
            className: 'bg-gray-100 text-gray-800', 
            icon: null 
        };
    }, [status]);

    return (
        <span className={`flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.className}`}>
            {config.icon && <span className="mr-1.5">{config.icon}</span>}
            {status}
        </span>
    );
};

DeliveryStatusBadge.propTypes = {
    status: PropTypes.string.isRequired
};

export default DeliveryStatusBadge;
