import React from 'react';
import Select from 'react-select';

const ACCENT_COLORS = {
    orange: { main: '#f97316', light: '#fed7aa', shadow: 'rgba(249, 115, 22, 0.2)' },
    blue: { main: '#3b82f6', light: '#bfdbfe', shadow: 'rgba(59, 130, 246, 0.2)' },
    green: { main: '#10b981', light: '#a7f3d0', shadow: 'rgba(16, 185, 129, 0.2)' },
    red: { main: '#ef4444', light: '#fecaca', shadow: 'rgba(239, 68, 68, 0.2)' }
};

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    isLoading = false,
    isDisabled = false,
    isClearable = true,
    isSearchable = true,
    required = false,
    className = "",
    maxMenuHeight = 210,
    accentColor = 'orange',
    menuZIndex = 9999,
    ...props
}) => {
    const accent = ACCENT_COLORS[accentColor] || ACCENT_COLORS.orange;
    // Custom styles for the select component
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '42px',
            borderColor: state.isFocused ? accent.main : '#d1d5db',
            boxShadow: state.isFocused ? `0 0 0 2px ${accent.shadow}` : 'none',
            '&:hover': {
                borderColor: state.isFocused ? accent.main : '#9ca3af',
            },
            fontSize: '14px',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? accent.main
                : state.isFocused
                ? accent.light
                : 'white',
            color: state.isSelected ? 'white' : '#374151',
            '&:hover': {
                backgroundColor: state.isSelected ? accent.main : accent.light,
            },
            fontSize: '14px',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
            fontSize: '14px',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#374151',
            fontSize: '14px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: menuZIndex,
            maxHeight: `${maxMenuHeight}px`,
            overflow: 'hidden',
        }),
        menuList: (provided) => ({
            ...provided,
            maxHeight: `${maxMenuHeight}px`,
            overflowY: 'auto',
            paddingTop: 0,
            paddingBottom: 0,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: menuZIndex,
        }),
    };

    // Handle change to ensure we pass the value correctly
    const handleChange = (selectedOption) => {
        if (onChange) {
            // Only pass the value if an option is actually selected
            // Don't auto-select the first option when value is null/undefined
            onChange(selectedOption ? selectedOption.value : null);
        }
    };

    // Find the selected option object
    const selectedOption = options.find(option => option.value === value) || null;
    
    // Debug logging removed for production

    return (
        <div className={className}>
            <Select
                options={options}
                value={selectedOption}
                onChange={handleChange}
                placeholder={placeholder}
                isLoading={isLoading}
                isDisabled={isDisabled}
                isClearable={isClearable}
                isSearchable={isSearchable}
                styles={customStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                noOptionsMessage={() => "No options found"}
                loadingMessage={() => "Loading..."}
                {...props}
            />
            {required && !value && (
                <div className="text-red-500 text-xs mt-1">This field is required</div>
            )}
        </div>
    );
};

export default SearchableSelect;