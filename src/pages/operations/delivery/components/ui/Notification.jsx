import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { PackageCheck, Info } from 'lucide-react';
import { NOTIFICATION_TYPES } from '../../constants';

/**
 * Notification component for displaying temporary messages
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, info, error)
 * @param {function} onDismiss - Callback to dismiss notification
 */
const Notification = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const isSuccess = type === NOTIFICATION_TYPES.SUCCESS;
    
    return (
        <div 
            className={`fixed top-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white ${isSuccess ? 'bg-green-500' : 'bg-blue-500'} animate-fade-in-down z-[100]`}
            role="alert"
            aria-live="polite"
        >
            {isSuccess ? <PackageCheck size={20} className="mr-3"/> : <Info size={20} className="mr-3"/>}
            <span>{message}</span>
        </div>
    );
};

Notification.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf([NOTIFICATION_TYPES.SUCCESS, NOTIFICATION_TYPES.INFO, NOTIFICATION_TYPES.ERROR]).isRequired,
    onDismiss: PropTypes.func.isRequired
};

export default Notification;
