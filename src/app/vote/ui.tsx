'use client'

// Palet & potongan UI bersama untuk halaman bilik voting.
// Aksen: indigo (utama) · teal (mitra muda) · amber (mitra tama) · emerald (sukses).
// Sengaja tanpa efek berlebihan (tanpa glassmorphism, tanpa gradien 3 warna
// bertumpuk) supaya tetap enak dibaca panitia di layar HP.

/** Tombol sekunder yang rapi: satu garis, ikon sejajar, area sentuh cukup. */
export function ToolButton({
  onClick,
  icon,
  children,
  disabled,
  title,
}: {
  onClick?: () => void
  icon: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="group inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  )
}

/** Label kecil berpita untuk menandai tahap. */
export function StepTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
      {children}
    </span>
  )
}

/** Kartu putih dengan garis tipis — dipakai semua tahap agar konsisten. */
export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] ${className}`}
    >
      {children}
    </div>
  )
}
