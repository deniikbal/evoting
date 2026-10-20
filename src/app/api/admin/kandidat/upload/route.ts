import { NextRequest, NextResponse } from 'next/server'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Unggah foto kandidat ke penyimpanan VPS sendiri.
 *
 * Berkas sengaja ditulis ke `data/foto-kandidat`, BUKAN ke `public/uploads`.
 * Next.js hanya menyajikan isi `public/` yang sudah ada ketika build berjalan;
 * berkas yang ditulis sesudah build tidak akan pernah terjangkau lewat URL
 * statis (terukur: /uploads/uji.txt membalas 404 walau berkasnya ada). Menaruh
 * foto di luar `public/` juga membuat `npm run build` tidak menghapusnya.
 *
 * Penyajiannya ditangani `/api/foto/[nama]` yang membaca folder yang sama.
 *
 * Ekstensi ditentukan dari tipe MIME yang diizinkan, bukan dari nama berkas
 * kiriman klien, supaya nama seperti `foto.php` tidak bisa masuk. Nama berkas
 * dibuat UUID sehingga tidak bisa ditebak dan tidak bertabrakan.
 */

const FOLDER_FOTO = path.join(process.cwd(), 'data', 'foto-kandidat')

const EKSTENSI: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const BATAS_UKURAN = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()

  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    const ekstensi = EKSTENSI[file.type]
    if (!ekstensi) {
      return NextResponse.json(
        { message: 'Tipe file tidak valid. Gunakan JPG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    if (file.size > BATAS_UKURAN) {
      return NextResponse.json(
        { message: 'Ukuran file terlalu besar. Maksimal 5MB' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { message: 'File kosong' },
        { status: 400 }
      )
    }

    const namaBerkas = `${randomUUID()}.${ekstensi}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // `recursive: true` supaya folder dibuat saat unggahan pertama.
    await mkdir(FOLDER_FOTO, { recursive: true })
    await writeFile(path.join(FOLDER_FOTO, namaBerkas), buffer)

    return NextResponse.json({
      message: 'File berhasil diupload',
      // URL relatif: domain mengikuti halaman yang membukanya, jadi tidak perlu
      // tahu apakah dipasang di VPS atau di tempat lain.
      url: `/api/foto/${namaBerkas}`,
      namaBerkas,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { message: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
}
