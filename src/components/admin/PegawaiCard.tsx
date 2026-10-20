'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface Pegawai {
  id: number
  nama: string
  email: string
  role: 'guru' | 'tu'
  qrId: string
  tokenPlain: string
  nip?: string | null
  nomorInduk?: string | null
  nomorUrut?: number
}

interface PegawaiCardProps {
  pegawai: Pegawai
}

/**
 * Kartu pemilih pegawai. Template, ukuran, dan geometri disamakan dengan
 * VoterCard (kartu siswa) supaya PDF pegawai dan PDF siswa bisa dicetak
 * dengan pengaturan potong yang sama.
 *
 * Ukuran dipatok mati (mm) — bukan `1fr` — karena grid `1fr` minimumnya
 * min-content, sehingga nama panjang melebarkan kolomnya sendiri dan grid
 * meluber melewati lebar A4.
 *
 * Ukuran QR memakai inline style, BUKAN kelas `w-[20mm]`. Library `qrcode`
 * menulis `style="width:NNNpx;height:NNNpx"` langsung ke canvas dan inline
 * style selalu menang atas kelas utility, jadi ukuran tampil harus diatur
 * ulang lewat style setelah render.
 */
const LEBAR_KARTU = '60mm'
const TINGGI_KARTU = '35mm'
/** Jarak garis potong dari tepi kartu (2,5mm): kotak jadi 65mm x 40mm,
 *  sehingga 3 kolom = 195mm tetap muat di area cetak A4. */
const GARIS_POTONG = '2.5mm'
/** Ukuran tampil QR 20mm — hasil sapuan uji keterbacaan cetak 120-300 dpi. */
const UKURAN_QR = '20mm'
/** Resolusi internal kanvas QR, bukan ukuran tampil. PDF digambar dengan
 *  html2canvas `scale: 3`, jadi kanvas lebih besar dari ukuran tampil agar
 *  QR selalu diperkecil (tajam), bukan diperbesar. */
const RESOLUSI_QR = 384

export default function PegawaiCard({ pegawai }: PegawaiCardProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)
  const jabatan = pegawai.role === 'guru' ? 'GURU' : 'TENAGA KEPENDIDIKAN'
  // NIP dipakai lebih dulu, lalu nomor induk sebagai cadangan.
  const nomorInduk = pegawai.nip || pegawai.nomorInduk || ''

  useEffect(() => {
    const kanvas = qrRef.current
    if (!kanvas) return

    QRCode.toCanvas(kanvas, pegawai.qrId, {
      width: RESOLUSI_QR,
      // Quiet zone wajib ada supaya pemindai menemukan batas QR.
      margin: 2,
      // 'M' (15%) dipilih dari uji cetak: level lebih tinggi menambah modul
      // sehingga tiap modul mengecil dan justru gagal saat cetak blur/kotor.
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(() => {
        // `qrcode` menimpa style.width/height kanvas dengan ukuran piksel
        // internalnya setelah render; tanpa penyetelan ulang di sini QR tampil
        // sebesar RESOLUSI_QR px dan merusak kartu.
        kanvas.style.width = UKURAN_QR
        kanvas.style.height = UKURAN_QR
        kanvas.style.display = 'block'
      })
      .catch((err) => {
        console.error('Gagal membuat QR:', err)
      })
  }, [pegawai.qrId])

  return (
    <div
      className="voter-card-wrap flex items-center justify-center"
      style={{
        width: `calc(${LEBAR_KARTU} + 2 * ${GARIS_POTONG})`,
        height: `calc(${TINGGI_KARTU} + 2 * ${GARIS_POTONG})`,
        // Garis potong memakai `border` pada PEMBUNGKUS, bukan `outline` pada
        // kartu: html2canvas tidak merender `outline`, sehingga garisnya hilang
        // dari PDF.
        border: '1px dashed #9ca3af',
      }}
    >
      <div
        className="voter-card flex flex-col overflow-hidden rounded border border-gray-800 bg-white p-1.5"
        style={{
          width: LEBAR_KARTU,
          height: TINGGI_KARTU,
        }}
      >
        <div className="relative mb-1 shrink-0 border-b border-gray-800 pb-0.5">
          <h2 className="text-center text-[9px] font-bold leading-tight text-gray-900">
            PEMILIHAN KETUA OSIS
          </h2>
          {pegawai.nomorUrut !== undefined && (
            <span
              className="absolute right-0 top-0 text-[8px] font-bold leading-tight text-gray-900"
              aria-label={`Nomor urut ${pegawai.nomorUrut}`}
            >
              {pegawai.nomorUrut}
            </span>
          )}
        </div>

        <div className="flex min-h-0 flex-1 items-start gap-1.5">
          <div className="shrink-0">
            <canvas
              ref={qrRef}
              style={{ width: UKURAN_QR, height: UKURAN_QR, display: 'block' }}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[7px] leading-tight">
            {/* Baris nomor induk hanya muncul bila datanya ada. Saat ini NIP
                seluruh pegawai masih kosong di basis data, jadi mencetak
                "NIP : -" di 67 kartu hanya memboroskan ruang. */}
            {nomorInduk && (
              <div className="flex">
                <span className="w-9 shrink-0 font-semibold text-gray-700">NIP</span>
                <span className="min-w-0 flex-1 break-words">: {nomorInduk}</span>
              </div>
            )}

            <div className="flex">
              <span className="w-9 shrink-0 font-semibold text-gray-700">NAMA</span>
              <span className="min-w-0 flex-1 break-words">: {pegawai.nama}</span>
            </div>

            <div className="flex">
              <span className="w-9 shrink-0 font-semibold text-gray-700">JABATAN</span>
              <span className="min-w-0 flex-1 break-words">: {jabatan}</span>
            </div>
          </div>
        </div>

        <div className="mt-0.5 shrink-0 border-t border-gray-300 pt-0.5 text-center text-[5px] leading-tight text-gray-500">
          Scan QR ini di bilik voting
        </div>
      </div>
    </div>
  )
}
