# DESIGN.md — E-Voting OSIS SMAN 1 Bantarujeg

Arah desain yang disetujui pemilik produk. Dibaca sebelum mengubah UI.

## Identitas

- Produk: bilik voting digital untuk pemilihan Ketua OSIS.
- Pengguna layar `/vote`: **panitia** yang mendampingi pemilih (siswa, guru, TU) satu per satu, sering di HP atau tablet, di ruangan yang ramai.
- Nada: tenang, administratif, tegas. Bukan promosi, bukan teknologi. Yang penting: tidak salah orang, tidak salah simpan.

## Palet

Mengikuti **token shadcn default (netral)**, bukan palet karangan agen.

| Peran | Token | Dipakai untuk |
|---|---|---|
| Latar | `--background`, `--card` | halaman dan kartu |
| Teks utama | `--foreground` | judul, nama pemilih, nama kandidat |
| Teks sekunder | `--muted-foreground` | keterangan, label tahap, catatan |
| Aksi utama | `--primary` / `--primary-foreground` | satu tombol utama per layar |
| Bidang tenang | `--secondary` | kotak peringatan, badge status |
| Bahaya | `--destructive` | pesan gagal kamera, error simpan suara |
| Garis | `--border` | semua pemisah dan tepi kartu |
| Fokus | `--ring` | ring fokus keyboard |

Alasan: token netral membuat status **bermakna** (primary = aksi, destructive = bahaya), bukan dekorasi. Tidak ada aksen warna tambahan.

## Tipografi

Geist Sans (sudah dimuat di aplikasi). Ukuran minimum teks **11px**, teks isi 12 sampai 14px, judul 20 sampai 24px. Angka identitas (NIS, nomor urut) memakai monospace secukupnya supaya tidak salah baca.

## Bentuk

- Radius `rounded-md` untuk kontrol, `rounded-lg` untuk panel. Bukan pil di semua elemen.
- Bayangan hanya satu tingkat pada panel utama; kontrol memakai garis, bukan bayangan.

## Dials

**ENERGY 1 / RHYTHM 1 / MOTION 1.**

Alasan: layar ini alat kerja panitia, bukan halaman pemasaran. Gerak hanya untuk umpan balik (fokus, tekan, progress jeda 1 detik). Tidak ada animasi hiasan, tidak ada denyut tanpa henti.

## Batasan yang tidak boleh dilanggar

1. Tidak ada angka, kebijakan, atau klaim yang dikarang. Data dari database atau tidak ditampilkan.
2. Tidak ada mode manual/input teks. Pemilih diverifikasi lewat QR.
3. Satu aksi utama per layar; aksi berbahaya selalu diberi warna `--destructive` dan konfirmasi.
4. Semua token yang tampil adalah identitas pemilih, bukan rahasia: NIS dan jabatan boleh, token login tidak.
