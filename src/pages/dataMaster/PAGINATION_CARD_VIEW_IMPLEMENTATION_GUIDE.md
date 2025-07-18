# Pagination Card View Implementation Guide

## 📋 **Template untuk Implementasi Pagination Card View di Halaman Lain**

Dokumentasi ini menyediakan template dan langkah-langkah yang dapat ditiru untuk mengimplementasikan pagination card view di halaman master data lainnya.

## 🎯 **Contoh Prompt untuk AI Assistant**

```
Saya ingin mengimplementasikan pagination card view untuk halaman [NAMA_HALAMAN] dengan fitur:
1. Grid responsif (1-4 kolom tergantung device)
2. Pagination controls dengan pilihan items per page (6, 12, 18, 24)
3. Loading states dan error handling
4. Kompatibilitas dengan backend DataTables atau REST API biasa

Struktur halaman saya:
- Main Page: src/pages/dataMaster/[NAMA_HALAMAN]Page.jsx
- Hook API: src/pages/dataMaster/[namaHalaman]/hooks/use[NamaHalaman].js
- CardView: src/pages/dataMaster/[namaHalaman]/components/CardView.jsx

Backend API format:
- URL: https://domain.com/api/master/[namahalaman]/data
- Response: [TEMPEL_CONTOH_RESPONSE_JSON]

Tolong implementasikan dengan mengikuti pola yang sama dengan halaman eartag dan supplier.
```

## 🏗️ **Langkah-langkah Implementasi**

### **Step 1: Buat PaginationControls Component**

```jsx
// src/pages/dataMaster/[namaHalaman]/components/PaginationControls.jsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PaginationControls = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [6, 12, 18, 24],
    loading = false
}) => {
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const halfRange = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = Math.min(totalPages, currentPage + halfRange);

        // Adjust if we're at the beginning or end
        if (endPage - startPage < maxPagesToShow - 1) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            } else {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
            onPageChange(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        if (newItemsPerPage !== itemsPerPage && !loading) {
            onItemsPerPageChange(newItemsPerPage);
        }
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Tampilkan</span>
                <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    disabled={loading}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {itemsPerPageOptions.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span>cards per halaman</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
                Menampilkan {startItem} - {endItem} dari {totalItems} entries
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman pertama"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {pageNumbers.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                page === currentPage
                                    ? 'bg-red-500 text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next page */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman selanjutnya"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman terakhir"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
```

### **Step 2: Modifikasi CardView untuk Pagination**

```jsx
// src/pages/dataMaster/[namaHalaman]/components/CardView.jsx
import React, { useMemo } from 'react';
import { Building2 } from 'lucide-react'; // Sesuaikan icon
import CardActionButton from './CardActionButton';
import PaginationControls from './PaginationControls';

const CardView = ({ 
    data, 
    onEdit, 
    onDelete, 
    onDetail, 
    openMenuId, 
    setOpenMenuId,
    loading = false,
    error = null,
    // Pagination props
    currentPage = 1,
    itemsPerPage = 12,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [6, 12, 18, 24]
}) => {
    // Calculate pagination
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = data.slice(startIndex, endIndex);

    // Loading component
    const LoadingGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: itemsPerPage }, (_, index) => (
                <div key={index} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl mr-3 sm:mr-4"></div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-16 bg-gray-200 rounded-2xl"></div>
                        <div className="flex items-center justify-start pt-3 border-t border-gray-100">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Error component
    const ErrorDisplay = () => (
        <div className="text-center py-12">
            <div className="text-red-600">
                <p className="text-lg font-semibold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
    );

    // Empty state component
    const EmptyState = () => (
        <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data ditemukan</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            <div className="min-h-[400px]">
                {loading ? (
                    <LoadingGrid />
                ) : error ? (
                    <ErrorDisplay />
                ) : currentPageData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {currentPageData.map(item => (
                            <div key={item.pubid} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-base sm:text-xl mb-1">{item.name}</p>
                                                <div className="flex items-center text-gray-500">
                                                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    <span className="text-xs sm:text-sm">Data Master</span>
                                                </div>
                                            </div>
                                        </div>
                                        <CardActionButton 
                                            item={item}
                                            openMenuId={openMenuId}
                                            setOpenMenuId={setOpenMenuId}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onDetail={onDetail}
                                        />
                                    </div>
                                    
                                    {/* Content area - sesuaikan dengan data halaman */}
                                    <div className="space-y-4">
                                        {item.description && (
                                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center justify-start pt-3 sm:pt-4 border-t border-gray-100">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.status === 1
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.status === 1 ? 'Aktif' : 'Tidak Aktif'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && !error && totalItems > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                    itemsPerPageOptions={itemsPerPageOptions}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default CardView;
```

