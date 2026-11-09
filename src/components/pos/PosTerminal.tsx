import React, { useState } from 'react'
import { useGymStore } from '../../store/useGymStore'
import { ProductGrid } from './ProductGrid'
import { CartSidebar } from './CartSidebar'
import { ReceiptModal } from './ReceiptModal'
import { PaymentMethod } from '../../types'

export function PosTerminal() {
  const {
    products,
    clients,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    selectedClientId,
    setSelectedClientId,
    processSale,
    lastCompletedSale,
    setLastCompletedSale,
  } = useGymStore()

  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  const handleCheckout = async (paymentMethod: PaymentMethod) => {
    const sale = await processSale(paymentMethod, selectedClientId)
    setIsReceiptOpen(true)
  }

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false)
    setLastCompletedSale(null)
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] min-h-[550px] flex flex-col lg:flex-row gap-6">
      {/* Sección Izquierda: Catálogo y Búsqueda de Productos */}
      <div className="flex-1 flex flex-col min-w-0">
        <ProductGrid products={products} onAddToCart={addToCart} />
      </div>

      {/* Sección Derecha: Carrito de Compra y Cobro */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <CartSidebar
          cart={cart}
          clients={clients}
          selectedClientId={selectedClientId}
          onSelectClient={setSelectedClientId}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Modal de Ticket / Recibo */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceipt}
        sale={lastCompletedSale}
      />
    </div>
  )
}

