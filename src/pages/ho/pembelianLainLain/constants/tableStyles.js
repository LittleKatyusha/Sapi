const enhancedLainLainTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px', // Remove border radius from table itself for seamless scrolling
            width: '100%',
            minWidth: '1740px', // Optimized minimum width ensuring all headers display completely
            maxWidth: '100%',
            tableLayout: 'auto', // Auto layout for optimal column fitting
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
            // Custom scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            // Enable sticky positioning
            isolation: 'isolate',
        },
    },
    header: {
        style: {
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            padding: '1rem 1.5rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            textAlign: 'center', // Center alignment for header
        },
    },
    headRow: {
        style: {
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#f8fafc', // Subtle background instead of gradient
            borderBottom: '2px solid #e2e8f0',
            minHeight: '52px', // Increased for better breathing room
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        },
    },
    headCells: {
        style: {
            paddingTop: '12px', // py-3 equivalent
            paddingBottom: '12px',
            paddingLeft: '16px', // px-4 equivalent
            paddingRight: '16px',
            fontWeight: '600',
            color: '#334155',
            fontSize: '13px', // Slightly larger for better readability
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
            textAlign: 'center', // Center alignment for all headers
            borderRight: '1px solid #e2e8f0', // Border between columns
            whiteSpace: 'nowrap',
            overflow: 'visible', // Allow content to expand
            background: 'transparent',
            // Remove border from last column to avoid empty column appearance
            '&:last-child': {
                borderRight: 'none',
            },
        },
    },
    cells: {
        style: {
            paddingTop: '12px', // py-3 equivalent  
            paddingBottom: '12px',
            paddingLeft: '16px', // px-4 equivalent
            paddingRight: '16px',
            fontSize: '13px',
            color: '#475569',
            textAlign: 'center', // Center alignment for all cells
            borderRight: '1px solid #f1f5f9', // Subtle border between columns
            // Enable word wrapping and break words for long content
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            wordBreak: 'break-words',
            overflowWrap: 'break-word',
            // Allow dynamic row height
            minHeight: 'auto',
            height: 'auto',
            // Remove border from last column
            '&:last-child': {
                borderRight: 'none',
            },
        },
    },
    rows: {
        style: {
            minHeight: '44px', // Increased minimum height for better content display
            height: 'auto', // Dynamic height adjustment
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f8fafc',
                transform: 'translateY(-1px)', // Subtle lift effect
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#f8fafc',
            transition: 'all 0.2s ease',
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid #e2e8f0',
            borderRadius: '0 0 12px 12px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
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
            fontSize: '16px',
            fontWeight: '500',
            textAlign: 'center',
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

// Export the enhanced styles
export default enhancedLainLainTableStyles;