'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FileDown, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import VoterCard from '@/components/admin/VoterCard'
import { Siswa } from '@/app/admin/siswa/page'
import { generateCardsPdf } from '@/lib/generate-cards-pdf'
import { bandingNamaKelas, denganNomorUrut } from '@/lib/urutan-kelas'

interface Props {
  siswa: Siswa[]
  /** Label tombol: default "Download PDF" */
  label?: string
  /** Tentukan ukuran (cards wide) supaya sesuai dengan layout A4. */
  className?: string
  /** Tentukan default nama file PDF. */
  fileName?: string
  /** id container snapshot; wajib unik bila ada >1 instance terpasang */
  containerId?: string
  /** Sembunyikan tombol (dipakai untuk generate otomatis dari halaman lain) */
  hideControls?: boolean
  /** Generate sekali pada saat mount; dipasangkan dengan hideControls */
  autoDownload?: boolean
  /** Dipanggil setelah generate selesai (sukses maupun gagal) */
  onDone?: () => void
}

export function StudentPdfCards({
  siswa,
  label = 'Download PDF',
  className,
  fileName,
  containerId = 'student-pdf-cards-render',
  hideControls = false,
  autoDownload = false,
  onDone,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => setError(''), [siswa.length])

  const handleDownload = async () => {
    if (siswa.length === 0) {
      setError('Tidak ada siswa untuk di-generate')
      return
    }
    setIsGenerating(true)
    setError('')
    try {
      const defaultName = `kartu-pemilih-${new Date().toISOString().slice(0, 10)}.pdf`
      await generateCardsPdf({
        source: `#${containerId}`,
        fileName: fileName ?? defaultName,
      })
    } catch (err) {
      console.error('Gagal generate PDF:', err)
      setError(err instanceof Error ? err.message : 'Gagal generate PDF')
    } finally {
      setIsGenerating(false)
      onDone?.()
    }
  }

  // Generate otomatis sekali saat mount (alur generate per kelas di halaman Kelas).
  useEffect(() => {
    if (autoDownload && siswa.length > 0) handleDownload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      {!hideControls && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating || siswa.length === 0}
          className={className}
        >
          {isGenerating ? (
            <>
              <Spinner className="size-4" />
              Membuat PDF...
            </>
          ) : (
            <>
              <FileDown />
              {label}
            </>
          )}
        </Button>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden render target untuk html2canvas.
          Elemen ini off-screen tapi tetap di DOM (bukan display:none) supaya
          QR <canvas> di VoterCard ter-render dan bisa di-snapshot.
          Kolomnya lebar TETAP (60mm), bukan `1fr`: dengan `1fr` minimum kolom
          adalah min-content, sehingga kartu berisi nama panjang melebarkan
          kolomnya sendiri dan grid meluber melewati lebar A4. */}
      <div
        id={containerId}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '210mm',
          // Tinggi otomatis mengikuti isi (grid 3 kolom)
          background: '#ffffff',
          color: '#000000',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60mm)',
          justifyContent: 'center',
          gap: '5mm',
          padding: '5mm',
          zIndex: -1,
        }}
      >
        {(() => {
          // Nomor urut alfabet namaLengkap, restart per kelas, kelas disusun
          // berurutan (X, XI, XII, dst.). Bila input lintas kelas (mis. dari
          // halaman Siswa -> "Download PDF (Semua)"), tiap kelas dipecah dan
          // dinomori ulang dari 1.
          const semuaKelas = Array.from(new Set(siswa.map((s) => s.kelas))).sort(
            bandingNamaKelas
          )
          const flat: Array<Siswa & { nomorUrut: number }> = []
          for (const kelas of semuaKelas) {
            const anggotaKelas = siswa.filter((s) => s.kelas === kelas)
            flat.push(...denganNomorUrut(anggotaKelas))
          }
          return flat.map((s) => <VoterCard key={s.id} siswa={s} />)
        })()}
      </div>
    </div>
  )
}
