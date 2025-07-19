# Halaman SDM - Data Karyawan

## Overview
Halaman SDM Data Karyawan adalah implementasi yang identik dengan halaman Supplier, dengan struktur yang modular dan terintegrasi dengan backend API.

## Struktur Folder
```
src/pages/sdm/
├── KaryawanPage.jsx                    # Main page component
├── karyawan/
│   ├── hooks/
│   │   └── useKaryawan.js              # Data management hook
│   ├── components/
│   │   ├── StatusBadge.jsx             # Status badge component
│   │   ├── ActionButton.jsx            # Action button for table
│   │   ├── ActionMenu.jsx              # Action menu dropdown
│   │   ├── CardView.jsx                # Card view component
│   │   ├── CardActionButton.jsx        # Action button for cards
│   │   └── PaginationControls.jsx      # Pagination component
│   ├── modals/
│   │   ├── AddEditKaryawanModal.jsx    # Add/Edit modal
│   │   └── KaryawanDetailModal.jsx     # Detail view modal
│   └── constants/
│       └── tableStyles.js              # DataTable custom styles
└── README.md                           # This file
```

## Fitur Utama

### 1. ✅ Data Management
- **CRUD Operations**: Create, Read, Update, Delete karyawan
- **Backend Integration**: Terintegrasi dengan API `https://puput-api.ternasys.com/api/sdm/karyawan`
- **Fallback System**: Menggunakan dummy data jika API tidak tersedia
- **DataTables Pagination**: Server-side pagination dengan parameter DataTables

### 2. ✅ User Interface
- **Dual View Mode**: Table view dan Card view
- **Responsive Design**: Mobile-friendly interface
- **Search & Filter**: Real-time search dan filter status
- **Consistent Styling**: Menggunakan red theme seperti supplier

### 3. ✅ Data Structure
```javascript
{
  pubid: "karyawan-001",
  employee_id: "EMP001",
  name: "Ahmad Subarjo",
  position: "Manajer Peternakan",
  department: "Operasional",
  phone: "081234567890",
  email: "ahmad@example.com",
  address: "Jl. Raya Jakarta No. 100",
  hire_date: "2020-01-15",
  salary: 8000000,
  status: 1, // 1 = aktif, 0 = tidak aktif
  created_at: "2020-01-15T00:00:00.000Z",
  updated_at: "2020-01-15T00:00:00.000Z"
}
```

## API Endpoints

### Base URL
```
https://puput-api.ternasys.com/api/system/pegawai
```

### Endpoints
- **GET** `/data` - Fetch pegawai dengan DataTables pagination
- **POST** `/store` - Create pegawai baru
- **POST** `/update` - Update pegawai existing
- **POST** `/delete` - Delete pegawai
- **POST** `/detail` - Get single pegawai detail
- **POST** `/reset-password` - Reset pegawai password
- **GET** `/jabatan` - Get roles/jabatan for dropdown

### DataTables Parameters
```javascript
{
  start: 0,           // Offset
  length: 100,        // Items per page
  draw: 1,            // Draw counter
  search: {
    value: ""         // Search term
  },
  order: [
    {
      column: 0,      // Column index
      dir: "asc"      // Sort direction
    }
  ]
}
```

## Komponen Detail

### KaryawanPage.jsx
- Main component yang mengatur state dan logic
- Identical structure dengan SupplierPage
- Menggunakan DataTable dan Card view
- Integrated dengan pagination

### useKaryawan.js
- Custom hook untuk data management
- API integration dengan error handling
- Fallback ke dummy data
- Search dan filter functionality

### Modals
- **AddEditKaryawanModal**: Form untuk tambah/edit karyawan
- **KaryawanDetailModal**: Detail view karyawan
- **DeleteConfirmationModal**: Konfirmasi hapus (shared component)

### Components
- **StatusBadge**: Menampilkan status aktif/tidak aktif
- **ActionButton/ActionMenu**: Menu aksi untuk table
- **CardActionButton**: Menu aksi untuk card view
- **CardView**: Grid view untuk karyawan
- **PaginationControls**: Pagination untuk card view

## Routing

### URL
```
/hr/karyawan
```

### Title
```
Data Karyawan SDM
```

### Navigation
Halaman dapat diakses melalui menu SDM → Data Karyawan

## Authentication & Security
- Menggunakan `useAuthSecure` hook untuk token management
- Semua API calls menggunakan Authorization header
- Error handling untuk unauthorized access

## Performance Features
- Server-side pagination untuk large datasets
- Lazy loading untuk modal components
- Optimized re-renders dengan useMemo dan useCallback
- Responsive design dengan mobile-first approach

## Dummy Data
Jika API tidak tersedia, sistem akan menggunakan dummy data dengan 5 karyawan sample:
- Ahmad Subarjo (Manajer Peternakan)
- Siti Aminah (Staf Administrasi)
- Joko Widodo (Kepala Penjualan)
- Dewi Lestari (Dokter Hewan)
- Bambang Susanto (Staf Kandang)

## Development Notes
1. Struktur identik dengan supplier untuk konsistensi
2. Menggunakan red theme untuk visual consistency
3. Implementasi DataTables server-side pagination
4. Fallback mechanism untuk API errors
5. Responsive design dengan Tailwind CSS

## Testing
- Dapat ditest dengan dummy data meski API tidak tersedia
- Console logging untuk debugging API calls
- Error boundaries untuk graceful error handling

## Future Enhancements
- Photo upload untuk karyawan
- Department management
- Salary history tracking
- Performance reviews integration
- Attendance tracking integration