/**
 * Custom DataTable styles for Stok Sapi RPH page
 * Following the project's existing DataTable styling patterns
 */

const customTableStyles = {
  table: {
    style: {
      backgroundColor: '#fff',
      borderRadius: '0px',
      width: '100%',
      minWidth: '600px',
      maxWidth: 'none',
      tableLayout: 'auto',
      borderCollapse: 'separate',
      borderSpacing: 0,
      margin: 0,
    },
  },
  tableWrapper: {
    style: {
      overflowX: 'auto',
      overflowY: 'visible',
      width: '100%',
      maxWidth: '100%',
      border: 'none',
      borderRadius: '0',
      WebkitOverflowScrolling: 'touch',
      position: 'relative',
      scrollBehavior: 'smooth',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
      isolation: 'isolate',
    },
  },
  headRow: {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
      minHeight: '52px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
  },
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      padding: '12px 16px',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      lineHeight: '1.4',
      letterSpacing: '0.025em',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:last-child': {
        borderRight: 'none',
      },
    },
  },
  rows: {
    style: {
      minHeight: '48px',
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.15s ease',
      cursor: 'default',
    },
    highlightOnHoverStyle: {
      backgroundColor: '#ecfdf5',
      borderBottom: '1px solid #d1fae5',
      outlineOffset: '-2px',
      outlineWidth: '1px',
    },
  },
  cells: {
    style: {
      fontSize: '13px',
      color: '#374151',
      padding: '10px 16px',
      lineHeight: '1.5',
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid #e5e7eb',
      padding: '8px 16px',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  },
  noData: {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      color: '#9ca3af',
      fontSize: '14px',
      backgroundColor: '#f9fafb',
    },
  },
};

export default customTableStyles;
