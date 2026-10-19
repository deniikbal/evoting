'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'

/**
 * Import siswa dari Excel, dua langkah dengan pratinjau.
 *
 * Sebelumnya berkas langsung di-insert begitu diunggah, dan baris yang kelasnya
 * tidak dikenal tetap tersimpan tanpa `classroom_id` tanpa pesan apa pun. Di sini
 * server memeriksa dulu (tanpa menulis apa pun), operator melihat ringkasan dan
 * daftar baris bermasalah, baru menekan Simpan. Hanya baris berstatus siap yang
 * ikut tersimpan.
 */

interface BarisDiperiksa {
  baris: number
  nis: string
  nama: string
  kelas: string
  status: string
  catatan: string
}

interface HasilPeriksa {
  ringkasan: { total: number; siap: number; bermasalah: number }
  kelasTidakDikenal: string[]
  baris: BarisDiperiksa[]
}

interface Props {
  /** Dipanggil setelah baris tersimpan, supaya tabel siswa dimuat ulang. */
  onSelesai?: () => void
  /** Jumlah siswa yang sudah terdaftar, ditampilkan sebagai keterangan. */
  jumlahTerdaftar: number
}

export function ImportSiswaDialog({ onSelesai, jumlahTerdaftar }: Props) {
  const [terbuka, setTerbuka] = useState(false)
  const [berkas, setBerkas] = useState<File | null>(null)
  const [sedangPeriksa, setSedangPeriksa] = useState(false)
  const [sedangSimpan, setSedangSimpan] = useState(false)
  const [galat, setGalat] = useState('')
  const [hasil, setHasil] = useState<HasilPeriksa | null>(null)
  const [jumlahTersimpan, setJumlahTersimpan] = useState<number | null>(null)
  const [dilewati, setDilewati] = useState<Array<{ nis: string; catatan: string }>>([])

  const sibuk = sedangPeriksa || sedangSimpan

  const tutupSemua = () => {
    setBerkas(null)
    setHasil(null)
    setGalat('')
    setJumlahTersimpan(null)
    setDilewati([])
  }

  const handleUnduhTemplate = async () => {
    try {
      const respons = await fetch('/api/admin/siswa/template')
      if (!respons.ok) {
        toast.error('Gagal mengunduh template')
        return
      }
      const blob = await respons.blob()
      const url = window.URL.createObjectURL(blob)
      const tautan = document.createElement('a')
      tautan.href = url
      tautan.download = 'template-import-siswa.xlsx'
      tautan.click()
      window.URL.revokeObjectURL(url)
      toast.success('Template diunduh')
    } catch {
      toast.error('Gagal mengunduh template')
    }
  }

  const pilihBerkas = (daftar: FileList | null) => {
    const berkasBaru = daftar?.[0]
    if (!berkasBaru) return
    const nama = berkasBaru.name.toLowerCase()
    if (!nama.endsWith('.xlsx') && !nama.endsWith('.xls') && !nama.endsWith('.csv')) {
      setGalat('Berkas harus berformat Excel (.xlsx, .xls) atau CSV')
      setBerkas(null)
      return
    }
    setGalat('')
    setHasil(null)
    setJumlahTersimpan(null)
    setDilewati([])
    setBerkas(berkasBaru)
  }

  const handlePeriksa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!berkas) {
      setGalat('Pilih berkas Excel terlebih dahulu')
      return
    }

    setSedangPeriksa(true)
    setGalat('')
    try {
      const formData = new FormData()
      formData.append('xlsFile', berkas)

      const respons = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        body: formData,
      })
      const data = await respons.json()

      if (!respons.ok) {
        setGalat(data.message || 'Berkas tidak bisa dibaca')
        return
      }
      setHasil(data as HasilPeriksa)
    } catch {
      setGalat('Terjadi kesalahan saat membaca berkas. Coba lagi.')
    } finally {
      setSedangPeriksa(false)
    }
  }

  const handleSimpan = async () => {
    if (!hasil) return
    const siap = hasil.baris.filter((b) => b.status === 'siap')

    setSedangSimpan(true)
    try {
      const respons = await fetch('/api/admin/siswa/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baris: siap.map((b) => ({ nis: b.nis, nama: b.nama, kelas: b.kelas })),
        }),
      })
      const data = await respons.json()

      if (!respons.ok) {
        setGalat(data.message || 'Gagal menyimpan data')
        return
      }
      setJumlahTersimpan(data.count as number)
      setDilewati(Array.isArray(data.dilewati) ? data.dilewati : [])
      onSelesai?.()
      toast.success(`Import selesai: ${data.count} siswa masuk`)
    } catch {
      setGalat('Terjadi kesalahan saat menyimpan data. Coba lagi.')
    } finally {
      setSedangSimpan(false)
    }
  }

  const siap = hasil?.baris.filter((b) => b.status === 'siap') ?? []
  const bermasalah = hasil?.baris.filter((b) => b.status !== 'siap') ?? []

  return (
    <Dialog
      open={terbuka}
      onOpenChange={(buka) => {
        if (sibuk) return
        setTerbuka(buka)
        if (!buka) tutupSemua()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="min-h-11 sm:min-h-0">
          <Upload />
          Import Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Data Siswa</DialogTitle>
          <DialogDescription>
            Unggah berkas Excel berisi kolom nis, nama_lengkap, dan kelas. Data baru
            masuk setelah diperiksa dan disimpan.
          </DialogDescription>
        </DialogHeader>

        {jumlahTersimpan !== null ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">{jumlahTersimpan} siswa tersimpan</p>
                <p className="text-muted-foreground">
                  Setiap siswa mendapat token login dan identitas QR sendiri. Kartu
                  pemilih dapat dicetak dari tombol Download PDF.
                </p>
              </div>
            </div>

            {dilewati.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>{dilewati.length} baris dilewati</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="mt-2 max-h-40">
                    <div className="space-y-2">
                      {dilewati.map((d) => (
                        <p key={d.nis} className="text-xs">
                          <span className="font-medium">{d.nis}:</span> {d.catatan}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button onClick={() => setTerbuka(false)} className="min-h-11 sm:min-h-0">
                Selesai
              </Button>
            </DialogFooter>
          </div>
        ) : !hasil ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="mt-0.5 size-4 shrink-0" />
                Template berisi susunan kolom yang benar dan daftar nama kelas yang
                terdaftar, supaya penulisan kelas tidak berbeda.
              </p>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleUnduhTemplate}
                className="mt-3 w-full min-h-11 sm:min-h-0"
              >
                <Download />
                Unduh Template Excel
              </Button>
            </div>

            <form onSubmit={handlePeriksa} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="berkas-siswa"
                  className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors hover:border-primary"
                >
                  <input
                    id="berkas-siswa"
                    name="xlsFile"
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                    disabled={sibuk}
                    onChange={(e) => pilihBerkas(e.target.files)}
                  />
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {berkas ? berkas.name : 'Klik untuk memilih berkas Excel'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Format .xlsx, .xls, atau .csv. Lembar pertama yang dibaca.
                  </span>
                </label>
              </div>

              {galat && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{galat}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTerbuka(false)}
                  disabled={sibuk}
                  className="min-h-11 sm:min-h-0"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={!berkas || sibuk} className="min-h-11 sm:min-h-0">
                  {sedangPeriksa ? (
                    <>
                      <Spinner />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet />
                      Periksa Berkas
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-3" role="status">
              <p className="text-sm">
                <span className="font-medium">{hasil.ringkasan.siap}</span> baris siap
                disimpan
                {hasil.ringkasan.bermasalah > 0 && (
                  <>
                    , <span className="font-medium">{hasil.ringkasan.bermasalah}</span>{' '}
                    baris bermasalah tidak ikut disimpan
                  </>
                )}
                .
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dari {hasil.ringkasan.total} baris di berkas. Saat ini {jumlahTerdaftar}{' '}
                siswa terdaftar.
              </p>
            </div>

            {hasil.kelasTidakDikenal.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Nama kelas tidak dikenal</AlertTitle>
                <AlertDescription>
                  <p className="mt-1 text-xs">
                    {hasil.kelasTidakDikenal.join(', ')}. Perbaiki penulisan di berkas
                    atau tambahkan kelasnya lebih dulu di menu Kelas.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {bermasalah.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Baris bermasalah ({bermasalah.length})</p>
                <ScrollArea className="max-h-48 rounded-md border">
                  <div className="divide-y">
                    {bermasalah.map((b) => (
                      <div key={b.baris} className="p-3 text-xs">
                        <p className="font-medium">Baris {b.baris}</p>
                        <p className="text-muted-foreground">
                          {b.catatan}
                          {b.nis ? ` (NIS: ${b.nis})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {siap.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Baris siap disimpan ({siap.length})</p>
                <ScrollArea className="max-h-48 rounded-md border">
                  <div className="divide-y">
                    {siap.map((b) => (
                      <div key={b.baris} className="flex flex-wrap gap-x-3 p-3 text-xs">
                        <span className="font-medium">{b.nis}</span>
                        <span className="min-w-0 flex-1 break-words">{b.nama}</span>
                        <span className="text-muted-foreground">{b.kelas}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {galat && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{galat}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHasil(null)
                  setBerkas(null)
                }}
                disabled={sibuk}
                className="min-h-11 sm:min-h-0"
              >
                Pilih berkas lain
              </Button>
              <Button
                type="button"
                onClick={handleSimpan}
                disabled={siap.length === 0 || sibuk}
                className="min-h-11 sm:min-h-0"
              >
                {sedangSimpan ? (
                  <>
                    <Spinner />
                    Menyimpan...
                  </>
                ) : (
                  `Simpan ${siap.length} siswa`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
