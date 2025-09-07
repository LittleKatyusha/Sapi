import React from 'react';
import Select from 'react-select';

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
    ...props
}) => {
    // Custom styles for the select component
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '42px',
            borderColor: state.isFocused ? '#f97316' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(249, 115, 22, 0.2)' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#f97316' : '#9ca3af',
            },
            fontSize: '14px',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#f97316' 
                : state.isFocused 
                ? '#fed7aa' 
                : 'white',
            color: state.isSelected ? 'white' : '#374151',
            '&:hover': {
                backgroundColor: state.isSelected ? '#f97316' : '#fed7aa',
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
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
    };

    // Handle change to ensure we pass the value correctly
    const handleChange = (selectedOption) => {
        if (onChange) {
            onChange(selectedOption ? selectedOption.value : null);
        }
    };

    // Find the selected option object
    const selectedOption = options.find(option => option.value === value) || null;
    
    // Debug logging for klasifikasi OVK
    if (placeholder && placeholder.includes('Klasifikasi')) {
        console.log('🔍 SearchableSelect Debug:', {
            value,
            valueType: typeof value,
            options: options,
            selectedOption,
            found: !!selectedOption
        });
    }

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