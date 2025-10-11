# 🚀 Setup Neon Database Connection untuk E-Voting OSIS

## Langkah 1: Dapatkan Connection String Neon

1. Login ke dashboard Neon: https://neon.tech
2. Buat project baru atau pilih project yang ada
3. Klik pada project Anda
4. Klik 'Connection details' atau 'Connection string'
5. Copy connection string yang ada

Format connection string biasanya seperti ini:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Langkah 2: Update .env File

Edit file `.env` dan ganti `DATABASE_URL` dengan connection string Neon Anda:

```env
# Neon Postgres Database Connection
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## Langkah 3: Push Schema ke Neon

Jalankan perintah berikut untuk push schema database:

```bash
npm run db:push
```

## Langkah 4: Seed Data

Jalankan seed untuk membuat data awal:

```bash
npm run db:seed
```

## Langkah 5: Restart Aplikasi

Restart development server:

```bash
# Tekan Ctrl+C lalu jalankan kembali
npm run dev
```

## 🎉 Selesai!

Setelah setup selesai, Anda akan memiliki:
- ✅ Database Neon yang terhubung
- ✅ Schema database yang sudah di-push
- ✅ Data awal (admin, kandidat, siswa)
- ✅ Aplikasi siap digunakan

## 📊 Data Default

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**Data Sample:**
- 3 kandidat dengan visi & misi
- 20 siswa dengan token unik

## 🔧 Troubleshooting

Jika mengalami masalah:

1. **Connection Error:**
   - Periksa connection string Neon Anda
   - Pastikan database Neon sudah aktif
   - Periksa koneksi internet

2. **Schema Push Error:**
   - Hapus database di Neon dan buat baru
   - Jalankan `npm run db:push` lagi

3. **Seed Error:**
   - Jalankan `npm run db:seed` manual
   - Periksa apakah schema sudah benar

## 📝 Catatan

- Database Neon akan otomatis tersinkronisasi
- Data akan persisten (tidak hilang saat restart)
- Bisa diakses dari mana saja dengan connection string