import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PlanType } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `Bs ${formatted}`
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: 'short',
    }).format(date)
  } catch {
    return dateString
  }
}

export function calculateMargin(salePrice: number, costPrice: number): number {
  if (!salePrice || salePrice === 0) return 0
  return Math.round(((salePrice - costPrice) / salePrice) * 100)
}

// Calcular fecha de vencimiento según plan
export function calculateEndDate(startDateStr: string, planType: PlanType): string {
  const [y, m, d] = startDateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)

  if (planType === 'Sesión Individual') {
    // Vence el mismo día
    return startDateStr
  }

  // 30 días para planes mensuales
  date.setDate(date.getDate() + 30)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export interface ExpiryInfo {
  state: 'active' | 'expiring_soon' | 'expired'
  daysRemaining: number
  label: string
}

export function getExpiryInfo(endDateStr?: string): ExpiryInfo {
  if (!endDateStr) {
    return { state: 'active', daysRemaining: 30, label: 'Al día' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [y, m, d] = endDateStr.split('-').map(Number)
  const endDate = new Date(y, m - 1, d)
  endDate.setHours(0, 0, 0, 0)

  const diffTime = endDate.getTime() - today.getTime()
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (days < 0) {
    const absDays = Math.abs(days)
    return {
      state: 'expired',
      daysRemaining: days,
      label: absDays === 1 ? 'Acabó ayer' : `Acabó hace ${absDays} días`,
    }
  }

  if (days === 0) {
    return {
      state: 'expiring_soon',
      daysRemaining: 0,
      label: '¡Vence hoy!',
    }
  }

  if (days <= 5) {
    return {
      state: 'expiring_soon',
      daysRemaining: days,
      label: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`,
    }
  }

  return {
    state: 'active',
    daysRemaining: days,
    label: `${days} días restantes`,
  }
}
