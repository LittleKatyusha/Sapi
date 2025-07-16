const customTableStyles = {
    table: {
        style: {
            color: '#1f2937',
            backgroundColor: '#ffffff',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#f8fafc',
            borderBottomColor: '#e2e8f0',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            minHeight: '56px',
        },
    },
    headCells: {
        style: {
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            fontSize: '14px',
            color: '#374151',
        },
    },
    rows: {
        style: {
            backgroundColor: '#ffffff',
            borderBottomColor: '#f3f4f6',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            '&:hover': {
                backgroundColor: '#f9fafb',
                transition: 'background-color 0.2s ease',
            },
        },
    },
    pagination: {
        style: {
            borderTopColor: '#e5e7eb',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            backgroundColor: '#ffffff',
            color: '#374151',
            fontSize: '14px',
            minHeight: '56px',
        },
        pageButtonsStyle: {
            borderRadius: '6px',
            height: '32px',
            width: '32px',
            padding: '0',
            margin: '0 4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: '#6b7280',
            fill: '#6b7280',
            backgroundColor: 'transparent',
            '&:disabled': {
                cursor: 'not-allowed',
                color: '#d1d5db',
                fill: '#d1d5db',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fill: '#374151',
            },
            '&:focus': {
                outline: 'none',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fill: '#374151',
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
            fontSize: '16px',
            fontWeight: '500',
            padding: '48px 16px',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            fontSize: '16px',
            fontWeight: '500',
            padding: '48px 16px',
        },
    },
};

export default customTableStyles;