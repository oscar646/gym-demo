import React, { useMemo } from 'react'
import {
  Users,
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  PackageCheck,
  CheckCircle,
  Clock,
  RotateCw,
  Phone,
} from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { StatCard } from './StatCard'
import { RevenueChart } from './RevenueChart'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatCurrency, formatDate, getExpiryInfo } from '../../lib/utils'

interface DashboardViewProps {
  onNavigateToPOS: () => void
  onNavigateToInventory: () => void
  onNavigateToClients: () => void
}

export function DashboardView({
  onNavigateToPOS,
  onNavigateToInventory,
  onNavigateToClients,
}: DashboardViewProps) {
  const { clients, products, sales, currentUser, loginAs, renewClientMembership } = useGymStore()
  const isAdmin = currentUser?.role === 'admin'

  const metrics = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === 'Activo').length

    const todayStr = new Date().toISOString().split('T')[0]
    const todaySales = sales.filter((s) => s.created_at.startsWith(todayStr))
    
    const todayRevenue = todaySales.reduce((acc, s) => acc + s.total_amount, 0)
    
    let todayProfit = 0
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.product_id)
        if (product) {
          const cost = product.cost_price * item.quantity
          todayProfit += item.subtotal - cost
        } else {
          todayProfit += item.subtotal * 0.4
        }
      })
    })

    const lowStockProducts = products.filter(
      (p) => p.stock <= (p.min_stock ?? 5)
    )

    // Membresías por vencer y vencidas
    const expiringSoon = clients.filter((c) => {
      if (c.plan_type === 'Sesión Individual') return false
      return getExpiryInfo(c.end_date).state === 'expiring_soon'
    })

    const expired = clients.filter((c) => {
      if (c.plan_type === 'Sesión Individual') return false
      return getExpiryInfo(c.end_date).state === 'expired'
    })

    return {
      activeClients,
      totalClients: clients.length,
      todayRevenue,
      todayProfit,
      todaySalesCount: todaySales.length,
      lowStockProducts,
      expiringSoon,
      expired,
    }
  }, [clients, products, sales])

  return (
    <div className="space-y-5">
      {/* Cabecera Sobria de Bienvenida */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Resumen General
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Sesión iniciada como <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentUser?.full_name}</span> ({isAdmin ? 'Administrador' : 'Empleado'}).
          </p>
        </div>

        <Button onClick={onNavigateToPOS} size="md">
          <ShoppingBag className="h-4 w-4" />
          <span>Ir a Caja (POS)</span>
        </Button>
      </div>

      {/* AVISO IMPORTANTE DE MEMBRESÍAS (Por acabar o acabadas) */}
      {(metrics.expiringSoon.length > 0 || metrics.expired.length > 0) && (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 dark:bg-amber-900/50 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  Control de Vencimientos de Membresías
                </h4>
                <p className="text-xs text-amber-900 dark:text-amber-300 mt-0.5">
                  Tienes <strong className="text-amber-950 dark:text-amber-100">{metrics.expiringSoon.length} socios</strong> con membresía por acabar en los próximos días y <strong className="text-rose-700 dark:text-rose-400">{metrics.expired.length} socios</strong> con membresía vencida.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onNavigateToClients}
              className="border-amber-300 text-amber-900 hover:bg-amber-100/70 dark:border-amber-800 dark:text-amber-200"
            >
              <span>Ver Lista de Renovaciones</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Clientes Activos */}
        <StatCard
          title="Socios Activos"
          value={metrics.activeClients}
          subtitle={`De ${metrics.totalClients} registrados`}
          icon={Users}
          trend={{ value: `${Math.round((metrics.activeClients / (metrics.totalClients || 1)) * 100)}%`, isPositive: true }}
        />

        {/* KPI 2: Ganancias del Día (Admin) o Ventas del Día (Empleado) */}
        {isAdmin ? (
          <StatCard
            title="Ganancia Estimada Hoy"
            value={formatCurrency(metrics.todayProfit)}
            subtitle={`Ingreso: ${formatCurrency(metrics.todayRevenue)}`}
            icon={TrendingUp}
            trend={{ value: `${metrics.todaySalesCount} ventas`, isPositive: true }}
          />
        ) : (
          <StatCard
            title="Ventas de Hoy"
            value={`${metrics.todaySalesCount} tickets`}
            subtitle="Transacciones del turno"
            icon={ShoppingBag}
          />
        )}

        {/* KPI 3: Facturación Hoy (Admin) o Alertas de Membresías */}
        {isAdmin ? (
          <StatCard
            title="Facturación Hoy"
            value={formatCurrency(metrics.todayRevenue)}
            subtitle={`${metrics.todaySalesCount} operaciones`}
            icon={DollarSign}
          />
        ) : (
          <StatCard
            title="Por Vencer (5 días)"
            value={metrics.expiringSoon.length}
            subtitle="Requieren renovación próxima"
            icon={Clock}
          />
        )}

        {/* KPI 4: Bajo Stock */}
        <StatCard
          title="Stock Bajo (Alerta)"
          value={metrics.lowStockProducts.length}
          subtitle={
            metrics.lowStockProducts.length > 0
              ? 'Por debajo del mínimo'
              : 'Inventario suficiente'
          }
          icon={AlertTriangle}
        />
      </div>

      {/* Sección con Diferenciación por Rol */}
      {isAdmin ? (
        /* ADMIN: Gráfico Recharts + Panel de Alertas de Vencimiento y Stock */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueChart sales={sales} />
          </div>

          {/* Panel Lateral: Alertas de Vencimiento de Membresías */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-800 dark:text-blue-400" />
                <CardTitle className="text-sm">Alertas de Membresías</CardTitle>
              </div>
              <Badge variant={metrics.expiringSoon.length > 0 ? 'warning' : 'default'}>
                {metrics.expiringSoon.length + metrics.expired.length} avisos
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 space-y-2.5">
              {[...metrics.expiringSoon, ...metrics.expired].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                  <CheckCircle className="h-8 w-8 text-zinc-400 mb-1.5 opacity-70" />
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Todas las membresías al día</p>
                  <p className="text-[11px] text-zinc-400">No hay planes por vencer en los próximos días.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...metrics.expiringSoon, ...metrics.expired].slice(0, 4).map((member) => {
                    const expiry = getExpiryInfo(member.end_date)
                    const isExpired = expiry.state === 'expired'

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200/70 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-850"
                      >
                        <div className="pr-2">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {member.full_name}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {member.plan_type} · Vence: {member.end_date}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 flex items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                              isExpired
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {expiry.label}
                          </span>
                          <button
                            onClick={() => renewClientMembership(member.id)}
                            title="Renovar membresía (+30 días)"
                            className="p-1 text-blue-800 hover:bg-blue-50 rounded dark:text-blue-400"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToClients}
                className="w-full mt-3"
              >
                <span>Administrar Todas las Membresías</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* VISTA EMPLEADO: Sobria y orientada a mostrador y renovaciones */
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-850 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                Modo Operativo de Empleado
              </p>
              <p>
                Control de mostrador: registro de clientes, caja (POS), consulta de existencias y control de vencimientos de membresías.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Acciones Rápidas</h3>
              <div className="flex gap-2">
                <Button onClick={onNavigateToPOS} size="md" className="flex-1">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Cobrar (POS)</span>
                </Button>
                <Button onClick={onNavigateToClients} variant="outline" size="md" className="flex-1">
                  <Users className="h-4 w-4" />
                  <span>Registrar Socio</span>
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Membresías por Vencer</h3>
                <Badge variant={metrics.expiringSoon.length > 0 ? 'warning' : 'default'}>
                  {metrics.expiringSoon.length} socios
                </Badge>
              </div>
              <div className="space-y-1.5">
                {metrics.expiringSoon.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">{c.full_name}</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {getExpiryInfo(c.end_date).label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Últimas Ventas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm">Últimas Ventas Procesadas</CardTitle>
            <p className="text-xs text-zinc-400 mt-0.5">Transacciones recientes en el mostrador</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onNavigateToPOS}>
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 text-zinc-400 font-medium dark:border-zinc-800">
                <tr>
                  <th className="pb-2 pl-2">Fecha / Hora</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Atendido por</th>
                  <th className="pb-2">Productos</th>
                  <th className="pb-2">Método</th>
                  <th className="pb-2 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors">
                    <td className="py-2.5 pl-2 text-zinc-500 dark:text-zinc-400">{formatDate(sale.created_at)}</td>
                    <td className="py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{sale.client_name || 'Cliente Mostrador'}</td>
                    <td className="py-2.5 text-zinc-500 dark:text-zinc-400">{sale.user_name || 'Empleado'}</td>
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-300">
                      <span className="line-clamp-1">
                        {sale.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(', ') || 'Productos varios'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Badge variant="outline">{sale.payment_method}</Badge>
                    </td>
                    <td className="py-2.5 pr-2 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
