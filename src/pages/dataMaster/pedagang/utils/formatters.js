/**
 * Utility functions for formatting data in Pedagang module
 */

/**
 * Format currency to Indonesian Rupiah
 * @param {number|string} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date string to Indonesian locale
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
  } catch {
    return dateString;
  }
};

/**
 * Format date with time
 * @param {string} dateString
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
  } catch {
    return dateString;
  }
};

/**
 * Pedagang status mapping
 */
export const PEDAGANG_STATUS = {
  DEPOSIT: 1,
  PERINGATAN: 2,
  MACET: 3,
};

export const PEDAGANG_STATUS_OPTIONS = [
  { value: PEDAGANG_STATUS.DEPOSIT, label: 'Deposit' },
  { value: PEDAGANG_STATUS.PERINGATAN, label: 'Peringatan' },
  { value: PEDAGANG_STATUS.MACET, label: 'Macet' },
];

/**
 * Get status badge classes based on status code
 * @param {number} statusCode
 * @returns {string} Tailwind classes
 */
export const getStatusBadgeClasses = (statusCode) => {
  switch (statusCode) {
    case PEDAGANG_STATUS.DEPOSIT:
      return 'bg-green-100 text-green-800';
    case PEDAGANG_STATUS.PERINGATAN:
      return 'bg-yellow-100 text-yellow-800';
    case PEDAGANG_STATUS.MACET:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status label from status code
 * @param {number} statusCode
 * @returns {string}
 */
export const getStatusLabel = (statusCode) => {
  const option = PEDAGANG_STATUS_OPTIONS.find(o => o.value === statusCode);
  return option ? option.label : 'Tidak Diketahui';
};
