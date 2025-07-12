# Login Page Documentation

## Halaman Login Dashboard Sapi

Halaman login telah berhasil dibuat dengan fitur-fitur modern dan keamanan Cloudflare Turnstile captcha.

### Fitur Utama

1. **Desain Modern & Responsive**
   - Gradient background yang menarik
   - Mobile-friendly design
   - Smooth animations dan transitions
   - Clean dan minimalis UI

2. **Keamanan**
   - Cloudflare Turnstile captcha integration
   - Site key: `0x4AAAAAABk4XOgg4RBl7dSz`
   - Input validation
   - Protected routes

3. **User Experience**
   - Loading states
   - Error handling
   - Remember me functionality
   - Forgot password link
   - Demo credentials display

### Kredensial Demo

Untuk testing, gunakan kredensial berikut:
- **Email**: `admin@example.com`
- **Password**: `password`

### Cara Menggunakan

1. **Akses Halaman Login**
   - Buka browser dan navigasi ke `http://localhost:3001/login`
   - Atau jika belum login, akses route apapun akan redirect ke login

2. **Login Process**
   - Masukkan email dan password
   - Selesaikan captcha verification
   - Klik "Sign in"
   - Akan redirect ke dashboard setelah berhasil

3. **Logout**
   - Klik avatar/profile di header
   - Pilih "Logout" dari dropdown menu

### Struktur File

```
src/
├── pages/
│   └── LoginPage.jsx              # Halaman login utama
├── components/
│   ├── ProtectedRoute.jsx         # Route protection
│   └── Header.jsx                 # Header dengan logout functionality
├── styles/
│   └── login.css                  # CSS tambahan untuk login
└── App.jsx                        # Routing configuration
```

### Responsive Design

- **Desktop**: Full-size layout dengan semua elemen
- **Tablet**: Adjusted spacing dan font sizes
- **Mobile**: 
  - Compact layout
  - Scaled captcha (80% size)
  - Optimized touch targets
  - Minimized padding

### Customization

Untuk menyesuaikan tampilan:

1. **Colors**: Edit gradient di `LoginPage.jsx`
2. **Logo**: Ganti SVG icon di brand section
3. **Background**: Modifikasi pattern circles
4. **Captcha**: Update site key di captcha element

### Security Notes

- Authentication state disimpan di localStorage
- ProtectedRoute component melindungi semua routes
- Captcha verification required untuk login
- Error handling untuk failed login attempts

### Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

### Development

Untuk development:
```bash
npm start
```

Untuk production build:
```bash
npm run build
```

### Troubleshooting

1. **Captcha tidak muncul**
   - Pastikan koneksi internet stabil
   - Check browser console untuk errors
   - Verify site key valid

2. **Redirect issues**
   - Clear localStorage: `localStorage.clear()`
   - Refresh browser
   - Check console untuk navigation errors

3. **Styling issues**
   - Pastikan Tailwind CSS loaded
   - Check responsive viewport settings
   - Verify CSS classes applied correctly
