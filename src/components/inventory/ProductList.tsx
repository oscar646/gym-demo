import React, { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { useGymStore } from '../../store/useGymStore'
import { Product, ProductCategory } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import { ProductModal } from './ProductModal'
import { formatCurrency, calculateMargin } from '../../lib/utils'

const CATEGORY_TABS: ('Todos' | ProductCategory)[] = [
  'Todos',
  'Agua',
  'Proteínas',
  'Postres proteicos',
  'Energizantes',
  'Otros',
]

export function ProductList() {
  const { products, addProduct, updateProduct, deleteProduct, currentUser } = useGymStore()
  const isAdmin = currentUser?.role === 'admin'

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | ProductCategory>('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = selectedCategory === 'Todos' || prod.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [products, searchTerm, selectedCategory])

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= (p.min_stock ?? 5)).length,
    [products]
  )

  const handleOpenCreate = () => {
    setProductToEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product)
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (data: Omit<Product, 'id'>) => {
    if (productToEdit) {
      await updateProduct(productToEdit.id, data)
    } else {
      await addProduct(data)
    }
  }

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id)
      setProductToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span>Inventario de Productos</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total en catálogo: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{products.length}</span> · Stock bajo:{' '}
            <span className={lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-zinc-500'}>
              {lowStockCount} productos
            </span>
          </p>
        </div>

        {isAdmin ? (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            <span>Añadir Producto</span>
          </Button>
        ) : (
          <span className="text-xs text-zinc-500">
            Vista de consulta para empleados
          </span>
        )}
      </div>

      {/* Filtros */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
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
                  <th className="py-3 pl-5">Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  {isAdmin && <th className="py-3 px-3">P. Compra</th>}
                  <th className="py-3 px-3">P. Venta</th>
                  {isAdmin && <th className="py-3 px-3">Margen</th>}
                  <th className="py-3 px-3">Stock Actual</th>
                  <th className="py-3 px-3">Estado</th>
                  {isAdmin && <th className="py-3 pr-5 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 5} className="py-10 text-center text-zinc-400">
                      No hay productos en esta categoría.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.stock <= (product.min_stock ?? 5)
                    const margin = calculateMargin(product.sale_price, product.cost_price)

                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/50 transition-colors">
                        <td className="py-3 pl-5 font-semibold text-zinc-900 dark:text-zinc-100">
                          {product.name}
                        </td>

                        <td className="py-3 px-3">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>

                        {isAdmin && (
                          <td className="py-3 px-3 font-mono text-zinc-500 dark:text-zinc-400">
                            {formatCurrency(product.cost_price)}
                          </td>
                        )}

                        <td className="py-3 px-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(product.sale_price)}
                        </td>

                        {isAdmin && (
                          <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 font-medium">
                            {margin}%
                          </td>
                        )}

                        <td className="py-3 px-3 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                          {product.stock} u.
                        </td>

                        <td className="py-3 px-3">
                          {isLow ? (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Bajo ({product.stock})</span>
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3" />
                              <span>Normal</span>
                            </Badge>
                          )}
                        </td>

                        {isAdmin && (
                          <td className="py-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenEdit(product)}
                                title="Editar"
                                className="rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(product)}
                                title="Eliminar"
                                className="rounded p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Crear/Editar */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Confirmación Eliminar */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white border border-zinc-200 p-5 shadow-lg dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">¿Eliminar producto?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
              Se eliminará <strong className="text-zinc-800 dark:text-zinc-200">{productToDelete.name}</strong> del catálogo.
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setProductToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
