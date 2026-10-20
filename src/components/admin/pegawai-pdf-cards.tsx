'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { FileDown, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PegawaiCard from '@/components/admin/PegawaiCard'
import { generateCardsPdf } from '@/lib/generate-cards-pdf'
import { denganNomorUrut } from '@/lib/urutan-kelas'

interface Pegawai {
  id: number
  nama: string
  email: string
  role: 'guru' | 'tu'
  status: 'aktif' | 'non-aktif'
  sudahMemilih: boolean
  tokenPlain: string
  qrId: string
  /** Dicetak di kartu bila terisi; saat ini masih kosong di basis data. */
  nip?: string | null
  nomorInduk?: string | null
}

interface Props {
  pegawai: Pegawai[]
  label?: string
  className?: string
  fileName?: string
  containerId?: string
  hideControls?: boolean
  autoDownload?: boolean
  onDone?: () => void
}

export function PegawaiPdfCards({
  pegawai,
  label = 'Download PDF',
  className,
  fileName,
  containerId = 'pegawai-pdf-cards-render',
  hideControls = false,
  autoDownload = false,
  onDone,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => setError(''), [pegawai.length])

  const handleDownload = async () => {
    if (pegawai.length === 0) {
      setError('Tidak ada pegawai untuk di-generate')
      return
    }
    setIsGenerating(true)
    setError('')
    try {
      const defaultName = `kartu-pegawai-${new Date().toISOString().slice(0, 10)}.pdf`
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

  useEffect(() => {
    if (autoDownload && pegawai.length > 0) handleDownload()
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
          disabled={isGenerating || pegawai.length === 0}
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

      {/* Container off-screen untuk snapshot. Sengaja bukan display:none supaya
          canvas QR di PegawaiCard ter-render dan bisa diambil html2canvas.
          Kolomnya lebar TETAP (65mm = kartu 60mm + 2 x 2,5mm garis potong),
          bukan `1fr`: dengan `1fr` minimum kolom adalah min-content, sehingga
          kartu berisi nama panjang melebarkan kolomnya sendiri dan grid
          meluber melewati lebar A4. `gap: 0` disengaja karena garis putus-putus
          tiap kartu sudah menyisakan 2,5mm di luar tepi kartu, jadi garis dua
          kartu bersebelahan berimpit menjadi satu garis potong. */}
      <div
        id={containerId}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '210mm',
          background: '#ffffff',
          color: '#000000',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 65mm)',
          justifyContent: 'center',
          gap: '0',
          padding: '7.5mm',
          zIndex: -1,
        }}
      >
        {(() => {
          // Nomor urut alfabet nama, memakai helper yang sama dengan kartu
          // siswa supaya penomoran kedua jenis kartu konsisten.
          const berurut = denganNomorUrut(
            pegawai.map((p) => ({ ...p, namaLengkap: p.nama }))
          )
          return berurut.map((p) => <PegawaiCard key={p.id} pegawai={p} />)
        })()}
      </div>
    </div>
  )
}
