# Cash Management Integration Analysis & Implementation Guide

## 📋 Overview
This document provides a comprehensive analysis of the cash management controllers and outlines the integration process for the frontend React application.

**Date:** December 6, 2025  
**Status:** Service Layer Complete ✅  
**Next Steps:** Frontend Component Creation

---

## 🎯 Controllers Analyzed

### 1. PengajuanBiayaController.php (Cash Budget Request)
**Location:** `src/pages/ho/keuanganKas/PengajuanBiayaController.php`  
**Purpose:** Handles creating and managing cash budget requests  
**Model:** `DataPengajuanBiaya`, `PengajuanBiaya`

#### Key Endpoints:
- `GET /api/ho/pengajuanbiaya/data` - Get paginated list with filtering
- `POST /api/ho/pengajuanbiaya/show` - Get detail by PID
- `POST /api/ho/pengajuanbiaya/store` - Create new request
- `POST /api/ho/pengajuanbiaya/update` - Update existing request
- `POST /api/ho/pengajuanbiaya/hapus` - Delete request
- `GET /api/ho/pengajuanbiaya/card` - Get dashboard statistics

#### Status Types:
- **tipe=1**: Approved/Rejected requests (status: 'Disetujui', 'Ditolak')
- **tipe=2**: Pending requests (status: 'Menunggu Persetujuan') - **Default**

---

### 2. PengeluaranPengajuanBiayaKasController.php (Cash Disbursement/Approval)
**Location:** `src/pages/ho/keuanganKas/PengeluaranPengajuanBiayaKasController.php`  
**Purpose:** Handles approval/rejection and disbursement of cash requests  
**Model:** `DataPengeluaranPengajuanBiayaKas`

#### Key Endpoints:
- `GET /api/ho/pengeluaranpengajuanbiayakas/data` - Get all requests
- `POST /api/ho/pengeluaranpengajuanbiayakas/show` - Get detail by PID
- `POST /api/ho/pengeluaranpengajuanbiayakas/approve` - Approve with payment details
- `POST /api/ho/pengeluaranpengajuanbiayakas/reject` - Reject with reason
- `POST /api/ho/pengeluaranpengajuanbiayakas/hapus` - Delete request
- `GET /api/ho/pengeluaranpengajuanbiayakas/card` - Get statistics
- `GET /api/ho/pengeluaranpengajuanbiayakas/file/{path}` - Get receipt file

#### Status Values:
- `1` = Menunggu Persetujuan (Pending)
- `2` = Disetujui (Approved)
- `3` = Ditolak (Rejected)

---

## ✅ Completed Work

### 1. Service Layer Created

#### pengajuanBiayaService.js (Updated)
**Location:** `src/services/pengajuanBiayaService.js`

**Key Methods:**
- `getData(params)` - Get paginated list with tipe filtering
- `getDetail(pid)` - Get detail by encrypted PID
- `getCardData()` - Get dashboard statistics
- `store(data)` - Create new request
- `update(pid, data)` - Update existing request
- `delete(pid)` - Delete request
- `transformData(item)` - Transform backend to frontend format
- `getStatusInfo(status)` - Get status badge configuration
- `formatCurrency(amount)` - Format IDR currency
- `formatDate(date)` - Format date to ID locale

---

#### pengeluaranPengajuanBiayaKasService.js (NEW)
**Location:** `src/services/pengeluaranPengajuanBiayaKasService.js`

**Key Methods:**
- `getData(params)` - Get paginated list with date filtering
- `getDetail(pid)` - Get detail by encrypted PID
- `getCardData()` - Get dashboard statistics
- `approve(pid, data)` - Approve with FormData support for file upload
- `reject(pid, reason)` - Reject request
- `delete(pid)` - Delete request
- `getFileUrl(filePath)` - Get MinIO file URL
- `transformData(item)` - Transform backend to frontend format
- `validateApprovalData(data)` - Validate approval form
- `validateRejectionData(reason)` - Validate rejection reason

**Special Features:**
- FormData support for file uploads (payment receipts)
- File validation (JPG/JPEG/PNG/PDF, max 2MB)
- Comprehensive validation utilities
- MinIO file handling

---

### 2. API Configuration Updated
**File:** `src/config/api.js`

Added:
```javascript
PENGAJUAN_BIAYA: '/api/ho/pengajuanbiaya'
PENGELUARAN_PENGAJUAN_BIAYA_KAS: '/api/ho/pengeluaranpengajuanbiayakas'
```

---

## 🏗️ Next Steps: Frontend Component Creation

### Phase 1: Create Page Structure

