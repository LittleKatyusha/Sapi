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
                zIndex: 11,
                textAlign: 'center',
                minWidth: '48px',
                maxWidth: '48px',
                borderRight: '2px solid #e2e8f0',
            },
            '&:nth-of-type(2)': {
                position: 'sticky',
                left: '48px',
                backgroundColor: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
                zIndex: 10,
                textAlign: 'center',
                minWidth: '60px',
                maxWidth: '60px',
                borderLeft: '2px solid #e2e8f0',
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
                zIndex: 6,
                textAlign: 'center',
                fontWeight: '600',
                borderRight: '2px solid #f1f5f9',
            },
            '&:nth-of-type(2)': {
                position: 'sticky',
                left: '48px',
                backgroundColor: '#fff',
                zIndex: 5,
                textAlign: 'center',
                fontWeight: '600',
                borderLeft: '2px solid #f1f5f9',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
        }
    }
};

// Enhanced table styles optimized for detail page with perfect UX
const detailPageTableStyles = {
    table: {
        style: {
            backgroundColor: '#ffffff',
            borderRadius: '0px',
            width: '100%',
            minWidth: '1220px', // Optimized for detail table columns (reduced after removing biaya truk)
            maxWidth: '100%',
            tableLayout: 'fixed', // Critical for consistent column widths
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
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '60px', // Increased for better text wrapping
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }
    },
    headCells: {
        style: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            padding: '16px 12px', // py-4 px-3 - optimal padding
            textAlign: 'center',
            whiteSpace: 'pre-line', // Allow line breaks in headers
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: '1.3',
            letterSpacing: '0.025em',
            borderRight: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:last-child': {
                borderRight: 'none',
            },
        }
    },
    rows: {
        style: {
            minHeight: '52px', // Increased for better content spacing
            borderBottom: '1px solid #f3f4f6',
            transition: 'background-color 0.2s ease',
            '&:hover': {
                backgroundColor: '#f9fafb',
                transform: 'none', // Disable transform for better performance
            },
            '&:last-child': {
                borderBottom: 'none',
            },
            '&:nth-of-type(even)': {
                backgroundColor: '#fafbfc', // Very subtle striping
            }
        }
    },
    cells: {
        style: {
            padding: '14px 16px', // Increased padding for better breathing room
            fontSize: '13px',
            color: '#374151',
            lineHeight: '1.5',
            textAlign: 'center',
            whiteSpace: 'normal', // Enable word wrapping
            wordWrap: 'break-word',
            wordBreak: 'break-words', // Handle very long text
            overflow: 'visible', // Prevent data truncation
            verticalAlign: 'middle',
            borderRight: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:last-child': {
                borderRight: 'none',
            },
            // Enhance hover effect for individual cells
            '&:hover': {
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
            }
        }
    },
    pagination: {
        style: {
            borderTop: '1px solid #e2e8f0',
            borderRadius: '0 0 12px 12px',
            padding: '16px 20px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end', // Align pagination to the right
            gap: '8px', // Add spacing between pagination elements
        }
    }
};

// Enhanced table styles with improved layout and structure
const enhancedTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px', // Remove border radius from table itself
            width: '100%',
            minWidth: '2000px', // Adjusted for full currency display in Total Belanja and Biaya Lain
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
            border: 'none', // Remove border as it's handled by parent container
            borderRadius: '0',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            // Ensure smooth scrolling
            scrollBehavior: 'smooth',
            // Custom scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9',
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

export default customTableStyles;
export { enhancedTableStyles, detailPageTableStyles };

// Additional utility styles for enhanced user experience
export const tableUtilityStyles = {
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
    },
    errorState: {
        padding: '40px 20px',
        textAlign: 'center',
        color: '#ef4444',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px',
    },
    emptyState: {
        padding: '60px 20px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
    }
};