/**
 * Extract data array from various API response shapes
 * @param {object} response - The API response
 * @returns {Array} The extracted data array
 */
export const extractApiData = (response) => {
    const data = response?.data?.data || response?.data || response || [];
    return Array.isArray(data) ? data : [];
};