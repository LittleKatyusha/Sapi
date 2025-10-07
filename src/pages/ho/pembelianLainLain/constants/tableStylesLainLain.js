// Enhanced table styles optimized for PembelianLainLain with perfect UX
const enhancedLainLainTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px', // Remove border radius from table itself
            width: '100%',
            minWidth: '1440px', // Optimized for Lain-Lain detail table columns (10 columns)
            maxWidth: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0,
            margin: 0,
        }
    },
    tableWrapper: {
        style: {
            overflowX: 'auto',
            overflowY: 'visible',
            width: '100%',
            maxWidth: '100%',
            border: 'none', // Remove border, handled by parent
            borderRadius: '0',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            scrollBehavior: 'smooth',
            // Enhanced scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
            '&::-webkit-scrollbar': {
                height: '8px',
            },
            '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#cbd5e1',
                borderRadius: '4px',
                '&:hover': {
                    backgroundColor: '#94a3b8',
                },
            },
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
            padding: '16px 12px', // py-4 px-3 equivalent - optimal padding
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
            // Sticky "Aksi" column styling - now second column (nth-child(2))
            '&:nth-child(2)': {
                position: 'sticky',
                left: '60px', // Position after the No column width
                zIndex: 1001,
                backgroundColor: '#f8fafc',
                borderLeft: '2px solid #e5e7eb',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
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
            padding: '12px', // py-3 px-3 equivalent - consistent spacing
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
            // Sticky "Aksi" column styling - now second column (nth-child(2))
            '&:nth-child(2)': {
                position: 'sticky',
                left: '60px', // Position after the No column width
                zIndex: 998,
                backgroundColor: '#ffffff !important',
                borderLeft: '2px solid #e5e7eb',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '80px',
                maxWidth: '80px',
            },
        }
    },
    pagination: {
        style: {
            display: 'none', // Hide default pagination since we use custom one
        }
    }
};

const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            tableLayout: 'auto',
            minWidth: 0,
        }
    },
    headRow: {
        style: {
            background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
            borderRadius: '12px 12px 0 0',
            borderBottom: '1px solid #e2e8f0',
            minHeight: '36px',
        }
    },
    headCells: {
        style: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#334155',
            paddingLeft: '8px',
            paddingRight: '8px',
            letterSpacing: '0.01em',
            background: 'transparent',
            borderRight: '1px solid #e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:first-of-type': {
                position: 'sticky',
                left: 0,
                backgroundColor: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
                zIndex: 10,
                textAlign: 'center',
                minWidth: '48px',
                maxWidth: '48px',
                borderRight: '2px solid #e2e8f0',
            }
        }
    },
    rows: {
        style: {
            minHeight: '32px',
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f8fafc',
            }
        }
    },
    cells: {
        style: {
            paddingLeft: '8px',
            paddingRight: '8px',
            fontSize: '12px',
            color: '#475569',
            borderRight: '1px solid #f1f5f9',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:first-of-type': {
                position: 'sticky',
                left: 0,
                backgroundColor: '#fff',
                zIndex: 5,
                textAlign: 'center',
                fontWeight: '600',
                borderRight: '2px solid #f1f5f9',
            }
        }
    },
    pagination: {
        style: {
            borderTop: '1px solid #e2e8f0',
            borderRadius: '0 0 18px 18px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
        }
    }
};

export default customTableStyles;
export { enhancedLainLainTableStyles };
