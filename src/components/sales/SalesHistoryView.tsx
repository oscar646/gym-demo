import React, { useState, useMemo } from 'react'
import { History, Search, Filter, Eye } from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { Sale, PaymentMethod } from '../../types'
import { Card, CardContent } from '../ui/Card'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { ReceiptModal } from '../pos/ReceiptModal'
import { formatCurrency, formatDate } from '../../lib/utils'

export function SalesHistoryView() {
  const { sales } = useGymStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<'Todos' | PaymentMethod>('Todos')
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const clientName = sale.client_name || 'Cliente Mostrador'
      const cashierName = sale.user_name || 'Empleado'
      const matchSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchMethod = selectedMethod === 'Todos' || sale.payment_method === selectedMethod
      return matchSearch && matchMethod
    })
  }, [sales, searchTerm, selectedMethod])

  const totalFilteredRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.total_amount, 0)
  }, [filteredSales])

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>Historial de Ventas</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total transacciones: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredSales.length}</span> · Monto: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatCurrency(totalFilteredRevenue)}</span>
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar por cliente, cajero o ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Pago:
            </span>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
              {(['Todos', 'Efectivo', 'QR'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    selectedMethod === method
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {method === 'QR' ? 'Pago QR' : method}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 font-medium dark:border-zinc-800 dark:bg-zinc-850">
                <tr>
                  <th className="py-3 pl-5">Ticket</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Cliente</th>
                  <th className="py-3 px-3">Atendido por</th>
                  <th className="py-3 px-3">Productos</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 pr-5 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-zinc-400">
                      No se encontraron transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3 pl-5 font-mono text-zinc-600 dark:text-zinc-400">
                        #{sale.id.slice(-8).toUpperCase()}
                      </td>

                      <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">
                        {formatDate(sale.created_at)}
                      </td>

                      <td className="py-3 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {sale.client_name || 'Cliente Mostrador'}
                      </td>

                      <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">
                        {sale.user_name || 'Empleado'}
                      </td>

                      <td className="py-3 px-3 max-w-xs text-zinc-600 dark:text-zinc-300">
                        <span className="line-clamp-1">
                          {sale.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(', ') || 'Productos'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant="outline">{sale.payment_method}</Badge>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(sale.total_amount)}
                      </td>

                      <td className="py-3 pr-5 text-right">
                        <button
                          onClick={() => setViewingSale(sale)}
                          title="Ver ticket"
                          className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReceiptModal
        isOpen={Boolean(viewingSale)}
        onClose={() => setViewingSale(null)}
        sale={viewingSale}
      />
    </div>
  )
}
