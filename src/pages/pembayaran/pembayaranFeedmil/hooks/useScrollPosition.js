import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing table scroll position
 * @param {Array} filteredData - Filtered data array
 * @returns {Object} Scroll position state and handlers
 */
export const useScrollPosition = (filteredData) => {
  const [scrollPosition, setScrollPosition] = useState({ 
    canScrollLeft: false, 
    canScrollRight: false 
  });

  // Handle table scroll for visual feedback
  const handleTableScroll = useCallback((e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    setScrollPosition({
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 1
    });
  }, []);

  // Check initial scroll state when data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const tableWrapper = document.querySelector('[data-table-wrapper="true"]');
      if (tableWrapper) {
        const { scrollWidth, clientWidth } = tableWrapper;
        setScrollPosition({
          canScrollLeft: false,
          canScrollRight: scrollWidth > clientWidth
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredData]);

  return {
    scrollPosition,
    handleTableScroll
  };
};
