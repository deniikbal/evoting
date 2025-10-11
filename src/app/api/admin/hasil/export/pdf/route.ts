import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Get candidates with vote counts
    const kandidat = await db.kandidat.findMany({
      orderBy: [
        { jumlahSuara: 'desc' },
        { nomorUrut: 'asc' }
      ]
    })

    // Get voting statistics
    const totalSiswa = await db.siswa.count()
    const sudahMemilih = await db.siswa.count({
      where: { sudahMemilih: true }
    })

    const totalSuara = sudahMemilih

    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hasil Voting OSIS SMAN 1 Bantarujeg</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 40px;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #333;
                margin: 0;
                font-size: 24px;
            }
            .header p {
                color: #666;
                margin: 5px 0;
            }
            .summary {
                background: #f5f5f5;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 30px;
            }
            .summary h2 {
                margin-top: 0;
                color: #333;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 15px;
            }
            .summary-item {
                padding: 10px;
                background: white;
                border-radius: 3px;
                border-left: 4px solid #007bff;
            }
            .summary-item strong {
                display: block;
                color: #007bff;
                font-size: 18px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            th {
                background-color: #f8f9fa;
                font-weight: bold;
            }
            .winner {
                background-color: #fff3cd;
                font-weight: bold;
            }
            .text-center {
                text-align: center;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>HASIL VOTING KETUA OSIS</h1>
            <p>SMAN 1 Bantarujeg</p>
            <p>Tahun Ajaran 2024/2025</p>
            <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="summary">
            <h2>Ringkasan Voting</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <strong>${totalSiswa}</strong>
                    Total Pemilih Terdaftar
                </div>
                <div class="summary-item">
                    <strong>${sudahMemilih}</strong>
                    Sudah Melakukan Voting
                </div>
                <div class="summary-item">
                    <strong>${totalSiswa - sudahMemilih}</strong>
                    Belum Melakukan Voting
                </div>
                <div class="summary-item">
                    <strong>${totalSiswa > 0 ? ((sudahMemilih / totalSiswa) * 100).toFixed(2) : '0.00'}%</strong>
                    Tingkat Partisipasi
                </div>
            </div>
        </div>

        <h2>Perolehan Suara per Kandidat</h2>
        <table>
            <thead>
                <tr>
                    <th>Peringkat</th>
                    <th>Nomor Urut</th>
                    <th>Nama Calon</th>
                    <th>Jumlah Suara</th>
                    <th>Persentase</th>
                </tr>
            </thead>
            <tbody>
                ${kandidat.map((k, index) => {
                    const persentase = totalSuara > 0 ? ((k.jumlahSuara / totalSuara) * 100).toFixed(2) : '0.00'
                    const isWinner = index === 0 && k.jumlahSuara > 0
                    return `
                    <tr class="${isWinner ? 'winner' : ''}">
                        <td class="text-center">${index + 1}</td>
                        <td class="text-center">${k.nomorUrut}</td>
                        <td>${k.namaCalon}</td>
                        <td class="text-center">${k.jumlahSuara}</td>
                        <td class="text-center">${persentase}%</td>
                    </tr>
                    `
                }).join('')}
            </tbody>
        </table>

        ${kandidat.length > 0 && kandidat[0].jumlahSuara > 0 ? `
        <div class="summary" style="margin-top: 30px; background: #d4edda; border-left: 4px solid #28a745;">
            <h2 style="color: #155724;">🏆 Pemenang Sementara</h2>
            <p style="font-size: 18px; margin: 10px 0;">
                <strong>${kandidat[0].namaCalon}</strong> (Nomor Urut ${kandidat[0].nomorUrut})
            </p>
            <p>
                Mendapatkan ${kandidat[0].jumlahSuara} suara (${totalSuara > 0 ? ((kandidat[0].jumlahSuara / totalSuara) * 100).toFixed(2) : '0.00'}%)
            </p>
        </div>
        ` : ''}

        <div class="footer">
            <p>Dokumen ini dibuat secara otomatis oleh Sistem E-Voting OSIS SMAN 1 Bantarujeg</p>
            <p>Generated on ${new Date().toISOString()}</p>
        </div>
    </body>
    </html>
    `

    // For now, return HTML as response (in production, you'd use a PDF library like puppeteer)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="hasil-voting-${new Date().toISOString().split('T')[0]}.html"`
      }
    })

  } catch (error) {
    console.error('Error exporting PDF:', error)
    return NextResponse.json(
      { message: 'Gagal mengekspor hasil voting' },
      { status: 500 }
    )
  }
}