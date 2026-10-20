import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * Penyaji foto kandidat dari penyimpanan VPS.
 *
 * Folder `data/foto-kandidat` berada di luar `public/`, jadi tidak ada URL
 * statis yang bisa menjangkaunya. Route ini yang membacakan berkasnya.
 *
 * Tidak dijaga sesi admin: foto kandidat memang tampil di halaman kiosk dan
 * bilik voting yang dibuka tanpa login. Yang dijaga adalah penulisan berkas
 * (POST upload), bukan pembacaannya.
 *
 * Pengaman path traversal: nama berkas dicocokkan dengan pola UUID + ekstensi
 * gambar yang dikenal, sehingga nilai seperti `../../.env` atau `..%2F..%2Fetc`
 * ditolak sebelum menyentuh sistem berkas.
 */

const FOLDER_FOTO = path.join(process.cwd(), 'data', 'foto-kandidat')

const POLA_NAMA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i

const TIPE_KONTEN: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nama: string }> }
) {
  const { nama } = await params

  // Tolak apa pun yang bukan UUID + ekstensi yang dikenal. Pemeriksaan ini
  // sekaligus menutup path traversal karena garis miring dan titik ganda tidak
  // mungkin lolos pola.
  if (!POLA_NAMA.test(nama)) {
    return NextResponse.json({ message: 'Nama berkas tidak valid' }, { status: 400 })
  }

  const ekstensi = nama.split('.').pop()!.toLowerCase()

  try {
    const isi = await readFile(path.join(FOLDER_FOTO, nama))

    return new NextResponse(new Uint8Array(isi), {
      status: 200,
      headers: {
        'Content-Type': TIPE_KONTEN[ekstensi],
        // Nama berkas unik dan isinya tidak pernah ditimpa, jadi aman disimpan
        // lama di cache peramban.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(isi.byteLength),
      },
    })
  } catch {
    return NextResponse.json({ message: 'Foto tidak ditemukan' }, { status: 404 })
  }
}
