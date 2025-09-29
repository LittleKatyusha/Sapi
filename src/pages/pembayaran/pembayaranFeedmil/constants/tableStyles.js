const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px',
            width: 'auto', // Changed from 100% to auto to fit content
            minWidth: '100%', // Ensure it fills container if content is smaller
            borderCollapse: 'separate',
            borderSpacing: '0',
            margin: 0,
        },
    },
    tableWrapper: {
        style: {
            width: 'auto', // Changed to auto to prevent forcing full width
            minWidth: '100%', // Minimum width to fill container
            border: 'none',
            borderRadius: '0',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            overflow: 'visible', // Allow content to be visible
        },
    },
    header: {
        style: {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            padding: '1rem 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            textAlign: 'center',
        },
    },
    headRow: {
        style: {
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '56px', // Slightly increased for better visual balance
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
    },
    headCells: {
        style: {
            paddingTop: '12px', // Reduced padding to save space
            paddingBottom: '12px',
            paddingLeft: '16px', // Reduced horizontal padding
            paddingRight: '16px',
            fontWeight: '600',
            color: '#334155',
            fontSize: '13px', // Slightly smaller font to save space
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            textAlign: 'center',
            borderRight: '1px solid #e5e7eb',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            background: 'transparent',
            '&:last-child': {
                borderRight: 'none',
            },
            // Better visual hierarchy
            '&:nth-child(1), &:nth-child(2)': {
                backgroundColor: '#f8fafc',
                fontWeight: '700',
            },
        },
    },
    cells: {
        style: {
            paddingTop: '12px', // Reduced vertical padding
            paddingBottom: '12px',
            paddingLeft: '16px', // Reduced horizontal padding
            paddingRight: '16px',
            fontSize: '13px', // Slightly smaller font to save space
            color: '#475569',
            textAlign: 'center',
            borderRight: '1px solid #f1f5f9',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            minHeight: 'auto',
            height: 'auto',
            '&:last-child': {
                borderRight: 'none',
            },
        },
    },
    rows: {
        style: {
            minHeight: '48px', // Reduced row height to save space
            height: 'auto',
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f8fafc',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
            // Add zebra striping for better readability
            '&:nth-of-type(even)': {
                backgroundColor: '#fafafa',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f0f9ff',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
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
