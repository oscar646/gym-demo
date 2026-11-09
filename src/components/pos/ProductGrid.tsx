import React, { useState, useMemo } from 'react'
import { Product, ProductCategory } from '../../types'
import { Input } from '../ui/Input'
import { formatCurrency } from '../../lib/utils'
import { Search, Plus, ShoppingCart } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

const CATEGORIES: ('Todos' | ProductCategory)[] = [
  'Todos',
  'Agua',
  'Proteínas',
  'Postres proteicos',
  'Energizantes',
  'Otros',
]

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | ProductCategory>('Todos')

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = selectedCategory === 'Todos' || prod.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [products, searchTerm, selectedCategory])

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Controles */}
      <div className="space-y-2">
        <Input
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="h-3.5 w-3.5" />}
        />

        {/* Categorías */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => (
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

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
            <ShoppingCart className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
            <p className="text-xs font-medium">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0
              const isLowStock = !isOutOfStock && product.stock <= (product.min_stock ?? 5)

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={`group relative flex flex-col justify-between text-left p-3 rounded-xl border transition-all select-none ${
                    isOutOfStock
                      ? 'border-zinc-200/50 bg-zinc-50/50 opacity-40 cursor-not-allowed dark:border-zinc-800/50 dark:bg-zinc-900/30'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-xs active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="rounded bg-zinc-100 text-zinc-500 px-1.5 py-0.2 text-[10px] font-medium dark:bg-zinc-800">
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="rounded bg-amber-50 text-amber-700 border border-amber-200/70 px-1 py-0.2 text-[10px] font-medium dark:bg-amber-950/40 dark:text-amber-400">
                          {product.stock} disp.
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">
                          {product.stock} disp.
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(product.sale_price)}
                    </span>

                    <div
                      className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${
                        isOutOfStock
                          ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                          : 'bg-blue-50 text-blue-800 group-hover:bg-blue-800 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:group-hover:bg-blue-700 dark:group-hover:text-white'
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
