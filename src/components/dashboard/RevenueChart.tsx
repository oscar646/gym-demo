import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card'
import { Sale } from '../../types'
import { formatCurrency, formatDateShort } from '../../lib/utils'
import { BarChart3, TrendingUp } from 'lucide-react'

interface RevenueChartProps {
  sales: Sale[]
}

type Period = '7d' | '30d'
type ChartType = 'bar' | 'area'

export function RevenueChart({ sales }: RevenueChartProps) {
  const [period, setPeriod] = useState<Period>('7d')
  const [chartType, setChartType] = useState<ChartType>('bar')

  const chartData = useMemo(() => {
    const daysCount = period === '7d' ? 7 : 30
    const today = new Date()
    const daysMap = new Map<string, { date: string; displayDate: string; revenue: number; salesCount: number }>()

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const displayDate = formatDateShort(d.toISOString())
      daysMap.set(key, {
        date: key,
        displayDate,
        revenue: 0,
        salesCount: 0,
      })
    }

    sales.forEach((sale) => {
      const saleDateKey = sale.created_at.split('T')[0]
      if (daysMap.has(saleDateKey)) {
        const current = daysMap.get(saleDateKey)!
        current.revenue += sale.total_amount
        current.salesCount += 1
      }
    })

    return Array.from(daysMap.values())
  }, [sales, period])

  const totalPeriodRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0)
  }, [chartData])

  const averageDailyRevenue = useMemo(() => {
    return chartData.length > 0 ? totalPeriodRevenue / chartData.length : 0
  }, [chartData, totalPeriodRevenue])

  return (
    <Card className="p-2 sm:p-4">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Ingresos por Ventas</CardTitle>
          </div>
          <CardDescription>
            Últimos {period === '7d' ? '7 días' : '30 días'} · Total: <span className="font-semibold text-blue-800 dark:text-blue-300">{formatCurrency(totalPeriodRevenue)}</span> · Promedio diario: {formatCurrency(averageDailyRevenue)}
          </CardDescription>
        </div>

        {/* Controles de periodo y tipo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 7d / 30d */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => setPeriod('7d')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === '7d'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === '30d'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              30 Días
            </button>
          </div>

          {/* Bar / Area */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => setChartType('bar')}
              title="Gráfico de Barras"
              className={`rounded-md p-1 transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-blue-800 shadow-xs dark:bg-zinc-700 dark:text-blue-300'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Gráfico de Línea Continua"
              className={`rounded-md p-1 transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-blue-800 shadow-xs dark:bg-zinc-700 dark:text-blue-300'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e4e4e7' }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickFormatter={(val) => `Bs ${val}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(30, 58, 138, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{data.date}</p>
                          <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                            {formatCurrency(data.revenue)}
                          </p>
                          <p className="text-[10px] text-zinc-400">{data.salesCount} ventas</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#1e40af"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e4e4e7' }}
                />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e4e4e7' }}
                  tickFormatter={(val) => `Bs ${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-zinc-200 bg-white p-2.5 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{data.date}</p>
                          <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                            {formatCurrency(data.revenue)}
                          </p>
                          <p className="text-[10px] text-zinc-400">{data.salesCount} ventas</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1e40af"
                  strokeWidth={2}
                  fill="url(#blueAreaGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
