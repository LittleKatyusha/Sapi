const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '18px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
            minWidth: '900px',
            width: '100%',
            overflowX: 'visible',
        }
    },
    headRow: {
        style: {
            background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
            borderRadius: '18px 18px 0 0',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '62px',
        }
    },
    headCells: {
        style: {
            fontSize: '15px',
            fontWeight: '700',
            color: '#334155',
            paddingLeft: '18px',
            paddingRight: '18px',
            minWidth: '180px',
            width: 'auto',
            letterSpacing: '0.03em',
            background: 'transparent',
            borderRight: '1px solid #e2e8f0',
            overflow: 'visible',
        }
    },
    rows: {
        style: {
            minHeight: '68px',
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.18s cubic-bezier(.4,2,.3,1)',
            overflow: 'visible',
            background: 'linear-gradient(90deg, #fff 0%, #f8fafc 100%)',
            '&.active-row, &.active-row:hover': {
                backgroundColor: '#e0e7ff',
            },
            '&:hover': {
                backgroundColor: '#f8fafc',
                transform: 'scale(1.01)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }
        }
    },
    cells: {
        style: {
            paddingLeft: '18px',
            paddingRight: '18px',
            fontSize: '15px',
            minWidth: '60px',
            width: 'auto',
            color: '#475569',
            overflow: 'visible',
            borderRight: '1px solid #f1f5f9',
        }
    }
};

export default customTableStyles;