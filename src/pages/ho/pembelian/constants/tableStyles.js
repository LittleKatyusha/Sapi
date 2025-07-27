const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '18px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            tableLayout: 'auto',
        }
    },
    headRow: {
        style: {
            background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
            borderRadius: '18px 18px 0 0',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '56px',
        }
    },
    headCells: {
        style: {
            fontSize: '14px',
            fontWeight: '700',
            color: '#334155',
            paddingLeft: '16px',
            paddingRight: '16px',
            letterSpacing: '0.03em',
            background: 'transparent',
            borderRight: '1px solid #e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'unset',
            '&:first-of-type': {
                position: 'sticky',
                left: 0,
                backgroundColor: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
                zIndex: 10,
                textAlign: 'center',
                minWidth: '60px',
                maxWidth: '60px',
                borderRight: '2px solid #e2e8f0',
            }
        }
    },
    rows: {
        style: {
            minHeight: '64px',
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f8fafc',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }
        }
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            fontSize: '14px',
            color: '#475569',
            borderRight: '1px solid #f1f5f9',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            textOverflow: 'unset',
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

// Updated custom table styles with sticky columns for both "No" and "Aksi"
const updatedCustomStyles = {
    ...customTableStyles, // Start with base styles
    table: {
        ...customTableStyles.table,
        style: {
            ...customTableStyles.table.style,
            minWidth: '1200px', // Adjusted for better column layout
            width: '100%',
            tableLayout: 'fixed', // Ensure this is present
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
        }
    },
    tableWrapper: {
        style: {
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '600px', // Adjust if needed
            maxWidth: '100%',
            width: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            WebkitOverflowScrolling: 'touch',
        }
    },
    headRow: {
        style: {
            ...customTableStyles.headRow.style,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }
    },
    rows: {
        style: {
            ...customTableStyles.rows.style,
            '&:hover': {
                backgroundColor: 'rgba(243, 244, 246, 0.7)', // Tailwind's gray-100 with opacity
                transform: 'scale(1)',
                // Ensure sticky columns maintain background on hover
                '& > div:first-child, & > div:last-child': {
                    backgroundColor: 'rgba(243, 244, 246, 0.7)',
                }
            },
        }
    },
    headCells: {
        style: {
            fontSize: '13px', // Consistent with other pages
            fontWeight: 'bold',
            color: 'inherit',
            padding: '8px 12px', // Consistent padding with cells
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            // Sticky "No" column on the left
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 1002, // Higher than headRow
                backgroundColor: '#ffffff',
                borderRight: '2px solid #e2e8f0',
                boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px', // Explicit consistent padding
            },
            // Sticky "Aksi" column on the right
            '&:last-child': {
                position: 'sticky',
                right: 0, // Sticky on the right
                zIndex: 1001, // Higher than headRow
                backgroundColor: '#ffffff',
                borderLeft: '2px solid #e2e8f0', // Border on left of action column
                boxShadow: 'inset 3px 0 4px -1px rgba(0, 0, 0, 0.1)', // Shadow on left
                padding: '8px 12px', // Explicit consistent padding
            },
        },
    },
    cells: {
        style: {
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '8px 12px', // Default padding for cells
            fontSize: '12px',
            lineHeight: '1.4',
            // Sticky "No" column on the left for data
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 999,
                backgroundColor: '#fff',
                borderRight: '2px solid #e2e8f0',
                boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                padding: '8px 12px', // Explicit consistent padding
            },
            // Sticky "Aksi" column on the right for data
            '&:last-child': {
                position: 'sticky',
                right: 0, // Sticky on the right
                zIndex: 998, // Higher than background row hover
                backgroundColor: '#fff',
                borderLeft: '2px solid #e2e8f0', // Border on left of action column
                boxShadow: 'inset 3px 0 4px -1px rgba(0, 0, 0, 0.1)', // Shadow on left
                padding: '8px 12px', // Explicit consistent padding
                // Center align content vertically and horizontally
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center', // Center button horizontally too
            },
        }
    }
};

export default customTableStyles;
export { updatedCustomStyles };