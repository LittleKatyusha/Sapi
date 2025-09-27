/**
 * Formats a date string to Indonesian locale format
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Formatted date string or original string if invalid
 */
export const formatDateToIndonesian = (dateStr) => {
  if (!dateStr) return '-';
  
  try {
    let date;
    
    // Handle DD-MM-YYYY format
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
      const [day, month, year] = dateStr.split('-');
      date = new Date(year, month - 1, day);
    } else {
      // Handle YYYY-MM-DD format or other standard formats
      date = new Date(dateStr);
    }
    
    return date.toLocaleDateString('id-ID');
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formats a date for display in table cells
 * @param {string} dateStr - Date string
 * @returns {JSX.Element} Formatted date span element
 */
export const formatDateCell = (dateStr) => {
  const formattedDate = formatDateToIndonesian(dateStr);
  
  return (
    <span className="text-gray-900 font-medium text-sm">
      {formattedDate}
    </span>
  );
};
