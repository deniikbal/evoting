import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: LucideIcon
  className?: string
}

/**
 * Kartu statistik ringkas untuk header halaman admin.
 * Konsisten dengan tema shadcn (token warna, bukan warna hardcoded).
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface StatCardGridProps {
  children: React.ReactNode
  className?: string
}

/**
 * Grid responsif untuk deretan StatCard.
 * 1 kolom (mobile) -> 2 kolom (sm) -> 4 kolom (lg).
 */
export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}
