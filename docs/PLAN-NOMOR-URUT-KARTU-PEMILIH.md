# PLAN: Nomor Urut di Kartu Pemilih PDF (diurut alfabet namaLengkap per kelas)

> **Status:** rencana, belum ada perubahan kode.
> **Asumsi default yang dipakai sampai konfirmasi:** nomor urut diletakkan di **pojok kanan-atas header** kartu, format **`No. {n}`** (mis. `No. 1`, `No. 12`), dan **tampil juga di mode print HTML** (`window.print()` di halaman Siswa).

---

## 1. Pendekatan Singkat

Penomoran urut adalah **properti turunan dari daftar siswa yang akan di-render**, bukan data persisten di database — supaya nama yang diganti tidak membuat nomor "loncat". Karena semua alur render kartu melewati `StudentPdfCards` (PDF) atau blok `.print-only` di `siswa/page.tsx` (print HTML), kita cukup **menghitung nomor urut di pemanggil** dengan satu util bersama: `nomorUrutPerKelas(siswa[])` yang berada di `src/lib/urutan-kelas.ts`. Util ini menerima daftar siswa, **mengurutkan salinannya** berdasarkan `namaLengkap` dengan `Intl.Collator('id', { numeric: true, sensitivity: 'base' })`, lalu mengembalikan array `Siswa & { nomorUrut: number }`. Pemanggil memutuskan restart/per-kelas vs global dan render.

Pendekatan ini menjaga `VoterCard` tetap "bodoh": ia menerima `nomorUrut` sebagai prop opsional, dan kalau prop itu ada ia menampilkan badge kecil di pojok kanan-atas header. Tidak ada duplikasi logika sortir — `StudentPdfCards` dan blok print HTML di `siswa/page.tsx` keduanya memanggil util yang sama sehingga hasil PDF dan hasil print HTML selalu konsisten.

Untuk halaman `Kelas`, karena endpoint `/api/admin/siswa?kelas=…` (lihat `src/app/admin/kelas/page.tsx:108-111`) hanya mengembalikan siswa **satu kelas**, urutan restart-per-kelas otomatis terjadi tanpa logika tambahan.

---

## 2. File yang Akan Diubah + Diff Rencana

### 2.1 `src/lib/urutan-kelas.ts` — tambah util `nomorUrutPerKelas`

**Before (akhir file):**
```ts
/** Pencarian nama kelas tanpa peduli huruf besar/kecil dan spasi berlebih. */
export function cocokCari(nama: string, kueri: string): boolean {
  const q = kueri.trim().toLowerCase()
  if (!q) return true
  return nama.toLowerCase().includes(q)
}
```

**After:**
```ts
/** Pencarian nama kelas tanpa peduli huruf besar/kecil dan spasi berlebih. */
export function cocokCari(nama: string, kueri: string): boolean {
  const q = kueri.trim().toLowerCase()
  if (!q) return true
  return nama.toLowerCase().includes(q)
}

/**
 * Banding nama lengkap untuk nomor urut: locale 'id', case-insensitive,
 * angka dibanding sebagai angka (biar "Andi 2" vs "Andi 10" benar).
 */
const collatorNamaSiswa = new Intl.Collator('id', {
  numeric: true,
  sensitivity: 'base',
})

/**
 * Kembalikan salinan `siswa` yang sudah diurut alfabet namaLengkap,
 * masing-masing ditambah `nomorUrut` yang restart dari 1.
 *
 * - Pure: tidak memodifikasi array input.
 * - deterministic: hasil sort selalu sama untuk input sama (sorted by namaLengkap).
 *
 * Restart vs global ditentukan oleh pemanggil dengan cara memecah
 * daftar per kelas, memanggil helper per-kelas, lalu menggabungkan.
 */
export function denganNomorUrut<T extends { namaLengkap: string }>(
  siswa: T[]
): Array<T & { nomorUrut: number }> {
  return [...siswa]
    .sort((a, b) => collatorNamaSiswa.compare(a.namaLengkap, b.namaLengkap))
    .map((s, i) => ({ ...s, nomorUrut: i + 1 }))
}
```

