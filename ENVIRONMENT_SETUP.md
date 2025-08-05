# Environment Setup Guide

## Environment Files

Proyek ini menggunakan environment files untuk konfigurasi yang berbeda antara development dan production.

### File Environment

1. **`.env.development`** - Untuk development
2. **`.env.production`** - Untuk production
3. **`.env.local`** - Untuk override lokal (opsional, tidak di-commit ke git)

### Variables yang Tersedia

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:8000` | `https://puput-api.ternasys.com` | Base URL untuk API |
| `REACT_APP_ENV` | `development` | `production` | Environment identifier |
| `REACT_APP_DEBUG` | `true` | `false` | Enable/disable debug logging |

## Build Scripts

### Development
```bash
# Start development server
npm start
# atau
npm run start:dev

# Build untuk development
npm run build:dev
```

### Production
```bash
# Start dengan production config (testing)
npm run start:prod

# Build untuk production
npm run build:prod

# Serve production build locally
npm run serve:prod
```

## Deployment

### Development Deployment
```bash
npm run build:dev
# Deploy folder 'build' ke development server
```

### Production Deployment  
```bash
npm run build:prod
# Deploy folder 'build' ke production server
```

## Environment Validation

Aplikasi akan otomatis memvalidasi environment configuration saat startup. 

### Development
- Console akan menampilkan informasi environment
- Debug logging akan aktif
- Error akan ditampilkan di console

### Production
- Debug logging dimatikan
- Environment errors akan di-handle secara graceful
- Minimal logging untuk performance

## Troubleshooting

### Jika API tidak terhubung:
1. Pastikan `.env.development` atau `.env.production` ada
2. Periksa nilai `REACT_APP_API_BASE_URL`
3. Restart development server setelah mengubah environment variables

### Jika build gagal:
1. Hapus folder `build` dan `node_modules`
2. Run `npm install`
3. Run build command lagi

### Environment variables tidak terbaca:
1. Pastikan variable dimulai dengan `REACT_APP_`
2. Restart development server
3. Periksa tidak ada typo di nama variable
