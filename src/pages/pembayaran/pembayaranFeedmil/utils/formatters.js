/**
 * Utility functions for formatting data
 */

// Format currency to Indonesian Rupiah
export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Enhanced date formatting with support for multiple formats
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    // Handle both DD-MM-YYYY and YYYY-MM-DD formats
    let date;
    if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
      // DD-MM-YYYY format
      const [day, month, year] = dateString.split('-');
      date = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format or other standard formats
      date = new Date(dateString);
    }
    return date.toLocaleDateString('id-ID');
  } catch (e) {
    return dateString;
  }
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID');
  } catch (e) {
    return dateString;
  }
};

// Format date for display in table cells
export const formatTableDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    // Handle both DD-MM-YYYY and YYYY-MM-DD formats
    let date;
    if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
      // DD-MM-YYYY format
      const [day, month, year] = dateString.split('-');
      date = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format or other standard formats
      date = new Date(dateString);
    }
    return date.toLocaleDateString('id-ID');
  } catch (e) {
    return dateString;
  }
};

// Calculate payment information
export const calculatePaymentInfo = (pembayaranData) => {
  const totalBiaya = parseFloat(pembayaranData?.total_tagihan || 0);
  const totalPembayaran = parseFloat(pembayaranData?.total_terbayar || 0);
  const sisaPembayaran = totalBiaya - totalPembayaran;

  return {
    biayaTruk: 0,
    biayaLain: 0,
    biayaTotal: 0,
    totalBiaya,
    totalPembayaran,
    sisaPembayaran
  };
};

// Get payment status text and styling
export const getPaymentStatusInfo = (status) => {
  switch (status) {
    case 1:
      return {
        text: 'Lunas',
        className: 'bg-green-50 text-green-700 border-green-200'
      };
    case 0:
    default:
      return {
        text: 'Belum Lunas',
        className: 'bg-red-50 text-red-700 border-red-200'
      };
  }
};

// Get remaining payment status styling
export const getRemainingPaymentStyle = (sisaPembayaran) => {
  if (sisaPembayaran > 0) {
    return {
      containerClass: 'bg-gradient-to-r from-red-50 to-pink-50',
      textClass: 'text-red-700',
      iconColor: 'text-red-600',
      statusText: 'Belum lunas'
    };
  } else if (sisaPembayaran < 0) {
    return {
      containerClass: 'bg-gradient-to-r from-yellow-50 to-orange-50',
      textClass: 'text-yellow-700',
      iconColor: 'text-yellow-600',
      statusText: 'Pembayaran berlebih'
    };
  } else {
    return {
      containerClass: 'bg-gradient-to-r from-green-50 to-emerald-50',
      textClass: 'text-green-700',
      iconColor: 'text-green-600',
      statusText: 'Lunas'
    };
  }
};