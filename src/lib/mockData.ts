import { Client, Product, Sale, UserProfile } from '../types'
import { calculateEndDate } from './utils'

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-01',
    email: 'admin@gymdemo.com',
    full_name: 'Carlos Mendoza (Administrador)',
    role: 'admin',
  },
  {
    id: 'user-emp-01',
    email: 'empleado@gymdemo.com',
    full_name: 'Lucía Gómez (Empleado)',
    role: 'empleado',
  },
]

function getDateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getInitialClients(): Client[] {
  const c1Start = getDateOffset(10)
  const c2Start = getDateOffset(27) // Vence en 3 días (Por acabar!)
  const c3Start = getDateOffset(29) // Vence mañana (Por acabar!)
  const c4Start = getDateOffset(35) // Venció hace 5 días (Acabó!)
  const c5Start = getDateOffset(40) // Venció hace 10 días (Acabó!)
  const c6Start = getDateOffset(0)  // Sesión individual de hoy
  const c7Start = getDateOffset(5)  // Al día

  return [
    {
      id: 'cli-001',
      full_name: 'Alejandro Morales Ríos',
      dni: '4892104 LP',
      phone: '+591 71234567',
      start_date: c1Start,
      end_date: calculateEndDate(c1Start, 'Mensual Completo'),
      status: 'Activo',
      plan_type: 'Mensual Completo',
    },
    {
      id: 'cli-002',
      full_name: 'Valentina Soto Paz',
      dni: '7154238 SC',
      phone: '+591 76543210',
      start_date: c2Start,
      end_date: calculateEndDate(c2Start, 'Día por Medio (Mes)'),
      status: 'Activo',
      plan_type: 'Día por Medio (Mes)',
    },
    {
      id: 'cli-003',
      full_name: 'Martín Delgado Castro',
      dni: '3890124 CB',
      phone: '+591 79811223',
      start_date: c3Start,
      end_date: calculateEndDate(c3Start, 'Mensual Completo'),
      status: 'Activo',
      plan_type: 'Mensual Completo',
    },
    {
      id: 'cli-004',
      full_name: 'Camila Herrera Duarte',
      dni: '5289013 LP',
      phone: '+591 78844556',
      start_date: c4Start,
      end_date: calculateEndDate(c4Start, 'Día por Medio (Mes)'),
      status: 'Inactivo',
      plan_type: 'Día por Medio (Mes)',
    },
    {
      id: 'cli-005',
      full_name: 'Diego Fernando Navarro',
      dni: '2987145 SC',
      phone: '+591 77733445',
      start_date: c5Start,
      end_date: calculateEndDate(c5Start, 'Mensual Completo'),
      status: 'Inactivo',
      plan_type: 'Mensual Completo',
    },
    {
      id: 'cli-006',
      full_name: 'Pase Individual #1042',
      dni: 'S/D (Individual)',
      phone: '',
      start_date: c6Start,
      end_date: c6Start,
      status: 'Activo',
      plan_type: 'Sesión Individual',
    },
    {
      id: 'cli-007',
      full_name: 'Andrés Felipe Restrepo',
      dni: '6145298 LP',
      phone: '+591 73355667',
      start_date: c7Start,
      end_date: calculateEndDate(c7Start, 'Mensual Completo'),
      status: 'Activo',
      plan_type: 'Mensual Completo',
    },
  ]
}

export const INITIAL_CLIENTS: Client[] = getInitialClients()

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Agua Mineral Vital 500ml',
    category: 'Agua',
    cost_price: 2.50,
    sale_price: 5.00,
    stock: 48,
    min_stock: 12,
  },
  {
    id: 'prod-002',
    name: 'Agua con Gas Mendocina 500ml',
    category: 'Agua',
    cost_price: 3.00,
    sale_price: 6.00,
    stock: 24,
    min_stock: 8,
  },
  {
    id: 'prod-003',
    name: 'Whey Isolate 100% Vainilla 1kg',
    category: 'Proteínas',
    cost_price: 220.00,
    sale_price: 320.00,
    stock: 9,
    min_stock: 4,
  },
  {
    id: 'prod-004',
    name: 'Whey Protein Chocolate Suizo 1kg',
    category: 'Proteínas',
    cost_price: 180.00,
    sale_price: 260.00,
    stock: 3,
    min_stock: 4,
  },
  {
    id: 'prod-005',
    name: 'Barra Proteica Brownie Caramel (20g Prot)',
    category: 'Postres proteicos',
    cost_price: 10.00,
    sale_price: 18.00,
    stock: 30,
    min_stock: 10,
  },
  {
    id: 'prod-006',
    name: 'Galleta Proteica Doble Chocolate',
    category: 'Postres proteicos',
    cost_price: 11.00,
    sale_price: 19.00,
    stock: 2,
    min_stock: 5,
  },
  {
    id: 'prod-007',
    name: 'Pudín Proteico Vainilla 200g',
    category: 'Postres proteicos',
    cost_price: 8.50,
    sale_price: 15.00,
    stock: 15,
    min_stock: 6,
  },
  {
    id: 'prod-008',
    name: 'Monster Energy Ultra White 500ml',
    category: 'Energizantes',
    cost_price: 12.00,
    sale_price: 20.00,
    stock: 24,
    min_stock: 8,
  },
  {
    id: 'prod-009',
    name: 'Red Bull Sin Azúcar 250ml',
    category: 'Energizantes',
    cost_price: 10.00,
    sale_price: 16.00,
    stock: 16,
    min_stock: 6,
  },
  {
    id: 'prod-010',
    name: 'Pre-Entreno C4 Original Fruit Punch',
    category: 'Energizantes',
    cost_price: 150.00,
    sale_price: 230.00,
    stock: 2,
    min_stock: 3,
  },
  {
    id: 'prod-011',
    name: 'Toalla de Microfibra de Entrenamiento',
    category: 'Otros',
    cost_price: 20.00,
    sale_price: 40.00,
    stock: 14,
    min_stock: 5,
  },
  {
    id: 'prod-012',
    name: 'Shaker Mezclador Pro 700ml',
    category: 'Otros',
    cost_price: 18.00,
    sale_price: 35.00,
    stock: 11,
    min_stock: 5,
  },
]

