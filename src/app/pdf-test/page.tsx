'use client'

import { useEffect, useRef, useState } from 'react'
import jsPDF from 'jspdf'
import { StudentPdfCards } from '@/components/admin/student-pdf-cards'
import type { Siswa } from '@/app/admin/siswa/page'

// ---- instrumentasi: rekam apa yang benar-benar masuk ke PDF, cegah download ----
const recorded: { dataUrl: string; w: number; h: number }[] = []


const makeStudents = (n: number): Siswa[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    nis: `2024${String(i).padStart(3, '0')}`,
    namaLengkap: `SISWA UJI ${i}`,
    kelas: `XII-${(i % 5) + 1}`,
    classroomId: null,
    plainToken: 'x',
    qrId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    sudahMemilih: false,
    createdAt: new Date().toISOString(),
  }))

export default function PdfTestPage() {
  const started = useRef(false)
  const [n, setN] = useState(20)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const count = Number(new URLSearchParams(location.search).get('n') || 20)
    setN(count)
    const out = document.getElementById('out')!
    const report: Record<string, unknown> = { n: count }

    const measure = async () => {
      const root = document.querySelector<HTMLElement>('#student-pdf-cards-render')
      if (!root) {
        report.containerFound = false
        out.textContent = 'PDFTEST ' + JSON.stringify(report)
        return
      }
      const cards = Array.from(root.querySelectorAll<HTMLElement>('.voter-card'))
      report.containerFound = true
      report.rootClient = `${root.clientWidth}x${root.clientHeight}`
      report.rootRect = JSON.stringify(root.getBoundingClientRect().toJSON())
      report.cardCount = cards.length
      report.card0Offset = cards[0] ? `${cards[0].offsetTop}/${cards[0].offsetHeight}` : 'none'
      report.card0ParentIsRoot = cards[0] ? cards[0].offsetParent === root : null
      report.card0Rect = cards[0] ? JSON.stringify(cards[0].getBoundingClientRect().toJSON()) : 'none'
      report.bodyBg = getComputedStyle(document.body).backgroundColor
      report.visibility = getComputedStyle(root).visibility
      report.display = getComputedStyle(root).display

      // Pilih tombol berdasarkan teks label, bukan button pertama di dokumen
      const btn = Array.from(document.querySelectorAll<HTMLButtonElement>('button[type="button"]'))
        .find((b) => /Download PDF/.test(b.textContent || ''))
      if (!btn) {
        report.buttonFound = false
        out.textContent = 'PDFTEST ' + JSON.stringify(report)
        return
      }
      btn.click()
      for (let i = 0; i < 300 && !(window as unknown as Record<string, unknown>).__pdfdbg; i++) await new Promise((r) => setTimeout(r, 100))
      report.dbg = (window as unknown as Record<string, unknown>).__pdfdbg ?? null
      report.recorded = recorded.length
      report.pages = []
      for (const rec of recorded) {
        const ink = await new Promise<number>((resolve) => {
          const img = new Image()
          img.onload = () => {
            const c = document.createElement('canvas')
            c.width = img.width
            c.height = img.height
            const g = c.getContext('2d')!
            g.fillStyle = '#fff'
            g.fillRect(0, 0, c.width, c.height)
            g.drawImage(img, 0, 0)
            const px = g.getImageData(0, 0, c.width, c.height).data
            let cnt = 0
            for (let i = 0; i < px.length; i += 4) {
              if (px[i] !== 255 || px[i + 1] !== 255 || px[i + 2] !== 255) cnt++
            }
            resolve(+(100 * cnt / (c.width * c.height)).toFixed(3))
          }
          img.onerror = () => resolve(-1)
          img.src = rec.dataUrl
        })
        report.pages.push({
          imgW: 0,
          placeWmm: rec.w,
          placeHmm: rec.h,
          dataUrlLen: rec.dataUrl.length,
          ink,
        })
      }
      report.errorText = document.querySelector('[role="alert"]')?.textContent || null
      out.textContent = 'PDFTEST ' + JSON.stringify(report)
    }
    setTimeout(measure, 800)
  }, [])

  return (
    <div className="p-4">
      <StudentPdfCards siswa={makeStudents(n)} />
      <pre id="out">pending</pre>
    </div>
  )
}
