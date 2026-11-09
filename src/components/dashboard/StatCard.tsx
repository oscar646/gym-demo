import React from 'react'
import { Card } from '../ui/Card'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: string
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}

          {trend && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 font-medium',
                  trend.isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                )}
              >
                {trend.value}
              </span>
              <span className="text-zinc-400">vs periodo anterior</span>
            </div>
          )}
        </div>

        <div className="rounded-lg p-2 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
