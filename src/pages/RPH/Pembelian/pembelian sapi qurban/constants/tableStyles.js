const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            width: '100%',
            margin: 0,
        },
    },
    tableWrapper: {
        style: {
            overflowX: 'auto',
            width: '100%',
        },
    },
    headRow: {
        style: {
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            minHeight: '36px',
        },
    },
    headCells: {
        style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            fontWeight: '600',
            color: '#6b7280',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            whiteSpace: 'nowrap',
            background: 'transparent',
        },
    },
    cells: {
        style: {
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            fontSize: '12px',
            color: '#374151',
            borderBottom: '1px solid #f3f4f6',
            minHeight: 'auto',
            height: 'auto',
        },
    },
    rows: {
        style: {
            minHeight: '36px',
            height: 'auto',
            borderBottom: '1px solid #f3f4f6',
            '&:hover': {
                backgroundColor: '#f9fafb',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f9fafb',
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid #e5e7eb',
            padding: '8px 12px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            fontSize: '12px',
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            backgroundColor: '#ffffff',
            color: '#9ca3af',
            fontSize: '13px',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            backgroundColor: '#ffffff',
        },
    },
};

// Named export for components that import using destructuring
export const enhancedTableStyles = customTableStyles;

export default customTableStyles;