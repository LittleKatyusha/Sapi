const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '18px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }
    },
    headRow: {
        style: {
            background: 'linear-gradient(90deg, #f8fafc 0%, #e0e7ff 100%)',
            borderRadius: '18px 18px 0 0',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '62px',
            flex: '0 0 auto',
        }
    },
    headCells: {
        style: {
            fontSize: '14px',
            fontWeight: '700',
            color: '#334155',
            paddingLeft: '12px',
            letterSpacing: '0.03em',
            background: 'transparent',
            borderRight: '1px solid #e2e8f0',
            overflow: 'visible',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            '&:first-of-type': {
                position: 'sticky',
                left: 0,
                backgroundColor: '#f8fafc',
                zIndex: 10,
                borderRight: '2px solid #e2e8f0',
                minWidth: '60px',
                maxWidth: '60px',
                textAlign: 'center'
            }
        }
    },
    rows: {
        style: {
            minHeight: '68px',
            borderBottom: '1px solid #f1f5f9',
            transition: 'all 0.18s cubic-bezier(.4,2,.3,1)',
            overflow: 'visible',
            background: 'linear-gradient(90deg, #fff 0%, #f8fafc 100%)',
            flex: '1 0 auto',
            '&.active-row, &.active-row:hover': {
                backgroundColor: '#e0e7ff',
            },
            '&:hover': {
                backgroundColor: 'inherit',
                transform: 'none',
                boxShadow: 'none',
            }
        }
    },
    cells: {
        style: {
            paddingLeft: '12px',
            fontSize: '14px',
            color: '#475569',
            overflow: 'visible',
            borderRight: '1px solid #f1f5f9',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
        }
    }
};

export default customTableStyles;