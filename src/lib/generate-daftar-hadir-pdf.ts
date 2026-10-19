'use client'

import jsPDF from 'jspdf'
import { denganNomorUrut } from '@/lib/urutan-kelas'

/**
 * Daftar hadir pemilihan ketua OSIS: satu kelas, satu lembar F4.
 *
 * PDF dibuat VEKTOR lewat jsPDF langsung, bukan html2canvas seperti kartu
 * pemilih. Daftar hadir hanya berisi teks dan garis tabel (tanpa QR), jadi
 * teks vektor tetap tajam pada ukuran cetak apa pun dan berkasnya kecil
 * (belasan KB, bukan beberapa MB).
 */

/** F4 (folio) ukuran yang dipakai di Indonesia: 215 x 330 mm, bukan A4. */
export const F4_LEBAR_MM = 215
export const F4_TINGGI_MM = 330

const MARGIN_BAWAH = 12
const MARGIN_KIRI = 15
const MARGIN_KANAN = 15

/**
 * Jumlah lebar kolom = 185mm = lebar area cetak (215 - 15 - 15), supaya garis
 * tabel berhenti tepat di margin kanan. Kolom tanda tangan 45mm: cukup untuk
 * tanda tangan tangan, bukan sekadar centang.
 */
const KOLOM = [
  { judul: 'No', lebar: 12, tengah: true },
  { judul: 'NIS', lebar: 28, tengah: true },
  { judul: 'Nama Lengkap', lebar: 100, tengah: false },
  { judul: 'Tanda Tangan', lebar: 45, tengah: true },
]

/**
 * Baris paling tinggi 12mm. Karena rekap kini menempel di bawah tabel (bukan
 * dipaku di dasar halaman), kelas dengan sedikit siswa memakai baris lapang
 * dan tabelnya tidak menyisakan ruang kosong besar di bawah.
 */
const TINGGI_BARIS_MAKS = 12
/**
 * Batas bawah tinggi baris. Tujuan Pak Deni: satu kelas cukup satu lembar F4.
 * Kelas nyata terbesar 46 siswa, tetapi batas ini dipasang supaya kelas sampai
 * 57 siswa tetap muat satu lembar (baris terapat 4,5mm, teks 9pt masih lega).
 * Di bawah 4,5mm teks mulai menempel garis tabel, jadi lebih baik pindah lembar
 * daripada dipaksa mengecil sampai tak terbaca.
 */
const TINGGI_BARIS_MIN = 4.5
const TINGGI_JUDUL_TABEL = 8

/**
 * Ruang untuk blok rekap di bawah tabel (Jumlah pemilih / yang hadir /
 * tidak hadir). Tabel TIDAK boleh memakai ruang ini; kalau terpakai, rekap
 * akan menumpuk baris terakhir.
 */
const TINGGI_REKAP = 34

/**
 * Tabel halaman pertama mulai di bawah kop surat. Angka ini sengaja dibuat
 * kecil supaya tabel naik dan masih ada ruang untuk blok rekap di bawah.
 */
const Y_TABEL_AWAL = 44
/** Halaman lanjutan hanya memuat judul kecil, jadi tabel bisa mulai lebih atas. */
const Y_TABEL_LANJUTAN = 30

/** Ukuran font isi tabel: dipakai apa adanya bila muat, diperkecil bila perlu. */
const UKURAN_FONT_ISI = 9
const UKURAN_FONT_ISI_MIN = 7

const NAMA_SEKOLAH_BAWAAN = 'SMA NEGERI 1 BANTARUJEG'

export interface SiswaDaftarHadir {
  nis: string
  namaLengkap: string
}

export interface OpsiDaftarHadir {
  /** Nama kelas, dipakai di kop dan nama berkas. */
  kelas: string
  siswa: SiswaDaftarHadir[]
  /** Nama berkas PDF. Bila kosong dibuat dari nama kelas. */
  fileName?: string
  namaSekolah?: string
  /** Baris keterangan tambahan di kop, mis. tahun pelajaran. */
  keterangan?: string
}