```
src/pages/ho/keuanganKas/
├── pengajuanBiaya/
│   ├── PengajuanBiayaPage.jsx
│   ├── components/
│   │   ├── PengajuanBiayaTable.jsx
│   │   ├── StatusBadge.jsx
│   │   └── StatCard.jsx
│   ├── modals/
│   │   ├── AddEditPengajuanModal.jsx
│   │   ├── DetailModal.jsx
│   │   └── DeleteConfirmModal.jsx
│   ├── hooks/
│   │   └── usePengajuanBiaya.js
│   └── constants/
│       └── tableStyles.js
│
└── pengeluaran/
    ├── PengeluaranKasPage.jsx
    ├── components/
    │   ├── PengeluaranTable.jsx
    │   ├── ApprovalStatusBadge.jsx
    │   └── StatCard.jsx
    ├── modals/
    │   ├── ApprovalModal.jsx
    │   ├── RejectionModal.jsx
    │   ├── DetailModal.jsx
    │   └── DeleteConfirmModal.jsx
    ├── hooks/
    │   └── usePengeluaranKas.js
    └── constants/
        └── tableStyles.js
```

---

### Phase 2: Key Component Features

#### PengajuanBiayaPage.jsx
- Tab navigation (Pending vs History)
- Dashboard cards with statistics
- DataTable with search and date filtering
- Add/Edit/Delete actions
- Export functionality

#### PengeluaranKasPage.jsx
- View all requests (all statuses)
- Dashboard cards showing approval statistics
- Quick approve/reject actions
- File download for receipts
- DataTable with advanced filtering

#### ApprovalModal.jsx (Critical Component)
**Form Fields:**
- nominal_disetujui (pre-filled)
- id_disetujui (dropdown)
- penerima_nominal
- tgl_pembayaran
- kota_pembayaran
- catatan_persetujuan (optional)
- file upload (optional, with drag & drop)

**Validation:** Uses `validateApprovalData()` from service

#### RejectionModal.jsx
**Form Fields:**
- reason (textarea, min 10 chars)

**Validation:** Uses `validateRejectionData()` from service

---

## 📚 Implementation Guidelines

### 1. Use Existing Patterns
Reference these modules for consistency:
- `src/pages/dataMaster/persetujuanHo/` - Similar approval workflow
- `src/pages/pembayaran/pembayaranFeedmil/` - Payment handling patterns
- `src/pages/ho/pembelianLainLain/` - DataTable and filtering patterns

### 2. Key Technologies
- **React** with functional components and hooks
- **DataTables** for table rendering
- **Tailwind CSS** for styling
- **React Hook Form** for form management (recommended)
- **Axios** via HttpClient for API calls

### 3. Security Considerations
- Always use encrypted PIDs for API calls
- Validate file uploads client-side before submission
- Implement proper error handling
- Use HTTPS in production

### 4. File Upload Best Practices
- Show file preview before upload
- Display upload progress
- Validate file type and size
- Handle upload errors gracefully
- Support drag & drop

---

## 🔄 Data Flow

```
User Creates Request → PengajuanBiayaController
                    ↓
            Status: "Menunggu Persetujuan"
                    ↓
Approver Reviews → PengeluaranPengajuanBiayaKasController
                    ↓
            Approve (Status: 2) + Upload Receipt
                 OR
            Reject (Status: 3) + Reason
                    ↓
            View in History
```

---

## 📋 Testing Checklist

- [ ] Create new cash request
- [ ] Edit pending request
- [ ] Delete pending request
- [ ] View request details
- [ ] Approve request with file upload
- [ ] Approve request without file
- [ ] Reject request with reason
- [ ] View approved requests
- [ ] View rejected requests
- [ ] Download payment receipt
- [ ] Search functionality
- [ ] Date range filtering
- [ ] Dashboard statistics display correctly
- [ ] Pagination works
- [ ] Export functionality
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive design

---

## 🚀 Summary

### ✅ What's Done:
1. Service layer for PengajuanBiaya (already existed, confirmed working)
2. NEW service layer for PengeluaranPengajuanBiayaKas with complete functionality
3. API endpoints configured
4. Comprehensive validation utilities
5. File upload support implemented
6. Data transformation utilities

### 🔨 What's Next:
1. Create page components following the structure above
2. Implement custom hooks for data management
3. Build modals for CRUD operations
4. Add approval/rejection workflows
5. Implement file upload UI with preview
6. Add comprehensive testing
7. Deploy and monitor

---

**Document Version:** 1.0  
**Last Updated:** December 6, 2025  
**Author:** Kilo Code