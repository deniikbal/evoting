# Panduan Setup Database E-Voting

## Langkah 1: Hapus Database Lama di Neon
1. Login ke https://console.neon.tech
2. Pilih project Anda
3. Hapus database lama atau buat database baru

## Langkah 2: Dapatkan Connection String Baru
1. Copy connection string database baru dari Neon dashboard
2. Format: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

## Langkah 3: Update .env File
```bash
DATABASE_URL="[paste connection string di sini]"
```

## Langkah 4: Jalankan Migration
```bash
npm run db:push
```

Atau jika db:push bermasalah, gunakan SQL langsung:
```bash
# Migration file ada di: drizzle/0000_puzzling_colossus.sql
# Bisa dijalankan langsung di Neon SQL Editor
```

## Langkah 5: Jalankan Seeding
```bash
npm run db:seed
```

## Hasil Seeding
Setelah seeding berhasil, database akan memiliki:

### Admin
- Username: `admin`
- Password: `admin123`

### Pengaturan
- `voting_aktif`: false
- `waktu_mulai_voting`: (kosong)
- `waktu_selesai_voting`: (kosong)

### Kandidat (3 kandidat contoh)
1. Ahmad Rizki (Nomor Urut: 1)
2. Siti Nurhaliza (Nomor Urut: 2)
3. Budi Santoso (Nomor Urut: 3)

### Siswa (20 siswa contoh)
- NIS: 2024001 - 2024020
- Nama: Siswa 1 - Siswa 20
- Kelas: Random dari [XII IPA 1, XII IPA 2, XII IPS 1, XII IPS 2, XI IPA 1, XI IPA 2]
- Token: Random (sudah di-hash)

## Troubleshooting

### Jika npm run db:push timeout:
1. Buka Neon SQL Editor di browser
2. Copy isi file `drizzle/0000_puzzling_colossus.sql`
3. Paste dan jalankan langsung di SQL Editor

### Jika seed gagal:
1. Pastikan migration sudah berjalan dengan benar
2. Cek koneksi database di .env
3. Jalankan ulang: `npm run db:seed`

## Verifikasi
Setelah setup selesai, coba akses:
- Admin dashboard: login dengan admin/admin123
- API statistik: `/api/admin/statistik`
- API kandidat: `/api/kandidat`
