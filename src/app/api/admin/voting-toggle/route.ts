import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'edge';
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Get current voting status
    const currentSetting = await db.pengaturan.findUnique({
      where: {
        namaPengaturan: 'voting_aktif'
      }
    })

    const currentStatus = currentSetting?.nilai === 'true'
    const newStatus = !currentStatus

    // Update voting status
    if (currentSetting) {
      await db.pengaturan.update({
        where: {
          namaPengaturan: 'voting_aktif'
        },
        data: {
          nilai: newStatus.toString()
        }
      })
    } else {
      // Create setting if it doesn't exist
      await db.pengaturan.create({
        data: {
          namaPengaturan: 'voting_aktif',
          nilai: newStatus.toString()
        }
      })
    }

    return NextResponse.json({
      message: `Voting berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      votingAktif: newStatus
    })

  } catch (error) {
    console.error('Error toggling voting:', error)
    return NextResponse.json(
      { message: 'Gagal mengubah status voting' },
      { status: 500 }
    )
  }
}