> Catatan: tidak saya tambahkan `nomorUrutPerKelas` sebagai helper terpisah karena satu helper generik `denganNomorUrut` sudah cukup; pemanggil melakukan group-by-kelas (lihat §3).

---

### 2.2 `src/components/admin/VoterCard.tsx` — terima prop `nomorUrut`, render badge

**Before (potongan relevan, baris 7-9, 32-36, 64-65):**
```tsx
interface VoterCardProps {
  siswa: Siswa
}
// ...
<div className="voter-card bg-white border border-gray-800 rounded p-1.5">
  <div className="text-center mb-1 pb-0.5 border-b border-gray-800">
    <h2 className="text-[9px] font-bold text-gray-900 leading-tight">PEMILIHAN KETUA OSIS</h2>
  </div>
  {/* ... */}
</div>
```

**After:**
```tsx
import { Siswa } from '@/app/admin/siswa/page'

interface VoterCardProps {
  siswa: Siswa & { nomorUrut?: number }
}

export default function VoterCard({ siswa }: VoterCardProps) {
  // ... useEffect QR tetap sama
  return (
    <div className="voter-card bg-white border border-gray-800 rounded p-1.5">
      <div className="relative mb-1 pb-0.5 border-b border-gray-800">
        <h2 className="text-center text-[9px] font-bold text-gray-900 leading-tight">
          PEMILIHAN KETUA OSIS
        </h2>
        {siswa.nomorUrut !== undefined && (
          <span
            className="absolute right-0 top-0 text-[8px] font-bold text-gray-900 leading-tight"
            aria-label={`Nomor urut ${siswa.nomorUrut}`}
          >
            No. {siswa.nomorUrut}
          </span>
        )}
      </div>
      {/* ... blok QR + NIS/NAMA/KELAS + footer tetap sama */}
    </div>
  )
}
```

Catatan teknis:
- `nomorUrut?: number` (opsional) sehingga panggilan lama tanpa nomor urut (mis. tempat lain yang memakai `VoterCard` di luar scope perubahan ini) tidak rusak.
- `relative` di wrapper header + `absolute right-0 top-0` di badge supaya tidak mendorong layout tengah judul.
- Ukuran `text-[8px]` konsisten dengan hierarki tipografi kartu (`text-[7px]` untuk baris NIS/NAMA/KELAS).

---

### 2.3 `src/components/admin/student-pdf-cards.tsx` — pakai `denganNomorUrut`

**Before (baris 1-13 dan 124-127):**
```tsx
import { Siswa } from '@/app/admin/siswa/page'
import { generateCardsPdf } from '@/lib/generate-cards-pdf'
// ...
{siswa.map((s) => (
  <VoterCard key={s.id} siswa={s} />
))}
```

**After:**
```tsx
import { Siswa } from '@/app/admin/siswa/page'
import { generateCardsPdf } from '@/lib/generate-cards-pdf'
import { denganNomorUrut } from '@/lib/urutan-kelas'
// ...
const siswaDenganNomor = denganNomorUrut(siswa)
// ...
{siswaDenganNomor.map((s) => (
  <VoterCard key={s.id} siswa={s} />
))}
```

Catatan: `denganNomorUrut` dipanggil di body komponen (di luar `useEffect`), sehingga setiap render ulang (mis. `siswa` berubah setelah `useEffect(() => () => setError(''), [siswa.length])`) menghasilkan ulang urutan.

---

### 2.4 `src/app/admin/siswa/page.tsx` — pakai util di dua tempat

**Tempat A — tombol download PDF (sekitar baris 561-565):**

Before:
```sai
<StudentPdfCards
  siswa={filteredSiswa}
  label={`Download PDF (${filteredSiswa.length})`}
  fileName={`kartu-pemilih-${new Date().toISOString().slice(0, 10)}.pdf`}
/>
```

Tidak perlu diubah di sini: `StudentPdfCards` sudah akan menghitung nomor urut di dalam. Yang penting adalah *ekspektasi*: nomor urut untuk mode **"Semua Siswa"** (download dari sini) dihitung **per kelas** (lihat §3 + §6 pertanyaan klarifikasi).

