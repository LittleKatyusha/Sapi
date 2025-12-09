import React from 'react';

/**
 * Reusable payment information card component with enhanced styling options
 */
const PaymentInfoCard = ({
  icon: Icon,
  label,
  value,
  gradientClass = "bg-gradient-to-r from-gray-50 to-gray-100",
  iconColor = "text-gray-600",
  labelClass = "text-sm font-medium text-gray-600 mb-2",
  valueClass = "text-lg font-bold text-gray-900",
  children
}) => {
  return (
    <div className={`${gradientClass} p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200`}>
      <label className={`block ${labelClass} flex items-center gap-2`}>
        <div className={`p-1.5 bg-white/80 rounded-lg shadow-sm`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="font-semibold">{label}</span>
      </label>
      {children || (
        <p className={valueClass}>
          {value}
        </p>
      )}
    </div>
  );
};

export default PaymentInfoCard;