const customTableStyles = {
  table: {
    style: {
      width: '100%'
    },
  },
  headRow: {
    style: {
      backgroundColor: '#f9fafb',
      borderBottomWidth: '1px',
      borderBottomColor: '#e5e7eb',
      borderBottomStyle: 'solid',
    },
  },
  headCells: {
    style: {
      color: '#374151',
      fontWeight: 700,
      fontSize: '0.875rem',
    },
  },
  rows: {
    style: {
      minHeight: '56px',
      '&:not(:last-of-type)': {
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: '#f3f4f6',
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: '#f9fafb',
      borderBottomColor: '#e5e7eb',
      outline: '1px solid #e5e7eb',
    },
  },
  pagination: {
    style: {
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderTopColor: '#e5e7eb',
    },
  },
};

export default customTableStyles;
