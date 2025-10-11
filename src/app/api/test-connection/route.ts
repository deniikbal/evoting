import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json()

    if (!connectionString) {
      return NextResponse.json(
        { message: 'Connection string harus diisi' },
        { status: 400 }
      )
    }

    // Test the connection string format
    if (!connectionString.startsWith('postgresql://')) {
      return NextResponse.json(
        { message: 'Connection string harus dimulai dengan postgresql://' },
        { status: 400 }
      )
    }

    // Update the .env file (in production, you'd use a more secure method)
    // For now, just validate the format
    try {
      const url = new URL(connectionString)
      if (!url.hostname || !url.username || !url.pathname) {
        throw new Error('Invalid connection string format')
      }
    } catch (error) {
      return NextResponse.json(
        { message: 'Format connection string tidak valid' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Connection string valid. Silakan update file .env secara manual.',
      connectionString: connectionString
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memvalidasi connection string' },
      { status: 500 }
    )
  }
}