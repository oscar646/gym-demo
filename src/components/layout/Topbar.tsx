import React, { useState, useMemo } from 'react'
import {
  Menu,
  Plus,
  ShieldCheck,
  User,
  Bell,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { Button } from '../ui/Button'
import { NavTab } from './Sidebar'
import { getExpiryInfo } from '../../lib/utils'

interface TopbarProps {
  currentTab: NavTab
  onOpenMobileMenu: () => void
  onNavigateToPOS: () => void
  onNavigateToClients: () => void
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Métricas principales y rendimiento del gimnasio',
  },
  clients: {
    title: 'Clientes & Membresías',
    subtitle: 'Socios, planes de uso (mensual, día por medio, individual) y estados',
  },
  inventory: {
    title: 'Inventario',
    subtitle: 'Suplementos, bebidas y existencias',
  },
  pos: {
    title: 'Punto de Venta (POS)',
    subtitle: 'Registro de cobros y despacho de productos',
  },
  sales: {
    title: 'Historial de Ventas',
    subtitle: 'Registro de tickets y transacciones',
  },
}

export function Topbar({
  currentTab,
  onOpenMobileMenu,
  onNavigateToPOS,
  onNavigateToClients,
}: TopbarProps) {
  const { currentUser, loginAs, clients, renewClientMembership } = useGymStore()
  const isAdmin = currentUser?.role === 'admin'
  const activeMeta = TAB_TITLES[currentTab]
  const [showNotifications, setShowNotifications] = useState(false)

  // Membresías en riesgo o vencidas
  const alertMembers = useMemo(() => {
    return clients
      .filter((c) => {
        if (c.plan_type === 'Sesión Individual') return false
        const info = getExpiryInfo(c.end_date)
        return info.state === 'expiring_soon' || info.state === 'expired'
      })
      .map((c) => ({
        ...c,
        expiry: getExpiryInfo(c.end_date),
      }))
  }, [clients])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-5 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95 transition-colors">
      {/* Lado izquierdo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            {activeMeta.title}
          </h1>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {activeMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Campana de Notificaciones de Vencimientos */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Avisos de membresías por acabar o acabadas"
            className="relative rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {alertMembers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
                {alertMembers.length}
              </span>
            )}
          </button>

          {/* Popover de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Avisos de Membresías ({alertMembers.length})</span>
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-700"
                >
                  Cerrar
                </button>
              </div>

              <div className="py-2 space-y-1.5 max-h-64 overflow-y-auto">
                {alertMembers.length === 0 ? (
                  <p className="text-center text-xs text-zinc-400 py-4">No hay membresías por vencer.</p>
                ) : (
                  alertMembers.map((m) => {
                    const isExpired = m.expiry.state === 'expired'
                    return (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs flex items-center justify-between gap-2 dark:bg-zinc-850 dark:border-zinc-800"
                      >
                        <div className="overflow-hidden">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{m.full_name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {m.plan_type} · Vence: {m.end_date}
                          </p>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold ${
                              isExpired ? 'text-rose-600' : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isExpired ? `🛑 ${m.expiry.label}` : `⚠️ ${m.expiry.label}`}
                          </span>
                        </div>
                        <button
                          onClick={() => renewClientMembership(m.id)}
                          title="Renovar (+30d)"
                          className="flex-shrink-0 p-1.5 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-800 hover:text-white transition-colors dark:bg-blue-950 dark:text-blue-300"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    onNavigateToClients()
                  }}
                  className="text-xs font-semibold text-blue-800 dark:text-blue-400 hover:underline"
                >
                  Ver todos los clientes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interruptor de Rol con Azul Sobrio */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
          <button
            onClick={() => loginAs('admin')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              isAdmin
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => loginAs('empleado')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              !isAdmin
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <User className="h-3 w-3" />
            <span>Empleado</span>
          </button>
        </div>

        {/* Botón Nueva Venta */}
        {currentTab !== 'pos' && (
          <Button size="sm" onClick={onNavigateToPOS} className="hidden sm:inline-flex">
            <Plus className="h-3.5 w-3.5" />
            <span>Nueva Venta</span>
          </Button>
        )}
      </div>
    </header>
  )
}
