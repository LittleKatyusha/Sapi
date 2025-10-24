# API Integration Test for Item Lain-Lain by Klasifikasi

## Changes Implemented

### 1. Updated `useItemLainLainSelect` Hook
- **File**: `src/pages/ho/pembelianLainLain/hooks/useItemLainLainSelect.js`
- **Changes**:
  - Added support for filtering items by classification ID
  - New API endpoint: `POST /api/master/itemlainlain/databyklasifikasi`
  - Hook now accepts optional `klasifikasiId` parameter
  - Added `fetchItemLainLainByKlasifikasi` function for filtered fetching
  - Main `fetchItemLainLain` function now decides which API to call based on classification

### 2. Updated Parent Component
- **File**: `src/pages/ho/pembelianLainLain/addEditPembelianLainLain.jsx`
- **Changes**:
  - Added state for `selectedKlasifikasiForItems`
  - Pass `fetchItemLainLain` function to modal
  - Added `onKlasifikasiChange` callback to modal props
  - Added `itemLainLainLoading` prop to modal

### 3. Updated Modal Component
- **File**: `src/pages/ho/pembelianLainLain/modals/AddEditDetailModal.jsx`
- **Changes**:
  - Added `onKlasifikasiChange` and `itemLainLainLoading` props
  - Classification select now triggers item fetching when changed
  - Item select shows loading state and appropriate placeholders
  - Added warning message when no items found for selected classification

## API Route Implementation

The new API route that needs to be implemented in the backend:

```php
Route::post('databyklasifikasi', [ItemLainLainController::class, 'getDataByKlasifikasi'])
    ->middleware('permission:master.itemlainlain,getDataByKlasifikasi');
```

### Expected Request Format:
```json
{
  "id": 123
}
```

### Expected Response Format:
```json
{
  "status": "ok",
  "data": [
    {
      "id": 1,
      "pid": "encrypted_pid",
      "name": "Item Name",
      "description": "Item Description",
      "id_klasifikasi_lainlain": 123,
      "created_at": "2024-01-01",
      "updated_at": "2024-01-01"
    }
  ]
}
```

## How It Works

1. **User opens the Add/Edit Detail Modal**
   - Initially, all items are loaded (or none if no default classification)

2. **User selects a Classification**
   - The `onKlasifikasiChange` callback is triggered
   - This calls `fetchItemLainLain(klasifikasiId)` from the hook
   - The hook makes a POST request to `/api/master/itemlainlain/databyklasifikasi`

3. **Items are filtered**
   - The API returns only items matching the selected classification
   - The item select dropdown is updated with filtered options
   - Loading states are shown during the fetch

4. **User selects an item**
   - The filtered list makes it easier to find the right item
   - The selection works as before

## Testing Steps

1. Open the Pembelian Lain-Lain Add/Edit page
2. Click "Tambah Detail" to open the modal
3. Select a "Klasifikasi Lain-Lain" from the dropdown
4. Observe that the "Nama Item" dropdown updates with filtered items
5. Select an item and complete the form
6. Save the detail item

## Benefits

- **Improved UX**: Users can filter items by classification, making selection easier
- **Better Performance**: Only relevant items are loaded when needed
- **Backward Compatible**: Still supports loading all items if no classification is selected
- **Dynamic Loading**: Items are fetched on-demand based on user selection