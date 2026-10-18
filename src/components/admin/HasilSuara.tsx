'use client'

import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import type { Kandidat } from './dashboard-types'
import { labelRole } from './dashboard-types'

interface HasilSuaraProps {
  kandidat: Kandidat[]
  votingAktif: boolean
  hasilTerlihat: boolean
  /** true hanya saat pemuatan pertama; penyegaran berkala tidak mengosongkan daftar. */
  sedangMemuat?: boolean
}

const URUTAN_ROLE = ['mitratama', 'mitramuda']

/**
 * Sebaran suara tiap kandidat di kelompoknya.
 * Pertanyaan: kandidat mana yang unggul di kelompok ini.
 * Panjang bar membawa data, warna tidak, jadi satu-satunya warna adalah
 * --foreground (R-29: palet tetap netral).
 */
export default function HasilSuara({
  kandidat,
  votingAktif,
  hasilTerlihat,
  sedangMemuat = false,
}: HasilSuaraProps) {
  const roleAda = Array.from(
    new Set([...URUTAN_ROLE, ...kandidat.map((k) => k.role)])
  ).filter((role) => kandidat.some((k) => k.role === role))

  if (!hasilTerlihat) {
    return (
      <section
        aria-labelledby="hasil-judul"
        className="rounded-lg border bg-card shadow-sm"
      >
        <div className="border-b px-5 py-4">
          <h2 id="hasil-judul" className="text-sm font-medium">
            Perolehan suara
          </h2>
        </div>
        <div className="flex flex-col items-start gap-2 px-5 py-8">
          <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Hasil disembunyikan</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            Voting sedang berlangsung. Perolehan suara akan tampil di sini
            setelah voting dihentikan. Jumlah pemilih yang sudah masuk tetap
            terlihat di blok partisipasi.
          </p>
        </div>
      </section>
    )
  }

  if (kandidat.length === 0) {
    return (
      <section
        aria-labelledby="hasil-judul"
        className="rounded-lg border bg-card shadow-sm"
      >
        <div className="border-b px-5 py-4">
          <h2 id="hasil-judul" className="text-sm font-medium">
            Perolehan suara
          </h2>
        </div>
        <div className="px-5 py-8">
          {/* Saat data masih diambil, jangan mengklaim kandidat tidak ada. */}
          {sedangMemuat ? (
            <p className="text-sm text-muted-foreground">
              Memuat perolehan suara
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">Belum ada kandidat terdaftar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan kandidat lewat menu Data Master. Setelah itu perolehan
                suara akan muncul di sini.
              </p>
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="hasil-judul"
      className="rounded-lg border bg-card shadow-sm"
    >
      <div className="border-b px-5 py-4">
        <h2 id="hasil-judul" className="text-sm font-medium">
          Perolehan suara
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tiap pemilih memilih satu kandidat di setiap kategori, jadi
          persentase dihitung dari suara yang masuk di kategori itu, bukan dari
          jumlah pemilih.
        </p>
      </div>

      <div className="divide-y">
        {roleAda.map((role) => {
          const baris = kandidat
            .filter((k) => k.role === role)
            .sort((a, b) => b.jumlahSuara - a.jumlahSuara)
          const tertinggi = baris[0]?.jumlahSuara ?? 0
          const suaraRole = baris.reduce((s, k) => s + k.jumlahSuara, 0)

          return (
            <div key={role} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium">{labelRole(role)}</h3>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {baris.length} kandidat, {suaraRole} suara masuk
                </p>
              </div>
              {baris.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Belum ada kandidat pada kelompok ini.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {baris.map((k) => {
                    const persen =
                      suaraRole > 0
                        ? Math.round((k.jumlahSuara / suaraRole) * 100)
                        : null
                    const terdepan = k.jumlahSuara > 0 && k.jumlahSuara === tertinggi
                    return (
                      <li key={k.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <div className="flex min-w-0 items-baseline gap-2">
                            <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                              No. {k.nomorUrut}
                            </span>
                            <span className="truncate text-sm font-medium">
                              {k.namaCalon}
                            </span>
                            {terdepan ? (
                              <Badge variant="secondary" className="font-normal">
                                Tertinggi
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm tabular-nums">
                            <span className="font-semibold">
                              {k.jumlahSuara}
                            </span>{' '}
                            <span className="text-muted-foreground">
                              suara
                              {persen === null ? '' : `, ${persen}%`}
                            </span>
                          </p>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-secondary"
                          role="img"
                          aria-label={`${k.namaCalon} memperoleh ${k.jumlahSuara} dari ${suaraRole} suara di kategori ini`}
                        >
                          <div
                            className="h-full rounded-sm bg-foreground"
                            style={{ width: `${persen ?? 0}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
