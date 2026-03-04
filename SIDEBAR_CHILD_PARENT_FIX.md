# Sidebar Child+Parent Menu Fix

## Problem
Ketika user mengklik menu yang merupakan **child+parent** (menu yang memiliki parent DAN children), sidebar menutup parent menu alih-alih navigate ke URL menu tersebut.

### Example Scenario
```
Head Office (parent)
├── Keuangan (child+parent) ← Clicking this closes "Head Office"
│   ├── Kas (child)
│   └── Bank (child)
```

**Expected Behavior:**
- Klik "Keuangan" → Navigate ke halaman Keuangan
- Klik chevron di sebelah "Keuangan" → Toggle submenu (Kas, Bank)

**Actual Behavior (Before Fix):**
- Klik "Keuangan" → Toggle submenu (tidak navigate)
- Parent "Head Office" menutup

## Root Cause

Ada DUA masalah yang menyebabkan parent menu menutup:

### Problem 1: Toggle Logic in LayoutSecure
Fungsi `toggleMenu` di `LayoutSecure.jsx` menutup SEMUA menu lain ketika membuka satu menu:

```javascript
// Before: Closes all other menus (accordion behavior)
const toggleMenu = (menuName) => {
  if (prev[menuName]) {
    return { ...prev, [menuName]: false };
  } else {
    const newExpandedMenus = {};  // ❌ Clears all other menus!
    newExpandedMenus[menuName] = true;
    return newExpandedMenus;
  }
};
```

Ini menyebabkan ketika klik "Keuangan", parent "Head Office" ikut tertutup.

### Problem 2: DynamicMenuItem UI
Komponen `DynamicMenuItem` memperlakukan semua menu dengan children sebagai "parent-only" menu, yang hanya berfungsi untuk toggle expand/collapse. Tidak ada penanganan khusus untuk menu yang memiliki BOTH children AND URL.

```javascript
// Before: All menus with children treated as toggle-only
if (hasChildren) {
  return (
    <button onClick={handleMenuClick}>  // Only toggles, no navigation
      {item.nama}
      <ChevronIcon />
    </button>
  );
}
```

## Solution

### Fix 1: Hybrid Toggle Behavior (LayoutSecure.jsx)

Implementasi **hybrid toggle** dengan behavior berbeda per level:

```javascript
// After: Hybrid behavior based on depth
const toggleMenu = (menuName, depth = 0) => {
  if (depth === 0) {
    // Level 0 (root): Accordion - close other root menus
    const rootMenuNames = menuTree.map(item => item.id || item.nama);
    const newExpandedMenus = { ...prev };
    
    rootMenuNames.forEach(rootName => {
      if (rootName !== menuName) {
        newExpandedMenus[rootName] = false;
      }
    });
    
    newExpandedMenus[menuName] = !prev[menuName];
    return newExpandedMenus;
  }
  
  // Level 1+ (nested): Independent toggle
  return {
    ...prev,
    [menuName]: !prev[menuName]
  };
};
```

**Benefits:** 
- Root menus use accordion (cleaner sidebar)
- Nested menus stay open (better navigation)

### Fix 2: Split UI for Child+Parent Menus (DynamicMenuItem.jsx)

Membedakan antara dua tipe parent menu:

### 1. Regular Parent (No URL)
Menu yang hanya sebagai container untuk submenu:
```javascript
{
  nama: "Head Office",
  url: "#",  // or null
  children: [...]
}
```
**Behavior:** Klik menu → Toggle expand/collapse

### 2. Child+Parent (Has URL)
Menu yang memiliki halaman sendiri DAN submenu:
```javascript
{
  nama: "Keuangan",
  url: "/keuangan",  // Has actual URL
  children: [...]
}
```
**Behavior:** 
- Klik menu → Navigate ke URL
- Klik chevron button → Toggle expand/collapse

## Implementation

### Split UI for Child+Parent Menus

```javascript
if (hasChildren) {
  const hasUrl = item.url && item.url !== '#';
  
  if (hasUrl) {
    // Child+Parent: Split into Link + Toggle Button
    return (
      <div className="flex items-center">
        {/* Main clickable area - navigates to URL */}
        <Link to={item.url} className="flex-1 rounded-l-lg">
          {/* Menu icon and label */}
        </Link>
        
        {/* Separate toggle button for submenu */}
        <button onClick={handleMenuClick} className="rounded-r-lg">
          <ChevronIcon />
        </button>
      </div>
    );
  } else {
    // Regular Parent: Single button for toggle only
    return (
      <button onClick={handleMenuClick} className="w-full rounded-lg">
        {/* Menu icon, label, and chevron */}
      </button>
    );
  }
}
```

### Visual Design

#### Regular Parent Menu
```
┌─────────────────────────────────┐
│ 📁 Head Office            ▼     │  ← Full width button (toggle)
└─────────────────────────────────┘
```

