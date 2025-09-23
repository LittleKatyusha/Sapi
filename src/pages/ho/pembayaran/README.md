# Pembayaran Module

Modul ini menangani manajemen data pembayaran untuk pembelian di Head Office (HO).

## Struktur File

```
pembayaran/
├── PembayaranPage.jsx              # Halaman utama daftar pembayaran
├── AddEditPembayaranPage.jsx      # Halaman tambah/edit pembayaran
├── PembayaranDetailPage.jsx       # Halaman detail pembayaran
├── components/
│   ├── ActionButton.jsx           # Tombol aksi untuk setiap baris
│   ├── ActionMenu.jsx             # Menu dropdown aksi
│   ├── CustomPagination.jsx       # Komponen pagination kustom
│   └── PembayaranCard.jsx         # Card untuk tampilan mobile
├── constants/
│   └── tableStyles.js             # Styling untuk tabel
├── hooks/
│   ├── useBanksAPI.js             # Hook untuk data bank
│   ├── useFarmAPI.js              # Hook untuk data farm
│   └── usePembayaran.js           # Hook utama untuk pembayaran
├── modals/
│   └── DeleteConfirmationModal.jsx # Modal konfirmasi hapus
└── README.md                      # Dokumentasi modul
```

## Fitur

- **Daftar Pembayaran**: Menampilkan daftar pembayaran dengan pagination
- **Pencarian**: Pencarian berdasarkan supplier, nota HO, atau ID pembayaran
- **Filter**: Filter berdasarkan status pembayaran
- **CRUD Operations**: Create, Read, Update, Delete pembayaran
- **Tambah/Edit Pembayaran**: Form untuk menambah atau mengedit pembayaran
- **Detail Pembayaran**: Lihat detail pembayaran dan detail pembayaran
- **Responsive Design**: Tampilan desktop (tabel) dan mobile (card)
- **Real-time Updates**: Auto-refresh data saat kembali ke halaman
- **Validasi Form**: Validasi form sesuai dengan backend validation rules

## Data Fields

### Header Pembayaran
- `id`: ID pembayaran
- `nota_ho`: Nomor nota HO
- `nama_supplier`: Nama supplier
- `due_date`: Tanggal jatuh tempo
- `settlement_date`: Tanggal pelunasan
- `payment_status`: Status pembayaran (0: Belum Lunas, 1: Lunas)
- `amount`: Jumlah pembayaran

### Detail Pembayaran
- `id_pembayaran`: ID pembayaran header
- `amount`: Jumlah pembayaran detail
- `payment_date`: Tanggal pembayaran detail

## API Endpoints

- `GET /api/ho/payment/data` - Ambil data pembayaran
- `POST /api/ho/payment/store` - Buat pembayaran baru
- `POST /api/ho/payment/update` - Update pembayaran
- `POST /api/ho/payment/hapus` - Hapus pembayaran
- `POST /api/ho/payment/show` - Detail pembayaran
- `GET /api/ho/payment/summary` - Statistik pembayaran
- `GET /api/ho/payment/details` - Detail pembayaran
- `POST /api/ho/payment/detail/store` - Buat detail pembayaran
- `POST /api/ho/payment/detail/update` - Update detail pembayaran
- `POST /api/ho/payment/detail/hapus` - Hapus detail pembayaran

## Status Pembayaran

- **0 (Belum Lunas)**: Pembayaran belum dilunasi
- **1 (Lunas)**: Pembayaran sudah dilunasi

## Penggunaan

```jsx
import PembayaranPage from './pages/ho/pembayaran/PembayaranPage';
import AddEditPembayaranPage from './pages/ho/pembayaran/AddEditPembayaranPage';
import PembayaranDetailPage from './pages/ho/pembayaran/PembayaranDetailPage';

// Di routing
<Route path="/ho/pembayaran" element={<PembayaranPage />} />
<Route path="/ho/pembayaran/add" element={<AddEditPembayaranPage />} />
<Route path="/ho/pembayaran/edit/:id" element={<AddEditPembayaranPage />} />
<Route path="/ho/pembayaran/detail/:id" element={<PembayaranDetailPage />} />
```

## Dependencies

- React 18+
- React Router DOM
- React Data Table Component
- Lucide React (Icons)
- Tailwind CSS
- Custom HTTP Client