const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px', // Remove border radius from table itself
            width: '100%',
            minWidth: '1400px', // Adjusted minimum width for horizontal scroll
            maxWidth: 'none', // Allow table to expand beyond container
            tableLayout: 'auto', // Change to auto for better column fitting
            borderCollapse: 'separate',
            borderSpacing: 0,
            margin: 0,
        }
    },
    tableWrapper: {
        style: {
            overflow: 'visible', // Let parent container handle scrolling
            width: '100%',
            maxWidth: '100%',
            border: 'none',
            borderRadius: '0',
            position: 'relative',
            // Remove scrolling properties since parent handles it
        }
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
        }
    },
    headCells: {
        style: {
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
            padding: '12px 16px', // py-3 px-4 equivalent - optimal spacing
            textAlign: 'center !important', // Force center alignment for all headers
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: '1.4',
            letterSpacing: '0.025em',
            borderRight: '1px solid #e5e7eb', // Vertical borders except last
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:last-child': {
                borderRight: 'none', // No border on last column
            },
            // Sticky "No" column styling
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 1002,
                backgroundColor: '#f8fafc',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '60px',
                maxWidth: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center !important',
            },
            // Sticky "Aksi" column styling - last column
            '&:last-of-type': {
                position: 'sticky',
                right: 0,
                zIndex: 1001,
                backgroundColor: '#f8fafc',
                borderLeft: '2px solid #e5e7eb',
                borderRight: 'none',
                boxShadow: '-1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '80px',
                maxWidth: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center !important',
            },
        }
    },
    rows: {
        style: {
            minHeight: '48px', // Dynamic height that adjusts to content
            borderBottom: '1px solid #f3f4f6',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f9fafb',
                transform: 'none', // Remove scale effect for cleaner look
            },
            '&:last-child': {
                borderBottom: 'none',
            }
        }
    },
    cells: {
        style: {
            padding: '12px 16px', // py-3 px-4 equivalent - consistent spacing
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.5',
            textAlign: 'center', // Center alignment for all content
            whiteSpace: 'normal', // Allow text wrapping
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflow: 'visible', // Remove hidden to prevent truncation
            verticalAlign: 'middle',
            borderRight: '1px solid #f3f4f6', // Subtle vertical borders
            '&:last-child': {
                borderRight: 'none', // No border on last column
            },
            // Sticky "No" column styling
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 999,
                backgroundColor: '#ffffff !important',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '60px',
                maxWidth: '60px',
            },
            // Sticky "Aksi" column styling - last column
            '&:last-of-type': {
                position: 'sticky',
                right: 0,
                zIndex: 998,
                backgroundColor: '#ffffff !important',
                borderLeft: '2px solid #e5e7eb',
                borderRight: 'none',
                boxShadow: '-1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                maxWidth: '80px',
            },
        }
    }
};

export default customTableStyles;
