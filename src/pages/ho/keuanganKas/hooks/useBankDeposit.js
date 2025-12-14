import { useState, useCallback } from 'react';
import BankDepositService from '../../../../services/bankDepositService';

const useBankDeposit = () => {
    const [bankDeposits, setBankDeposits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalRecords: 0,
        totalPages: 0,
        from: 0,
        to: 0
    });

    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null
    });

    const fetchBankDeposits = useCallback(async (
        page = 1,
        perPage = 10,
        search = '',
        startDate = null,
        endDate = null,
        forceRefresh = false
    ) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await BankDepositService.getBankDeposits({
                page,
                perPage,
                search,
                startDate,
                endDate
            });

            if (response.success) {
                const transformedData = (response.data || []).map(item => 
                    BankDepositService.transformData(item)
                );
                
                setBankDeposits(transformedData);
                
                const totalRecords = response.recordsFiltered || 0;
                const totalPages = Math.ceil(totalRecords / perPage);
                
                setServerPagination({
                    currentPage: page,
                    perPage,
                    totalRecords,
                    totalPages,
                    from: totalRecords > 0 ? (page - 1) * perPage + 1 : 0,
                    to: Math.min(page * perPage, totalRecords)
                });
            }
        } catch (err) {
            console.error('Error fetching bank deposits:', err);
            setError(err.message || 'Gagal memuat data setoran bank');
            setBankDeposits([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = useCallback(async (term) => {
        setSearchTerm(term);
        setIsSearching(true);
        setSearchError(null);
        
        try {
            await fetchBankDeposits(
                1,
                serverPagination.perPage,
                term,
                dateFilter.startDate,
                dateFilter.endDate
            );
        } catch (err) {
            setSearchError(err.message);
        } finally {
            setIsSearching(false);
        }
    }, [fetchBankDeposits, serverPagination.perPage, dateFilter]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSearchError(null);
        fetchBankDeposits(
            1,
            serverPagination.perPage,
            '',
            dateFilter.startDate,
            dateFilter.endDate
        );
    }, [fetchBankDeposits, serverPagination.perPage, dateFilter]);

    const handlePageChange = useCallback((page) => {
        fetchBankDeposits(
            page,
            serverPagination.perPage,
            searchTerm,
            dateFilter.startDate,
            dateFilter.endDate
        );
    }, [fetchBankDeposits, serverPagination.perPage, searchTerm, dateFilter]);

    const handlePerPageChange = useCallback((perPage) => {
        fetchBankDeposits(
            1,
            perPage,
            searchTerm,
            dateFilter.startDate,
            dateFilter.endDate
        );
    }, [fetchBankDeposits, searchTerm, dateFilter]);

    const handleDateFilterChange = useCallback((startDate, endDate) => {
        setDateFilter({ startDate, endDate });
        fetchBankDeposits(
            1,
            serverPagination.perPage,
            searchTerm,
            startDate,
            endDate
        );
    }, [fetchBankDeposits, serverPagination.perPage, searchTerm]);

    const createBankDeposit = useCallback(async (data) => {
        try {
            const formData = BankDepositService.createFormData(data);
            const response = await BankDepositService.createBankDeposit(formData);
            return response;
        } catch (err) {
            console.error('Error creating bank deposit:', err);
            throw err;
        }
    }, []);

    const updateBankDeposit = useCallback(async (pid, data) => {
        try {
            const formData = BankDepositService.createFormData(data);
            const response = await BankDepositService.updateBankDeposit(pid, formData);
            return response;
        } catch (err) {
            console.error('Error updating bank deposit:', err);
            throw err;
        }
    }, []);

    const deleteBankDeposit = useCallback(async (pid) => {
        try {
            const response = await BankDepositService.deleteBankDeposit(pid);
            return response;
        } catch (err) {
            console.error('Error deleting bank deposit:', err);
            throw err;
        }
    }, []);

    const getBankDepositDetail = useCallback(async (pid) => {
        try {
            const response = await BankDepositService.getBankDepositDetail(pid);
            return response;
        } catch (err) {
            console.error('Error fetching bank deposit detail:', err);
            throw err;
        }
    }, []);

    const refreshData = useCallback(() => {
        fetchBankDeposits(
            serverPagination.currentPage,
            serverPagination.perPage,
            searchTerm,
            dateFilter.startDate,
            dateFilter.endDate,
            true
        );
    }, [fetchBankDeposits, serverPagination, searchTerm, dateFilter]);

    return {
        bankDeposits,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        dateFilter,
        fetchBankDeposits,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        handleDateFilterChange,
        createBankDeposit,
        updateBankDeposit,
        deleteBankDeposit,
        getBankDepositDetail,
        refreshData
    };
};

export default useBankDeposit;
