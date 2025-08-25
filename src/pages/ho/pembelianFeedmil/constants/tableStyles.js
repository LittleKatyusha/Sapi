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
