# Keputusan desain halaman Pegawai (admin)

Ditulis setelah redesign `/admin/pegawai` dengan filter antislop (mode DURING).

## Masalah yang diperbaiki

1. **Token login tampil di UI.** Kolom `Token` di tabel, tombol salin per baris, kartu
   mobile, dialog kredensial, dan daftar hasil import semuanya memperlihatkan token 6
   karakter. `DESIGN.md` batasan 4 sudah menyatakannya: token login bukan identitas
   pemilih dan tidak boleh tampil. Jalur memilih pegawai sekarang lewat QR (`/vote`),
   jadi token tidak lagi dibutuhkan panitia di layar ini.

2. **Deretan empat kartu angka.** "Total Pegawai / Guru / TU / Sudah Vote" adalah bentuk
   bawaan dasbor: empat kotak setara padahal yang menentukan tindakan panitia hanya satu
   (berapa yang belum memilih). Diganti satu baris teks ringkasan.

3. **Aksi baris berupa dropdown.** Setiap baris punya menu tiga titik berisi "Generate
   Token" (kini tidak ada), "Reset Status", "Hapus". Diganti tombol ikon langsung, sama
   dengan pola yang sudah dipakai halaman Kelas dan Siswa.

4. **Checkbox seleksi tanpa aksi massal.** `selectedIds` terpasang lengkap (checkbox per
   baris, select-all, `data-state="selected"`) tetapi tidak ada satu pun tombol yang
   memakainya. Kontrol tanpa perilaku dihapus (R-26).

5. **Tanpa state galat.** `fetchPegawai` menelan kegagalan tanpa jejak; kalau API gagal,
   layar tampil seperti daftar kosong. Sekarang ada pesan sebab + tombol "Coba lagi".

6. **Bahasa Inggris dan huruf besar di tengah kalimat.** "Refresh", "Cetak Kartu",
   "Import Berhasil!", "Non-Aktif", "Kredensial Pegawai Baru". Diganti kalimat biasa.

## Alasan tiap keputusan (R-31)

- **Satu baris ringkasan, bukan empat kartu.** Angka yang mengubah tindakan panitia adalah
  jumlah yang belum memilih. Tiga angka lain hanya konteks, jadi cukup jadi kalimat.
- **Kolom "Memilih" dengan badge Sudah/Belum.** Ini kolom yang dicari panitia saat
  mendampingi pemilih; status akun dan role adalah konteks di sebelahnya.
- **Nama dan email dalam satu sel.** Email panjang pernah memaksa kolom melebar dan
  memotong tabel di layar sempit; menumpuk keduanya menghemat satu kolom.
- **Tombol ikon di kolom Aksi, dengan `title` + `sr-only`.** Permintaan berulang pemilik
  produk untuk tabel admin; teks tetap tersedia untuk pembaca layar.
- **Reset status hanya muncul saat sudah memilih.** Aksi yang tidak berlaku untuk baris itu
  tidak ditampilkan, bukan ditampilkan lalu dinonaktifkan.
- **Dialog cetak tidak lagi memakai `<Alert>` berisi Info.** Isinya sudah jadi kalimat
  deskripsi dialog; satu blok peringatan untuk satu kalimat itu dekorasi.
- **`min-h-11` pada kontrol di layar sentuh, `sm:min-h-0` di desktop.** Target sentuh 44px
  hanya relevan di layar sentuh; di desktop tinggi 32px menjaga tabel tetap rapat.
- **Warna tetap token shadcn.** Tidak ada warna karangan (`--primary` hanya untuk tombol
  utama "Tambah pegawai", `--destructive` hanya untuk Hapus).

## Yang belum ditangani (sengaja)

- **Endpoint `/api/admin/pegawai/[id]/regenerate-token` tetap ada** tetapi tidak lagi
  dipanggil dari UI. Penghapusan route adalah keputusan backend, bukan redesign UI.
  Data token di database tidak disentuh.
- **Jalur login email + token di `/api/auth/login` tetap berfungsi.** Guru dan TU yang
  masih memegang token lama bisa memakainya sampai login itu dihentikan terpisah.
- **Sidebar `Toggle Sidebar` 28px** dan tombol pagination 36px berasal dari komponen
  shadcn bersama (`sidebar.tsx`, `pagination.tsx`) yang dipakai seluruh aplikasi admin,
  bukan milik halaman ini. Mengubahnya = perubahan global; perlu persetujuan terpisah.