### **Step 3: Update Hook API untuk Pagination**

```js
// src/pages/dataMaster/[namaHalaman]/hooks/use[NamaHalaman].js

// Tambahkan state untuk server pagination
const [serverPagination, setServerPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 100 // Default fetch all data
});

// Modifikasi fetchData function
const fetchData = useCallback(async (page = 1, perPage = 100) => {
    setLoading(true);
    setError(null);
    
    try {
        const authHeader = getAuthHeader();
        if (!authHeader.Authorization) {
            throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
        }
        
        // Pilih salah satu format berdasarkan backend:
        
        // OPSI A: Jika backend menggunakan DataTables
        const start = (page - 1) * perPage;
        const url = new URL(`${API_BASE}/data`);
        url.searchParams.append('start', start.toString());
        url.searchParams.append('length', perPage.toString());
        url.searchParams.append('draw', '1');
        url.searchParams.append('search[value]', '');
        url.searchParams.append('order[0][column]', '0');
        url.searchParams.append('order[0][dir]', 'asc');
        
        // OPSI B: Jika backend menggunakan REST API biasa
        // const url = new URL(`${API_BASE}/data`);
        // url.searchParams.append('page', page.toString());
        // url.searchParams.append('per_page', perPage.toString());
        // url.searchParams.append('limit', perPage.toString());
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        let dataArray = [];
        let paginationMeta = {};
        
        // Handle response format berdasarkan backend:
        
        // OPSI A: DataTables format
        if (result.draw && result.data && Array.isArray(result.data)) {
            dataArray = result.data;
            paginationMeta = {
                total: result.recordsTotal,
                filtered: result.recordsFiltered,
                current_page: page,
                per_page: perPage,
                last_page: Math.ceil(result.recordsTotal / perPage)
            };
        } 
        // OPSI B: REST API format
        else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
            dataArray = result.data;
        }
        // OPSI C: Laravel pagination format
        else if (result.data && result.data.data && Array.isArray(result.data.data)) {
            dataArray = result.data.data;
            paginationMeta = {
                total: result.data.total,
                current_page: result.data.current_page,
                per_page: result.data.per_page,
                last_page: result.data.last_page
            };
        }
        
        // Update server pagination state
        if (Object.keys(paginationMeta).length > 0) {
            setServerPagination({
                currentPage: paginationMeta.current_page || page,
                totalPages: paginationMeta.last_page || Math.ceil((paginationMeta.total || dataArray.length) / perPage),
                totalItems: paginationMeta.total || dataArray.length,
                perPage: paginationMeta.per_page || perPage
            });
        }
        
        // Process dan set data
        if (dataArray.length >= 0) {
            const validatedData = dataArray.map((item, index) => ({
                pubid: item.pubid || `TEMP-${index + 1}`,
                name: item.name || 'Nama tidak tersedia',
                description: item.description || '',
                status: item.status !== undefined ? item.status : 1,
                // Tambahkan field lain sesuai kebutuhan
            }));
            
            setData(validatedData);
            setError(null);
        }
    } catch (err) {
        setError(`API Error: ${err.message}`);
        // Set fallback data jika diperlukan
    } finally {
        setLoading(false);
    }
}, [getAuthHeader]);

// Tambahkan serverPagination ke return
return {
    // ... existing returns
    serverPagination,
    fetchData
};
```

### **Step 4: Update Main Page untuk Pagination**

