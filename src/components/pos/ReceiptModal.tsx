import React from 'react'
import { Sale } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { Printer, CheckCircle2, Dumbbell, ShoppingBag } from 'lucide-react'

interface ReceiptModalProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
}

export function ReceiptModal({ sale, isOpen, onClose }: ReceiptModalProps) {
  if (!sale) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Venta"
      description="Transacción registrada y stock actualizado"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Cabecera Ticket */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 text-center space-y-1.5 dark:border-zinc-800 dark:bg-zinc-850">
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center dark:bg-zinc-700 dark:text-zinc-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">
            Modelo de Prueba Gym
          </h3>
          <p className="text-[11px] font-mono text-zinc-400">
            TICKET #{sale.id.slice(-8).toUpperCase()}
          </p>

          <div className="text-[11px] text-zinc-500 space-y-0.5 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <p>Fecha: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{formatDate(sale.created_at)}</span></p>
            <p>Atendido por: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{sale.user_name || 'Empleado'}</span></p>
            <p>Cliente: <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{sale.client_name || 'Cliente Mostrador'}</span></p>
          </div>
        </div>

        {/* Detalle */}
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
            {sale.items.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.product_name}</p>
                  <p className="text-zinc-400 text-[11px]">
                    {item.quantity} x {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              Método: <span className="font-medium text-zinc-800 dark:text-zinc-200">{sale.payment_method}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block">Total</span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(sale.total_amount)}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </Button>
          <Button size="sm" onClick={onClose}>
            <span>Aceptar</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
