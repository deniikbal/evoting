import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { siswa, classroom } from '@/lib/schema'
import { inArray } from 'drizzle-orm'
import crypto from 'crypto'
import * as XLSX from 'xlsx'
import { punyaSesiAdmin, responsBukanAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Import siswa dari Excel, dua langkah.
 *
 * Langkah 1 (periksa): unggah berkas, tidak menyentuh database. Server membaca
 * seluruh baris dan mengembalikan status per baris supaya operator bisa melihat
 * kesalahan sebelum ada satu baris pun tersimpan.
 * Langkah 2 (simpan): kirim baris yang sudah diperiksa dalam bentuk JSON.
 *
 * Baris yang tidak lolos pemeriksaan tidak pernah ikut disimpan. Kelas harus
 * cocok persis dengan nama di menu Kelas: sebelumnya nama kelas yang tidak
 * dikenal hanya membuat `classroom_id` kosong tanpa pesan apa pun, sehingga
 * siswa tampak masuk padahal tidak terhubung ke kelas mana pun.
 */

const KOLOM_WAJIB = ['nis', 'namalengkap', 'kelas'] as const

type StatusBaris =
  | 'siap'
  | 'nis-kosong'
  | 'nama-kosong'
  | 'kelas-kosong'
  | 'nis-ganda-berkas'
  | 'nis-sudah-ada'
  | 'kelas-tidak-dikenal'

interface BarisDiperiksa {
  baris: number
  nis: string
  nama: string
  kelas: string
  status: StatusBaris
  catatan: string
}

function bersihkan(nilai: unknown): string {
  if (nilai === null || nilai === undefined) return ''
  return String(nilai).replace(/\s+/g, ' ').trim()
}

/** Kunci kolom: "Nama Lengkap", "nama_lengkap", dan "namaLengkap" dianggap sama. */
function kunciKolom(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function petakanHeader(baris: Record<string, unknown>): Record<string, string> {
  const peta: Record<string, string> = {}
  for (const kunci of Object.keys(baris)) {
    peta[kunciKolom(kunci)] = kunci
  }
  return peta
}

function bacaBerkas(arrayBuffer: ArrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const namaSheet = workbook.SheetNames[0]
  if (!namaSheet) return null
  const worksheet = workbook.Sheets[namaSheet]
  const baris = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    defval: '',
  })
  return { baris, namaSheet }
}

function nilai(baris: Record<string, unknown>, peta: Record<string, string>, kunci: string): string {
  const header = peta[kunci]
  return header ? bersihkan(baris[header]) : ''
}

/** Token login siswa. crypto dipakai supaya token tidak bisa ditebak dari waktu. */
function buatTokenSiswa(): string {
  const alfabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let token = ''
  for (let i = 0; i < 6; i++) {
    token += alfabet[crypto.randomInt(alfabet.length)]
  }
  return token
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  if (!punyaSesiAdmin(request)) return responsBukanAdmin()

  const tipe = request.headers.get('content-type') || ''
  try {
    if (tipe.includes('application/json')) {
      return await simpan(request)
    }
    return await periksa(request)
  } catch (error) {
    console.error('Import siswa gagal:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memproses berkas' },
      { status: 500 }
    )
  }
}

/** Langkah 1: baca berkas dan laporkan status setiap baris. Tidak menulis apa pun. */
async function periksa(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('xlsFile') as File | null

  if (!file) {
    return NextResponse.json({ message: 'Berkas belum dipilih' }, { status: 400 })
  }

  const isi = bacaBerkas(await file.arrayBuffer())
  if (!isi || isi.baris.length === 0) {
    return NextResponse.json(
      { message: 'Berkas kosong atau lembar pertama tidak berisi data' },
      { status: 400 }
    )
  }

  const peta = petakanHeader(isi.baris[0])
  const kolomHilang = KOLOM_WAJIB.filter((k) => !peta[k])
  if (kolomHilang.length > 0) {
    const namaKolomHilang = kolomHilang.map((k) => (k === 'namalengkap' ? 'nama_lengkap' : k))
    return NextResponse.json(
      {
        message: `Kolom wajib tidak ditemukan: ${namaKolomHilang.join(', ')}. Unduh template untuk melihat susunan kolom yang benar.`,
        kolomDitemukan: Object.keys(isi.baris[0]),
      },
      { status: 400 }
    )
  }

  const daftarKelas = await db.select({ id: classroom.id, name: classroom.name }).from(classroom)
  const petaKelas = new Map(
    daftarKelas.map((k) => [k.name.trim().toLowerCase(), k.id] as const)
  )

  const nisDalamBerkas = new Set<string>()
  const semuaNis: string[] = []
  const baris: BarisDiperiksa[] = []

  // Kumpulkan NIS lebih dulu supaya pemeriksaan "sudah terdaftar" cukup satu query.
  for (let i = 0; i < isi.baris.length; i++) {
    const nis = nilai(isi.baris[i], peta, 'nis')
    if (nis) semuaNis.push(nis)
  }

  const nisSudahAda = new Set<string>()
  if (semuaNis.length > 0) {
    // Potong agar jumlah parameter tetap aman untuk berkas besar.
    for (let i = 0; i < semuaNis.length; i += 500) {
      const potongan = semuaNis.slice(i, i + 500)
      const ada = await db
        .select({ nis: siswa.nis })
        .from(siswa)
        .where(inArray(siswa.nis, potongan))
      ada.forEach((r) => nisSudahAda.add(r.nis))
    }
  }

  for (let i = 0; i < isi.baris.length; i++) {
    const barisKe = i + 2 // baris 1 = header
    const isiBaris = isi.baris[i]
    const nis = nilai(isiBaris, peta, 'nis')
    const nama = nilai(isiBaris, peta, 'namalengkap')
    const kelas = nilai(isiBaris, peta, 'kelas')

    const catat = (status: StatusBaris, catatan: string) => {
      baris.push({ baris: barisKe, nis, nama, kelas, status, catatan })
    }

    if (!nis) {
      catat('nis-kosong', 'NIS belum diisi')
      continue
    }
    if (!nama) {
      catat('nama-kosong', 'Nama belum diisi')
      continue
    }
    if (!kelas) {
      catat('kelas-kosong', 'Kelas belum diisi')
      continue
    }
    if (nisDalamBerkas.has(nis)) {
      catat('nis-ganda-berkas', 'NIS ini muncul lebih dari sekali di berkas')
      continue
    }
    if (nisSudahAda.has(nis)) {
      catat('nis-sudah-ada', 'NIS sudah terdaftar di aplikasi')
      continue
    }
    if (!petaKelas.has(kelas.toLowerCase())) {
      catat('kelas-tidak-dikenal', `Nama kelas "${kelas}" tidak ada di menu Kelas`)
      continue
    }

    nisDalamBerkas.add(nis)
    catat('siap', '')
  }

  const siap = baris.filter((b) => b.status === 'siap').length
  const kelasTidakDikenal = Array.from(
    new Set(baris.filter((b) => b.status === 'kelas-tidak-dikenal').map((b) => b.kelas))
  )

  return NextResponse.json({
    ringkasan: {
      total: baris.length,
      siap,
      bermasalah: baris.length - siap,
    },
    kelasTidakDikenal,
    kelasTerdaftar: daftarKelas.map((k) => k.name),
    baris,
  })
}

