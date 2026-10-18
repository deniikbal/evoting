'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Siswa } from '@/app/admin/siswa/page'

interface VoterCardProps {
  siswa: Siswa & { nomorUrut?: number }
}

export default function VoterCard({ siswa }: VoterCardProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  // QR berisi qr_id (UUID acak), bukan NIS — supaya identitas pemilih
  // tidak bisa ditebak/dibuat ulang orang lain. Kartu lama (berisi NIS)
  // tetap dikenali kiosk lewat fallback di /api/auth/qr.
  const qrValue = siswa.qrId || siswa.nis

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, qrValue, {
        width: 96,
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      }).catch((err) => {
        console.error('Gagal membuat QR:', err)
      })
    }
  }, [qrValue])

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
            {siswa.nomorUrut}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* QR Code (isi: qr_id) */}
        <div className="flex-shrink-0">
          <canvas ref={qrRef} className="w-[14mm] h-[14mm]" />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex text-[7px] leading-tight">
            <span className="w-9 font-semibold text-gray-700">NIS</span>
            <span className="flex-1 font-bold">: {siswa.nis}</span>
          </div>

          <div className="flex text-[7px] leading-tight">
            <span className="w-9 font-semibold text-gray-700">NAMA</span>
            <span className="flex-1 truncate">: {siswa.namaLengkap}</span>
          </div>

          <div className="flex text-[7px] leading-tight">
            <span className="w-9 font-semibold text-gray-700">KELAS</span>
            <span className="flex-1">: {siswa.kelas}</span>
          </div>
        </div>
      </div>

      <div className="mt-0.5 pt-0.5 border-t border-gray-300 text-[5px] text-gray-500 text-center leading-tight">
        Scan QR ini di bilik voting
      </div>
    </div>
  )
}
