export type UserRole = 'admin' | 'empleado'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
}

export type MembershipStatus = 'Activo' | 'Inactivo'

export type PlanType = 
  | 'Sesión Individual'      // Pase por día o clase suelta
  | 'Día por Medio (Mes)'    // 3 días por semana dentro de un mes
  | 'Mensual Completo'       // Pase libre todos los días del mes

export interface Client {
  id: string
  full_name: string
  dni: string
  phone: string
  start_date: string
  end_date: string           // Fecha de fin de membresía
  status: MembershipStatus
  plan_type: PlanType
  created_at?: string
}

export type ProductCategory = 
  | 'Agua' 
  | 'Proteínas' 
  | 'Postres proteicos' 
  | 'Energizantes' 
  | 'Otros'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  cost_price: number // Precio de compra
  sale_price: number // Precio de venta
  stock: number      // Stock actual
  min_stock?: number // Umbral de alerta
  created_at?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export type PaymentMethod = 'Efectivo' | 'QR'

export interface SaleItem {
  id?: string
  sale_id?: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Sale {
  id: string
  user_id?: string
  user_name?: string
  client_id?: string | null
  client_name?: string | null
  total_amount: number
  payment_method: PaymentMethod
  created_at: string
  items: SaleItem[]
}

export interface DashboardMetrics {
  totalActiveClients: number
  totalClients: number
  todayRevenue: number
  todayProfit: number
  lowStockCount: number
  totalSalesTodayCount: number
  expiringSoonCount: number
  expiredCount: number
}
