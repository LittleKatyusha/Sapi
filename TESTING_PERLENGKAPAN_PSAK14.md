# 🧪 Panduan Testing — Modul Perlengkapan (Kartu Stok, Opname, NRV / PSAK 14)

> Dokumen ini dipakai untuk **UAT** modul perlengkapan: penginputan pembelian → kartu stok → opname → jurnal → rekonsiliasi → pengungkapan PSAK 14.
> Semua angka contoh bisa langsung dipakai; hasil yang diharapkan ditulis eksplisit agar mudah dicocokkan.

**Terakhir diperbarui:** 2026-11-29 · **Versi modul:** migrasi `2026_11_28_000001…000005`, `2026_11_29_000001…000004`

---

## 0. Alur Pengisian Cepat (SOP) — dari nol sampai laporan

> Ikuti berurutan. Setiap langkah menyebutkan **menu**, **field yang diisi**, dan **hasil yang harus terlihat**.

### Langkah 1 — Siapkan akun (sekali saja) · **M9 Data Master → COA**
Pastikan ada dan **aktif + posting**:
`1180 Perlengkapan`, `6250 Beban Perlengkapan`, `6298 Beban Penurunan Nilai`, `6299 Beban Kerugian Kehilangan`.

### Langkah 2 — Siapkan item & nama barang · **M1 → M2**
1. **M1 Item Lain-Lain** → pastikan ada item, mis. `Perlengkapan Kantor`, dengan **COA = 1180**.
   ⚠️ Item ber-COA 6xxx hanya jadi beban — **tidak** masuk kartu stok.
2. **M2 Nama Item** → pilih `Perlengkapan Kantor` → tambah nama barang: `Pulpen` (satuan `pcs`), lalu `Tipex`, dst.
   Hasil: daftar nama item muncul dengan badge **Aktif**.

### Langkah 3 — Input pembelian · **M3 HO → Pembelian Lain Lain → tab Tambah Biaya-Biaya**
Isi:
| Field | Contoh |
|---|---|
| Divisi/Farm | HO |
| Jenis Biaya-Biaya | BIAYA-BIAYA |
| Item | `Perlengkapan Kantor — 1180 Perlengkapan` |
| **Nama Item** | `Pulpen` |
| Jumlah (qty) | `10` |
| Harga Satuan | `3000` |
| Nilai | otomatis **30.000** |
| Dibayarkan Oleh / Tanggal / Peruntukan | diisi |
| Syarat Pembelian | Kas / Bank |

Klik **Simpan**.
Hasil yang benar:
```
Jurnal     : DR 1180 30.000 / CR Kas 30.000
Kartu stok : MASUK 10 pcs @3.000 → saldo 10 / 30.000
```
Jika muncul *“Belum bisa disimpan. Lengkapi: …”* → isi field yang disebut.

### Langkah 4 — Cek stok masuk · **M5 Kartu Stok Perlengkapan**
Pilih unit → cari `Pulpen`.
Hasil: baris **MASUK** (hijau), saldo qty **10**, saldo nilai **30.000**.
Bila salah nama: klik ✏️ → ubah nama → Simpan.

### Langkah 5 — Lakukan opname fisik · **M4 Opname Perlengkapan**
1. Pilih unit → **Tanggal opname** → **Buat sesi opname** → kode `OPB-YYYYMMDD-001`, status **Penghitungan**.
2. Isi kolom: **Qty fisik** (mis. `7`), **Kondisi** (`baik`/`rusak`/`hilang`), catatan → **Simpan hasil hitung**.
   Hasil: selisih **−3**, nilai selisih **9.000**.
3. **Verifikasi** → status **Terverifikasi**.
   (Bila SoD aktif, pemeriksa harus user berbeda.)
