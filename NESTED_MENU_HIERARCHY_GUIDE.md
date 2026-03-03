# Nested Menu Hierarchy Guide

## Overview
Sistem menu management sekarang mendukung **nested hierarchy** penuh, di mana child menu dapat menjadi parent untuk menu lain. Ini memungkinkan struktur menu yang lebih kompleks dan fleksibel.

## Fitur Utama

### 1. Child Menu Dapat Menjadi Parent
- Menu yang sudah memiliki parent (child) tetap bisa memiliki child sendiri
- Tidak ada batasan kedalaman hierarki (unlimited nesting)
- Sistem otomatis mencegah circular reference

### 2. Visual Indicators

#### Di Tabel Menu
- **Badge "Child+Parent"**: Ditampilkan pada menu yang merupakan child sekaligus parent
- **Status Column**: 
  - `Item` (gray) - Menu biasa tanpa child
  - `Child` (blue) - Menu yang memiliki parent
  - `Parent` (green) - Menu yang memiliki child
  - `Child+Parent` (purple) - Menu yang memiliki parent DAN child
- **Level Indicator**: Menampilkan kedalaman hierarki (0 = root)

#### Di Dropdown Parent Menu (SearchableSelect)
- **Searchable**: Ketik untuk mencari menu
- **Indentasi visual** untuk menunjukkan hierarki (`└─`)
- **Emoji icons**: 📁 (parent), 📄 (child), 🔗 (child+parent)
- **Label status**: (child), (parent), (child+parent)
- **Clearable**: Klik X untuk reset ke root menu
- **Keyboard navigation**: Arrow keys untuk navigasi
- Sorting otomatis berdasarkan depth dan nama

### 3. Validasi Circular Reference
Sistem otomatis mencegah:
- Menu menjadi parent dari dirinya sendiri
- Menu menjadi parent dari parent-nya (circular loop)
- Validasi dilakukan saat memilih parent di modal

### 4. Statistics Dashboard
- **Total Menu**: Jumlah semua menu
- **Root Menu**: Menu tanpa parent (level 0)
- **Nested Parent**: Menu yang merupakan child sekaligus parent (purple badge)
- **Menu dengan URL**: Menu yang memiliki URL aktif
- **Max Depth**: Kedalaman maksimum hierarki

## Contoh Struktur

```
Dashboard (Root, Parent)
├── Analytics (Child, Parent)
│   ├── Sales Report (Child)
│   └── User Stats (Child, Parent)
│       └── Active Users (Child)
├── Settings (Child)
└── Reports (Child, Parent)
    └── Monthly (Child)
```

Dalam contoh di atas:
- `Analytics` adalah child dari `Dashboard` sekaligus parent dari `Sales Report` dan `User Stats`
- `User Stats` adalah child dari `Analytics` sekaligus parent dari `Active Users`
- Depth: Dashboard=0, Analytics=1, User Stats=2, Active Users=3

## Cara Menggunakan

### Membuat Menu Nested
1. Buka modal "Tambah Menu" atau "Edit Menu"
2. Pilih parent menu dari dropdown (termasuk menu yang sudah punya parent)
3. Sistem akan menampilkan semua menu kecuali:
   - Menu itu sendiri (jika edit)
   - Menu yang akan menyebabkan circular reference
4. Isi URL jika menu ini akan memiliki halaman sendiri
5. Simpan menu

### Melihat Struktur Hierarki
1. Klik tombol "Tree View" di header
2. Gunakan "Buka Semua" untuk expand semua node
3. Klik chevron untuk expand/collapse individual node

### Navigasi di Sidebar

#### Hybrid Toggle Behavior
- **Level 0 (Root)**: Accordion - hanya satu root menu terbuka (contoh: Head Office, System)
- **Level 1+ (Nested)**: Independent - multiple nested menus bisa terbuka bersamaan
- **Parent Stays Open**: Parent menu tetap terbuka ketika child menu di-toggle

#### Menu Types
- **Regular Parent** (tanpa URL): Klik untuk toggle submenu
- **Child+Parent** (dengan URL): 
  - Klik nama menu → Navigate ke halaman
  - Klik chevron (▼) → Toggle submenu

#### Example
```
✓ Head Office (root - closes other roots)
  ✓ Keuangan (nested - can be open with siblings)
     ├── Kas
     └── Bank
  ✓ Penjualan (nested - can be open)
✗ System (root - closed when Head Office opened)
```

## Data Format Support

Modal mendukung dua format data:

### 1. Flat Array Format
```json
[
  {"id": 1, "nama": "Dashboard", "parent_id": null, "depth": 0},
  {"id": 2, "nama": "Settings", "parent_id": 1, "depth": 1}
]
```

### 2. Tree Structure Format (Auto-Flattened)
```json
[
  {
    "id": 1,
    "nama": "Dashboard",
    "depth": 0,
    "has_children": true,
    "children": [
      {
        "id": 2,
        "nama": "Settings",
        "depth": 1,
        "has_children": false,
        "children": []
      }
    ]
  }
]
```

Modal otomatis mendeteksi format tree (dengan property `children`) dan melakukan flattening untuk dropdown.

## Technical Details

### Files Modified
1. `src/pages/system/MenuManagementPage.jsx`
   - Updated stats cards (5 cards instead of 4)
   - Added "Nested Parent" counter
   - Enhanced status column with Child+Parent indicator
   - Added badge in header

2. `src/pages/system/modals/AddEditMenuModal.jsx`
   - Removed filter that excluded child menus from parent dropdown
   - Added circular reference validation
   - **Replaced native select with SearchableSelect component**
   - Added tree structure flattening function
   - Enhanced dropdown with visual hierarchy (indentation + emoji icons)
   - Added status labels (child/parent/child+parent)
   - Added helper text explaining nested hierarchy feature
   - Supports both flat array and tree structure data formats

### Validation Logic
```javascript
wouldCreateCircularReference(potentialParentId, currentMenuId) {
  // Checks if selecting potentialParentId as parent would create a loop
  // Returns true if circular reference detected
}
```

### Tree Structure Flattening
Modal otomatis mendeteksi dan flatten struktur tree:
```javascript
flattenMenuTree(menus) {
  // Recursively flatten tree structure with children
  // Preserves depth information for visual hierarchy
  // Returns flat array with all menus (including nested children)
}
```

### Dropdown Filtering
```javascript
dropdownOptions = flattenedMenus
  .filter(menuItem => {
    // Exclude self
    if (itemId === currentMenuId) return false;
    
    // Exclude if would create circular reference
    if (wouldCreateCircularReference(itemId, currentMenuId)) return false;
    
    return true; // Include all other menus (including children)
  })
  .map(menuItem => ({
    label: `${indent}${menuItem.nama} (child/parent/child+parent)`,
    value: menuItem.id,
    depth: menuItem.depth
  }))
```

## Benefits

1. **Flexibility**: Struktur menu yang lebih kompleks dan natural
2. **Scalability**: Tidak ada batasan kedalaman hierarki
3. **Safety**: Validasi otomatis mencegah error
4. **Clarity**: Visual indicators yang jelas untuk memahami struktur
5. **User-Friendly**: Dropdown dengan indentasi memudahkan pemilihan parent

## Notes

- Backend API harus mendukung nested hierarchy
- Circular reference validation dilakukan di frontend
- Tree view modal otomatis menampilkan struktur nested
- Reordering tetap bekerja untuk setiap level hierarki
