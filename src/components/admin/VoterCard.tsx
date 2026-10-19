'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Siswa } from '@/app/admin/siswa/page'

interface VoterCardProps {
  siswa: Siswa & { nomorUrut?: number }
}

/**
 * Ukuran kartu dipatok mati (mm) supaya SEMUA kartu sama lebar dan tinggi.
 *
 * Sebelumnya kartu tidak punya ukuran tetap: grid memakai `repeat(3, 1fr)` dan
 * `1fr` minimumnya adalah min-content, sedangkan nama memakai `truncate`
 * (`white-space: nowrap`) tanpa `min-w-0`. Akibatnya kartu yang namanya panjang
 * melebarkan kolomnya sendiri — terukur 74,94 / 79,51 / 86,61 mm dalam satu
 * baris, dan total grid meluber jadi 945px pada wadah 794px (paling kanan
 * 250mm, melewati lebar A4 210mm). Nama panjang juga terpotong ellipsis,
 * bukan turun ke baris baru.
 *
 * Sekarang lebar & tinggi tetap (60mm x 35mm), dan nama membungkus ke baris
 * baru di dalam batas lebar kartu (`break-words`, tanpa `truncate`).
 *
 * 60mm dipilih supaya 3 kolom pas di area cetak A4: (190 - 2 x 5mm gap) / 3.
 *
 * Ukuran QR ditulis sebagai inline style, BUKAN kelas `w-[14mm]`/`h-[14mm]`.
 * Library `qrcode` menulis `style="width:96px;height:96px"` langsung ke elemen
 * canvas (dari opsi `width`), dan inline style selalu menang atas kelas utility.
 * Akibatnya QR selalu 25,4mm (96px) apa pun kelasnya, melebihi ruang isi kartu
 * (23,48mm) dan menabrak footer "Scan QR ini di bilik voting" sejauh 5,2px.
 * Untuk QR, `width` hanya menentukan resolusi internal kanvas; ukuran tampil
 * diatur lewat CSS, jadi 14mm tetap tajam karena kanvas 96px diskalakan turun.
 */
const LEBAR_KARTU = '60mm'
const TINGGI_KARTU = '35mm'
/** Ukuran tampil QR. 20mm dipilih dari sapuan uji (14-22mm) yang menguji
 *  keterbacaan hasil cetak pada 300/200/150/120/96 dpi + blur + noda:
 *  20mm lulus 5/5 di semua kondisi, 18mm mulai gagal di 120 dpi.
 *  Kartu 35mm masih memuatnya tanpa memotong nama. */
const UKURAN_QR = '20mm'
/** Resolusi internal kanvas QR (piksel), BUKAN ukuran tampil.
 *  PDF digambar lewat html2canvas `scale: 3`, jadi QR 20mm menjadi sekitar
 *  227px pada A4. Kanvas 384px membuat QR selalu DIPERKECIL (tajam), bukan
 *  diperbesar seperti dulu saat kanvas masih 96px. */
const RESOLUSI_QR = 384

export default function VoterCard({ siswa }: VoterCardProps) {
  const qrRef = useRef<HTMLCanvasElement>(null)

  // QR berisi qr_id (UUID acak), bukan NIS — supaya identitas pemilih
  // tidak bisa ditebak/dibuat ulang orang lain. Kartu lama (berisi NIS)
  // tetap dikenali kiosk lewat fallback di /api/auth/qr.
  const qrValue = siswa.qrId || siswa.nis

  useEffect(() => {
    const kanvas = qrRef.current
    if (!kanvas) return

    QRCode.toCanvas(kanvas, qrValue, {
      // `width` = resolusi internal kanvas, bukan ukuran tampil.
      width: RESOLUSI_QR,
      // Quiet zone (zona putih di tepi) WAJIB ada supaya pemindai bisa
      // menemukan batas QR. Dengan `margin: 0` QR menempel ke garis kartu.
      // Uji ulang: margin 2 modul memberi hasil terbaik pada cetak kotor.
      margin: 2,
      // 'M' (15%) dipilih berdasarkan uji, BUKAN 'H'. Level lebih tinggi
      // menambah jumlah modul, sehingga tiap modul jadi lebih kecil dan
      // justru lebih mudah gagal saat cetak blur/kotor: pada 18mm 'H' gagal
      // total (0/5) di 120 dpi, sedangkan 'M' lulus 5/5.
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then(() => {
        // `qrcode` menimpa style.width/height kanvas dengan ukuran piksel
        // internalnya (RESOLUSI_QR px) SETELAH render. Tanpa penyetelan ulang
        // di sini, QR tampil sebesar RESOLUSI_QR px dan merusak kartu.
        kanvas.style.width = UKURAN_QR
        kanvas.style.height = UKURAN_QR
        kanvas.style.display = 'block'
      })
      .catch((err) => {
        console.error('Gagal membuat QR:', err)
      })
  }, [qrValue])

  return (
    <div
      className="voter-card flex flex-col overflow-hidden rounded border border-gray-800 bg-white p-1.5"
      style={{ width: LEBAR_KARTU, height: TINGGI_KARTU }}
    >
      <div className="relative mb-1 shrink-0 border-b border-gray-800 pb-0.5">
        <h2 className="text-center text-[9px] font-bold leading-tight text-gray-900">
          PEMILIHAN KETUA OSIS
        </h2>
        {siswa.nomorUrut !== undefined && (
          <span
            className="absolute right-0 top-0 text-[8px] font-bold leading-tight text-gray-900"
            aria-label={`Nomor urut ${siswa.nomorUrut}`}
          >
            {siswa.nomorUrut}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 items-start gap-1.5">
        {/* QR Code (isi: qr_id). Ukuran lewat inline style: library `qrcode`
            memasang style="width:96px;height:96px" pada canvas ini sehingga
            kelas utility selalu kalah. */}
        <div className="shrink-0">
          <canvas
            ref={qrRef}
            style={{ width: UKURAN_QR, height: UKURAN_QR, display: 'block' }}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-[7px] leading-tight">
          <div className="flex">
            <span className="w-9 shrink-0 font-semibold text-gray-700">NIS</span>
            <span className="min-w-0 flex-1 font-bold">: {siswa.nis}</span>
          </div>

          {/* Nama membungkus ke baris baru, tidak dipotong ellipsis. */}
          <div className="flex">
            <span className="w-9 shrink-0 font-semibold text-gray-700">NAMA</span>
            <span className="min-w-0 flex-1 break-words">: {siswa.namaLengkap}</span>
          </div>

          <div className="flex">
            <span className="w-9 shrink-0 font-semibold text-gray-700">KELAS</span>
            <span className="min-w-0 flex-1 break-words">: {siswa.kelas}</span>
          </div>
        </div>
      </div>

      <div className="mt-0.5 shrink-0 border-t border-gray-300 pt-0.5 text-center text-[5px] leading-tight text-gray-500">
        Scan QR ini di bilik voting
      </div>
    </div>
  )
}
