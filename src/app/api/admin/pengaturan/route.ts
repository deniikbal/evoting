import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pengaturan = await db.pengaturan.findMany({
      where: {
        namaPengaturan: {
          in: ['voting_aktif', 'waktu_mulai_voting', 'waktu_selesai_voting']
        }
      }
    })

    // Convert to key-value object
    const pengaturanObj: any = {
      voting_aktif: 'false',
      waktu_mulai_voting: '',
      waktu_selesai_voting: ''
    }

    pengaturan.forEach(p => {
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
      await db.pengaturan.upsert({
        where: {
          namaPengaturan: setting.namaPengaturan
        },
        update: {
          nilai: setting.nilai
        },
        create: {
          namaPengaturan: setting.namaPengaturan,
          nilai: setting.nilai
        }
      })
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