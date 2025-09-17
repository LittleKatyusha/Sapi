# Modul Pembelian Kulit

Modul ini menangani pembelian kulit untuk sistem TernaSys.

## Struktur File

```
pembelianKulit/
├── PembelianKulitPage.jsx              # Halaman utama daftar pembelian kulit
├── AddEditPembelianKulitPage.jsx       # Form tambah/edit pembelian kulit
├── PembelianKulitDetailPage.jsx        # Halaman detail pembelian kulit
├── components/
│   ├── ActionButton.jsx                # Tombol aksi untuk setiap item
│   ├── ActionMenu.jsx                  # Menu dropdown aksi
│   ├── CustomPagination.jsx            # Komponen pagination
│   └── PembelianKulitCard.jsx          # Card view untuk mobile
├── constants/
│   └── tableStyles.js                  # Styling untuk tabel
├── hooks/
│   ├── usePembelianKulit.js            # Hook utama untuk API calls
│   ├── useFarmAPI.js                   # Hook untuk data farm
│   ├── useBanksAPI.js                  # Hook untuk data bank
│   ├── useJenisPembelianKulit.js       # Hook untuk jenis pembelian
│   ├── useKlasifikasiKulit.js          # Hook untuk klasifikasi kulit
│   └── useParameterSelect.js           # Hook untuk parameter select
└── modals/
    ├── DeleteConfirmationModal.jsx     # Modal konfirmasi hapus
    └── PembelianKulitDetailModal.jsx   # Modal detail pembelian
```

## Fitur

### 1. Halaman Utama (PembelianKulitPage.jsx)
- Daftar pembelian kulit dengan tabel responsif
- Pencarian berdasarkan nota, supplier, supir, atau plat nomor
- Filter berdasarkan jenis pembelian
- Pagination server-side
- Statistik pembelian (total, hari ini, bulan ini)
- Aksi: Lihat detail, Edit, Hapus

### 2. Form Tambah/Edit (AddEditPembelianKulitPage.jsx)
- Form input data pembelian kulit
- Detail items dengan klasifikasi kulit
- Upload file dokumen
- Validasi form
- Auto-calculate total harga dan berat

### 3. Halaman Detail (PembelianKulitDetailPage.jsx)
- Tampilan detail lengkap pembelian kulit
- Daftar item detail
- Informasi supplier dan farm
- Download file dokumen

## API Endpoints

Modul ini menggunakan endpoint berikut:
- `GET /api/ho/kulit/pembelian/data` - Ambil data pembelian
- `POST /api/ho/kulit/pembelian/store` - Simpan pembelian baru
- `POST /api/ho/kulit/pembelian/update` - Update pembelian
- `POST /api/ho/kulit/pembelian/hapus` - Hapus pembelian
- `POST /api/ho/kulit/pembelian/show` - Detail pembelian
- `GET /api/ho/kulit/pembelian/file/{path}` - Download file

## Routing

Routes yang tersedia:
- `/ho/pembelian-kulit` - Halaman utama
- `/ho/pembelian-kulit/add` - Form tambah
- `/ho/pembelian-kulit/edit/:id` - Form edit
- `/ho/pembelian-kulit/detail/:id` - Halaman detail

## Permissions

Modul ini memerlukan permission berikut:
- `ho.kulit.pembelian,getData` - Melihat data
- `ho.kulit.pembelian,store` - Menambah data
- `ho.kulit.pembelian,update` - Mengubah data
- `ho.kulit.pembelian,delete` - Menghapus data
- `ho.kulit.pembelian,show` - Melihat detail
- `ho.kulit.pembelian,file` - Download file

## Dependencies

- React Router DOM untuk navigasi
- React Data Table Component untuk tabel
- Lucide React untuk ikon
- Tailwind CSS untuk styling
- Custom hooks untuk state management

## Catatan

- Modul ini menggunakan server-side pagination untuk performa yang lebih baik
- File upload menggunakan FormData untuk mendukung file dokumen
- Responsive design dengan card view untuk mobile
- Error handling yang komprehensif
