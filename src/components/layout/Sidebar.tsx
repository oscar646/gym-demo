import React from 'react'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  History,
  Dumbbell,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { cn, getExpiryInfo } from '../../lib/utils'

export type NavTab = 'dashboard' | 'clients' | 'inventory' | 'pos' | 'sales'

interface SidebarProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ currentTab, onSelectTab, isMobileOpen, onCloseMobile }: SidebarProps) {
  const { currentUser, logout, loginAs, products, clients } = useGymStore()

  const isAdmin = currentUser?.role === 'admin'

  // Contar productos con bajo stock
  const lowStockCount = products.filter(
    (p) => p.stock <= (p.min_stock ?? 5)
  ).length

  // Contar membresías por vencer o vencidas
  const expiringMembersCount = clients.filter((c) => {
    if (c.plan_type === 'Sesión Individual') return false
    const info = getExpiryInfo(c.end_date)
    return info.state === 'expiring_soon' || info.state === 'expired'
  }).length

  interface NavItem {
    id: NavTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    adminOnly?: boolean
    badge?: number | string
    badgeVariant?: 'default' | 'warning' | 'success' | 'blue'
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'pos',
      label: 'Punto de Venta (POS)',
      icon: ShoppingCart,
      adminOnly: false,
      badge: 'Caja',
      badgeVariant: 'blue',
    },
    {
      id: 'clients',
      label: 'Clientes & Membresías',
      icon: Users,
      adminOnly: false,
      badge: expiringMembersCount > 0 ? `${expiringMembersCount} avisos` : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: Package,
      adminOnly: false,
      badge: lowStockCount > 0 ? `${lowStockCount} bajos` : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'sales',
      label: 'Historial de Ventas',
      icon: History,
      adminOnly: false,
    },
  ]

  return (
    <>
      {/* Backdrop móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200/80 bg-white transition-transform duration-200 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-white shadow-xs">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Modelo de Prueba</span>
              <span className="text-[10px] ml-1.5 font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                Gym
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Rol Activo */}
        <div className="p-3 mx-3 mt-3 rounded-lg border border-blue-100 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300">
              Rol: {isAdmin ? 'Administrador' : 'Empleado'}
            </span>
            <button
              onClick={() => loginAs(isAdmin ? 'empleado' : 'admin')}
              className="text-[10px] font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors"
            >
              Cambiar
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isAdmin ? 'Acceso total y reportes' : 'Registro, caja e inventario'}
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Módulos
          </div>

          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null

            const Icon = item.icon
            const isActive = currentTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id)
                  onCloseMobile()
                }}
                className={cn(
                  'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-blue-50/60 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-zinc-400 group-hover:text-blue-800 dark:text-zinc-500 dark:group-hover:text-zinc-300')} />
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-medium',
                      isActive
                        ? 'bg-blue-900 text-white'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    )}
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity',
                      isActive && 'opacity-0'
                    )}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer: Perfil & Logout */}
        <div className="border-t border-zinc-100 p-3 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-850">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-950 dark:text-blue-300">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {currentUser?.full_name}
                </p>
                <p className="truncate text-[10px] text-zinc-400">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