**Tempat B — blok print HTML (baris 1378-1409):**

Before:
```tsx
{(() => {
  const siswaList = getFilteredSiswaForPrint()
  const pages: React.ReactNode[] = []

  // Group students by kelas
  const groupedByKelas: { [key: string]: typeof siswaList } = {}
  siswaList.forEach(s => {
    if (!groupedByKelas[s.kelas]) {
      groupedByKelas[s.kelas] = []
    }
    groupedByKelas[s.kelas].push(s)
  })

  // Create one page per kelas
  Object.keys(groupedByKelas).sort().forEach(kelas => {
    const kelasStudents = groupedByKelas[kelas]
    pages.push(
      <div key={kelas} className="print-page">
        <div className="print-header">
          <h2>KARTU PEMILIHAN KELAS {kelas}</h2>
        </div>
        <div className="print-cards-grid">
          {kelasStudents.map((s) => (
            <VoterCard key={s.id} siswa={s} />
          ))}
        </div>
      </div>
    )
  })

  return pages
})()}
```

After:
```tsx
import { bandingNamaKelas, denganNomorUrut } from '@/lib/urutan-kelas'

// ... di body komponen, setelah deklarasi `getFilteredSiswaForPrint` (baris 475-484):

// Urutkan nama kelas X → XI → XII lalu abjad
const urutKelas = (kelasA: string, kelasB: string) => bandingNamaKelas(kelasA, kelasB)

{(() => {
  const siswaList = getFilteredSiswaForPrint()
  const pages: React.ReactNode[] = []

  // Group by kelas
  const groupedByKelas: Record<string, typeof siswaList> = {}
  siswaList.forEach((s) => {
    (groupedByKelas[s.kelas] ??= []).push(s)
  })

  // Buat halaman per kelas; nomor urut restart tiap kelas
  Object.keys(groupedByKelas).sort(urutKelas).forEach((kelas) => {
    const kelasDenganNomor = denganNomorUrut(groupedByKelas[kelas])
    pages.push(
      <div key={kelas} className="print-page">
        <div className="print-header">
          <h2>KARTU PEMILIHAN KELAS {kelas}</h2>
        </div>
        <div className="print-cards-grid">
          {kelasDenganNomor.map((s) => (
            <VoterCard key={s.id} siswa={s} />
          ))}
        </div>
      </div>
    )
  })

  return pages
})()}
```

> Perubahan `Object.keys(groupedByKelas).sort()` → `.sort(urutKelas)` supaya halaman print mengikuti urutan X → XI → XII (bukan abjad mentah, konsisten dengan `bandingNamaKelas` yang dipakai di `urutan-kelas.ts:24-37`).

---

### 2.5 `src/app/admin/kelas/page.tsx` — *tidak ada perubahan kode*

`StudentPdfCards` sudah dipanggil dengan `siswa={kartuRequest.siswa}` (`src/app/admin/kelas/page.tsx:1031-1040`) yang hanya berisi siswa satu kelas (lihat fetch `?kelas=...` di baris 108-111). Karena `nomor urut` dihitung ulang di dalam `StudentPdfCards` dengan `denganNomorUrut`, hasilnya otomatis restart dari 1. **Cukup diverifikasi manual** saat testing.

---

## 3. Utilitas Baru atau Perubahan di `urutan-kelas.ts`

**Rekomendasi: tambah satu helper generik `denganNomorUrut<T extends { namaLengkap: string }>(siswa: T[])` di `src/lib/urutan-kelas.ts`, jangan buat `nomorUrutPerKelas(siswa[])`.**

Alasan:
- Group-by-kelas adalah **kebijakan tampilan** (PDF "Semua Kelas" dari halaman Siswa: restart per kelas vs global; print HTML: pasti per kelas karena tiap kelas dapat halaman sendiri). Meletakkan group-by di util akan memaksa satu kebijakan dan mempersulit mode lain.
- Pemanggil sudah punya konteks daftar siswa (mis. `filteredSiswa`, `groupedByKelas[kelas]`), jadi group-by zero-cost dan eksplisit.
- Helper generik (`<T extends { namaLengkap: string }>`) tetap reusable untuk komponen lain di masa depan (mis. daftar absensi, modul lain yang butuh nomor urut alfabet).

