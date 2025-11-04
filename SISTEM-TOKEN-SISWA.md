# 🔐 Sistem Token Siswa - Panduan Lengkap

## 📋 Ringkasan Sistem

Sistem token untuk login siswa menggunakan **dual-token system** untuk keamanan:

1. **`plain_token`** - Token asli yang bisa dibaca (contoh: `A3F7K2`) untuk dibagikan ke siswa
2. **`token`** - Token yang di-hash dengan bcrypt untuk keamanan database

## 🔄 Alur Kerja Sistem Token

### 1️⃣ **Saat Menambah Siswa Baru**

```
Admin menambah siswa → 
  ├─ Generate plain_token: "A3F7K2"
  ├─ Hash token: "$2a$10$xyz..." 
  └─ Simpan keduanya ke database
      ├─ plain_token: "A3F7K2" (readable)
      └─ token: "$2a$10$xyz..." (hashed)
```

**Kode yang dijalankan:**
```javascript
const plainToken = Math.random().toString(36).substring(2, 8).toUpperCase()
const hashedToken = await bcrypt.hash(plainToken, 10)

// Simpan ke database
await db.insert(siswa).values({
  nis: "2024001",
  namaLengkap: "Ahmad Fauzi",
  kelas: "XII IPA 1",
  token: hashedToken,        // Hash untuk keamanan
  plainToken: plainToken     // Plain untuk dibagikan
})
```

### 2️⃣ **Export Token untuk Dibagikan ke Siswa**

```
Admin klik "Export Token" → 
  ├─ Ambil semua data siswa (nis, nama, kelas, plain_token)
  ├─ Generate Excel file dengan format:
  │   ┌─────────┬──────────────┬───────────┬────────┐
  │   │   NIS   │ Nama Lengkap │   Kelas   │ Token  │
  │   ├─────────┼──────────────┼───────────┼────────┤
  │   │ 2024001 │ Ahmad Fauzi  │ XII IPA 1 │ A3F7K2 │
  │   │ 2024002 │ Siti Aisyah  │ XII IPA 1 │ B8K9M1 │
  │   └─────────┴──────────────┴───────────┴────────┘
  └─ Download file "tokens-siswa.xls"
```

### 3️⃣ **Distribusi ke Siswa**

**Opsi 1: Print & Bagikan**
```
1. Print Excel file
2. Potong per baris / buat kartu token
3. Bagikan ke masing-masing siswa
```

**Opsi 2: Digital**
```
1. Filter per kelas di Excel
2. Kirim ke wali kelas via WhatsApp/Email
3. Wali kelas distribusikan ke siswa
```

### 4️⃣ **Siswa Login**

```
Siswa buka halaman login →
  ├─ Input NIS: "2024001"
  ├─ Input Token: "A3F7K2"
  └─ Submit

Backend verifikasi:
  ├─ Cari siswa berdasarkan NIS
  ├─ Ambil token hash dari database
  ├─ Compare: bcrypt.compare("A3F7K2", "$2a$10$xyz...")
  └─ Jika cocok → Login berhasil ✅
```

## 🗄️ Struktur Database

### Tabel: `siswa`

| Kolom | Type | Deskripsi | Contoh |
|-------|------|-----------|--------|
| `id` | INTEGER | Primary key | 1 |
| `nis` | VARCHAR | NIS siswa (unique) | "2024001" |
| `nama_lengkap` | VARCHAR | Nama lengkap siswa | "Ahmad Fauzi" |
| `kelas` | VARCHAR | Kelas siswa | "XII IPA 1" |
| `classroom_id` | INTEGER | FK ke tabel classroom | 5 |
| **`token`** | VARCHAR | **Token hash (bcrypt)** | "$2a$10$abc..." |
| **`plain_token`** | VARCHAR | **Token asli (readable)** | "A3F7K2" |
| `sudah_memilih` | BOOLEAN | Status voting | false |
| `created_at` | TIMESTAMP | Tanggal dibuat | 2024-11-04 |

## 🚀 Cara Setup/Migrasi

### Untuk Database Baru (Fresh Install)

Database sudah include kolom `plain_token`, tidak perlu migrasi.

### Untuk Database yang Sudah Ada

Jalankan migration SQL:

```bash
psql -U your_username -d your_database_name -f migrations/add_plain_token.sql
```

**⚠️ PENTING setelah migrasi:**
1. Langsung export token: Menu Admin → Data Siswa → Export Token
2. Simpan file Excel dengan baik
3. Bagikan ke siswa sebelum voting dimulai

## 📱 Contoh Kartu Token untuk Siswa

```
┌──────────────────────────────────┐
│   E-VOTING KETUA OSIS 2024       │
├──────────────────────────────────┤
│  NIS    : 2024001                │
│  Nama   : Ahmad Fauzi            │
│  Kelas  : XII IPA 1              │
│                                  │
│  TOKEN  : A3F7K2                 │
│                                  │
│  Login di:                       │
│  http://voting.sekolah.sch.id    │
└──────────────────────────────────┘
```

## 🔒 Keamanan

### Mengapa Pakai Dual-Token?

1. **`plain_token` di database**: 
   - Untuk admin bisa export dan bagikan ke siswa
   - Siswa tidak perlu reset password
   - Admin bisa lihat token jika siswa lupa

2. **`token` (hashed) di database**:
   - Untuk keamanan verifikasi login
   - Jika database bocor, hacker tidak bisa langsung pakai token
   - Mengikuti best practice security

### Best Practices

✅ **DO:**
- Simpan file Excel token di tempat aman
- Bagikan token hanya kepada siswa yang bersangkutan
- Hapus file Excel setelah voting selesai

❌ **DON'T:**
- Jangan bagikan token di grup WhatsApp umum
- Jangan simpan token dalam format yang bisa diakses publik
- Jangan share screenshot Excel ke media sosial

## 🛠️ API Endpoints

### 1. Export Token
```
GET /api/admin/siswa/tokens
Response: Excel file dengan plain_token
```

### 2. Login Siswa
```
POST /api/auth/siswa/login
Body: { nis: "2024001", token: "A3F7K2" }
Process: Compare dengan bcrypt hash
```

## ❓ FAQ

**Q: Bagaimana jika siswa lupa token?**
A: Admin bisa export ulang token kapan saja. Token tidak berubah kecuali di-reset manual.

**Q: Apakah token bisa digunakan berkali-kali?**
A: Ya, token hanya untuk login. Setelah voting, `sudah_memilih` menjadi `true` dan siswa tidak bisa vote lagi.

**Q: Bagaimana cara generate token baru untuk siswa tertentu?**
A: Saat ini belum ada fitur ini. Token hanya bisa di-generate saat menambah siswa baru atau import.

**Q: Format token apa yang digunakan?**
A: 6 karakter alphanumeric uppercase (contoh: A3F7K2, B8K9M1)

## 📞 Troubleshooting

### Siswa tidak bisa login dengan token yang diberikan

**Penyebab:**
- Token salah ketik (huruf O vs angka 0, huruf I vs angka 1)
- Token belum ter-generate (data lama sebelum sistem dual-token)

**Solusi:**
1. Pastikan siswa input token persis seperti di kartu (huruf besar semua)
2. Export ulang token dan cek apakah token siswa tersebut ada
3. Jika perlu, hapus dan tambah ulang siswa tersebut

### Error "plainToken is required" saat menambah siswa

**Penyebab:** Migration belum dijalankan

**Solusi:**
```bash
psql -U username -d database -f migrations/add_plain_token.sql
```

---

**Last Updated:** 2024-11-04  
**Version:** 2.0 (Dual-Token System)
