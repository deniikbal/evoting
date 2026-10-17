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
