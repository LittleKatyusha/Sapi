const customTableStyles = {
  table: {
    style: {
      backgroundColor: 'transparent',
    },
  },
  headRow: {
    style: {
      backgroundColor: '#f8fafc',
      borderBottomColor: '#e2e8f0',
      borderBottomWidth: '1px',
      minHeight: '52px',
    },
  },
  headCells: {
    style: {
      fontSize: '14px',
      fontWeight: '600',
      textTransform: 'none',
      color: '#374151',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      fontSize: '14px',
      fontWeight: '400',
      color: '#374151',
      backgroundColor: 'white',
      borderBottomColor: '#e2e8f0',
      borderBottomWidth: '1px',
      '&:hover': {
        backgroundColor: '#f1f5f9',
        transition: 'background-color 0.2s ease',
      },
      minHeight: '60px',
    },
    stripedStyle: {
      backgroundColor: '#f9fafb',
    },
  },
  cells: {
    style: {
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '12px',
      paddingBottom: '12px',
    },
  },
  pagination: {
    style: {
      backgroundColor: '#f8fafc',
      borderTopColor: '#e2e8f0',
      borderTopWidth: '1px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      padding: '16px',
    },
  },
  progress: {
    style: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  },
  noData: {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      backgroundColor: 'white',
      padding: '48px 24px',
    },
  },
};

export default customTableStyles;