'use client'

// Next.js mewajibkan error boundary sebagai Client Component.
// Sengaja tanpa impor komponen lain agar tidak ada batasan server/client.
export default function VoteErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Bilik Voting
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Halaman tidak dapat dimuat</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Terjadi gangguan saat memuat bilik voting. Coba muat ulang; kalau tetap gagal, hubungi
          panitia.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  )
}
