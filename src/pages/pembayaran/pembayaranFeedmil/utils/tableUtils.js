import { formatDateCell } from './dateUtils';
import { PAYMENT_STATUS, COLUMN_WIDTHS } from '../constants';

/**
 * Creates a status badge for payment status
 * @param {number} paymentStatus - Payment status (1 = paid, 0 = unpaid)
 * @returns {JSX.Element} Status badge element
 */
export const createPaymentStatusBadge = (paymentStatus) => {
  const isPaid = paymentStatus === PAYMENT_STATUS.PAID;
  
  return (
    <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border ${
      isPaid 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {isPaid ? 'Lunas' : 'Belum Lunas'}
    </span>
  );
};

/**
 * Creates a styled cell wrapper
 * @param {string} content - Cell content
 * @param {string} className - Additional CSS classes
 * @returns {JSX.Element} Styled cell wrapper
 */
export const createStyledCell = (content, className = '') => (
  <div className={`w-full flex items-center justify-center ${className}`}>
    {content}
  </div>
);

/**
 * Creates a badge-style cell content
 * @param {string} text - Text content
 * @param {string} bgColor - Background color class
 * @param {string} textColor - Text color class
 * @param {string} borderColor - Border color class
 * @param {string} title - Title attribute
 * @returns {JSX.Element} Badge element
 */
export const createBadge = (text, bgColor, textColor, borderColor, title = '') => (
  <span 
    className={`font-mono text-sm ${bgColor} px-3 py-1.5 rounded-lg border ${borderColor} ${textColor}`}
    title={title}
  >
    {text || '-'}
  </span>
);

/**
 * Creates a number cell with proper styling
 * @param {number} value - Number value
 * @param {number} currentPage - Current page number
 * @param {number} perPage - Items per page
 * @param {number} index - Row index
 * @returns {JSX.Element} Number cell element
 */
export const createNumberCell = (value, currentPage, perPage, index) => (
  <div className="font-semibold text-gray-600 w-full flex items-center justify-center">
    {(currentPage - 1) * perPage + index + 1}
  </div>
);