Tambahan import yang dibutuhkan di `student-pdf-cards.tsx` dan `siswa/page.tsx`:
```ts
import { denganNomorUrut } from '@/lib/urutan-kelas'
// siswa/page.tsx juga butuh:
import { bandingNamaKelas } from '@/lib/urutan-kelas'
```

---

## 4. Pertanyaan Klarifikasi

1. **Penempatan visual "No. {n}"** — default saya pakai pojok kanan-atas header (`absolute right-0 top-0` di wrapper `<h2>PEMILIHAN KETUA OSIS</h2>`). Alternatif:
   - Di samping QR (kiri kartu, di atas/ bawah QR).
   - Di header, tapi kiri.
   - Inline di baris data: ganti baris `NIS` jadi `No. 1 | NIS 12345`.
   - Footer kartu (saat ini sudah berisi "Scan QR ini di bilik voting").

2. **Format** — default saya pakai `No. {n}` (mis. `No. 1`, `No. 12`). Alternatif:
   - `1.`, `1)`, `(1)`
   - `1/30` (n dari total) — perlu util kedua atau lebar tambahan.
   - `01` (zero-padded dua digit) untuk konsistensi visual saat satu kelas >9 siswa.
   - Hanya `{n}` polos (tanpa "No.").

3. **Tampil di mode print HTML (`window.print()`)?** — default saya: **ya**, tampil juga di `.print-only` (mengikuti proporsi yang sama dengan PDF). Alternatif: hanya PDF, print HTML polos.

4. **Konsistensi nomor urut antara download "Semua Kelas" dari Siswa dan download per kelas dari halaman Kelas** — saat ini util dihitung sekali di `StudentPdfCards`, jadi untuk daftar siswa yang **identik** hasilnya identik. Tidak ada perbedaan visual yang saya antisipasi.

5. **Penomoran ulang setelah edit/ hapus siswa** — sudah ditangani (nomor urut = turunan, dihitung ulang setiap render). Tidak ada migrasi data.

---

## 5. Test Plan Manual End-to-End

### Prasyarat
- Setidaknya 2 kelas (mis. `X 1`, `X 2`) masing-masing minimal 3 siswa dengan nama yang sengaja beragam: ada spasi di awal (`" Andi"`), nama mixed-case (`"bUDI"`), nama mengandung angka (`"Andi 2"`, `"Andi 10"`), dan minimal 1 nama non-latin kalau relevan.

### Skenario

