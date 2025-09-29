import { useState, useCallback, useEffect } from 'react';

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

    // Get scroll message
    const getScrollMessage = useCallback(() => {
        if (scrollPosition.canScrollLeft && scrollPosition.canScrollRight) {
            return 'Geser untuk melihat kolom lainnya';
        } else if (scrollPosition.canScrollLeft) {
            return 'Geser kiri untuk melihat kolom sebelumnya';
        } else if (scrollPosition.canScrollRight) {
            return 'Geser kanan untuk melihat kolom lainnya';
        } else {
            return 'Semua kolom terlihat';
        }
    }, [scrollPosition]);

    // Get scroll indicator style
    const getScrollIndicatorStyle = useCallback(() => {
        if (scrollPosition.canScrollLeft || scrollPosition.canScrollRight) {
            return 'text-blue-600 animate-pulse';
        }
        return 'text-green-600';
    }, [scrollPosition]);

    return {
        scrollPosition,
        handleTableScroll,
        getScrollMessage,
        getScrollIndicatorStyle
    };
};

export default useScrollPosition;