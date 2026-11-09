import { create } from 'zustand'
import { Client, Product, Sale, CartItem, UserProfile, UserRole, PaymentMethod } from '../types'
import { INITIAL_USERS, getInitialClients, INITIAL_PRODUCTS, generateInitialSales } from '../lib/mockData'
import { getSupabase } from '../lib/supabase'
import { calculateEndDate } from '../lib/utils'

interface GymStore {
  // Autenticación
  currentUser: UserProfile | null
  setCurrentUser: (user: UserProfile | null) => void
  loginAs: (role: UserRole) => void
  logout: () => void
  
  // Clientes
  clients: Client[]
  addClient: (clientData: Omit<Client, 'id'>) => Promise<Client>
  updateClient: (id: string, clientData: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  toggleClientStatus: (id: string) => Promise<void>
  renewClientMembership: (id: string) => Promise<void>

  // Inventario
  products: Product[]
  addProduct: (productData: Omit<Product, 'id'>) => Promise<Product>
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>

  // Punto de Venta (POS) & Carrito
  cart: CartItem[]
  addToCart: (product: Product, qty?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  selectedClientId: string | null
  setSelectedClientId: (clientId: string | null) => void

  // Ventas
  sales: Sale[]
  processSale: (paymentMethod: PaymentMethod, clientId?: string | null) => Promise<Sale>
  
  // Sincronización / Estado
  isLoading: boolean
  isSupabaseConnected: boolean
  lastCompletedSale: Sale | null
  setLastCompletedSale: (sale: Sale | null) => void
  resetToDemoData: () => void
  fetchData: () => Promise<void>
}

// Cargar o inicializar estado local
function getInitialLocalState() {
  const localClients = localStorage.getItem('ironfit_clients')
  const localProducts = localStorage.getItem('ironfit_products')
  const localSales = localStorage.getItem('ironfit_sales')
  const localUser = localStorage.getItem('ironfit_user')

  const initialClients = getInitialClients()
  const parsedClients = localClients ? JSON.parse(localClients) : initialClients
  const clients = parsedClients.map((c: any) => {
    const plan = c.plan_type || 'Mensual Completo'
    return {
      ...c,
      plan_type: plan,
      end_date: c.end_date || calculateEndDate(c.start_date || new Date().toISOString().split('T')[0], plan),
    }
  })

  return {
    clients,
    products: localProducts ? JSON.parse(localProducts) : INITIAL_PRODUCTS,
    sales: localSales ? JSON.parse(localSales) : generateInitialSales(),
    user: localUser ? JSON.parse(localUser) : INITIAL_USERS[0], // Por defecto Admin
  }
}

const savedData = getInitialLocalState()

export const useGymStore = create<GymStore>((set, get) => ({
  currentUser: savedData.user,
  clients: savedData.clients,
  products: savedData.products,
  sales: savedData.sales,
  cart: [],
  selectedClientId: null,
  isLoading: false,
  isSupabaseConnected: false,
  lastCompletedSale: null,

  setLastCompletedSale: (sale) => set({ lastCompletedSale: sale }),

  setCurrentUser: (user) => {
    set({ currentUser: user })
    if (user) {
      localStorage.setItem('ironfit_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('ironfit_user')
    }
  },

  loginAs: (role: UserRole) => {
    const user = INITIAL_USERS.find((u) => u.role === role) || INITIAL_USERS[0]
    set({ currentUser: user })
    localStorage.setItem('ironfit_user', JSON.stringify(user))
  },

  logout: () => {
    set({ currentUser: null, cart: [] })
    localStorage.removeItem('ironfit_user')
  },

  setSelectedClientId: (clientId) => set({ selectedClientId: clientId }),

  // --- CLIENTES ---
  addClient: async (clientData) => {
    const supabase = getSupabase()
    const endDate = clientData.end_date || calculateEndDate(clientData.start_date, clientData.plan_type)
    const newClient: Client = {
      ...clientData,
      end_date: endDate,
      id: `cli-${Date.now()}`,
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('clients').insert([{ ...clientData, end_date: endDate }]).select().single()
        if (error) throw error
        if (data) newClient.id = data.id
      } catch (err) {
        console.error('Error insertando cliente en Supabase:', err)
      }
    }

    set((state) => {
      const updated = [newClient, ...state.clients]
      localStorage.setItem('ironfit_clients', JSON.stringify(updated))
      return { clients: updated }
    })

    return newClient
  },

  updateClient: async (id, clientData) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('clients').update(clientData).eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Error actualizando cliente en Supabase:', err)
      }
    }

    set((state) => {
      const updated = state.clients.map((c) => (c.id === id ? { ...c, ...clientData } : c))
      localStorage.setItem('ironfit_clients', JSON.stringify(updated))
      return { clients: updated }
    })
  },

  deleteClient: async (id) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Error eliminando cliente en Supabase:', err)
      }
    }

    set((state) => {
      const updated = state.clients.filter((c) => c.id !== id)
      localStorage.setItem('ironfit_clients', JSON.stringify(updated))
      return { clients: updated }
    })
  },

  toggleClientStatus: async (id) => {
    const client = get().clients.find((c) => c.id === id)
    if (!client) return
    const newStatus = client.status === 'Activo' ? 'Inactivo' : 'Activo'
    await get().updateClient(id, { status: newStatus })
  },

  renewClientMembership: async (id) => {
    const client = get().clients.find((c) => c.id === id)
    if (!client) return
    const today = new Date().toISOString().split('T')[0]
    const planToRenew = client.plan_type === 'Sesión Individual' ? 'Mensual Completo' : client.plan_type
    const newEndDate = calculateEndDate(today, planToRenew)
    await get().updateClient(id, {
      start_date: today,
      end_date: newEndDate,
      status: 'Activo',
      plan_type: planToRenew,
    })
  },

  // --- INVENTARIO ---
  addProduct: async (productData) => {
    const supabase = getSupabase()
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      min_stock: productData.min_stock ?? 5,
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([productData]).select().single()
        if (error) throw error
        if (data) newProduct.id = data.id
      } catch (err) {
        console.error('Error agregando producto en Supabase:', err)
      }
    }

    set((state) => {
      const updated = [newProduct, ...state.products]
      localStorage.setItem('ironfit_products', JSON.stringify(updated))
      return { products: updated }
    })

    return newProduct
  },

  updateProduct: async (id, productData) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('products').update(productData).eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Error actualizando producto en Supabase:', err)
      }
    }

    set((state) => {
      const updated = state.products.map((p) => (p.id === id ? { ...p, ...productData } : p))
      localStorage.setItem('ironfit_products', JSON.stringify(updated))
      return { products: updated }
    })
  },

  deleteProduct: async (id) => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Error eliminando producto en Supabase:', err)
      }
    }

    set((state) => {
      const updated = state.products.filter((p) => p.id !== id)
      localStorage.setItem('ironfit_products', JSON.stringify(updated))
      return { products: updated }
    })
  },

  // --- CARRITO & POS ---
  addToCart: (product, qty = 1) => {
    const { cart } = get()
    const existingIndex = cart.findIndex((item) => item.product.id === product.id)
    
    // Validar stock disponible
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0
    if (currentQtyInCart + qty > product.stock) {
      alert(`No hay suficiente stock disponible de ${product.name}. Stock restante: ${product.stock}`)
      return
    }

    if (existingIndex > -1) {
      const updated = [...cart]
      updated[existingIndex].quantity += qty
      set({ cart: updated })
    } else {
      set({ cart: [...cart, { product, quantity: qty }] })
    }
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }))
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }
    const { products, cart } = get()
    const product = products.find((p) => p.id === productId)
    if (product && quantity > product.stock) {
      alert(`Solo hay ${product.stock} unidades en stock de ${product.name}`)
      return
    }
    set({
      cart: cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    })
  },

  clearCart: () => set({ cart: [], selectedClientId: null }),

  // --- PROCESAR VENTA ---
  processSale: async (paymentMethod, clientId) => {
    const { cart, products, currentUser, clients } = get()
    if (cart.length === 0) {
      throw new Error('El carrito está vacío.')
    }

    // Calcular total
    const total_amount = cart.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0)
    
    // Obtener información del cliente
    const client = clientId ? clients.find((c) => c.id === clientId) : null
    const client_name = client ? client.full_name : 'Cliente Mostrador'

    // Formatear items vendidos
    const items = cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.sale_price,
      subtotal: item.product.sale_price * item.quantity,
    }))

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name || 'Empleado',
      client_id: clientId || null,
      client_name,
      total_amount,
      payment_method: paymentMethod,
      created_at: new Date().toISOString(),
      items,
    }

    // Descontar inventario localmente
    const updatedProducts = products.map((prod) => {
      const soldItem = cart.find((item) => item.product.id === prod.id)
      if (soldItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - soldItem.quantity),
        }
      }
      return prod
    })

    // Intentar transacción en Supabase si está conectado
    const supabase = getSupabase()
    if (supabase) {
      try {
        const rpcPayload = {
          p_client_id: clientId || null,
          p_payment_method: paymentMethod,
          p_items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.sale_price,
          })),
        }
        const { data, error } = await supabase.rpc('process_sale', rpcPayload)
        if (error) {
          console.warn('RPC process_sale falló en Supabase (usando fallback local):', error.message)
        } else if (data) {
          newSale.id = data
        }
      } catch (err) {
        console.warn('Fallo al conectar con Supabase durante la venta:', err)
      }
    }

    // Actualizar estado global y persistencia
    set((state) => {
      const updatedSales = [newSale, ...state.sales]
      localStorage.setItem('ironfit_products', JSON.stringify(updatedProducts))
      localStorage.setItem('ironfit_sales', JSON.stringify(updatedSales))
      return {
        products: updatedProducts,
        sales: updatedSales,
        cart: [],
        selectedClientId: null,
        lastCompletedSale: newSale,
      }
    })

    return newSale
  },

  resetToDemoData: () => {
    localStorage.removeItem('ironfit_clients')
    localStorage.removeItem('ironfit_products')
    localStorage.removeItem('ironfit_sales')
    const freshSales = generateInitialSales()
    const freshClients = getInitialClients()
    set({
      clients: freshClients,
      products: INITIAL_PRODUCTS,
      sales: freshSales,
      cart: [],
    })
    localStorage.setItem('ironfit_clients', JSON.stringify(freshClients))
    localStorage.setItem('ironfit_products', JSON.stringify(INITIAL_PRODUCTS))
    localStorage.setItem('ironfit_sales', JSON.stringify(freshSales))
  },

  fetchData: async () => {
    const supabase = getSupabase()
    if (!supabase) {
      set({ isSupabaseConnected: false })
      return
    }

    set({ isLoading: true })
    try {
      const [clientsRes, productsRes, salesRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('sales').select('*, items:sale_items(*)').order('created_at', { ascending: false }).limit(100),
      ])

      if (clientsRes.data && clientsRes.data.length > 0) {
        set({ clients: clientsRes.data })
        localStorage.setItem('ironfit_clients', JSON.stringify(clientsRes.data))
      }
      if (productsRes.data && productsRes.data.length > 0) {
        set({ products: productsRes.data })
        localStorage.setItem('ironfit_products', JSON.stringify(productsRes.data))
      }
      if (salesRes.data && salesRes.data.length > 0) {
        set({ sales: salesRes.data })
        localStorage.setItem('ironfit_sales', JSON.stringify(salesRes.data))
      }

      set({ isSupabaseConnected: true })
    } catch (err) {
      console.warn('Error cargando datos de Supabase:', err)
      set({ isSupabaseConnected: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))