export function generateInitialSales(): Sale[] {
  const sales: Sale[] = []
  const today = new Date()

  sales.push({
    id: 'sale-today-01',
    user_id: 'user-emp-01',
    user_name: 'Lucía Gómez',
    client_id: 'cli-001',
    client_name: 'Alejandro Morales Ríos (Mensual)',
    total_amount: 275.00,
    payment_method: 'QR',
    created_at: new Date(today.getTime() - 1000 * 60 * 45).toISOString(),
    items: [
      { product_id: 'prod-004', product_name: 'Whey Protein Chocolate Suizo 1kg', quantity: 1, unit_price: 260.00, subtotal: 260.00 },
      { product_id: 'prod-001', product_name: 'Agua Mineral Vital 500ml', quantity: 3, unit_price: 5.00, subtotal: 15.00 },
    ],
  })

  sales.push({
    id: 'sale-today-02',
    user_id: 'user-admin-01',
    user_name: 'Carlos Mendoza',
    client_id: 'cli-002',
    client_name: 'Valentina Soto Paz (Día por Medio)',
    total_amount: 52.00,
    payment_method: 'Efectivo',
    created_at: new Date(today.getTime() - 1000 * 60 * 120).toISOString(),
    items: [
      { product_id: 'prod-005', product_name: 'Barra Proteica Brownie Caramel', quantity: 2, unit_price: 18.00, subtotal: 36.00 },
      { product_id: 'prod-009', product_name: 'Red Bull Sin Azúcar 250ml', quantity: 1, unit_price: 16.00, subtotal: 16.00 },
    ],
  })

  sales.push({
    id: 'sale-today-03',
    user_id: 'user-emp-01',
    user_name: 'Lucía Gómez',
    client_id: null,
    client_name: 'Cliente Mostrador',
    total_amount: 40.00,
    payment_method: 'Efectivo',
    created_at: new Date(today.getTime() - 1000 * 60 * 240).toISOString(),
    items: [
      { product_id: 'prod-008', product_name: 'Monster Energy Ultra White 500ml', quantity: 2, unit_price: 20.00, subtotal: 40.00 },
    ],
  })

  const pastAmounts = [620, 850, 480, 940, 720, 580, 1150, 490, 820, 990, 640, 890, 1250, 1420, 680, 890, 980, 760, 1120, 1340, 790, 920, 1080, 1190, 850, 980, 1280, 1390, 1050]
  
  for (let i = 1; i <= 29; i++) {
    const saleDate = new Date(today)
    saleDate.setDate(today.getDate() - i)
    const baseAmt = pastAmounts[i - 1] || 750
    
    sales.push({
      id: `sale-past-${i}`,
      user_id: i % 2 === 0 ? 'user-admin-01' : 'user-emp-01',
      user_name: i % 2 === 0 ? 'Carlos Mendoza' : 'Lucía Gómez',
      client_id: i % 3 === 0 ? 'cli-001' : i % 3 === 1 ? 'cli-003' : null,
      client_name: i % 3 === 0 ? 'Alejandro Morales' : i % 3 === 1 ? 'Martín Delgado' : 'Cliente Mostrador',
      total_amount: baseAmt + (i % 7) * 20,
      payment_method: i % 2 === 0 ? 'QR' : 'Efectivo',
      created_at: saleDate.toISOString(),
      items: [
        { product_id: 'prod-003', product_name: 'Whey Isolate Vainilla', quantity: 1, unit_price: 320.00, subtotal: 320.00 },
        { product_id: 'prod-008', product_name: 'Monster Ultra', quantity: 2, unit_price: 20.00, subtotal: 40.00 },
      ],
    })
  }

  return sales
}
