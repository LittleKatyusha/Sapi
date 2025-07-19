const customTableStyles = {
    headCells: {
        style: {
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: '#f8fafc',
            color: '#374151',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
        },
    },
    cells: {
        style: {
            fontSize: '14px',
            color: '#374151',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f3f4f6',
        },
    },
    rows: {
        style: {
            minHeight: '60px',
            backgroundColor: '#ffffff',
            '&:hover': {
                backgroundColor: '#f9fafb',
                transition: 'background-color 0.2s ease',
            },
        },
        stripedStyle: {
            backgroundColor: '#f9fafb',
        },
    },
    pagination: {
        style: {
            fontSize: '13px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px',
            paddingBottom: '16px',
        },
        pageButtonsStyle: {
            borderRadius: '8px',
            height: '32px',
            width: '32px',
            padding: '4px',
            margin: '0 2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            '&:hover': {
                backgroundColor: '#f3f4f6',
                color: '#374151',
            },
            '&:focus': {
                outline: 'none',
                boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
            },
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            padding: '48px 24px',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '500',
            padding: '48px 24px',
        },
    },
    table: {
        style: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
        },
    },
    tableWrapper: {
        style: {
            display: 'table',
            width: '100%',
            backgroundColor: '#ffffff',
        },
    },
    responsiveWrapper: {
        style: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
        },
    },
};

export default customTableStyles;