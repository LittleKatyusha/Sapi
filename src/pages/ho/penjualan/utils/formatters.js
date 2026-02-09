/**
 * Format number to Indonesian Rupiah currency format
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string (e.g., "Rp 1.500.000")
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value).replace('IDR', 'Rp').trim();
};

/**
 * Format number to weight format with KG unit (no rounding)
 * @param {number} value - The weight value
 * @returns {string} Formatted weight string (e.g., "125.75 KG")
 */
export const formatWeight = (value) => {
    if (value === null || value === undefined) return '0 KG';
    
    // Format with up to 2 decimal places, but don't add trailing zeros
    const formatted = Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
    
    return `${formatted} KG`;
};

/**
 * Format date to Indonesian format (DD/MM/YYYY)
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string (e.g., "15/01/2024")
 */
export const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
};

/**
 * Format price per KG
 * @param {number} value - The price value
 * @returns {string} Formatted price string (e.g., "Rp 15.000")
 */
export const formatPricePerKg = (value) => {
    return formatCurrency(value);
};