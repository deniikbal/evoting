'use client'

import jsPDF from 'jspdf'
// html2canvas-pro: fork dari html2canvas yang mendukung oklch()/lab()/lch().
// Tailwind v4 mengompilasi warna gray-* jadi oklch(), yang membuat html2canvas 1.4.1 gagal.
import html2canvas from 'html2canvas-pro'

export interface GeneratePdfOptions {
  /** Element (or selector) of a *hidden* container that already has all rendered voter cards (in DOM, off-screen). */
  source: HTMLElement | string
  /** File name of the resulting download. */
  fileName?: string
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
/** 3 kartu per baris A4 (1fr `gridTemplateColumns` container snapshot). */
const CARDS_PER_ROW = 3

/**
 * Render all `.voter-card` elements inside `source` to a multi-page A4 PDF
 * (4 cards per row, same layout as `VoterCard` print CSS), then trigger download.
 *
 * The caller is responsible for putting the cards in a hidden off-screen
 * container and rendering them with the same styles as `VoterCard`.
 *
 * Strategy:
 * 1. Susun tiap halaman A4 (7 baris x 3 kartu = maks 21 kartu per halaman A4) di container 210mm.
 * 2. html2canvas snapshot per halaman (bukan seluruh container: capture
 *    sangat tinggi, mis. 1000+ kartu, melewati batas ukuran canvas Chrome
 *    sehingga hasilnya kosong).
 * 3. Tanam JPEG hasil snapshot ke PDF A4. JPEG dipilih karena jsPDF menanam
 *    DCTDecode tanpa decode (jalur PNG jsPDF gagal: "Error while decompressing
 *    the data: -3").
 */
export async function generateCardsPdf({
  source,
  fileName = 'kartu-pemilih.pdf',
}: GeneratePdfOptions): Promise<void> {
  const root = typeof source === 'string' ? document.querySelector<HTMLElement>(source) : source
  const rootSelector = typeof source === 'string' ? source : '#student-pdf-cards-render'
  if (!root) throw new Error('Container kartu tidak ditemukan')

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.voter-card'))
  if (cards.length === 0) throw new Error('Tidak ada kartu (.voter-card) untuk di-export')

  // Tunggu 1 frame agar QR <canvas> yang di-render via `qrcode` library
  // benar-benar sudah tergambar sebelum di-snapshot.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  // Tunggu sampai SEMUA QR canvas sudah digambar (effect VoterCard).
  // Cek: setiap .voter-card punya <canvas> yang bukan kosong.
  for (let i = 0; i < 30; i++) {
    const allReady = cards.every((c) => {
      const canvas = c.querySelector('canvas')
      if (!canvas) return false
      const ctx = canvas.getContext('2d')
      if (!ctx) return true
      try {
        const data = ctx.getImageData(0, 0, 1, 1).data
        return data[3] !== 0 // pixel alpha > 0
      } catch {
        return true
      }
    })
    if (allReady) break
    await new Promise((r) => setTimeout(r, 100))
  }

  // Ukuran baris diambil dari DOM asli sebelum container dimodifikasi:
  // root persis selebar A4; skala CSS px ke mm ikut lebar root.
  const pageW = A4_WIDTH_MM
  const pageH = A4_HEIGHT_MM
  const mmPerCss = pageW / root.clientWidth
  const totalRows = Math.ceil(cards.length / CARDS_PER_ROW)
  const rowTopCss = (r: number) =>
    r < totalRows ? cards[r * CARDS_PER_ROW].offsetTop : root.clientHeight
  // Pitch = tinggi kartu + gap; pakai jarak antar baris nyata bila ada >1 baris.
  const pitchCss = totalRows > 1 ? rowTopCss(1) - rowTopCss(0) : cards[0].offsetHeight
  const rowsPerPage = Math.max(1, Math.floor(pageH / (pitchCss * mmPerCss)))

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  })

  for (let r0 = 0; r0 < totalRows; r0 += rowsPerPage) {
    const rows = Math.min(rowsPerPage, totalRows - r0)
    const slice = cards.slice(r0 * CARDS_PER_ROW, (r0 + rows) * CARDS_PER_ROW)

    // Muat hanya baris halaman ini ke container. Capture seluruh container
    // (ribuan kartu, tinggi puluhan ribu px) gagal di Chrome: canvas limit
    // ukuran sehingga snapshot kosong/putih dan PDF jadi kosong.
    while (root.firstChild) root.removeChild(root.firstChild)
    slice.forEach((c) => root.appendChild(c))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const captured = await html2canvas(root, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        warnaHitamPutih(clonedDoc, rootSelector)
      },
    })

    if (r0 > 0) pdf.addPage()
    const mmPerPx = mmPerCss / (captured.width / root.clientWidth)
    const dataUrl = captured.toDataURL('image/jpeg', 0.95)
    // JPEG (DCTDecode) ditanam langsung oleh jsPDF tanpa decode; jalur PNG
    // memakai fast-png+inflate internal yang gagal ("Error while decompressing
    // the data: -3") pada capture besar dari canvas.
    pdf.addImage(dataUrl, 'JPEG', 0, 0, pageW, captured.height * mmPerPx)
  }

  // Kembalikan seluruh kartu ke container sesuai urutan asli.
  while (root.firstChild) root.removeChild(root.firstChild)
  cards.forEach((c) => root.appendChild(c))

  pdf.save(fileName)
}

function warnaHitamPutih(clonedDoc: Document, rootSelector: string) {
  const clonedRoot = clonedDoc.querySelector(rootSelector) as HTMLElement | null
  if (clonedRoot) {
    clonedRoot.style.background = '#ffffff'
    clonedRoot.style.color = '#000000'
  }
  clonedDoc
    .querySelectorAll<HTMLElement>('.voter-card, .voter-card *')
    .forEach((el) => {
      el.style.color = '#000000'
      el.style.borderColor = '#000000'
    })
}
