const customTableStyles = {
  table: {
    style: {
      backgroundColor: '#fff',
      borderRadius: '0px',
      width: '100%',
      minWidth: '800px',
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
      scrollbarColor: '#94a3b8 #f1f5f9',
      isolation: 'isolate',
    },
  },
  headRow: {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#f8fafc',
      backgroundImage: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      borderBottom: '2px solid #cbd5e1',
      minHeight: '44px',
    },
  },
  headCells: {
    style: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#0f172a',
      padding: '10px 14px',
      textAlign: 'center',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      lineHeight: '1.3',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.15s ease',
      '&:hover': {
        color: '#059669',
      },
      '&:last-child': {
        borderRight: 'none',
      },
    },
    activeSortStyle: {
      color: '#059669',
      fontWeight: '800',
    },
  },
  rows: {
    style: {
      minHeight: '44px',
      borderBottom: '1px solid #f1f5f9',
      transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
      cursor: 'pointer',
      fontSize: '13px',
      '&:nth-of-type(even)': {
        backgroundColor: '#fafbfc',
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: '#ecfdf5 !important',
      borderBottom: '1px solid #a7f3d0',
      outlineOffset: '-2px',
      outlineWidth: '1px',
      boxShadow: 'inset 3px 0 0 #10b981',
    },
  },
  cells: {
    style: {
      fontSize: '13px',
      color: '#1e293b',
      padding: '10px 14px',
      lineHeight: '1.4',
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid #e5e7eb',
      padding: '12px 16px',
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
      padding: '48px',
      color: '#64748b',
      fontSize: '16px',
      backgroundColor: '#f9fafb',
    },
  },
};

export default customTableStyles;