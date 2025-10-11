# 🚀 Setup Neon Database - Panduan Lengkap

Aplikasi E-Voting OSIS telah dikonfigurasi untuk menggunakan database Neon Postgres! Berikut adalah panduan lengkap untuk menghubungkannya.

## 📋 Langkah 1: Dapatkan Connection String Neon

1. **Buka Neon Dashboard**: [https://neon.tech](https://neon.tech)
2. **Login** atau buat akun baru
3. **Buat Project Baru** atau pilih project yang ada
4. **Copy Connection String** dari menu "Connection Details"

Format connection string:
```
postgresql://username:password@host:port/database?sslmode=require
```

## 🛠️ Langkah 2: Update Konfigurasi

### Opsi A: Menggunakan Halaman Setup (Recommended)

1. Buka aplikasi di browser
2. Klik tombol **"Setup Database Neon"** di halaman login
3. Masukkan connection string Neon Anda
4. Klik **"Test Koneksi"** untuk validasi
5. Ikuti instruksi selanjutnya

### Opsi B: Manual Setup

1. Edit file `.env` di root project:
```env
# Ganti dengan connection string Neon Anda
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## 🔄 Langkah 3: Push Schema & Seed Data

Jalankan perintah berikut di terminal:

```bash
# Push schema database ke Neon
npm run db:push

# Seed data awal (admin, kandidat, siswa)
npm run db:seed
```

## ✅ Langkah 4: Verifikasi Setup

Setelah setup selesai, Anda dapat:

1. **Login Admin**:
   - URL: `/admin`
   - Username: `admin`
   - Password: `admin123`

2. **Cek Database**:
   - Buka dashboard Neon
   - Lihat tabel yang telah dibuat
   - Verifikasi data seed

## 📊 Data yang Akan Dibuat

### Tabel Database:
- `admin` - Data administrator
- `siswa` - Data siswa pemilih
- `kandidat` - Data kandidat OSIS
- `pengaturan` - Konfigurasi sistem

### Data Awal:
- **1 Admin** dengan username `admin`
- **3 Kandidat** sample dengan visi & misi
- **20 Siswa** sample dengan token unik
- **Pengaturan** voting (non-aktif secara default)

## 🔧 Troubleshooting

### Connection Error
```bash
Error: P1013: The provided database string is invalid
```
**Solusi**: Periksa kembali connection string Neon Anda

### Schema Push Error
```bash
Error: P5002: The database is empty
```
**Solusi**: Pastikan database Neon sudah dibuat dan connection string benar

### Seed Error
```bash
Error: Unique constraint failed
```
**Solusi**: Hapus semua data di database Neon dan jalankan ulang seed

## 🚀 Fitur yang Tersedia

Setelah terhubung ke Neon, Anda mendapatkan:
- ✅ Database cloud yang persisten
- ✅ Auto-scaling dan backup
- ✅ Akses dari mana saja
- ✅ Data tidak hilang saat restart
- ✅ Performa lebih baik dari SQLite

## 📝 Catatan Penting

- **Environment Variables**: Jangan share connection string ke public
- **Backup**: Neon menyediakan backup otomatis
- **Scaling**: Database dapat otomatis scaling sesuai kebutuhan
- **SSL**: Koneksi menggunakan SSL secara default

## 🎞️ Quick Start Commands

```bash
# Test connection (jika menggunakan halaman setup)
# Buka: http://localhost:3000/neon-setup

# Manual setup
# 1. Update .env file
# 2. Push schema
npm run db:push

# 3. Seed data
npm run db:seed

# 4. Restart aplikasi
npm run dev
```

## 🆘 Bantuan

Jika mengalami masalah:
1. Periksa connection string Neon
2. Pastikan database Neon aktif
3. Coba buat project baru di Neon
4. Hubungi support Neon

---

**Selamat! Aplikasi E-Voting OSIS Anda siap digunakan dengan database Neon! 🎉**