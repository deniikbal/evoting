# Cloudinary Setup Guide

## Kenapa Cloudinary?
Vercel tidak mendukung persistent file storage. Semua file yang di-upload ke filesystem akan hilang karena serverless functions bersifat ephemeral. Cloudinary menyediakan cloud storage dengan CDN global untuk menyimpan gambar kandidat.

## Free Tier
- 25 GB storage
- 25 GB bandwidth per bulan
- 1,000 transformations per bulan
- Cukup untuk aplikasi e-voting sekolah

## Setup Steps

### 1. Buat Akun Cloudinary
1. Kunjungi https://cloudinary.com/users/register/free
2. Daftar dengan email sekolah (gratis)
3. Verifikasi email Anda

### 2. Dapatkan Credentials
1. Login ke dashboard Cloudinary
2. Di halaman Dashboard, Anda akan melihat:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Setup Environment Variables

#### Local Development (.env.local)
Buat file `.env.local` di root project dan tambahkan:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Vercel Production
1. Buka project di Vercel Dashboard
2. Pergi ke **Settings > Environment Variables**
3. Tambahkan 3 environment variables:
   - `CLOUDINARY_CLOUD_NAME` = (cloud name Anda)
   - `CLOUDINARY_API_KEY` = (API key Anda)
   - `CLOUDINARY_API_SECRET` = (API secret Anda)
4. Pilih environment: **Production**, **Preview**, **Development** (centang semua)
5. Klik **Save**
6. **Redeploy** aplikasi agar environment variables aktif

### 4. Redeploy Aplikasi
Setelah environment variables ditambahkan:
```bash
git add .
git commit -m "Add Cloudinary integration for image storage"
git push origin main
```

Atau deploy manual dari Vercel Dashboard.

## Fitur yang Ditambahkan
- ✅ Upload gambar kandidat ke Cloudinary
- ✅ Auto-resize maksimal 800x800px
- ✅ Auto-optimization (quality & format)
- ✅ CDN global untuk loading cepat
- ✅ Folder organization: `evoting/kandidat/`

## Troubleshooting

### Error: "Missing Cloudinary credentials"
- Pastikan semua 3 environment variables sudah ditambahkan di Vercel
- Redeploy aplikasi setelah menambahkan environment variables

### Error 400 saat upload
- Periksa API credentials di dashboard Cloudinary
- Pastikan tidak ada typo di environment variables

### Gambar tidak muncul
- Periksa URL yang dikembalikan dari upload endpoint
- URL harus berformat: `https://res.cloudinary.com/your-cloud-name/...`

## Monitoring
Pantau usage di Cloudinary Dashboard:
- **Dashboard > Usage**: Lihat storage dan bandwidth usage
- **Media Library**: Lihat semua gambar yang ter-upload
