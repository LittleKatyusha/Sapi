const enhancedQurbanDetailStyles = {
    table: {
        style: {
            backgroundColor: '#ffffff',
            fontSize: '14px',
        },
    },
    tableWrapper: {
        style: {
            backgroundColor: '#ffffff',
        },
    },
    responsive: {
        style: {
            overflowX: 'auto',
        },
    },
    headCells: {
        style: {
            backgroundColor: '#f8fafc',
            color: '#1e293b',
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '2px solid #e2e8f0',
            paddingTop: '12px',
            paddingBottom: '12px',
            justifyContent: 'center',
            display: 'flex',
        },
    },
    cells: {
        style: {
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '12px',
            paddingRight: '12px',
            borderBottom: '1px solid #f1f5f9',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
        },
    },
    rows: {
        style: {
            backgroundColor: '#ffffff',
            '&:hover': {
                backgroundColor: '#f8fafc',
            },
        },
        stripedStyle: {
            backgroundColor: '#fafafa',
        },
    },
    pagination: {
        style: {
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '16px',
        },
        pageButtonsStyle: {
            backgroundColor: '#ffffff',
            color: '#3b82f6',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 12px',
            margin: '0 4px',
            '&:hover': {
                backgroundColor: '#eff6ff',
            },
            '&:disabled': {
                backgroundColor: '#f1f5f9',
                color: '#94a3b8',
                cursor: 'not-allowed',
            },
        },
    },
    noData: {
        style: {
            padding: '48px',
            textAlign: 'center',
            color: '#64748b',
        },
    },
};

export default enhancedQurbanDetailStyles;