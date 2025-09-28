import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing table scroll position and providing visual feedback
 */
export const useScrollPosition = (data) => {
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
  }, [data]);

  // Get scroll indicator message
  const getScrollMessage = () => {
    if (scrollPosition.canScrollLeft && scrollPosition.canScrollRight) {
      return 'Scroll kiri/kanan untuk melihat kolom lainnya';
    } else if (scrollPosition.canScrollLeft) {
      return 'Scroll kiri untuk melihat kolom sebelumnya';
    } else if (scrollPosition.canScrollRight) {
      return 'Scroll kanan untuk melihat kolom lainnya';
    } else {
      return 'Semua kolom terlihat';
    }
  };

  // Get scroll indicator styling
  const getScrollIndicatorStyle = () => {
    if (scrollPosition.canScrollLeft || scrollPosition.canScrollRight) {
      return 'text-blue-600 animate-pulse';
    } else {
      return 'text-green-600';
    }
  };

  return {
    scrollPosition,
    handleTableScroll,
    getScrollMessage,
    getScrollIndicatorStyle
  };
};
