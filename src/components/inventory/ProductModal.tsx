import React, { useState, useEffect } from 'react'
import { Product, ProductCategory } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { calculateMargin, formatCurrency } from '../../lib/utils'
import { Package, Tag, DollarSign, Layers } from 'lucide-react'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Omit<Product, 'id'>) => Promise<void>
  productToEdit?: Product | null
}

const CATEGORIES: ProductCategory[] = [
  'Agua',
  'Proteínas',
  'Postres proteicos',
  'Energizantes',
  'Otros',
]

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
}: ProductModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Proteínas')
  const [costPrice, setCostPrice] = useState<string>('')
  const [salePrice, setSalePrice] = useState<string>('')
  const [stock, setStock] = useState<string>('')
  const [minStock, setMinStock] = useState<string>('5')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name)
      setCategory(productToEdit.category)
      setCostPrice(productToEdit.cost_price.toString())
      setSalePrice(productToEdit.sale_price.toString())
      setStock(productToEdit.stock.toString())
      setMinStock((productToEdit.min_stock ?? 5).toString())
    } else {
      setName('')
      setCategory('Agua')
      setCostPrice('')
      setSalePrice('')
      setStock('')
      setMinStock('5')
    }
    setErrors({})
  }, [productToEdit, isOpen])

  const numCost = parseFloat(costPrice) || 0
  const numSale = parseFloat(salePrice) || 0
  const margin = calculateMargin(numSale, numCost)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'El nombre es obligatorio'
    if (!costPrice || isNaN(numCost) || numCost < 0) errs.costPrice = 'Precio de compra no válido'
    if (!salePrice || isNaN(numSale) || numSale <= 0) errs.salePrice = 'Precio de venta no válido'
    if (numSale <= numCost) errs.salePrice = 'La venta debe ser mayor al costo'
    if (stock === '' || isNaN(parseInt(stock)) || parseInt(stock) < 0) errs.stock = 'Stock no válido'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        category,
        cost_price: numCost,
        sale_price: numSale,
        stock: parseInt(stock, 10),
        min_stock: parseInt(minStock || '5', 10),
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto' : 'Añadir Producto'}
      description="Precios y existencias del artículo en catálogo"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Nombre del Producto *"
          placeholder="Ej: Whey Isolate Vainilla 1kg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={<Package className="h-4 w-4" />}
          autoFocus
        />

        <Select
          label="Categoría *"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
          options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            step="0.01"
            min="0"
            label="Precio de Compra (Bs) *"
            placeholder="0.00"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            error={errors.costPrice}
            icon={<DollarSign className="h-4 w-4" />}
          />

          <Input
            type="number"
            step="0.01"
            min="0"
            label="Precio de Venta (Bs) *"
            placeholder="0.00"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            error={errors.salePrice}
            icon={<DollarSign className="h-4 w-4" />}
          />
        </div>

        {/* Indicador de Margen */}
        {numSale > 0 && numCost > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 flex items-center justify-between text-xs dark:border-zinc-800 dark:bg-zinc-850">
            <span className="text-zinc-500">Margen bruto unitario:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              +{formatCurrency(numSale - numCost)} ({margin}%)
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="number"
            min="0"
            label="Stock Actual *"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            error={errors.stock}
            icon={<Layers className="h-4 w-4" />}
          />

          <Input
            type="number"
            min="1"
            label="Stock Mínimo (Alerta)"
            placeholder="5"
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            icon={<Tag className="h-4 w-4 text-zinc-400" />}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