```jsx
// src/pages/dataMaster/[NamaHalaman]Page.jsx

// Tambahkan state untuk pagination card view
const [cardCurrentPage, setCardCurrentPage] = useState(1);
const [cardItemsPerPage, setCardItemsPerPage] = useState(12);

// Handler untuk pagination card view
const handleCardPageChange = useCallback((page) => {
    setCardCurrentPage(page);
}, []);

const handleCardItemsPerPageChange = useCallback((itemsPerPage) => {
    setCardItemsPerPage(itemsPerPage);
    setCardCurrentPage(1); // Reset ke halaman pertama
}, []);

// Handler untuk view mode change
const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    if (mode === 'card') {
        setCardCurrentPage(1); // Reset ke halaman pertama
    }
}, []);

// Fetch data dengan parameter pagination
useEffect(() => {
    // Pilih salah satu berdasarkan backend:
    fetchData(1, 100); // Untuk backend DataTables atau REST API
    // fetchData(); // Untuk backend yang tidak perlu parameter
}, [fetchData]);

// Update CardView component di render
<CardView
    data={filteredData}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onDetail={handleDetail}
    openMenuId={openMenuId}
    setOpenMenuId={setOpenMenuId}
    loading={loading}
    error={error}
    currentPage={cardCurrentPage}
    itemsPerPage={cardItemsPerPage}
    onPageChange={handleCardPageChange}
    onItemsPerPageChange={handleCardItemsPerPageChange}
    itemsPerPageOptions={[6, 12, 18, 24]}
/>
```

## 🔧 **Konfigurasi Berdasarkan Backend**

### **A. Jika Backend Menggunakan DataTables (seperti Eartag)**

```js
// Request parameters
url.searchParams.append('start', start.toString());
url.searchParams.append('length', perPage.toString());
url.searchParams.append('draw', '1');

// Response format
{
    "draw": 1,
    "recordsTotal": 100,
    "recordsFiltered": 100,
    "data": [...]
}
```

### **B. Jika Backend Menggunakan REST API Biasa**

```js
// Request parameters
url.searchParams.append('page', page.toString());
url.searchParams.append('per_page', perPage.toString());

// Response format
{
    "status": "ok",
    "data": [...],
    "message": "ok"
}
```

### **C. Jika Backend Menggunakan Laravel Pagination**

```js
// Request parameters
url.searchParams.append('page', page.toString());
url.searchParams.append('per_page', perPage.toString());

// Response format
{
    "data": {
        "data": [...],
        "current_page": 1,
        "total": 100,
        "per_page": 15,
        "last_page": 7
    }
}
```

## 📋 **Checklist Implementasi**

- [ ] Buat PaginationControls component
- [ ] Modifikasi CardView dengan pagination dan grid responsif
- [ ] Update hook API untuk mendukung pagination
- [ ] Tambahkan state pagination di main page
- [ ] Implementasi handlers untuk pagination
- [ ] Test dengan berbagai ukuran data
- [ ] Verifikasi responsive design di berbagai device
- [ ] Test loading states dan error handling

## 🎯 **Hasil yang Diharapkan**

1. **Grid Responsif**: 1-4 kolom tergantung device
2. **Pagination Fleksibel**: User dapat pilih 6, 12, 18, 24 items per page
3. **Navigation Lengkap**: First, Previous, Next, Last buttons
4. **Loading States**: Skeleton loading yang smooth
5. **Error Handling**: User-friendly error messages
6. **Performance**: Efficient rendering dan memory usage

## 🚀 **Tips Penggunaan**

1. **Sesuaikan icon dan warna** di CardView dengan tema halaman
2. **Customisasi field data** sesuai dengan struktur data backend
3. **Adjust itemsPerPageOptions** sesuai kebutuhan (default: [6, 12, 18, 24])
4. **Test dengan data dummy** terlebih dahulu sebelum koneksi ke backend
5. **Monitor performance** dengan dataset yang besar

Dengan mengikuti template ini, Anda dapat dengan mudah mengimplementasikan pagination card view yang konsisten di semua halaman master data.