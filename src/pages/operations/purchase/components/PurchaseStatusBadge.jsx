import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
    PackageCheck, 
    Truck, 
    ShieldQuestion, 
    ShieldCheck 
} from 'lucide-react';
import { PURCHASE_STATUSES } from '../constants';

/**
 * PurchaseStatusBadge - Displays status badge for purchase items
 * @param {string} status - Purchase status
 * @returns {JSX.Element} Status badge component
 */
const PurchaseStatusBadge = ({ status }) => {
    const config = useMemo(() => {
        const statusConfigs = {
            [PURCHASE_STATUSES.RECEIVED]: {
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                icon: PackageCheck,
                label: 'Diterima'
            },
            [PURCHASE_STATUSES.ORDERED]: {
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-800',
                icon: Truck,
                label: 'Dipesan'
            },
            [PURCHASE_STATUSES.CANCELLED]: {
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                icon: ShieldQuestion,
                label: 'Dibatalkan'
            }
        };

        return statusConfigs[status] || {
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            icon: ShieldCheck,
            label: status
        };
    }, [status]);

    const { bgColor, textColor, icon: Icon, label } = config;

    return (
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            <Icon size={12} className="mr-1.5" />
            {label}
        </div>
    );
};

PurchaseStatusBadge.propTypes = {
    status: PropTypes.string.isRequired
};

export default PurchaseStatusBadge;
