# Panduan Kiosk Voting (Scan QR)

Alur voting cepat untuk siswa tanpa mengetik NIS & token. Siswa cukup membawa
**kartu QR**, lalu dipindai di bilik voting.

---

## Alur Singkat

```
Siswa bawa kartu QR
        ↓
[Layar Kiosk /kiosk] scan QR
        ↓
Layar KONFIRMASI: tampil NAMA + KELAS siswa
  → Panitia cek: benar orangnya?
  → [Batal]        [Mulai Memilih]
        ↓
Pilih kandidat Mitra Tama + Mitra Muda
        ↓
[Konfirmasi Pilihan]
        ↓
"Terima Kasih"  → auto kembali ke layar scan (5 detik)
        ↓
Siswa berikutnya
```

---

## QR Code

- **Isi QR = NIS saja** (angka). Contoh: `251001`.
- Sederhana → kecil → **mudah dicetak & cepat dipindai**.
- QR tercetak di **kartu pemilih** (menu Siswa → Cetak Kartu).
- Layout kartu: **QR + NIS + Nama + Kelas**, tetap **4 kartu / A4** (tidak menambah kertas).

### ⚠️ Penting: keamanan
Karena QR hanya berisi NIS, **siapa pun yang tahu NIS orang lain bisa membuat QR itu sendiri**.
Mitigasinya **WAJIB**:

1. **Layar konfirmasi identitas** (sudah otomatis tampil) — panitia melihat nama & wajah siswa
   sebelum siswa memilih. Kalau tidak cocok → tekan **Batal**.
2. Panitia **mengawasi** bilik voting.
3. Sistem tetap menjaga **1 siswa 1 suara** (`sudahMemilih`) — tidak bisa vote dua kali.

---

## Cara Pakai (Operator/Panitia)

1. Buka halaman **`/kiosk`** di HP/tablet/komputer yang disiapkan.
   (Tidak perlu login admin.)
2. Pilih **mode input**:
   - **Kamera** — arahkan QR siswa ke kamera.
   - **Manual / Scanner USB** — ketik/tempel NIS lalu Enter (atau pakai barcode
     scanner USB yang mengetik otomatis).
3. Setelah muncul **nama siswa** → verifikasi → **Mulai Memilih**.
4. Siswa memilih → **Konfirmasi Pilihan**.
5. Muncul "Terima Kasih" → otomatis kembali ke layar scan dalam 5 detik.

---

## Mode Input

| Mode | Cara kerja | Syarat |
|---|---|---|
| **Kamera** | Scan QR pakai kamera perangkat | **HTTPS** + izin kamera |
| **Manual / USB** | Ketik NIS + Enter, atau scanner USB | — |

> ❗ **Kamera butuh HTTPS.** Kalau kiosk diakses lewat `http://IP-lokal`, browser akan
> memblokir kamera → gunakan **mode Manual / Scanner USB**.
> Untuk HTTPS: deploy ke Vercel/domain, atau pakai tunnel (ngrok/cloudflared).

---

## Auto-Reset

- Setelah "Terima Kasih", layar otomatis kembali ke **scan** dalam **5 detik**
  (ada hitung mundur + tombol "Scan Siswa Berikutnya" untuk langsung).
- Tujuan: menjaga privasi (layar tidak lama menampilkan hasil) & mempercepat antrean.

---

## Endpoint Terkait

| Endpoint | Fungsi |
|---|---|
| `POST /api/auth/qr` | Validasi NIS dari QR (cek voting aktif + belum memilih) |
| `POST /api/voting` | Simpan suara (dipakai kiosk, sama seperti halaman voting biasa) |

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Kamera tidak muncul / error | Perangkat harus **HTTPS** & beri izin kamera. Atau pakai mode Manual/USB. |
| "NIS tidak ditemukan" | NIS belum terdaftar di menu Siswa. |
| "Siswa ini sudah melakukan voting" | Siswa sudah memilih. Tidak bisa dua kali. |
| "Voting belum dimulai" | Aktifkan voting di **Pengaturan**. |
| QR tidak terbaca | Pastikan cetak QR tidak terlalu kecil/blur. QR di kartu ~14mm. |

---

## File Terkait

- `src/app/kiosk/page.tsx` — halaman kiosk (scan + konfirmasi + voting + auto-reset)
- `src/app/api/auth/qr/route.ts` — endpoint validasi NIS
- `src/components/admin/VoterCard.tsx` — kartu QR untuk dicetak
- `src/app/admin/siswa/page.tsx` — tombol "Cetak Kartu"
