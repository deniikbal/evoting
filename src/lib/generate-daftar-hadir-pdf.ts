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

/** Baris paling tinggi 9mm supaya kolom tanda tangan lapang saat siswa sedikit. */
const TINGGI_BARIS_MAKS = 9
/**
 * Batas bawah tinggi baris. Tujuan Pak Deni: satu kelas cukup satu lembar F4.
 * Kelas nyata terbesar 46 siswa, tetapi batas ini dipasang supaya kelas sampai
 * 57 siswa tetap muat satu lembar (baris terapat 4,5mm, teks 9pt masih lega).
 * Di bawah 4,5mm teks mulai menempel garis tabel, jadi lebih baik pindah lembar
 * daripada dipaksa mengecil sampai tak terbaca.
 */
const TINGGI_BARIS_MIN = 4.5
const TINGGI_JUDUL_TABEL = 8
/** Tabel halaman pertama mulai di bawah kop surat. */
const Y_TABEL_AWAL = 52
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
  const yAkhirIsi = F4_TINGGI_MM - MARGIN_BAWAH

  // Satu kelas nyata terbesar 46 siswa dan muat satu lembar F4. Pembagian ini
  // jaring pengaman kalau nanti ada kelas gabungan yang lebih besar, mis.
  // 120 siswa: kapasitas satu lembar 51 baris (tinggi baris minimum 5mm),
  // jadi dibagi 40/40/40 dan barisnya tetap lapang (6,4mm). Baris TIDAK
  // dipaksa mengecil sampai tak terbaca hanya supaya muat satu lembar.
  const kapasitas = Math.max(
    1,
    Math.floor((yAkhirIsi - Y_TABEL_AWAL - TINGGI_JUDUL_TABEL) / TINGGI_BARIS_MIN)
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
      gambarKop(pdf, { namaSekolah, kelas, jumlah: total, keterangan })
    } else {
      gambarKopLanjutan(pdf, { kelas, halaman: halaman + 1 })
    }

    const yIsi = yTabel + TINGGI_JUDUL_TABEL
    const tinggiBaris = Math.min(
      TINGGI_BARIS_MAKS,
      (yAkhirIsi - yIsi) / potongan.length
    )

    gambarJudulTabel(pdf, MARGIN_KIRI, yTabel, lebarTabel, TINGGI_JUDUL_TABEL)
    gambarIsiTabel(pdf, {
      x: MARGIN_KIRI,
      y: yIsi,
      lebarTabel,
      tinggiBaris,
      data: potongan,
    })
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
  jumlah: number
  keterangan?: string
}

function gambarKop(pdf: jsPDF, { namaSekolah, kelas, jumlah, keterangan }: Kop) {
  const tengah = F4_LEBAR_MM / 2
  const kanan = F4_LEBAR_MM - MARGIN_KANAN

  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('DAFTAR HADIR PEMILIHAN KETUA OSIS', tengah, 18, { align: 'center' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(namaSekolah, tengah, 24, { align: 'center' })

  pdf.setLineWidth(0.5)
  pdf.line(MARGIN_KIRI, 27, kanan, 27)
  pdf.setLineWidth(0.2)
  pdf.line(MARGIN_KIRI, 27.8, kanan, 27.8)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Kelas: ${kelas}`, MARGIN_KIRI, 34)
  pdf.text(`Jumlah pemilih: ${jumlah} siswa`, kanan, 34, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.text('Hari/Tanggal: ...................................', MARGIN_KIRI, 40)
  pdf.text('Pukul: .................', kanan, 40, { align: 'right' })

  if (keterangan) {
    pdf.text(keterangan, tengah, 45, { align: 'center' })
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
  pdf.setLineWidth(0.2)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(0, 0, 0)

  let yBaris = y
  for (const siswa of data) {
    const isi = [String(siswa.nomorUrut), siswa.nis, siswa.namaLengkap, '']

    let xKolom = x
    KOLOM.forEach((kolom, i) => {
      if (xKolom > x) pdf.line(xKolom, yBaris, xKolom, yBaris + tinggiBaris)

      const teks = isi[i]
      if (teks) {
        // Nama panjang diperkecil bertahap (9 -> 8 -> 7pt). Kalau tetap tidak
        // muat, dipotong dengan elipsis: lebih baik terbaca utuh nama yang
        // sedikit dipendekkan daripada meluber ke kolom tanda tangan.
        const maks = kolom.lebar - 5
        const ukuran = ukuranPas(pdf, teks, maks)
        pdf.setFontSize(ukuran)
        pdf.text(potongTeks(pdf, teks, maks), teksPosisi(xKolom, kolom), yBaris + tinggiBaris / 2, {
          align: kolom.tengah ? 'center' : 'left',
          baseline: 'middle',
        })
      }

      xKolom += kolom.lebar
    })

    yBaris += tinggiBaris
  }

  pdf.rect(x, y, lebarTabel, yBaris - y)
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
