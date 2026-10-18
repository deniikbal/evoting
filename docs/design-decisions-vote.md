# Keputusan desain /vote (R-31)

Catatan satu baris per keputusan besar. Kalau alasannya tidak bisa ditulis satu baris, keputusan itu tidak sah.

| Keputusan | Alasan |
|---|---|
| Token shadcn netral, tanpa aksen warna tambahan | Permintaan pemilik produk; status jadi bermakna (primary = aksi, destructive = bahaya) alih-alih dekorasi |
| Satu tombol `--primary` per layar | Satu fokus per layar; panitia tidak boleh ragu tombol mana yang melanjutkan |
| Tombol sekunder bergaris (`ToolButton`, min-h-11) | Target sentuh 44px (R-03) dan tidak bersaing dengan aksi utama |
| Header satu tingkat, tinggi 56px | Header dua tingkat sebelumnya memakan 12% layar HP; navigasi harus hadir, bukan mendominasi |
| Penanda tahap dipindah ke dalam panel ("Langkah 1 dari 3") | Tetap memberi posisi tanpa biaya tinggi layar tetap |
| Bingkai bidik bersudut di atas kamera | Petunjuk visual letak QR tanpa menutupi area pindai |
| Kamera depan di-mirror (`scaleX(-1)`) | Gerak panitia terasa natural; tidak memengaruhi pembacaan QR |
| Kartu kandidat rasio 4:5 dengan `object-cover` | Foto kandidat sudah potret; rasio seragam membuat grid rapi dan mudah dibandingkan |
| Nomor urut memakai monospace di kiri atas | Angka dibaca cepat saat panitia menyebut nomor; monospace mencegah 1/7 dan 0/O tertukar |
| Kandidat terpilih: `border-foreground` + ring | Status terpilih harus terbaca tanpa bergantung warna, aman untuk buta warna |
| Ringkasan pilihan menempel di bawah | Keputusan akhir (dua nama) selalu terlihat bersama tombol simpan |
| Jeda 1 detik setelah suara tersimpan | Permintaan pemilik produk; mempercepat antrean, progress bar memberi bukti bahwa suara masuk |
| Teks minimum 11px | Teks 10px gagal dibaca di HP saat ruangan ramai |
| State kosong kandidat menyebut sebab dan aksi | R-27: layar kosong tanpa penjelasan membuat panitia menebak |
| Frasa tanpa em dash dan tanpa emoji | R-02 dan R-16; teks harus terasa ditulis manusia |

## Keputusan desain /admin/dashboard (R-31)

Catatan yang sama berlaku untuk layar admin. Satu baris per keputusan.

| Keputusan | Alasan |
|---|---|
| Netral penuh: semua gradien warna (sky, emerald, amber, violet, fuchsia, cyan, pink) dihapus | Permintaan pemilik produk (opsi A); tujuh gradien dalam satu layar melanggar R-01 dan R-29 (batas 2 sampai 3 warna inti + 1 aksen) |
| Satu aksen: `--primary` hanya untuk status "Voting berlangsung" dan bar progres partisipasi | Dua tempat itu satu-satunya keadaan yang benar-benar meminta perhatian; sisanya netral |
| Urutan blok: status voting, lalu partisipasi, lalu kecukupan data per kelas, lalu hasil | Mengikuti keputusan yang diambil panitia: "apakah perlu turun tangan sekarang"; deret 4 kartu statistik tidak menunjukkan urutan itu |
| Pemeriksaan data per kelas ditampilkan sebagai daftar bertingkat, bukan kartu | Yang dicari panitia adalah kelas mana yang nol, jadi kelas nol harus lebih menonjol daripada angka pendukung |
| Angka besar diambil dari data nyata (`/api/admin/statistik`), tanpa delta persentase | R-17 dan R-38: hanya angka yang punya sumber; delta butuh deret pembanding yang tidak ada |
| Pie chart diganti daftar bar berurut per kelompok | Token `--chart-1` sampai `--chart-5` gagal kontras 3:1 antar segmen (terukur 1.02 sampai 2.49:1); urutan dan panjang bar membaca lebih tepat untuk pertanyaan "kandidat mana yang unggul di kelompok ini" |
| Grafik memakai satu warna `--primary` dengan panjang bar, bukan warna berbeda per kandidat | Panjang bar membawa data, warna tidak perlu; ini menjaga palet di batas R-29 |
| Shadow dihapus dari kartu sekunder, hanya panel utama memakai `shadow-sm` | DESIGN.md: bayangan satu tingkat pada panel utama, kontrol memakai garis (R-12) |
| Radius `rounded-lg` untuk panel, bukan `rounded-full` pada bar | DESIGN.md: hindari pil di semua elemen (R-11); hanya track progres yang tersisa membulat |
| Label status memakai teks ("Berlangsung"), bukan simbol ● / ○ | Simbol itu bahasa indikator yang tidak menambah informasi; teks lebih jelas dan terbaca pembaca layar |
| State kosong, memuat, dan galat menyebut sebab dan aksi berikutnya | R-27; panitia harus tahu apa yang terjadi tanpa menebak |

## Keputusan desain /admin/kelas (R-31)

| Keputusan | Alasan |
|---|---|
| Kolom "Siswa" ditambahkan ke tabel | API menolak hapus kelas yang masih berisi siswa; tanpa angka ini panitia menekan hapus lalu gagal tanpa tahu sebabnya |
| Kartu "Data / Halaman" dihapus | Itu setelan tampilan, bukan data kelas; tidak menjawab pertanyaan panitia |
| Statistik jadi 3 angka + 1 peringatan: kelas, angkatan, siswa, kelas kosong | "Kelas kosong" adalah satu-satunya keadaan yang butuh tindakan (siap dihapus atau kelas GURU/TU) |
| Pencarian nama kelas | 37 kelas dalam 4 halaman; memindai halaman bukan pekerjaan panitia |
| Sort nama memakai natural sort | `X 10` harus setelah `X 2`; angka dibaca sebagai angka |
| Sort angkatan memakai urutan tingkat X, XI, XII dengan yang bukan tingkat di bawah | `Number('GURU')` menghasilkan NaN dan membuat urutan acak |
| Tombol hapus dinonaktifkan bila kelas masih berisi siswa, dengan label sebabnya | Aksi yang pasti gagal tidak boleh terlihat bisa diklik (R-26) |
| Aksi massal hanya memilih kelas kosong | Yang akan dilewati server ditandai sebelum diklik, bukan setelah gagal sebagian |
| Tombol Kartu PDF ditambahkan di tampilan HP | Sebelumnya fitur ini hanya ada di desktop |
| Peringatan memakai `--destructive` dan `--secondary` saja | Palet tetap netral; tidak ada aksen warna tambahan |
