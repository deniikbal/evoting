import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pengaturan } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Get current voting status
    const [currentSetting] = await db.select().from(pengaturan).where(eq(pengaturan.namaPengaturan, 'voting_aktif')).limit(1)

    const currentStatus = currentSetting?.nilai === 'true'
    const newStatus = !currentStatus

    // Update voting status
    if (currentSetting) {
      await db.update(pengaturan)
        .set({ nilai: newStatus.toString() })
        .where(eq(pengaturan.namaPengaturan, 'voting_aktif'))
    } else {
      // Create setting if it doesn't exist
      await db.insert(pengaturan).values({
        namaPengaturan: 'voting_aktif',
        nilai: newStatus.toString()
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