export async function generateDaftarHadirPdf({
  kelas,
  siswa,
  fileName,
  namaSekolah = NAMA_SEKOLAH_BAWAAN,
  keterangan,
}: OpsiDaftarHadir): Promise<void> {
  if (siswa.length === 0) {
    throw new Error(`Kelas ${kelas} belum memiliki siswa`)
  }

  const pdf = new jsPDF({
    unit: 'mm',
    format: [F4_LEBAR_MM, F4_TINGGI_MM],
    orientation: 'portrait',
    compress: true,
  })

  // Nomor urut mengikuti abjad nama, sama dengan kartu pemilih dan dialog
  // detail siswa, supaya urutan ketiga daftar konsisten.
  const baris = denganNomorUrut(siswa)
  const total = baris.length

  const lebarTabel = KOLOM.reduce((n, k) => n + k.lebar, 0)
  // Tabel berhenti sebelum blok rekap, bukan sampai margin bawah.
  const yAkhirTabel = F4_TINGGI_MM - MARGIN_BAWAH - TINGGI_REKAP

  // Satu kelas nyata terbesar 46 siswa dan muat satu lembar F4. Pembagian ini
  // jaring pengaman kalau nanti ada kelas gabungan yang lebih besar: baris
  // dipindah ke lembar lanjutan, bukan dikecilkan sampai tak terbaca.
  const kapasitas = Math.max(
    1,
    Math.floor((yAkhirTabel - Y_TABEL_AWAL - TINGGI_JUDUL_TABEL) / TINGGI_BARIS_MIN)
  )
  const jumlahHalaman = Math.ceil(total / kapasitas)
  const perHalaman = Math.ceil(total / jumlahHalaman)

  let mulai = 0
  for (let halaman = 0; halaman < jumlahHalaman; halaman++) {
    const potongan = baris.slice(mulai, mulai + perHalaman)
    mulai += perHalaman
    if (halaman > 0) pdf.addPage()

    const yTabel = halaman === 0 ? Y_TABEL_AWAL : Y_TABEL_LANJUTAN
    if (halaman === 0) {
      gambarKop(pdf, { namaSekolah, kelas, keterangan })
    } else {
      gambarKopLanjutan(pdf, { kelas, halaman: halaman + 1 })
    }

    const yIsi = yTabel + TINGGI_JUDUL_TABEL
    const tinggiBaris = Math.min(
      TINGGI_BARIS_MAKS,
      (yAkhirTabel - yIsi) / potongan.length
    )

    gambarJudulTabel(pdf, MARGIN_KIRI, yTabel, lebarTabel, TINGGI_JUDUL_TABEL)
    gambarIsiTabel(pdf, {
      x: MARGIN_KIRI,
      y: yIsi,
      lebarTabel,
      tinggiBaris,
      data: potongan,
    })

    // Rekap hanya di lembar terakhir: isinya menghitung seluruh kelas, bukan
    // per lembar, jadi mencetaknya di setiap lembar akan menyesatkan.
    if (halaman === jumlahHalaman - 1) {
      gambarRekap(pdf, {
        total,
        akhirTabel: yIsi + tinggiBaris * potongan.length,
        batasBawah: F4_TINGGI_MM - MARGIN_BAWAH,
      })
    }
  }

  pdf.save(fileName ?? namaBerkasDaftarHadir(kelas))
}

/** Nama berkas aman: garis miring pada nama kelas diganti tanda hubung. */
export function namaBerkasDaftarHadir(kelas: string): string {
  return `daftar-hadir-${kelas.replace(/[/\\]/g, '-')}.pdf`
}

interface Kop {
  namaSekolah: string
  kelas: string
  keterangan?: string
}

/**
 * Kop surat halaman pertama. Sengaja dipadatkan (judul 16mm, garis kop 24mm,
 * keterangan 36mm) supaya tabel bisa mulai di 44mm dan blok rekap di bawah
 * masih muat. "Jumlah pemilih" TIDAK lagi di kop: sekarang ada di blok rekap
 * bawah tabel bersama jumlah hadir/tidak hadir, sesuai permintaan Pak Deni.
 */
