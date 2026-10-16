'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Siswa } from '@/app/admin/siswa/page'

interface VoterCardProps {
  siswa: Siswa
}

export default function VoterCard({ siswa }: VoterCardProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // QR hanya berisi NIS (sederhana, mudah dicetak & dipindai)
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, siswa.nis, {
        width: 96,
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#FFFFFF' },
      }).catch((err) => {
        console.error('Gagal membuat QR:', err)
      })
    }
  }, [siswa.nis])

  return (
    <div className="voter-card bg-white border border-gray-800 rounded p-1.5">
      <div className="text-center mb-1 pb-0.5 border-b border-gray-800">
        <h2 className="text-[9px] font-bold text-gray-900 leading-tight">PEMILIHAN KETUA OSIS</h2>
      </div>

      <div className="flex items-center gap-1.5">
        {/* QR Code (isi: NIS) */}
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
