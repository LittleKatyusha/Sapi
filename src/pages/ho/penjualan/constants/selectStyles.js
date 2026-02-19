export const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '48px',
        borderRadius: '12px',
        borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
        boxShadow: state.isFocused ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : 'none',
        '&:hover': { borderColor: '#10b981' }
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#d1fae5' : 'white',
        color: state.isSelected ? 'white' : '#374151',
        '&:active': { backgroundColor: '#059669' }
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
    }),
    placeholder: (base) => ({ ...base, color: '#9ca3af' })
};