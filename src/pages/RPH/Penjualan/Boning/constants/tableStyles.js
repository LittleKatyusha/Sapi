export const enhancedTableStyles = {
  table: {
    style: {
      backgroundColor: '#fff',
      borderRadius: '0px',
      width: '100%',
      minWidth: '1000px',
      maxWidth: '100%',
      tableLayout: 'fixed',
      borderCollapse: 'separate',
      borderSpacing: 0,
      margin: 0,
    }
  },
  tableWrapper: {
    style: {
      overflowX: 'auto',
      overflowY: 'visible',
      width: '100%',
      maxWidth: '100vw',
      border: 'none',
      borderRadius: '0',
      WebkitOverflowScrolling: 'touch',
      scrollBehavior: 'smooth',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
    }
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
    }
  },
  headCells: {
    style: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#374151',
      padding: '16px 12px',
      textAlign: 'center !important',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      lineHeight: '1.4',
      letterSpacing: '0.025em',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:last-child': { borderRight: 'none' },
    }
  },
  rows: {
    style: {
      minHeight: '48px',
      borderBottom: '1px solid #f3f4f6',
      transition: 'all 0.2s ease',
      '&:hover': { backgroundColor: '#d1d5db' },
      '&:last-child': { borderBottom: 'none' },
      '&:nth-of-type(odd)': { backgroundColor: '#ffffff' },
      '&:nth-of-type(even)': { backgroundColor: '#e5e7eb' },
    },
    highlightOnHoverStyle: {
      backgroundColor: '#d1d5db',
      borderBottomColor: '#9ca3af',
      outline: 'none',
    }
  },
  cells: {
    style: {
      padding: '12px',
      fontSize: '13px',
      color: '#374151',
      lineHeight: '1.5',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      overflow: 'visible',
      verticalAlign: 'middle',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: 'transparent',
      '&:last-child': { borderRight: 'none' },
      '&:first-child': { fontWeight: '600', color: '#6b7280', backgroundColor: 'inherit' },
    }
  },
  pagination: {
    style: { display: 'none' }
  }
};
