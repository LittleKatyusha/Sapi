# Panduan Sistem Role Hierarki

## Konsep Dasar

Sistem role hierarki memungkinkan Anda membuat struktur organisasi dengan parent-child relationship antara role. Setiap role dapat memiliki parent role atau menjadi role independen.

## Cara Menggunakan

### 1. Membuat Parent Role (Role Utama)
- Klik tombol **Tambah Role**
- Kosongkan field **Parent Role** atau pilih "-- Tidak ada parent role --"
- Isi **Nama Role** (contoh: "Administrator", "Manager", "Supervisor")
- Isi **Deskripsi** role tersebut
- Klik **Simpan**

### 2. Membuat Child Role (Sub Role)
- Klik tombol **Tambah Role**
- Pilih **Parent Role** dari dropdown
- Isi **Nama Role** untuk sub role (contoh: "Staff", "User", "Operator")
- Isi **Deskripsi** role tersebut
- Klik **Simpan**

## Contoh Struktur Hierarki

```
Administrator (Parent Role)
├── Manager (Child Role)
│   ├── Staff (Child Role)
│   └── Trainee (Child Role)
└── IT Support (Child Role)

HR Manager (Parent Role)
├── HR Staff (Child Role)
└── Recruitment Officer (Child Role)
```

## Validasi Sistem

1. **Circular Dependency Prevention**: Role tidak bisa menjadi parent dari dirinya sendiri
2. **Unique Names**: Setiap role harus memiliki nama yang unik
3. **Required Fields**: Nama role wajib diisi

## Tips Penggunaan

1. **Mulai dari Parent**: Buat parent role terlebih dahulu sebelum membuat child role
2. **Penamaan Konsisten**: Gunakan konvensi penamaan yang konsisten
3. **Deskripsi Jelas**: Berikan deskripsi yang jelas untuk setiap role
4. **Review Berkala**: Tinjau struktur role secara berkala sesuai kebutuhan organisasi

## Contoh Implementasi

### Sistem Restaurant
- Manager → Waiter
- Manager → Chef
- Chef → Cook Assistant

### Sistem Perusahaan
- CEO → Department Head
- Department Head → Team Lead
- Team Lead → Staff Member

### Sistem Aplikasi
- Super Admin → Admin
- Admin → Moderator
- Moderator → User
