import React from 'react';
import { Search, X, Loader2, Filter } from 'lucide-react';

/**
 * Reusable SearchBar component with filter functionality
 */
const SearchBar = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  isSearching = false,
  searchError = null,
  placeholder = "Cari berdasarkan supplier, nota, atau nota HO...",
  showFilter = true,
  filterValue = "all",
  onFilterChange = null,
  filterOptions = [{ value: "all", label: "Semua Status" }],
  disabled = false
}) => {
  return (
    <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          {isSearching && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
          )}
          
          {searchTerm && !isSearching && (
            <button
              onClick={onClearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title="Clear search"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
            className={`w-full pl-12 ${searchTerm || isSearching ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 md:py-4 border ${
              searchError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            } rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          
          {searchError && (
            <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {searchError}
            </div>
          )}
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <select
                value={filterValue}
                onChange={onFilterChange}
                disabled={disabled || !onFilterChange}
                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;