/** Langkah 2: simpan baris yang lolos. Nilai diperiksa ulang di sini. */
async function simpan(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const daftar: unknown = body?.baris

  if (!Array.isArray(daftar) || daftar.length === 0) {
    return NextResponse.json(
      { message: 'Tidak ada baris yang dikirim untuk disimpan' },
      { status: 400 }
    )
  }

  const daftarKelas = await db.select({ id: classroom.id, name: classroom.name }).from(classroom)
  const petaKelas = new Map(
    daftarKelas.map((k) => [k.name.trim().toLowerCase(), k.id] as const)
  )

  const nisMasuk = new Set<string>()
  const siapSimpan: Array<{
    nis: string
    namaLengkap: string
    kelas: string
    classroomId: number
    token: string
    plainToken: string
  }> = []
  const dilewati: Array<{ nis: string; catatan: string }> = []

  for (const mentah of daftar) {
    const nis = bersihkan((mentah as Record<string, unknown>)?.nis)
    const nama = bersihkan((mentah as Record<string, unknown>)?.nama)
    const kelas = bersihkan((mentah as Record<string, unknown>)?.kelas)

    if (!nis || !nama || !kelas) {
      dilewati.push({ nis: nis || '(tanpa NIS)', catatan: 'Data tidak lengkap' })
      continue
    }
    if (nisMasuk.has(nis)) {
      dilewati.push({ nis, catatan: 'NIS ganda di dalam permintaan' })
      continue
    }
    const classroomId = petaKelas.get(kelas.toLowerCase())
    if (!classroomId) {
      dilewati.push({ nis, catatan: `Nama kelas "${kelas}" tidak ada di menu Kelas` })
      continue
    }
    nisMasuk.add(nis)

    const plainToken = buatTokenSiswa()
    siapSimpan.push({
      nis,
      namaLengkap: nama,
      kelas,
      classroomId,
      token: hashToken(plainToken),
      plainToken,
    })
  }

  if (siapSimpan.length === 0) {
    return NextResponse.json(
      {
        message: 'Tidak ada baris yang bisa disimpan',
        count: 0,
        dilewati,
      },
      { status: 400 }
    )
  }

  let tersimpan = 0
  // Potongan 500 baris: 500 x 6 kolom masih jauh di bawah batas parameter Postgres.
  for (let i = 0; i < siapSimpan.length; i += 500) {
    const potongan = siapSimpan.slice(i, i + 500)
    const hasil = await db
      .insert(siswa)
      .values(potongan)
      .onConflictDoNothing({ target: siswa.nis })
      .returning({ nis: siswa.nis })

    tersimpan += hasil.length

    const nisTersimpan = new Set(hasil.map((r) => r.nis))
    potongan.forEach((baris) => {
      if (!nisTersimpan.has(baris.nis)) {
        dilewati.push({ nis: baris.nis, catatan: 'NIS sudah terdaftar, baris dilewati' })
      }
    })
  }

  const gagal = siapSimpan.length - tersimpan
  let message = `${tersimpan} siswa tersimpan dan terhubung ke kelas`
  if (gagal > 0) {
    message += `, ${gagal} baris dilewati`
  }

  return NextResponse.json({
    message,
    count: tersimpan,
    dilewati: dilewati.length > 0 ? dilewati : undefined,
  })
}
