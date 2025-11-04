import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pengaturan } from '@/lib/schema'
import { inArray, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const allPengaturan = await db.select().from(pengaturan).where(
      inArray(pengaturan.namaPengaturan, ['voting_aktif', 'waktu_mulai_voting', 'waktu_selesai_voting'])
    )

    // Convert to key-value object
    const pengaturanObj: any = {
      voting_aktif: 'false',
      waktu_mulai_voting: '',
      waktu_selesai_voting: ''
    }

    allPengaturan.forEach(p => {
      pengaturanObj[p.namaPengaturan] = p.nilai
    })

    return NextResponse.json(pengaturanObj)

  } catch (error) {
    console.error('Error fetching pengaturan:', error)
    return NextResponse.json(
      { message: 'Gagal mengambil pengaturan' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { voting_aktif, waktu_mulai_voting, waktu_selesai_voting } = await request.json()

    // Update each setting
    const settings = [
      { namaPengaturan: 'voting_aktif', nilai: voting_aktif?.toString() || 'false' },
      { namaPengaturan: 'waktu_mulai_voting', nilai: waktu_mulai_voting || '' },
      { namaPengaturan: 'waktu_selesai_voting', nilai: waktu_selesai_voting || '' }
    ]

    for (const setting of settings) {
      const [existing] = await db.select().from(pengaturan).where(eq(pengaturan.namaPengaturan, setting.namaPengaturan)).limit(1)
      
      if (existing) {
        await db.update(pengaturan)
          .set({ nilai: setting.nilai })
          .where(eq(pengaturan.namaPengaturan, setting.namaPengaturan))
      } else {
        await db.insert(pengaturan).values({
          namaPengaturan: setting.namaPengaturan,
          nilai: setting.nilai
        })
      }
    }

    return NextResponse.json({
      message: 'Pengaturan berhasil disimpan'
    })

  } catch (error) {
    console.error('Error updating pengaturan:', error)
    return NextResponse.json(
      { message: 'Gagal menyimpan pengaturan' },
      { status: 500 }
    )
  }
}