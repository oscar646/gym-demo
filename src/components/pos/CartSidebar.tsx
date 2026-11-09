import React, { useState } from 'react'
import { CartItem, Client, PaymentMethod } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { formatCurrency } from '../../lib/utils'
import {
  Trash2,
  Plus,
  Minus,
  Banknote,
  QrCode,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface CartSidebarProps {
  cart: CartItem[]
  clients: Client[]
  selectedClientId: string | null
  onSelectClient: (clientId: string | null) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckout: (paymentMethod: PaymentMethod) => Promise<void>
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'QR', label: 'Pago QR', icon: QrCode },
]

export function CartSidebar({
  cart,
  clients,
  selectedClientId,
  onSelectClient,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSidebarProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.sale_price * item.quantity,
    0
  )
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleProcessSale = async () => {
    if (cart.length === 0) return
    setIsProcessing(true)
    setError(null)
    try {
      await onCheckout(paymentMethod)
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la venta.')
    } finally {
      setIsProcessing(false)
    }
  }

  const clientOptions = [
    { value: '', label: 'Cliente Mostrador (Ocasional)' },
    ...clients.map((c) => ({
      value: c.id,
      label: `${c.full_name} (${c.dni})`,
    })),
  ]

  return (
    <Card className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ticket de Venta</h3>
          <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {totalItemsCount} ítems
          </span>
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Cliente */}
      <div className="py-2.5 border-b border-zinc-100 dark:border-zinc-800">
        <Select
          label="Asignar a socio (opcional)"
          value={selectedClientId || ''}
          onChange={(e) => onSelectClient(e.target.value || null)}
          options={clientOptions}
        />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto py-2.5 space-y-2 pr-1">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
            <p className="text-xs">El carrito está vacío</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Selecciona productos a la izquierda</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/70 border border-zinc-200/70 dark:bg-zinc-850 dark:border-zinc-800"
            >
              <div className="flex-1 pr-2">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">{item.product.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {formatCurrency(item.product.sale_price)}
                </p>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="p-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="w-14 text-right font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(item.product.sale_price * item.quantity)}
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
        {/* Métodos de Pago */}
        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon
              const isSelected = paymentMethod === pm.id
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-blue-800 text-white border-blue-800 shadow-sm ring-1 ring-blue-800'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{pm.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/80 dark:bg-zinc-850 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Total a cobrar</span>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700 flex items-center gap-1.5 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          onClick={handleProcessSale}
          disabled={cart.length === 0}
          isLoading={isProcessing}
          className="w-full font-semibold"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Confirmar Venta</span>
        </Button>
      </div>
    </Card>
  )
}