| # | Lokasi | Aksi | Ekspektasi |
|---|---|---|---|
| 1 | `src/app/admin/siswa/page.tsx` (halaman Siswa) → toolbar → **Download PDF (Semua)** | Klik tombol | PDF terunduh; setiap kelas punya halaman/ blok sendiri; di pojok kanan-atas tiap kartu muncul `No. 1`, `No. 2`, … dan restart ke `No. 1` di kelas berikutnya; urutan alfabet nama (A → Z) dengan spasi di awal di-trim dan angka `2` < `10`. |
| 2 | Halaman Siswa → **Cetak Kartu Pemilih** → mode "Cetak Berdasarkan Kelas" → pilih "Semua Kelas" | Klik "Cetak" → preview print | Tiap kelas muncul di halaman A4 sendiri (header `KARTU PEMILIHAN KELAS {kelas}`); urutan halaman X → XI → XII; tiap kartu dalam kelas tampil `No. {n}` restart dari 1; nama terurut alfabet. |
| 3 | Skenario 2 → pilih kelas tunggal (mis. `X 1`) | Klik "Cetak" | Hanya siswa `X 1` yang muncul, nomor urut `No. 1` … `No. N`; konsisten dengan PDF skenario #1 untuk siswa yang sama. |
| 4 | Skenario 2 → mode "Pilih Peserta", pilih siswa **dari kelas berbeda** | Klik "Cetak" | Tiap siswa dapat halaman sendiri (karena dikelompokkan per kelas) atau digabung ke halaman "kelas pertama"? **Saat ini kode mengelompokkan per kelas** (`groupedByKelas` di siswa/page.tsx:1383-1389), sehingga siswa kelas `X 1` dan `X 2` akan masuk halaman berbeda. **Ekspektasi yang saya rekomendasikan**: siswa lintas kelas tampil di satu halaman bertingkat per kelas, atau tetap dipisah halaman. **Butuh konfirmasi**. |
| 5 | `src/app/admin/kelas/page.tsx` → klik ikon `FileDown` pada kelas `X 1` | Tunggu download otomatis | PDF khusus `X 1` saja; `No. 1` … `No. N` restart; konsisten dengan skenario #1 slice untuk `X 1`. |
| 6 | Filter halaman Siswa (cari / filter status) → Download PDF | Klik Download | PDF berisi hanya siswa terfilter; nomor urut dihitung ulang di subset. (Catatan: subset mungkin lintas kelas → restart per kelas.) |
| 7 | Edit nama salah satu siswa, lalu ulangi #1 | Klik Edit → ganti nama → simpan → Download ulang | Posisi siswa bergeser sesuai abjad baru; nomor urut dihitung ulang dengan benar; tidak ada nomor "kaku" yang tersimpan. |
| 8 | Hapus siswa, lalu ulangi #1 | Hapus → Download ulang | Daftar menyusut; tidak ada nomor yang "bolong" karena dihitung ulang. |
| 9 | Halaman Siswa → Refresh (tombol Refresh) | Klik Refresh | Tidak ada error; `useEffect(() => () => setError(''), [siswa.length])` tetap aman; render konsisten. |
| 10 | Buka `src/app/pdf-test/page.tsx` (kalau dipakai smoke test internal) | Jalankan sesuai kegunaan | Tidak regress. |

### Cara verifikasi cepat
- Buka PDF hasil download #1, sort nama via spreadsheet DB bandingkan dengan nomor urut di pojok kanan-atas kartu pertama tiap kelas → harus urutan alfabet.
- Print preview `#2` harus menampilkan `KARTU PEMILIHAN KELAS X 1` di atas, lalu `X 2`, dst — bukan `X 1`, `X 10`, `XI 1` (yang akan terjadi bila sort abjad mentah `Object.keys(...).sort()` dipakai; itulah alasan §2.4 mengganti `.sort()` dengan `urutKelas`).

---

## 6. Risiko & Edge Case

1. **Nama dengan spasi di awal** (`" Andi"`): `Intl.Collator` `sensitivity: 'base'` mengabaikan leading whitespace untuk perbandingan, sehingga `" Andi"` dan `"Andi"` masuk kategori setara. Ekspektasi: tetap dihitung urut sesuai posisi pertama non-whitespace. **Risiko**: bisa jadi nama dianggap duplikat bila dianggap identik — perlu konfirmasi apakah admin peduli leading-space pada nama. Tidak ada aksi kode; tinggal diverifikasi manual.

2. **Nama mixed-case** (`"bUDI"`, `"Budi"`): `sensitivity: 'base'` mengabaikan kapitalisasi. Hasil `"bUDI"` dan `"Budi"` urut berdekatan (sesuai posisi abjad huruf). **Risiko rendah**.

3. **Abjad campur non-latin** (mis. aksara Arab/Jawa/ Mandarin): `Intl.Collator('id', …)` mengikuti aturan Unicode CLDR untuk 'id'. Karakter non-latin akan diurutkan **setelah** abjad Latin (atau sesuai collation element table). **Risiko**: urutan mungkin tidak intuitif; tapi konsisten antar render dan tidak akan "loncat". Tidak ada fallback eksplisit — `denganNomorUrut` membiarkan `Intl.Collator` yang memutuskan.

