import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PenjualanService from '../../../../services/penjualanService';

const DEFAULT_PER_PAGE = 10;
const SEARCH_DEBOUNCE_DELAY = 300;

// Map tab names to id_jenis_penjualan: 1 = Feedmil (Bahan Baku), 2 = OVK
const TAB_TO_JENIS = {
    'bahan-baku': 1,
    'ovk': 2
};

const usePenjualan = (activeTab = 'bahan-baku') => {
    const idJenisPenjualan = useMemo(() => TAB_TO_JENIS[activeTab] || 1, [activeTab]);
    const [penjualan, setPenjualan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [cardData, setCardData] = useState(null);

    // Pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: DEFAULT_PER_PAGE,
        totalRows: 0,
        totalPages: 0
    });

    // Refs for cleanup and optimization
    const searchTimeoutRef = useRef(null);
    const currentStateRef = useRef({
        searchTerm: '',
        serverPagination: { currentPage: 1, perPage: DEFAULT_PER_PAGE, totalRows: 0, totalPages: 0 }
    });

    // Fetch penjualan data from API
    const fetchPenjualan = useCallback(async (
        page = null,
        perPage = null,
        search = null,
        isSearchRequest = false
    ) => {
        setLoading(true);
        setError(null);
        setSearchError(null);

        if (isSearchRequest) {
            setIsSearching(true);
        }

        try {
            const currentPage = page || currentStateRef.current.serverPagination.currentPage;
            const currentPerPage = perPage || currentStateRef.current.serverPagination.perPage;
            const currentSearch = search !== null ? search : currentStateRef.current.searchTerm;

            const start = (currentPage - 1) * currentPerPage;

            const result = await PenjualanService.getData(idJenisPenjualan, {
                start,
                length: currentPerPage,
                search: currentSearch,
                draw: currentPage
            });

            const dataArray = result.data || [];
            const totalRecords = result.recordsTotal || 0;
            const filteredRecords = result.recordsFiltered || totalRecords;

            setPenjualan(dataArray);

            setServerPagination({
                currentPage: currentPage,
                perPage: currentPerPage,
                totalRows: filteredRecords,
                totalPages: Math.ceil(filteredRecords / currentPerPage)
            });

        } catch (err) {
            const errorMessage = err.message || 'Terjadi kesalahan saat mengambil data penjualan';

            if (isSearchRequest) {
                setSearchError(errorMessage);
            } else {
                setError(errorMessage);
            }

            setPenjualan([]);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [idJenisPenjualan]);

    // Fetch summary/card data from API
    const fetchSummary = useCallback(async () => {
        try {
            const result = await PenjualanService.getSummary(idJenisPenjualan);
            setCardData(result.data || null);
        } catch (err) {
            console.error('Error fetching summary data:', err);
            // Don't block the main UI if summary fails
        }
    }, [idJenisPenjualan]);

    // Initial data fetch when tab changes
    useEffect(() => {
        fetchPenjualan(1);
        fetchSummary();
    }, [idJenisPenjualan, fetchPenjualan, fetchSummary]);

    // Update refs when state changes
    useEffect(() => {
        currentStateRef.current.searchTerm = searchTerm;
    }, [searchTerm]);

    useEffect(() => {
        currentStateRef.current.serverPagination = serverPagination;
    }, [serverPagination]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Handle search with debouncing
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
        setSearchError(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!term.trim()) {
            fetchPenjualan(1, null, '', false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchPenjualan(1, null, term, true);
        }, SEARCH_DEBOUNCE_DELAY);
    }, [fetchPenjualan]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        fetchPenjualan(1, null, '', false);
    }, [fetchPenjualan]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        fetchPenjualan(page, null, null, false);
    }, [fetchPenjualan]);

    // Handle per page change
    const handlePerPageChange = useCallback((newPerPage) => {
        fetchPenjualan(1, newPerPage, null, false);
    }, [fetchPenjualan]);

    return {
        // Data
        penjualan,
        cardData,

        // Loading states
        loading,
        error,

        // Search
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        handleSearch,
        clearSearch,

        // Pagination
        serverPagination,
        handlePageChange,
        handlePerPageChange
    };
};

export default usePenjualan;