const customTableStyles = {
    table: {
        style: {
            backgroundColor: '#fff',
            borderRadius: '0px',
            width: '100%',
            minWidth: '1500px',
            maxWidth: 'none',
            tableLayout: 'auto',
            borderCollapse: 'separate',
            borderSpacing: 0,
            margin: 0,
        }
    },
    tableWrapper: {
        style: {
            overflow: 'visible',
            width: '100%',
            maxWidth: '100%',
            border: 'none',
            borderRadius: '0',
            position: 'relative',
        }
    },
    headRow: {
        style: {
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            minHeight: '52px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }
    },
    headCells: {
        style: {
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: '#f8fafc',
            color: '#374151',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
            borderRight: '1px solid #e5e7eb',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: '1.4',
            '&:last-child': {
                borderRight: 'none',
            },
            // Sticky "No" column styling (1st column)
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 1002,
                backgroundColor: '#f8fafc',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '70px',
                maxWidth: '70px',
            },
            // Sticky "Aksi" column styling (2nd column)
            '&:nth-child(2)': {
                position: 'sticky',
                left: '70px',
                zIndex: 1001,
                backgroundColor: '#f8fafc',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '70px',
                maxWidth: '70px',
            },
        },
    },
    rows: {
        style: {
            minHeight: '60px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #f3f4f6',
            transition: 'all 0.2s ease',
            '&:hover': {
                backgroundColor: '#f9fafb',
                transition: 'background-color 0.2s ease',
            },
            '&:last-child': {
                borderBottom: 'none',
            }
        },
        stripedStyle: {
            backgroundColor: '#f9fafb',
        },
    },
    cells: {
        style: {
            fontSize: '14px',
            color: '#374151',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingTop: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f3f4f6',
            borderRight: '1px solid #f3f4f6',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            lineHeight: '1.5',
            overflow: 'visible',
            verticalAlign: 'middle',
            '&:last-child': {
                borderRight: 'none',
            },
            // Sticky "No" column styling (1st column)
            '&:first-child': {
                position: 'sticky',
                left: 0,
                zIndex: 998,
                backgroundColor: '#ffffff',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '70px',
                maxWidth: '70px',
            },
            // Sticky "Aksi" column styling (2nd column)
            '&:nth-child(2)': {
                position: 'sticky',
                left: '70px',
                zIndex: 998,
                backgroundColor: '#ffffff',
                borderRight: '2px solid #e5e7eb',
                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                willChange: 'transform',
                minWidth: '70px',
                maxWidth: '70px',
            },
        },
    },
    pagination: {
        style: {
            fontSize: '13px',
            color: '#6b7280',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '16px',
            paddingBottom: '16px',
        },
        pageButtonsStyle: {
            borderRadius: '8px',
            height: '32px',
            width: '32px',
            padding: '4px',
            margin: '0 2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: 'transparent',
            border: '1px solid #e5e7eb',
            color: '#6b7280',
            '&:hover': {
                backgroundColor: '#f3f4f6',
                color: '#374151',
            },
            '&:focus': {
                outline: 'none',
                boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
            },
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            padding: '48px 24px',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            color: '#ef4444',
            fontSize: '14px',
            fontWeight: '500',
            padding: '48px 24px',
        },
    },
};

export default customTableStyles;
