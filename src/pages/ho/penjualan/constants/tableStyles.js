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
            background: 'linear-gradient(90deg, #f8fafc 0%, #d1fae5 100%)',
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
                backgroundColor: 'linear-gradient(90deg, #f8fafc 0%, #d1fae5 100%)',
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

export default customTableStyles;