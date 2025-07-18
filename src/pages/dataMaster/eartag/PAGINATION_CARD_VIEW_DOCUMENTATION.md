# Dokumentasi Pagination Card View - EartagPage

## 📋 Overview

Fitur pagination card view telah berhasil diimplementasikan pada halaman Eartag untuk memberikan pengalaman pengguna yang lebih baik dalam mengelola data eartag dalam format card view yang responsif dan mudah digunakan.

## 🎯 Fitur yang Diimplementasikan

### 1. **Pagination Controls**
- **Navigasi halaman**: Previous, Next, First, Last
- **Nomor halaman**: Tampilan page numbers dengan smart pagination
- **Pilihan items per page**: 6, 12, 18, 24 cards per halaman
- **Informasi data**: "Menampilkan X - Y dari Z entries"

### 2. **Grid Layout Responsif**
- **Mobile (sm)**: 1 kolom
- **Tablet (md)**: 2 kolom
- **Desktop (lg)**: 3 kolom
- **Large Desktop (xl)**: 4 kolom

### 3. **Loading States**
- **Skeleton loading**: Animated placeholder cards saat data dimuat
- **Error handling**: Tampilan error yang informatif
- **Empty state**: Pesan yang jelas saat tidak ada data

## 🔧 Komponen yang Dibuat

### 1. **PaginationControls.jsx**
```jsx
// Path: dashboard-sapi/src/pages/dataMaster/eartag/components/PaginationControls.jsx
```

**Props:**
- `currentPage`: Halaman saat ini
- `totalPages`: Total jumlah halaman
- `itemsPerPage`: Jumlah item per halaman
- `totalItems`: Total jumlah data
- `onPageChange`: Callback untuk perubahan halaman
- `onItemsPerPageChange`: Callback untuk perubahan jumlah item per halaman
- `itemsPerPageOptions`: Array pilihan items per page (default: [6, 12, 18, 24])
- `loading`: Status loading

### 2. **CardView.jsx (Modified)**
```jsx
// Path: dashboard-sapi/src/pages/dataMaster/eartag/components/CardView.jsx
```

**Props Baru:**
- `loading`: Status loading
- `error`: Error message
- `currentPage`: Halaman saat ini
- `itemsPerPage`: Jumlah item per halaman
- `onPageChange`: Handler perubahan halaman
- `onItemsPerPageChange`: Handler perubahan items per page
- `itemsPerPageOptions`: Pilihan items per page

## 📱 Responsive Design

### Breakpoints:
- **Mobile**: `grid-cols-1` (1 kolom)
- **Tablet**: `md:grid-cols-2` (2 kolom)
- **Desktop**: `lg:grid-cols-3` (3 kolom)
- **Large Desktop**: `xl:grid-cols-4` (4 kolom)

## 🚀 State Management

### States yang Ditambahkan di EartagPage:
```javascript
const [cardCurrentPage, setCardCurrentPage] = useState(1);
const [cardItemsPerPage, setCardItemsPerPage] = useState(12);
```

### Handlers:
```javascript
const handleCardPageChange = useCallback((page) => {
    setCardCurrentPage(page);
}, []);

const handleCardItemsPerPageChange = useCallback((itemsPerPage) => {
    setCardItemsPerPage(itemsPerPage);
    setCardCurrentPage(1); // Reset ke halaman pertama
}, []);

const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    if (mode === 'card') {
        setCardCurrentPage(1); // Reset saat switch ke card view
    }
}, []);
```

## 🔄 Fitur Pagination

### 1. **Smart Page Numbers**
- Menampilkan maksimal 5 nomor halaman
- Automatic adjustment untuk halaman awal/akhir
- Ellipsis untuk halaman yang tersembunyi

### 2. **Items Per Page**
- Pilihan: 6, 12, 18, 24 cards
- Default: 12 cards
- Auto reset ke halaman 1 saat mengubah items per page

### 3. **Navigation Controls**
- **First Page**: Jump ke halaman pertama
- **Previous**: Halaman sebelumnya
- **Next**: Halaman selanjutnya
- **Last Page**: Jump ke halaman terakhir

## 🎨 UI/UX Features

### 1. **Loading States**
- Skeleton loading dengan animasi pulse
- Disabled controls saat loading
- Consistent loading experience

### 2. **Error Handling**
- Clear error messages
- Graceful fallback states
- User-friendly error display

### 3. **Empty States**
- Informative empty state message
- Consistent with overall design system

## 📊 Performance Benefits

### 1. **Optimized Rendering**
- Hanya render cards yang visible di halaman saat ini
- Reduced DOM elements
- Better performance untuk dataset besar

### 2. **Memory Management**
- Efficient data slicing
- Minimal memory footprint
- Smooth pagination transitions

## 🔧 Testing Scenarios

### 1. **Functionality Testing**
- [x] Pagination navigation works correctly
- [x] Items per page selection works
- [x] Data display is accurate
- [x] Loading states work properly
- [x] Error handling works
- [x] Responsive design works across devices

### 2. **Edge Cases**
- [x] Empty data handling
- [x] Single page data
- [x] Large dataset handling
- [x] Network error scenarios

## 🚀 Usage Examples

### Basic Usage:
```jsx
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

## 📋 Konsistensi dengan Table View

### Fitur yang Konsisten:
- Pagination pattern yang sama dengan DataTable
- Items per page options yang konsisten
- Loading states yang seragam
- Error handling yang sama

## 🎯 Benefits

1. **User Experience**: Navigasi yang lebih baik untuk data besar
2. **Performance**: Rendering yang lebih efficient
3. **Flexibility**: User dapat memilih jumlah cards yang ingin dilihat
4. **Consistency**: Pagination yang konsisten dengan table view
5. **Responsive**: Mobile-friendly design

## 📝 Maintenance Notes

- Pagination state terpisah untuk table dan card view
- Auto reset pagination saat switch view mode
- Consistent error handling across components
- Reusable PaginationControls component