#### Child+Parent Menu
```
┌──────────────────────────┬──────┐
│ 🔗 Keuangan              │  ▼   │  ← Split: Link + Button
└──────────────────────────┴──────┘
   ↑ Click to navigate     ↑ Click to toggle
```

### Key Changes

1. **URL Detection**
   ```javascript
   const hasUrl = item.url && item.url !== '#';
   ```

2. **Conditional Rendering**
   - `hasUrl === true` → Split UI (Link + Button)
   - `hasUrl === false` → Single button (Toggle only)

3. **Styling**
   - Link: `rounded-l-lg` (left rounded corners)
   - Button: `rounded-r-lg` (right rounded corners)
   - Both share same hover/active states

4. **Accessibility**
   - Toggle button has `title="Toggle submenu"`
   - Clear visual separation between clickable areas
   - Keyboard navigation works for both Link and Button

## Benefits

✅ **Intuitive UX**: Click menu name → navigate, click chevron → toggle
✅ **No Accidental Closes**: Parent menu stays open when navigating to child+parent
✅ **Consistent Behavior**: Regular parents still work as before
✅ **Visual Clarity**: Split UI makes it obvious there are two actions
✅ **Keyboard Friendly**: Tab navigation works correctly
✅ **Mobile Compatible**: Touch targets are clear and separate

## Testing Checklist

- [x] Regular parent menu (no URL) toggles correctly
- [x] Child+parent menu (with URL) navigates on click
- [x] Child+parent chevron button toggles submenu
- [x] Parent menu stays open when navigating to child+parent
- [x] Active state highlights correctly
- [x] Hover states work on both Link and Button
- [x] Keyboard navigation (Tab, Enter) works
- [x] Mobile touch targets are adequate
- [x] Nested hierarchy (3+ levels) works correctly
- [x] Collapsed sidebar shows icons correctly

## Example Menu Structure

```javascript
[
  {
    nama: "Dashboard",
    url: "/dashboard",
    icon: "layout-dashboard",
    children: []  // Leaf node
  },
  {
    nama: "Head Office",
    url: "#",  // Regular parent (no URL)
    icon: "folder",
    children: [
      {
        nama: "Keuangan",
        url: "/keuangan",  // Child+Parent (has URL)
        icon: "wallet",
        children: [
          {
            nama: "Kas",
            url: "/keuangan/kas",  // Leaf node
            children: []
          },
          {
            nama: "Bank",
            url: "/keuangan/bank",  // Leaf node
            children: []
          }
        ]
      }
    ]
  }
]
```

## User Flow

### Before Fix
```
1. User clicks "Head Office" → Expands
2. User clicks "Keuangan" → Toggles
3. "Head Office" closes unexpectedly ❌
4. "Keuangan" and its children disappear
5. User confused 😕
```

### After Fix
```
1. User clicks "Head Office" → Expands
2. User clicks "Keuangan" → Expands (shows Kas, Bank)
3. "Head Office" stays open ✅
4. User clicks "Kas" → Navigates to /ho/keuangan-kas
5. All parent menus stay open
6. User happy 😊
```

## Behavior Changes

### Old Behavior (Full Accordion)
- Opening one menu closes all others (any level)
- Only one menu can be expanded at a time
- Parent closes when child is toggled

### New Behavior (Hybrid Toggle)
- **Level 0 (Root)**: Accordion - only one root menu open at a time
- **Level 1+ (Nested)**: Independent - multiple nested menus can be open
- Parent stays open when child is toggled
- Better balance between clean UI and navigation efficiency

### Example
```
Dashboard
✓ Head Office (root - closes other roots)
  ├── Pembelian
  ✓ Keuangan (nested - can be open with siblings)
     ├── Kas
     └── Bank
✗ System (root - closed when Head Office opened)
  └── Menu Management
```

## Technical Notes

### URL Validation
```javascript
const hasUrl = item.url && item.url !== '#';
```
- `null`, `undefined`, `''`, `'#'` → Treated as no URL
- Any other string → Treated as valid URL

### Styling Consistency
Both Link and Button share:
- Same height (`py-2.5`)
- Same hover states
- Same active states
- Same transition timing

### Performance
No performance impact:
- Same number of DOM elements
- No additional re-renders
- Memoization not needed (simple conditional)

## Files Modified

1. `src/components/LayoutSecure.jsx`
   - **Changed toggle logic** from accordion (close others) to independent toggle
   - Allows multiple menus to be expanded simultaneously
   - Preserves parent menu state when toggling children

2. `src/components/DynamicMenuItem.jsx`
   - Added URL detection logic
   - Split UI for child+parent menus
   - Maintained backward compatibility

## Browser Compatibility

Tested and working on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements:
- [ ] Add tooltip on hover explaining the split behavior
- [ ] Add visual indicator (e.g., small arrow icon) on child+parent menus
- [ ] Add animation when toggling submenu
- [ ] Add right-click context menu for quick actions