function gambarKop(pdf: jsPDF, { namaSekolah, kelas, keterangan }: Kop) {
  const tengah = F4_LEBAR_MM / 2
  const kanan = F4_LEBAR_MM - MARGIN_KANAN

  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('DAFTAR HADIR PEMILIHAN KETUA OSIS', tengah, 15, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(namaSekolah, tengah, 20.5, { align: 'center' })

  pdf.setLineWidth(0.5)
  pdf.line(MARGIN_KIRI, 23.5, kanan, 23.5)
  pdf.setLineWidth(0.2)
  pdf.line(MARGIN_KIRI, 24.3, kanan, 24.3)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Kelas: ${kelas}`, MARGIN_KIRI, 30)

  pdf.setFont('helvetica', 'normal')
  pdf.text('Hari/Tanggal: ...................................', MARGIN_KIRI, 36)
  pdf.text('Pukul: .................', kanan, 36, { align: 'right' })

  if (keterangan) {
    pdf.text(keterangan, tengah, 40.5, { align: 'center' })
  }
}

function gambarKopLanjutan(
  pdf: jsPDF,
  { kelas, halaman }: { kelas: string; halaman: number }
) {
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(
    `DAFTAR HADIR PEMILIHAN KETUA OSIS - KELAS ${kelas} (lanjutan ${halaman})`,
    F4_LEBAR_MM / 2,
    18,
    { align: 'center' }
  )
  pdf.setLineWidth(0.2)
  pdf.line(MARGIN_KIRI, 22, F4_LEBAR_MM - MARGIN_KANAN, 22)
}

function gambarJudulTabel(
  pdf: jsPDF,
  x: number,
  y: number,
  lebarTabel: number,
  tinggi: number
) {
  pdf.setLineWidth(0.3)
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(UKURAN_FONT_ISI)

  let xKolom = x
  for (const kolom of KOLOM) {
    if (xKolom > x) pdf.line(xKolom, y, xKolom, y + tinggi)
    pdf.text(kolom.judul, teksPosisi(xKolom, kolom), y + tinggi / 2, {
      align: kolom.tengah ? 'center' : 'left',
      baseline: 'middle',
    })
    xKolom += kolom.lebar
  }

  pdf.rect(x, y, lebarTabel, tinggi)
}

interface OpsiIsi {
  x: number
  y: number
  lebarTabel: number
  tinggiBaris: number
  data: Array<SiswaDaftarHadir & { nomorUrut: number }>
}

function gambarIsiTabel(pdf: jsPDF, { x, y, lebarTabel, tinggiBaris, data }: OpsiIsi) {
  const tinggiTotal = tinggiBaris * data.length
  pdf.setLineWidth(0.2)
  pdf.setTextColor(0, 0, 0)

  // Pemisah kolom digambar SEKALI sepanjang tabel, bukan potongan per baris.
  let xKolom = x
  for (const kolom of KOLOM) {
    xKolom += kolom.lebar
    if (xKolom < x + lebarTabel - 0.01) {
      pdf.line(xKolom, y, xKolom, y + tinggiTotal)
    }
  }

  // Garis mendatar SATU PER SISWA, termasuk garis penutup baris terakhir.
  // Sebelumnya baris tidak pernah diberi garis mendatar sama sekali sehingga
  // nama siswa tampak tanpa garis pemisah; hanya bingkai luar yang terlihat.
  for (let i = 0; i <= data.length; i++) {
    pdf.line(x, y + i * tinggiBaris, x + lebarTabel, y + i * tinggiBaris)
  }

  pdf.setFont('helvetica', 'normal')

  let yBaris = y
  for (const siswa of data) {
    const isi = [String(siswa.nomorUrut), siswa.nis, siswa.namaLengkap, '']

    let xSel = x
    KOLOM.forEach((kolom, i) => {
      const teks = isi[i]
      if (teks) {
        // Nama panjang diperkecil bertahap (9 -> 8 -> 7pt). Kalau tetap tidak
        // muat, dipotong dengan elipsis: lebih baik nama sedikit dipendekkan
        // daripada meluber ke kolom tanda tangan.
        const maks = kolom.lebar - 5
        const ukuran = ukuranPas(pdf, teks, maks)
        pdf.setFontSize(ukuran)
        pdf.text(potongTeks(pdf, teks, maks), teksPosisi(xSel, kolom), yBaris + tinggiBaris / 2, {
          align: kolom.tengah ? 'center' : 'left',
          baseline: 'middle',
        })
      }
      xSel += kolom.lebar
    })

    yBaris += tinggiBaris
  }
}

interface OpsiRekap {
  total: number
  /** Ujung bawah tabel (mm) supaya rekap menempel di bawahnya. */
  akhirTabel: number
  /** Batas bawah agar rekap tidak melewati margin. */
  batasBawah: number
}

/**
 * Blok rekap di bawah tabel. "Jumlah pemilih" terisi otomatis dari jumlah
 * siswa; "Jumlah yang hadir" dan "Jumlah tidak hadir" sengaja dibiarkan
 * bertitik untuk diisi tangan petugas saat pemilihan berlangsung.
 *
 * Posisi rekap mengikuti ujung tabel (bukan dipaku di dasar halaman): kelas
 * berisi 46 siswa membuatnya otomatis berada dekat dasar, sedangkan kelas
 * kecil tidak menyisakan jurang kosong ratusan milimeter di antaranya.
 */
function gambarRekap(pdf: jsPDF, { total, akhirTabel, batasBawah }: OpsiRekap) {
  const kanan = F4_LEBAR_MM - MARGIN_KANAN
  const lebar = kanan - MARGIN_KIRI
  const tinggi = 26
  const yKotak = Math.min(akhirTabel + 4, batasBawah - tinggi)

  pdf.setLineWidth(0.2)
  pdf.rect(MARGIN_KIRI, yKotak, lebar, tinggi)

  const xLabel = MARGIN_KIRI + 4
  const xTitikDua = MARGIN_KIRI + 52
  const isi = [
    { label: 'Jumlah pemilih', nilai: `${total} siswa`, tebal: true },
    { label: 'Jumlah yang hadir', nilai: '..............................', tebal: false },
    { label: 'Jumlah tidak hadir', nilai: '..............................', tebal: false },
  ]

  pdf.setFontSize(9)
  isi.forEach((b, i) => {
    const y = yKotak + 6 + i * 7
    pdf.setFont('helvetica', 'normal')
    pdf.text(b.label, xLabel, y)
    pdf.text(':', xTitikDua, y)
    // Nilai otomatis ditebalkan supaya jelas mana yang sudah terisi.
    pdf.setFont('helvetica', b.tebal ? 'bold' : 'normal')
    pdf.text(b.nilai, xTitikDua + 3, y)
  })

  // Tempat tanda tangan panitia di sisi kanan blok rekap.
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Panitia Pemilihan,', kanan - 4, yKotak + 6, { align: 'right' })
  pdf.line(kanan - 42, yKotak + 20, kanan - 4, yKotak + 20)
}

/** Titik tulis teks sel: di tengah sel, atau 2,5mm dari tepi kiri. */
function teksPosisi(xKolom: number, kolom: { lebar: number; tengah: boolean }) {
  return kolom.tengah ? xKolom + kolom.lebar / 2 : xKolom + 2.5
}

/** Ukuran font terbesar (9, 8, 7pt) yang membuat teks muat dalam lebar tertentu. */
function ukuranPas(pdf: jsPDF, teks: string, lebarMm: number): number {
  for (const ukuran of [UKURAN_FONT_ISI, 8, UKURAN_FONT_ISI_MIN]) {
    pdf.setFontSize(ukuran)
    if (pdf.getTextWidth(teks) <= lebarMm) return ukuran
  }
  return UKURAN_FONT_ISI_MIN
}

/**
 * Potong teks dengan elipsis bila masih terlalu lebar pada ukuran font
 * minimum. `pdf.getTextWidth` dihitung ulang setiap iterasi karena lebar
 * karakter tidak seragam.
 */
function potongTeks(pdf: jsPDF, teks: string, lebarMm: number): string {
  pdf.setFontSize(UKURAN_FONT_ISI_MIN)
  if (pdf.getTextWidth(teks) <= lebarMm) return teks

  let dipotong = teks
  while (dipotong.length > 1 && pdf.getTextWidth(`${dipotong}...`) > lebarMm) {
    dipotong = dipotong.slice(0, -1)
  }
  return `${dipotong}...`
}
