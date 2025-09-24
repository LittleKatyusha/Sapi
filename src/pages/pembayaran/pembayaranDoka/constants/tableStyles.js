const customTableStyles = {
    table: {
        style: {
            minHeight: '400px',
            borderRadius: '0.75rem',
            overflow: 'hidden',
        },
    },
    tableWrapper: {
        style: {
            overflow: 'visible',
            borderRadius: '0.75rem',
        },
    },
    header: {
        style: {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            padding: '1rem 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#f1f5f9',
            borderBottomWidth: '1px',
            borderBottomColor: '#e2e8f0',
            minHeight: '3.5rem',
        },
    },
    headCells: {
        style: {
            paddingLeft: '1rem',
            paddingRight: '1rem',
            fontWeight: '600',
            color: '#334155',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            '&:first-child': {
                paddingLeft: '1.5rem',
            },
            '&:last-child': {
                paddingRight: '1.5rem',
            },
        },
    },
    cells: {
        style: {
            paddingLeft: '1rem',
            paddingRight: '1rem',
            fontSize: '0.875rem',
            color: '#334155',
            minHeight: '3rem',
            '&:first-child': {
                paddingLeft: '1.5rem',
            },
            '&:last-child': {
                paddingRight: '1.5rem',
            },
        },
    },
    rows: {
        style: {
            minHeight: '3.5rem',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
                borderBottomColor: '#f1f5f9',
            },
            '&:hover': {
                backgroundColor: '#f8fafc',
                transition: 'background-color 0.2s ease',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f1f5f9',
            transition: 'background-color 0.2s ease',
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid #f1f5f9',
            padding: '1rem',
            backgroundColor: '#ffffff',
            borderRadius: '0 0 0.75rem 0.75rem',
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            backgroundColor: '#ffffff',
            color: '#94a3b8',
            fontSize: '1rem',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            backgroundColor: '#ffffff',
        },
    },
};

export default customTableStyles;
