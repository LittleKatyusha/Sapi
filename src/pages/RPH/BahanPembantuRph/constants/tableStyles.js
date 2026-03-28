const customTableStyles = {
  table: {
    style: {
      backgroundColor: '#fff',
      borderRadius: '0px',
      width: '100%',
      minWidth: '1500px',
      maxWidth: 'none',
      tableLayout: 'auto',
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
      maxWidth: '100%',
      border: 'none',
      borderRadius: '0',
      WebkitOverflowScrolling: 'touch',
      position: 'relative',
      scrollBehavior: 'smooth',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9',
      isolation: 'isolate',
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
      padding: '12px 16px',
      textAlign: 'center !important',
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
      // Sticky "No" column styling
      '&:first-child': {
        position: 'sticky',
        left: 0,
        zIndex: 1002,
        backgroundColor: '#f8fafc',
        borderRight: '2px solid #e5e7eb',
        boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
        willChange: 'transform',
        minWidth: '50px',
        maxWidth: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center !important',
      },
      // Sticky "Aksi" column styling (second column)
      '&:nth-child(2)': {
        position: 'sticky',
        left: '50px',
        zIndex: 1001,
        backgroundColor: '#f8fafc',
        borderRight: '2px solid #e5e7eb',
        boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
        willChange: 'transform',
        minWidth: '70px',
        maxWidth: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center !important',
      },
    }
  },
  rows: {
    style: {
      minHeight: '48px',
      borderBottom: '1px solid #f3f4f6',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#f9fafb',
        transform: 'none',
      },
      '&:last-child': {
        borderBottom: 'none',
      }
    }
  },
  cells: {
    style: {
      padding: '12px 16px',
      fontSize: '13px',
      color: '#374151',
      lineHeight: '1.5',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      overflow: 'visible',
      verticalAlign: 'middle',
      borderRight: '1px solid #f3f4f6',
      '&:last-child': {
        borderRight: 'none',
      },
      // Sticky "No" column styling
      '&:first-child': {
        position: 'sticky',
        left: 0,
        zIndex: 999,
        backgroundColor: '#ffffff !important',
        borderRight: '2px solid #e5e7eb',
        boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
        willChange: 'transform',
        fontWeight: '600',
        color: '#6b7280',
        minWidth: '50px',
        maxWidth: '50px',
      },
      // Sticky "Aksi" column styling (second column)
      '&:nth-child(2)': {
        position: 'sticky',
        left: '50px',
        zIndex: 998,
        backgroundColor: '#ffffff !important',
        borderRight: '2px solid #e5e7eb',
        boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
        willChange: 'transform',
        minWidth: '70px',
        maxWidth: '70px',
      },
    }
  }
};

export const enhancedTableStyles = customTableStyles;
export default customTableStyles;
