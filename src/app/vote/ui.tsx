'use client'

// Palet: token shadcn default (netral). Aksen hanya --primary (aksi utama)
// dan --destructive (tindakan berbahaya). Tidak ada warna karangan.

/** Tombol sekunder dengan target sentuh minimal 44px (R-03). */
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  )
}

/** Kartu dasar. */
export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border border-border bg-card text-card-foreground ${className}`}>
      {children}
    </div>
  )
}

/** Label kecil netral untuk penanda tahap. */
export function StepTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  )
}
