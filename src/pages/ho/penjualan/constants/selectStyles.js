export const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '36px',
        borderRadius: '8px',
        borderColor: state.isFocused ? '#16a34a' : '#e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(22, 163, 74, 0.1)' : 'none',
        '&:hover': { borderColor: '#16a34a' }
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 8px'
    }),
    input: (base) => ({
        ...base,
        fontSize: '0.875rem',
        margin: 0,
        padding: 0
    }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        backgroundColor: state.isSelected ? '#16a34a' : state.isFocused ? '#dcfce7' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        '&:active': { backgroundColor: '#15803d' }
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }),
    placeholder: (base) => ({ ...base, color: '#9ca3af', fontSize: '0.875rem' })
};