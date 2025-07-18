# Dokumentasi Implementasi Pagination Card View - PelangganPage

## 📋 Overview

Halaman pelanggan telah berhasil diimplementasikan dengan fitur pagination card view yang responsif dan modern. Implementasi ini menggunakan API outlet dengan kategori = 2 untuk mengelola data pelanggan.

## 🎯 Fitur yang Diimplementasikan

### 1. **Backend Integration**
- **API Endpoint**: `https://puput-api.ternasys.com/api/master/outlet`
- **Kategori Filter**: `kategori = 2` untuk data pelanggan
- **Status Mapping**: 
  - `1` = Pelanggan Aktif
  - `0` = Pelanggan Tidak Aktif
- **DataTables Format**: Server-side pagination dengan format DataTables

### 2. **Pagination Card View**
- **Grid Responsif**: 1-4 kolom sesuai ukuran layar
- **Items per Page**: 6, 12, 18, 24 cards per halaman
- **Navigation**: Previous, Next, First, Last dengan page numbers
- **Loading States**: Skeleton loading animation
- **Empty States**: Pesan informatif saat tidak ada data

### 3. **Dual View Mode**
- **Card View**: Grid responsif dengan pagination
- **Table View**: Sticky columns dengan horizontal scroll
- **Toggle**: Seamless switching antara view modes

## 🔧 Struktur Komponen

### 1. **Hook: usePelanggan.js**
```javascript
// API Integration dengan kategori = 2
url.searchParams.append('kategori', '2'); // Filter pelanggan

// Field Mapping Backend -> Frontend
{
    name: item.nama,
    address: item.alamat,
    phone: item.kontak,
    email: item.email,
    status: item.status, // 1=aktif, 0=tidak aktif
}
```

### 2. **Components Created**
- `PaginationControls.jsx` - Reusable pagination component
- `StatusBadge.jsx` - Status display component
- `ActionButton.jsx` - Dropdown menu untuk aksi
- `CardView.jsx` - Main card view dengan pagination
- `AddEditPelangganModal.jsx` - Form modal (simplified)
- `PelangganDetailModal.jsx` - Detail view modal

### 3. **Table Integration**
- **Sticky Columns**: No. (left) dan Aksi (right)
- **Horizontal Scroll**: Min-width 950px
- **Text Overflow Prevention**: Line clamp dan max-width
- **Responsive Design**: Optimal di semua device

## 📱 Responsive Design

### Card View Breakpoints:
- **Mobile (default)**: 1 kolom
- **Tablet (md)**: 2 kolom  
- **Desktop (lg)**: 3 kolom
- **Large Desktop (xl)**: 4 kolom

### Table View Features:
- **Horizontal Scroll**: Untuk layar kecil
- **Sticky Columns**: Selalu terlihat saat scroll
- **Compressed Layout**: Optimized untuk mobile

## 🚀 Pagination State Management

### Card View Pagination:
```javascript
const [cardCurrentPage, setCardCurrentPage] = useState(1);
const [cardItemsPerPage, setCardItemsPerPage] = useState(12);

// Handlers
const handleCardPageChange = useCallback((page) => {
    setCardCurrentPage(page);
}, []);

const handleCardItemsPerPageChange = useCallback((itemsPerPage) => {
    setCardItemsPerPage(itemsPerPage);
    setCardCurrentPage(1); // Reset ke halaman pertama
}, []);
```

### View Mode Management:
```javascript
const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    if (mode === 'card') {
        setCardCurrentPage(1); // Reset saat switch ke card view
    }
}, []);
```

## 🎨 UI/UX Features

### 1. **Status Display**
- **Active**: Green badge dengan CheckCircle icon
- **Inactive**: Red badge dengan XCircle icon
- **Consistent**: Sama di card dan table view

### 2. **Card Design**
- **Gradient Header**: Blue gradient untuk pelanggan
- **Contact Info**: Phone dan email prominent
- **Address**: Dedicated section dengan MapPin icon
- **Description**: Optional dengan line clamp

### 3. **Loading States**
- **Skeleton Cards**: Animated placeholder
- **Disabled Controls**: Saat loading
- **Smooth Transitions**: Between states

## 📊 Data Management

### 1. **Search & Filter**
- **Search Fields**: Nama, alamat, telepon, email, deskripsi
- **Status Filter**: Semua, Aktif, Tidak Aktif
- **Real-time**: Filter langsung saat typing

### 2. **CRUD Operations**
- **Create**: Form modal dengan validasi
- **Read**: Card view dan detail modal
- **Update**: Edit modal dengan pre-filled data
- **Delete**: Confirmation modal

### 3. **Field Mapping**
```javascript
// Frontend -> Backend untuk Create/Update
{
    nama: pelangganData.name,
    alamat: pelangganData.address,
    kontak: pelangganData.phone,
    status: pelangganData.status,
    kategori: 2 // Tetap untuk pelanggan
}
```

## 🔄 API Integration

### 1. **Fetch Data**
```javascript
// DataTables parameters
url.searchParams.append('kategori', '2'); // Pelanggan filter
url.searchParams.append('start', start.toString());
url.searchParams.append('length', perPage.toString());
```

### 2. **Create/Update/Delete**
- **Same endpoint**: Outlet controller dengan kategori = 2
- **Consistent format**: DataTables response format
- **Error handling**: Robust error management

## 📋 Stats Integration

### Statistics Display:
- **Total Pelanggan**: Jumlah semua pelanggan
- **Pelanggan Aktif**: Pelanggan dengan status = 1
- **Color Coding**: Blue untuk total, Green untuk aktif

## 🎯 Performance Optimizations

### 1. **Client-side Pagination**
- **Data Slicing**: Hanya render cards yang visible
- **Memory Efficient**: Minimal DOM elements
- **Smooth Navigation**: Quick page transitions

### 2. **Component Optimization**
- **useCallback**: Memoized handlers
- **useMemo**: Filtered data computation
- **Conditional Rendering**: Efficient state management

## 🧪 Testing Scenarios

### 1. **Functionality Testing**
- [x] Pagination navigation works
- [x] Items per page selection
- [x] View mode switching
- [x] Search and filter
- [x] CRUD operations
- [x] Status display

### 2. **Edge Cases**
- [x] Empty data handling
- [x] Single page data
- [x] Network error scenarios
- [x] Loading states
- [x] Responsive design

## 📝 Usage Example

```jsx
// Card View dengan Pagination
<CardView
    data={pelanggan}
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

## 🏆 Key Benefits

1. **Consistent Architecture**: Menggunakan pattern yang sama dengan outlet
2. **Responsive Design**: Optimal di semua device
3. **User Experience**: Smooth pagination dan loading states
4. **Data Management**: Robust CRUD operations
5. **Performance**: Efficient rendering dan memory usage
6. **Maintainability**: Clean code structure dan reusable components

## 🔧 Technical Stack

- **React Hooks**: useState, useEffect, useCallback, useMemo
- **API Integration**: Fetch dengan authentication
- **UI Components**: Tailwind CSS dengan custom components
- **Icons**: Lucide React icons
- **State Management**: Local state dengan custom hooks
- **Responsive Design**: Mobile-first approach

## 📈 Future Enhancements

1. **Server-side Pagination**: Untuk dataset yang sangat besar
2. **Advanced Filtering**: Multi-criteria filtering
3. **Bulk Operations**: Select multiple items
4. **Export Features**: CSV/PDF export
5. **Real-time Updates**: WebSocket integration