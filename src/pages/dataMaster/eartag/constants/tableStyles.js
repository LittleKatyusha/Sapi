
const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '18px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
            width: '100%',
            minWidth: '700px', // Reduced minimum width
            maxWidth: '100%',
            overflowX: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            tableLayout: 'fixed', // Fixed layout untuk distribusi width yang konsisten
        }
    },
    headRow: {
        style: {
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', // Subtle background
            borderRadius: '18px 18px 0 0',
            borderBottom: '1px solid #cbd5e1',
            minHeight: '56px',
            flex: '0 0 auto',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        }
    },
    headCells: {
        style: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#475569',
            padding: '12px 16px', // py-3 px-4 equivalent
            letterSpacing: '0.025em',
            background: 'transparent',
            borderRight: '1px solid #e2e8f0',
            textAlign: 'center', // Center alignment
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            whiteSpace: 'normal',
            wordBreak: 'break-words',
            '&:last-child': {
                borderRight: 'none', // No border di kolom terakhir
            }
        }
    },
    rows: {
        style: {
            minHeight: 'auto', // Dynamic row height
            borderBottom: '1px solid #f1f5f9',
            transition: 'background-color 0.15s ease',
            overflow: 'visible',
            background: '#ffffff',
            '&:hover': {
                backgroundColor: '#f8fafc',
                transform: 'none',
                boxShadow: 'none',
            },
            '&:last-child': {
                borderBottom: 'none',
            }
        }
    },
    cells: {
        style: {
            padding: '12px 16px', // py-3 px-4 equivalent  
            fontSize: '14px',
            color: '#475569',
            overflow: 'visible',
            borderRight: '1px solid #f1f5f9',
            textAlign: 'center', // Center alignment
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'normal', // Enable word wrap
            wordBreak: 'break-words', // Break long words
            lineHeight: '1.5',
            '&:last-child': {
                borderRight: 'none', // No border di kolom terakhir
            }
        }
    }
};

export default customTableStyles;
