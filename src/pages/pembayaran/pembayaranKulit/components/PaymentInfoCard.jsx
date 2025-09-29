import React from 'react';

/**
 * Reusable payment information card component
 */
const PaymentInfoCard = ({ 
  icon: Icon, 
  label, 
  value, 
  gradientClass = "bg-gradient-to-r from-gray-50 to-gray-100",
  iconColor = "text-gray-600",
  children 
}) => {
  return (
    <div className={`${gradientClass} p-4 rounded-lg`}>
      <label className="block text-sm font-medium text-gray-600 mb-2">
        <Icon className={`w-4 h-4 inline mr-1 ${iconColor}`} />
        {label}
      </label>
      {children || (
        <p className="text-lg font-bold text-gray-900">
          {value}
        </p>
      )}
    </div>
  );
};

export default PaymentInfoCard;