4. **Mode "Pilih Peserta" lintas kelas** di `siswa/page.tsx`: lihat skenario #4 di §5 — siswa dari kelas berbeda akan digrupkan per kelas (lihat `groupedByKelas` baris 1383-1389), sehingga tiap kelas dapat halaman sendiri. **Risiko**: tidak sesuai ekspektasi admin yang memilih siswa acak lintas kelas dan berharap satu halaman. **Rekomendasi klarifikasi**.

5. **Mode "Semua Kelas" download PDF** (dari Siswa page): siswa digabung dalam satu container 3 kolom (lihat `student-pdf-cards.tsx:118-119`). Bila `denganNomorUrut` dipanggil **sekali** untuk semua siswa tanpa group-by, nomornya menjadi **global** (mis. kelas `X 1` dapat `No. 5, No. 12, …`). Ekspektasi default saya: **restart per kelas** agar guru yang menerima map kelas `X 1` tidak bingung dengan nomor 50+. Implementasi: di `student-pdf-cards.tsx` (§2.3), ketika `siswa` berisi >1 kelas, group-by dulu lalu panggil `denganNomorUrut` per grup, baru gabung. **Mohon konfirmasi** apakah admin lebih suka global atau restart. Default rencana: **restart per kelas** karena lebih cocok untuk map kelas fisik.

6. **Sortasi kelas** dalam PDF "Semua Kelas": grid 3 kolom membuat siswa kelas berbeda bisa muncul bersebelahan di satu halaman (mis. baris terakhir `X 1` + baris pertama `X 2`). **Risiko visual**: kartu dengan nomor urut `No. 1` di pojok kanan-atas kelas kedua bisa muncul di sebelah `No. 30` kelas pertama. **Mitigasi**: tambahkan `<div className="break-inside-avoid">` atau section break antar kelas di container `StudentPdfCards`, atau tampilkan "header kelas" mini di antara. **Rekomendasi**: header mini (`<div className="col-span-3 text-[7px] font-semibold text-center mt-1">{kelas}</div>`) sebelum tiap grup. Tambahan opsional.

7. **Re-render berulang di `StudentPdfCards`**: `denganNomorUrut` dipanggil tiap render (O(n log n)). Untuk N ≤ 1000 ini tidak masalah. Tidak perlu `useMemo` kecuali dijumpai lag.

8. **Backward compatibility**: `VoterCard` lama (dipakai di luar scope perubahan ini) tidak mengirim `nomorUrut`, sehingga `siswa.nomorUrut !== undefined` salah → badge tidak dirender. Aman.

9. **CSS print vs screen**: `warnaHitamPutih` di `generate-cards-pdf.ts:126-138` memaksa warna hitam di cloned doc untuk semua descendant `.voter-card`. Badge "No. {n}" akan otomatis ikut hitam-putih. Aman.

10. **Aksesibilitas**: badge diberi `aria-label="Nomor urut {n}"` agar screen reader tidak membaca `No. 1` sebagai "no point one". Saran tambahan bila tim menghendaki: `aria-label="Nomor urut {n}"` seperti di cuplikan §2.2.

---

## Ringkasan Perubahan

| File | Jenis | Baris (perkiraan) | Tujuan |
|---|---|---|---|
| `src/lib/urutan-kelas.ts` | tambah helper | +15 baris | `denganNomorUrut` generik |
| `src/components/admin/VoterCard.tsx` | tambah prop + badge | ~+10 baris, edit ~3 baris | Tampilkan "No. {n}" |
| `src/components/admin/student-pdf-cards.tsx` | tambah import + panggil helper | ~+3 baris, edit ~2 baris | Nomor urut di PDF |
| `src/app/admin/siswa/page.tsx` | tambah import + pakai helper di blok print HTML | ~+8 baris, edit ~6 baris | Nomor urut di print HTML |
| `src/app/admin/kelas/page.tsx` | tanpa perubahan | 0 | Sudah benar lewat `StudentPdfCards` |

Total: ~4 file disentuh, ~36 baris kode baru/ edit, 1 helper baru. Tidak ada perubahan schema DB, tidak ada migrasi.