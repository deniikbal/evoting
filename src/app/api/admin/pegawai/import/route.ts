import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pegawai } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { generatePegawaiToken, generatePegawaiPassword, hashToken } from '@/lib/utils'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

interface ImportRow {
  nama?: string
  email?: string
  role?: string
  nip?: string
  nomorInduk?: string
}

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
  credentials: Array<{
    email: string
    password_plain: string
    token: string
    role: string
    nama: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet)

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      credentials: [],
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        const rowNumber = i + 2 // Excel rows start from 1, plus header

        // Validation
        if (!row.nama || typeof row.nama !== 'string') {
          result.errors.push({
            row: rowNumber,
            error: 'Nama harus diisi dan berupa teks',
          })
          result.failed++
          continue
        }

        if (!row.email || typeof row.email !== 'string') {
          result.errors.push({
            row: rowNumber,
            error: 'Email harus diisi dan berupa teks',
          })
          result.failed++
          continue
        }

        if (!row.role || !['guru', 'tu'].includes(row.role)) {
          result.errors.push({
            row: rowNumber,
            error: 'Role harus guru atau tu',
          })
          result.failed++
          continue
        }

        // Check if email already exists
        const [existingPegawai] = await db
          .select()
          .from(pegawai)
          .where(eq(pegawai.email, row.email))
          .limit(1)

        if (existingPegawai) {
          result.errors.push({
            row: rowNumber,
            error: `Email sudah terdaftar (ID: ${existingPegawai.id})`,
          })
          result.failed++
          continue
        }

        // Generate credentials
        const plainPassword = generatePegawaiPassword()
        const token = generatePegawaiToken(row.role as 'guru' | 'tu')
        const hashedToken = hashToken(token)

        // Insert to database
        await db.insert(pegawai).values({
          nama: row.nama.trim(),
          email: row.email.trim().toLowerCase(),
          passwordPlain: plainPassword,
          token: hashedToken,
          role: row.role,
          nip: row.nip ? row.nip.toString().trim() : null,
          nomorInduk: row.nomorInduk ? row.nomorInduk.toString().trim() : null,
          status: 'aktif',
        })

        result.credentials.push({
          email: row.email.trim().toLowerCase(),
          password_plain: plainPassword,
          token: token,
          role: row.role,
          nama: row.nama.trim(),
        })

        result.success++
      } catch (error) {
        result.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Error tidak diketahui',
        })
        result.failed++
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${result.success} berhasil, ${result.failed} gagal`,
      result,
    })
  } catch (error) {
    console.error('Error importing pegawai:', error)
    return NextResponse.json(
      { message: 'Gagal mengimport pegawai' },
      { status: 500 }
    )
  }
}
