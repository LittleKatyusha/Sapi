# Dynamic Title Implementation Guide

## 🎯 Overview

The React app now features a comprehensive dynamic title system that automatically updates the browser tab title based on the current route and application state. This enhances user experience by providing contextual information in the browser tab.

## 🚀 Features Implemented

### 1. Automatic Route-Based Titles
- Titles automatically update when navigating between routes
- Uses the existing `pageTitleMap` configuration
- Fallback to default title for unmapped routes

### 2. Custom Title Management
- Set custom titles for specific components or states
- Temporary titles that auto-reset after a specified duration
- Manual title control with the `setTitle` function

### 3. Notification Titles
- Show temporary notifications in the title bar
- Different types: notifications, errors, success messages
- Automatic reset to original title after duration

### 4. Loading State Titles
- Automatically show loading indicators in titles
- Customizable loading text
- Auto-reset when loading completes

## 📁 Files Created/Modified

### New Files
- `src/hooks/useDocumentTitle.js` - Main dynamic title hook
- `src/components/DynamicTitleExample.jsx` - Usage examples
- `DYNAMIC_TITLE_GUIDE.md` - This documentation

### Modified Files
- `src/AppSecure.jsx` - Integrated dynamic title hook
- `public/index.html` - Simplified base title to "TernaSys"

## 🔧 Implementation Details

### Base Title Configuration
The base title in `public/index.html` is now simplified to "TernaSys" and gets dynamically updated by the React application.

### Hook Integration
The `useDocumentTitle()` hook is integrated into the main `AppSecure` component to automatically handle route-based title updates.

## 📖 Usage Examples

### 1. Basic Route-Based Titles (Automatic)
```javascript
// Already implemented in AppSecure.jsx
import useDocumentTitle from './hooks/useDocumentTitle';

function AppSecure() {
  // This automatically updates titles based on routes
  useDocumentTitle();
  // ... rest of component
}
```

### 2. Custom Titles in Components
```javascript
import useDocumentTitle from '../hooks/useDocumentTitle';

const MyComponent = () => {
  const { setTitle } = useDocumentTitle();
  
  useEffect(() => {
    setTitle('Custom Page Title');
  }, [setTitle]);
  
  return <div>My Component</div>;
};
```

### 3. Notification Titles
```javascript
import { useNotificationTitle } from '../hooks/useDocumentTitle';

const MyComponent = () => {
  const { showNotification, showError, showSuccess } = useNotificationTitle();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data berhasil disimpan!');
    } catch (error) {
      showError('Gagal menyimpan data');
    }
  };
  
  return (
    <button onClick={handleSave}>Save Data</button>
  );
};
```

### 4. Loading State Titles
```javascript
import { useLoadingTitle } from '../hooks/useDocumentTitle';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Automatically shows loading in title when isLoading is true
  useLoadingTitle(isLoading, 'Memuat data...');
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };
  
  return <div>My Component</div>;
};
```

### 5. Temporary Titles
```javascript
import useDocumentTitle from '../hooks/useDocumentTitle';

const MyComponent = () => {
  const { setTitle } = useDocumentTitle();
  
  const showTemporaryMessage = () => {
    // Shows title for 3 seconds, then resets
    setTitle('Pesan Sementara', true);
  };
  
  return (
    <button onClick={showTemporaryMessage}>Show Message</button>
  );
};
```

## ⚙️ Configuration Options

### useDocumentTitle Options
```javascript
const { setTitle } = useDocumentTitle(customTitle, {
  suffix: 'TernaSys',           // Suffix added to all titles
  prefix: '',                  // Prefix added to all titles
  separator: ' | ',            // Separator between parts
  updateOnRouteChange: true,   // Auto-update on route changes
  resetOnUnmount: false        // Reset title when component unmounts
});
```

### Notification Duration
```javascript
const { showNotification } = useNotificationTitle();

// Custom duration (default: 3000ms)
showNotification('Message', 5000);
showError('Error message', 10000);
showSuccess('Success message', 2000);
```

## 🎨 Title Format

The dynamic title system follows this format:
```
[Prefix] | [Page Title] | [Suffix]
```

Examples:
- Dashboard: "Dashboard | TernaSys"
- Login: "Login | TernaSys"
- Custom: "Custom Title | TernaSys"
- Notification: "🔔 New Message | TernaSys"
- Loading: "⏳ Memuat... | TernaSys"

## 🔍 Development Features

### Debug Logging
When `NODE_ENV=development`, the system logs title changes:
```
📄 Title updated: "Dashboard | TernaSys"
```

### Route Change Logging
Enhanced route change logging now includes title information:
```javascript
console.log('📍 AppSecure Route Change:', {
  pathname: location.pathname,
  isLoginPage,
  title: document.title,
  timestamp: new Date().toISOString()
});
```

## 🧪 Testing the Implementation

### 1. Route-Based Titles
- Navigate between different routes
- Observe title changes in browser tab
- Check that unmapped routes use default title

### 2. Custom Titles
- Use the `DynamicTitleExample` component
- Test custom title setting
- Verify temporary titles reset correctly

### 3. Notification Titles
- Test notification, error, and success titles
- Verify they reset to original title after duration
- Check different duration settings

### 4. Loading Titles
- Test loading state integration
- Verify loading indicator appears in title
- Check auto-reset when loading completes

## 📋 Best Practices

### 1. Title Naming
- Keep titles concise and descriptive
- Use consistent naming conventions
- Include context when necessary

### 2. Notification Usage
- Use notifications sparingly to avoid annoyance
- Choose appropriate durations (3-5 seconds)
- Use different types for different message severities

### 3. Loading States
- Always pair with visual loading indicators
- Use descriptive loading text
- Ensure loading states are properly cleared

### 4. Custom Titles
- Set custom titles in useEffect hooks
- Consider component lifecycle when setting titles
- Use temporary titles for short-lived messages

## 🚀 Future Enhancements

### Potential Improvements
1. **Breadcrumb Titles**: Show navigation breadcrumbs in titles
2. **User Context**: Include user name or role in titles
3. **Unread Counts**: Show notification counts in titles
4. **Favicon Updates**: Change favicon based on state
5. **Title History**: Track title change history for debugging

### Advanced Features
1. **SEO Integration**: Enhanced meta tag management
2. **Analytics**: Track title change events
3. **Accessibility**: Screen reader announcements for title changes
4. **Internationalization**: Multi-language title support

## 📞 Support

### Common Issues
1. **Title Not Updating**: Check if useDocumentTitle is properly imported and called
2. **Notifications Not Showing**: Verify notification hooks are used correctly
3. **Loading States Stuck**: Ensure loading state is properly cleared

### Debugging
- Enable development mode for debug logging
- Check browser console for title update logs
- Use React DevTools to inspect hook states

### Implementation Help
- Review the `DynamicTitleExample.jsx` component for usage patterns
- Check existing route configurations in `pageTitleMap.js`
- Test with different route combinations and states