4. **Setujui** (centang **Jurnal surplus** hanya bila ada selisih lebih dan ingin dijurnal).
   Hasil: *“1 barang kurang senilai 9.000 dijurnal otomatis (jurnal #…)”*, status **Disetujui**.

### Langkah 6 — Pastikan stok & jurnal · **M5 → M8**
- **M5**: baris **KELUAR** (merah) qty 3 → saldo **7 / 21.000**.
- **M8 Jurnal**: `INVENTORY_ADJUSTMENT` → **DR 6250 9.000 / CR 1180 9.000** (hilang → 6299, rusak → 6298).

### Langkah 7 — Bila ada barang rusak/usang (opsional) · **M5 → ikon ⬇ (NRV)**
1. Klik ikon **⬇** pada kartu barang → modal **Penyesuaian Nilai ke NRV**.
2. Isi **NRV per unit** (mis. `2000`) + catatan → **Posting**.
   Hasil: **DR 6298 / CR 1180** sebesar selisih; nilai kartu stok turun.
3. Bila NRV naik lagi → isi NRV lebih besar → sistem memposting **pemulihan** (maksimal sebesar biaya semula).

### Langkah 8 — Cek keseimbangan · **M6 Rekonsiliasi Perlengkapan**
Pilih unit + tanggal → **Muat ulang**.
Hasil: **GL 118x = Nilai kartu stok**, badge **Seimbang**, selisih **0**.
Panel **Catatan PSAK 14** menampilkan kebijakan, nilai tercatat, mutasi, dan **mutasi cadangan penurunan nilai**.

### Langkah 9 — Cek laporan · **M7 Neraca Saldo**
Hasil: **Total debit = total kredit**; akun 1180 = nilai kartu stok; 6250/6298/6299 sesuai jurnal.

### Langkah 10 — Akhiri periode
Setelah semua transaksi & opname selesai dan rekonsiliasi **Seimbang** → tutup periode di menu periode akuntansi.
Setelah periode ditutup, jurnal bertanggal periode tersebut akan **ditolak** (cut-off).

---

### Ringkasan urutan singkat
```
M9 akun → M1 item(COA 1180) → M2 nama item
   → M3 input pembelian → M5 cek stok
      → M4 opname (sesi → hitung → verifikasi → setujui)
         → M8 cek jurnal → M5 cek mutasi
            → (opsional) M5 NRV
               → M6 rekonsiliasi seimbang → M7 neraca saldo balance → tutup periode
```

## 1. Prasyarat (jalankan sekali)

```bash
cd ternasys
php artisan migrate --force        # membuat tabel supplies + menu + kolom nrv
php artisan config:clear           # agar config/env baru terbaca
```

Env opsional (`.env`):

```env
ACC_SUPPLIES_ENFORCE_SOD=false          # true = petugas tidak boleh verifikasi/approve sendiri
ACC_SUPPLIES_POST_SURPLUS=false         # true = surplus opname otomatis dijurnal
ACC_SUPPLIES_COA_HILANG=6299            # akun kerugian kehilangan
ACC_SUPPLIES_COA_RUSAK=6298             # akun penurunan nilai
# ACC_SUPPLIES_COA_SURPLUS=6290         # (opsional) akun kredit surplus
```

Frontend: **hard refresh** (`Cmd/Ctrl + Shift + R`) setelah deploy.

---

## 2. Daftar Menu

| Kode | Menu (sidebar) | URL | Fungsi | Permission akses |
|---|---|---|---|---|
| **M1** | Data Master → Item Lain-Lain | `/master-data/item-lain-lain` | master item (kategori) + COA | `master.itemlainlain` |
| **M2** | Data Master → **Nama Item** | `/master-data/nama-item` | sub-item (Pulpen, Tipex, …) — **dipakai sebagai nama barang** di kartu stok | `master.itemlainlain` |
| **M3** | HO → Pembelian Lain Lain → tab **Tambah Biaya-Biaya** | `/ho/pembelian-lain-lain` | input pembelian; otomatis menambah stok bila COA debit = 118x | modul pembelian |
| **M4** | Akuntansi → **Opname Perlengkapan** | `/akuntansi/opname-perlengkapan` | hitung fisik → verifikasi → setujui (jurnal + stok) | `accounting.coa`, `accounting.journals` (post) |
| **M5** | Akuntansi → **Kartu Stok Perlengkapan** | `/akuntansi/kartu-stok-perlengkapan` | mutasi masuk/keluar, saldo, rename barang, **aksi NRV** | `accounting.coa` |
| **M6** | Akuntansi → **Rekonsiliasi Perlengkapan** | `/akuntansi/rekonsiliasi-perlengkapan` | GL 118x vs kartu stok + **Catatan PSAK 14** | `accounting.coa` |
| **M7** | Akuntansi → Neraca Saldo | `/akuntansi/neraca-saldo` | cek total debit = kredit; tombol pintas ke M4/M6 | `accounting.coa` |
| **M8** | Akuntansi → Jurnal | `/akuntansi/jurnal` | cek jurnal `INVENTORY_ADJUSTMENT` / reversal | `accounting.journals` |
| **M9** | Data Master → COA | `/master-data/coa` | akun 1180, 6250, 6298, 6299 | `master.coa` |

---

## 3. Master data yang harus ada

| Kode akun | Nama | Tipe | Keterangan |
|---|---|---|---|
| **1180** | Perlengkapan | Aset | akun persediaan perlengkapan (wajib ada & posting) |
| **6250** | Beban Perlengkapan | Beban | pemakaian normal |
| **6298** | Beban Penurunan Nilai Perlengkapan | Beban | write-down / NRV |
| **6299** | Beban Kerugian Kehilangan Perlengkapan | Beban | opname kondisi “hilang” |

Item (M1) harus punya **COA 1180** agar pembeliannya masuk kartu stok:

| Item | COA | Sub-item (M2) |
|---|---|---|
| Perlengkapan Kantor | 1180 Perlengkapan | Pulpen, Tipex, Map |
| Peralatan Kantor | 6260 (beban) | tipe-x — *pembeliannya TIDAK menambah stok* |

### Data yang sudah tersedia di DB dev

```
Item 49 "Perlengkapan Kantor" (1180) → sub: Pulpen
Item 58 "Peralatan Kantor"   (6260) → sub: tipe-x
Item perlengkapan stok: Tipe-x → qty 10, nilai 35.000 (biaya rata-rata 3.500)
GL 1180 = 35.000 → rekonsiliasi seimbang
```

---

## 4. Aliran Data End-to-End

```
[M3] Input Pembelian (COA debit 118x)
        │  simpan → posting jurnal
        ├──────────────► JURNAL: DR 1180 Perlengkapan / CR Kas|Hutang
        └──────────────► KARTU STOK: mutasi MASUK (qty, harga satuan)
                                   sys_acc_supplies_mutations

[M4] Opname Perlengkapan
        ├─ 1. Buat sesi        → snapshot qty sistem  (kode OPB-YYYYMMDD-001)
        ├─ 2. Isi qty fisik    → selisih & nilai selisih (biaya rata-rata)
        ├─ 3. Verifikasi       → status verified
        └─ 4. Setujui          ├──► JURNAL INVENTORY_ADJUSTMENT
                               │      kurang:  DR 6250/6298/6299 / CR 1180
                               │      surplus: DR 1180 / CR beban   (opsional)
                               └──► KARTU STOK: KELUAR (kurang) / MASUK (surplus)

[M5] Kartu Stok
        ├─ lihat mutasi & saldo berjalan
        ├─ rename nama barang
        └─ aksi NRV  ──► JURNAL  turun: DR 6298 / CR 1180
                                 pulih: DR 1180 / CR 6298

[M6] Rekonsiliasi  → GL 118x  vs  Σ saldo_nilai barang  → status Seimbang/Selisih
                   → panel Catatan PSAK 14 (kebijakan, nilai tercatat, mutasi,
                     cadangan penurunan nilai, potensi write-down)
```

### Tabel data yang terlibat

| Tabel | Isi | Dipakai di |
|---|---|---|
| `sys_ms_item_lainlain` | master item + `coa_id` | M1, M3 |
| `sys_ms_item_lainlain_sub` | nama item (sub) | M2, M3 (dropdown Nama Item) |
| `sys_acc_supplies_items` | master barang stok: `saldo_qty`, `saldo_nilai`, `harga_terakhir`, `nrv`, `nilai_penurunan` | M4–M6 |
| `sys_acc_supplies_mutations` | kartu stok append-only: `tipe` (MASUK/KELUAR/ADJUST), qty, harga, nilai, saldo berjalan, `sumber_tabel`+`sumber_id` | M5 |
| `sys_acc_supplies_counts` / `_count_lines` | sesi opname & baris hasil hitung (qty sistem, fisik, selisih, kondisi, nilai) | M4 |
| `sys_acc_journals` / `sys_acc_journal_lines` | jurnal `PURCHASE_HO`, `INVENTORY_ADJUSTMENT`, `REVERSAL` | M8 |
| `sys_acc_general_ledger` | buku besar (sumber semua laporan) | M6, M7 |

---

## 5. Rumus & Kebijakan Perhitungan

### 5.1 Stok masuk dari pembelian
```
qty       = detail.jumlah → detail.berat → pembelian.jumlah → 1
harga     = detail.harga → (detail.total_harga / qty)
nama item = detail.nama_produk (Nama Item) → nama item induk
```
Idempotensi: satu dokumen + satu barang hanya menambah sekali (`sumber_tabel` + `sumber_id` + item).
**Resync saat edit:** sistem membandingkan qty “seharusnya” vs qty tercatat lalu menerapkan **selisih** (tambah/kurang), jadi edit qty tidak menggandakan stok.

### 5.2 Biaya rata-rata tertimbang bergerak (PSAK 14)
```
biaya_rata_per_unit = saldo_nilai / saldo_qty
nilai keluar        = qty_keluar × biaya_rata_per_unit
```

### 5.3 Opname
```
selisih      = qty_fisik − qty_sistem      (negatif = kurang, positif = lebih)
nilai_selisih = |selisih| × biaya_rata_per_unit
```
Akun beban sesuai **kondisi**:

| Kondisi | Akun debit |
|---|---|
| baik / kosong (pemakaian) | `coa_beban_id` item → fallback **6250** |
| rusak | **6298** Beban Penurunan Nilai |
| hilang / tidak ditemukan | **6299** Beban Kerugian Kehilangan |

Surplus (hanya bila `post_surplus = true`): **DR 1180 / CR beban item (atau `coa_surplus`)**, plus stok MASUK sebesar surplus.

### 5.4 Nilai realisasi neto (NRV)
```
harga_buku_per_unit   = saldo_nilai / qty
biaya_semula_per_unit = (saldo_nilai + nilai_penurunan) / qty

NRV < harga_buku → TURUN : nilai = (harga_buku − NRV) × qty
                           nilai_penurunan (akumulasi) += nilai
NRV > harga_buku → PULIH : target = min(NRV, biaya_semula)
                           nilai  = min((target − harga_buku) × qty, akumulasi)
                           nilai_penurunan -= nilai      (tidak pernah > biaya semula)
```

### 5.5 Kunci idempotensi jurnal
| Proses | Key |
|---|---|
| Pembelian | `stableIdempotencySuffix(ref_table, id)` |
| Opname | `SUPPLIES-OPNAME-{count_id}` |
| NRV | `SUPPLIES-NRV-{item_id}-{YYYYMMDD}-{turun\|naik}` |

---

## 6. Skenario Testing (dengan contoh angka)

> Gunakan entitas dengan GL 1180 = 35.000 sebagai baseline. Setiap skenario menulis **nilai yang diharapkan**; cocokkan di layar/DB.

### T1 — Master Nama Item (M2)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1.1 | Buka **M2**, pilih Item `Perlengkapan Kantor` (selectbox searchable) | daftar nama item muncul (Pulpen) |
| 1.2 | Tambah nama item `Pulpen`, satuan `pcs` → **Simpan nama item** | baris baru muncul, badge **Aktif** |
| 1.3 | Uji duplikat: tambah `Pulpen` lagi | **tidak error**, data lama dikembalikan & terpilih |
| 1.4 | Klik ✏️ → ubah jadi `Pulpen Biru` → Simpan | nama berubah |
| 1.5 | Klik ✖️ (nonaktifkan) | badge **Nonaktif**; item tidak muncul di dropdown Nama Item saat pembelian |
| 1.6 | Klik 🗑️ pada item | hilang dari daftar (soft delete) |

---

### T2 — Pembelian perlengkapan & stok masuk (M3)

**T2a — Pembelian pertama**

| Field | Nilai |
|---|---|
| Jenis | BIAYA-BIAYA |
| Item | Perlengkapan Kantor (1180) |
| Nama Item | Pulpen |
| Jumlah (qty) | **10** |
| Harga satuan | **3.000** |
| Nilai | 30.000 |
| Syarat | Kas |

Ekspektasi:
```
Jurnal      : DR 1180 Perlengkapan 30.000  /  CR Kas-HO 30.000     (tipe PURCHASE_HO)
Kartu stok  : MASUK 10 pcs @3.000 = 30.000  → saldo 10 / 30.000
Rekonsiliasi: GL 118x naik 30.000, kartu stok naik 30.000 → tetap seimbang
```

**T2b — Pembelian kedua dengan harga berbeda (uji rata-rata)**

| Field | Nilai |
|---|---|
| Nama Item | Pulpen |
| Jumlah | **10** |
| Harga satuan | **5.000** |

Ekspektasi:
```
Saldo stok   : 20 pcs, nilai 80.000
Biaya rata²  : 80.000 / 20 = 4.000 / pcs      ← PSAK 14 (moving weighted average)
Kartu stok   : baris MASUK kedua mencatat harga 5.000, saldo 20 / 80.000
```

---

### T3 — Edit pembelian (resync qty)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 3.1 | Edit pembelian T2b: ubah **Jumlah 10 → 6** (nilai 30.000), simpan | stok turun **4 pcs** |
| 3.2 | Cek M5 | saldo **16 pcs**, nilai **60.000**, rata-rata **3.750** |
| 3.3 | Cek M6 | GL 118x = 60.000, kartu stok = 60.000 → **Seimbang** |
| 3.4 | Simpan ulang tanpa perubahan | **tidak ada** mutasi tambahan (delta = 0) |

> Bila stok sudah terpakai opname dan pengurangan melebihi saldo, sistem **menolak pengurangan** (log warning) — saldo tidak pernah minus.

---

### T4 — Hapus pembelian (reversal)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 4.1 | Hapus pembelian T2b | jurnal di-void + **REVERSAL** terbit |
| 4.2 | Cek M5 | mutasi MASUK pembelian tersebut **hilang**, saldo kembali **10 pcs / 30.000** |
| 4.3 | Cek M6 | GL 118x = 30.000 = kartu stok → **Seimbang** |

---

### T5 — Opname: selisih kurang (kondisi baik)

Posisi awal: **10 Pulpen, biaya rata-rata 3.000, nilai 30.000**. Fisik: **7**.

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 5.1 | **M4** → pilih unit → tanggal → **Buat sesi opname** | kode `OPB-YYYYMMDD-001`, status **Penghitungan**, qty sistem 10 |
| 5.2 | Qty fisik `7`, Kondisi `baik` → **Simpan hasil hitung** | selisih **−3**, nilai selisih **9.000** |
| 5.3 | **Verifikasi** (user boleh sama bila SoD=false) | status **Terverifikasi** |
| 5.4 | **Setujui** (tanpa centang surplus) | pesan: *“1 barang kurang senilai 9.000 dijurnal otomatis (jurnal #…)”* |
| 5.5 | Cek M8 | `INVENTORY_ADJUSTMENT`: **DR 6250 9.000 / CR 1180 9.000**, status POSTED |
| 5.6 | Cek M5 | mutasi **KELUAR** qty 3 → saldo **7 / 21.000** |
| 5.7 | Cek M6 | 118x = 21.000 = kartu stok → **Seimbang** |

---

### T6 — Opname: kondisi “hilang” dan “rusak” (akun berbeda)

Posisi: **7 Pulpen, rata-rata 3.000**. Fisik **5**.

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 6.1 | Sesi baru → qty fisik `5`, Kondisi **hilang** → simpan → verifikasi → setujui | jurnal **DR 6299 6.000 / CR 1180 6.000** |
| 6.2 | Sesi lagi: fisik `5`, Kondisi **rusak** → setujui | jurnal **DR 6298 6.000 / CR 1180 6.000** |
| 6.3 | Cek M7 | 6299 dan 6298 bertambah sesuai skenario; 6250 **tidak** terpengaruh |

> Bila akun 6298/6299 tidak ditemukan/nonaktif → sistem fallback ke `coa_beban_id` item atau **6250**.

---

### T7 — Opname: surplus / selisih lebih (opsional)

Posisi: **5 Pulpen, rata-rata 3.000**. Fisik **8** (surplus 3). **Centang “Jurnal surplus”** sebelum Setujui.

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 7.1 | Sesi → fisik `8` → verifikasi → **centang Jurnal surplus** → Setujui | pesan menyertakan `nilai_surplus` |
| 7.2 | Cek M8 | **DR 1180 9.000 / CR 6250 9.000** (atau akun `coa_surplus` bila di-set) |
| 7.3 | Cek M5 | mutasi **MASUK** qty 3 → saldo **8 / 24.000** |
| 7.4 | Ulangi tanpa centang surplus | surplus **tidak dijurnal**, stok tetap 5 |

---

### T8 — NRV: penurunan & pemulihan (PSAK 14)

Posisi: **8 Pulpen, nilai 24.000, biaya rata-rata 3.000**.

**T8a — Penurunan nilai**

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 8.1 | **M5** → kartu barang Pulpen → ikon **⬇ (NRV)** | modal “Penyesuaian Nilai ke NRV” terbuka (stok, nilai tercatat, biaya buku per unit) |
| 8.2 | Isi NRV per unit **2.000**, catatan “rusak ringan” → **Posting** | pesan: *“Penurunan nilai 8.000 diposting (jurnal #…)”* |
| 8.3 | Cek M8 | **DR 6298 8.000 / CR 1180 8.000** |
| 8.4 | Cek M5 | mutasi **ADJUST** nilai −8.000, saldo nilai **16.000** (qty tetap 8), akumulasi penurunan 8.000 |
| 8.5 | Cek M6 | 118x = 16.000 = kartu stok → **Seimbang**; panel Catatan PSAK 14: penambahan **8.000** |

**T8b — Pemulihan (dibatasi biaya semula)**

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 8.6 | Ikon NRV lagi → isi **5.000** (di atas biaya semula 3.000) → Posting | pemulihan **8.000** (bukan 16.000) |
| 8.7 | Cek M8 | **DR 1180 8.000 / CR 6298 8.000** |
| 8.8 | Cek M5 | saldo nilai kembali **24.000**, akumulasi penurunan **0** |
| 8.9 | Ikon NRV → isi **4.000** | **tidak ada** penyesuaian (akumulasi 0 → tidak bisa menaikkan di atas biaya) |

---

### T9 — Kartu Stok (M5)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 9.1 | Filter unit + barang + periode | tabel mutasi: tanggal, tipe (MASUK/KELUAR/ADJUST), qty, harga, nilai, **saldo berjalan** |
| 9.2 | Cek ringkasan | total qty masuk, total qty keluar, nilai perolehan periode |
| 9.3 | Ikon ✏️ → ubah nama barang (`Pulpen` → `Pulpen Biru`) | nama berubah, mutasi lama tetap |
| 9.4 | Rename ke nama barang lain yang sudah ada | ditolak: *“… sudah ada di entitas ini”* |
| 9.5 | Barang tanpa saldo & tanpa mutasi | **tidak muncul** di daftar |

---

### T10 — Rekonsiliasi & Catatan PSAK 14 (M6)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 10.1 | Pilih unit + tanggal → **Muat ulang** | 3 kartu: **GL 118x**, **Nilai kartu stok**, **Selisih**; badge **Seimbang** bila selisih 0 |
| 10.2 | Tabel **Rincian Kartu Stok per Barang** | baris per barang: saldo qty, harga terakhir, nilai; total = nilai kartu stok |
| 10.3 | Tabel **Rincian Buku Besar 118x** | tanggal, nomor jurnal, akun, tipe, debit/kredit, keterangan (100 baris terakhir) |
| 10.4 | Panel **Catatan PSAK 14** | kebijakan (rata-rata, lower of cost & NRV, pengakuan beban, surplus) + nilai tercatat + mutasi + **Mutasi cadangan penurunan nilai** (awal → penambahan → pemulihan → akhir) |
| 10.5 | Bila ada barang NRV < biaya | peringatan kuning: potensi penurunan + arahan memakai aksi NRV di Kartu Stok |

> **Uji negatif:** buat jurnal manual yang mengkredit 1180 tanpa mengubah stok → panel menampilkan **Selisih terdeteksi**.

---

### T11 — Neraca Saldo (M7)

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 11.1 | Tampilkan neraca saldo | **Total debit = total kredit** (selisih 0) |
| 11.2 | Cari akun **1180** | nilainya = nilai kartu stok di M6 |
| 11.3 | Cari **6250 / 6298 / 6299** | bertambah sesuai opname & write-down |
| 11.4 | Klik tombol **Opname / Rekonsiliasi Perlengkapan** | pindah halaman tanpa reload penuh (SPA) |

---

## 7. Pesan Error Umum & Solusi

| Pesan | Penyebab | Solusi |
|---|---|---|
| *Sesi berstatus "approved" tidak dapat diverifikasi (sudah final)* | klik verifikasi pada sesi final | buat sesi baru |
| *Masih ada barang yang belum dihitung* | qty fisik kosong | lengkapi lalu simpan |
| *Qty keluar melebihi saldo stok* | fisik membuat stok minus / resync melebihi saldo | periksa hitung fisik / pembelian |
| *Akun penurunan nilai (6298) tidak ditemukan/nonaktif* | COA 6298 nonaktif | aktifkan di M9 |
| *Akun beban perlengkapan (6250) tidak ditemukan/nonaktif* | COA 6250 nonaktif & item tanpa `coa_beban_id` | aktifkan atau set COA beban item |
| *Barang perlengkapan "X" sudah ada di entitas ini* | rename duplikat | pakai nama unik |
| *Belum bisa disimpan. Lengkapi: …* | field wajib kosong | lengkapi field yang disebut |
| Periode tertutup / hanya jurnal posted dapat di-void | posting ke periode closed | buka periode / tanggal valid |
| Stok tidak bertambah setelah pembelian | COA item bukan 118x | ubah COA item di M1 |

---

## 8. Checklist UAT

| # | Item | ✔ |
|---|---|---|
| 1 | Migrasi `2026_11_28_000001–000005` & `2026_11_29_000001–000004` berjalan | ☐ |
| 2 | Menu Nama Item, Opname Perlengkapan, Kartu Stok, Rekonsiliasi tampil | ☐ |
| 3 | Master nama item: tambah/ubah/nonaktif/hapus | ☐ |
| 4 | Pembelian COA 1180 → stok MASUK + DR 1180 | ☐ |
| 5 | Pembelian COA 6xxx → **tidak** menambah stok | ☐ |
| 6 | Edit pembelian → stok menyesuaikan tanpa dobel | ☐ |
| 7 | Hapus pembelian → stok & jurnal kembali | ☐ |
| 8 | Opname kurang (baik) → DR 6250 | ☐ |
| 9 | Opname hilang → DR 6299; rusak → DR 6298 | ☐ |
| 10 | Surplus (centang) → DR 1180 / CR beban + stok naik | ☐ |
| 11 | NRV turun → DR 6298; pemulihan dibatasi biaya semula | ☐ |
| 12 | Kartu stok saldo berjalan sesuai | ☐ |
| 13 | Rekonsiliasi Seimbang + rincian tampil | ☐ |
| 14 | Panel Catatan PSAK 14 lengkap | ☐ |
| 15 | Neraca saldo debit = kredit | ☐ |

---

## 9. Lampiran API (tester teknis)

Base: `/api/accounting`

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/supplies/items?setting_id=` | daftar barang stok |
| POST | `/supplies/items` | buat/ambil master barang |
| PUT | `/supplies/items/{id}` | ubah nama/satuan/COA/aktif |
| POST | `/supplies/items/{id}/write-down` | penyesuaian NRV dua arah (`{nrv, catatan?}`) |
| GET | `/supplies/opname?setting_id=` | daftar sesi |
| POST | `/supplies/opname` | buat sesi (snapshot qty sistem) |
| GET | `/supplies/opname/{id}` | detail sesi + baris |
| POST | `/supplies/opname/{id}/count` | simpan hasil hitung |
| POST | `/supplies/opname/{id}/verify` | verifikasi |
| POST | `/supplies/opname/{id}/approve` | setujui (`{post_surplus?}`) |
| GET | `/supplies/stock-card?setting_id=&item_id=&dari=&sampai=` | kartu stok |
| GET | `/supplies/reconciliation?setting_id=&sampai=` | GL vs kartu stok |
| GET | `/supplies/disclosure?setting_id=&dari=&sampai=` | catatan PSAK 14 |
| GET | `/master/itemlainlain/sub/data?id_item=` | daftar nama item |
| POST | `/master/itemlainlain/sub/store` \| `sub/update` \| `sub/hapus` | kelola nama item |

Contoh respons penyesuaian NRV:
```json
{
  "status": "ok",
  "arah": "turun",
  "journal_id": 1661,
  "nrv": 2000,
  "harga_buku": 3000,
  "biaya_semula": 3000,
  "nilai": 8000,
  "akumulasi_penurunan": 8000,
  "saldo_nilai_baru": 16000
}
```

---

## 10. Troubleshooting Teknis

| Gejala | Penyebab | Solusi |
|---|---|---|
| Menu baru tidak muncul | cache menu | `php artisan cache:clear`, logout-login |
| Halaman menu balik ke dashboard | URL menu belum dipetakan | pastikan entri ada di `src/config/menuUrlMap.js` |
| Dropdown menampilkan “undefined” | bentuk respons API berbeda | sudah dinormalisasi; pastikan build terbaru |
| Daftar nama item tidak berubah | cache GET 5 menit | halaman sudah bypass cache; hard refresh |
| Env baru tidak terpakai | config cache | `php artisan config:clear` |
| Stok tidak berkurang saat hapus pembelian | build lama | deploy terbaru (`reverseForPurchase`) |
| Tombol Simpan tidak bereaksi | field wajib belum valid | lihat pesan merah di kiri tombol |

---

## 11. Keterbatasan yang perlu diketahui (bukan bug)

1. **NRV per barang**, bukan per lot — memadai untuk perlengkapan namun tidak membedakan batch.
2. **Pengungkapan satu periode** (belum komparatif) dan belum ada **ekspor PDF**.
3. **Surplus** default **tidak** dijurnal (konservatif) — dicentang manual atau `ACC_SUPPLIES_POST_SURPLUS=true`.
4. **Resync edit** tidak memaksa stok minus: bila pemakaian melebihi, pengurangan dilewati + log warning.
5. Kontrol **maker-checker** opname opsional (`ACC_*_ENFORCE_SOD`); jejak audit tetap tersimpan.
6. Item master tanpa COA 118x **tidak** masuk kartu stok (by design).

---

### Catatan hasil verifikasi terakhir (dev)

```
Tests: 31 passed (214 assertions)
GL debit = kredit = 106.878.086.714,35  (selisih 0)
Neraca saldo debit = kredit = 40.976.073.536,35  (selisih 0)
Rekonsiliasi: GL 118x 35.000 = kartu stok 35.000 → seimbang
Saldo barang negatif: 0
```





