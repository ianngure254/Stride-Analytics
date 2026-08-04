export type RouteId = 'home' | 'dashboard' | 'sales' | 'inventory' | 'customers'



export type PageProps = {
  activeRoute: RouteId
  onNavigate: (route: RouteId) => void
  onSignOut?: () => void
  userEmail?: string | null
}

export const appRoutes: { id: RouteId; label: string; description: string }[] = [
  { id: 'home', label: 'Home', description: 'Business overview' },
  { id: 'dashboard', label: 'Dashboard', description: 'Revenue and operations' },
  { id: 'sales', label: 'Sales', description: 'Transactions and new sales' },
  { id: 'inventory', label: 'Inventory', description: 'Stock and alerts' },
  { id: 'customers', label: 'Customers', description: 'Credit and loyalty' },
]

export type SaleRecord = {
  id: string
  customer: string
  item: string
  amount: number
  method: 'M-Pesa' | 'Cash' | 'Credit'
  status: 'Paid' | 'Pending'
  date: string
}

export type InventoryItem = {
  sku: string
  name: string
  category: string
  stock: number
  reorderAt: number
  price: number
  movement: 'Fast' | 'Steady' | 'Slow'
}

export type CustomerRecord = {
  id: string
  name: string
  phone: string
  balance: number
  lastPurchase: string
  status: 'Clear' | 'Active deni' | 'Overdue'
}

export const salesRecords: SaleRecord[] = [
  {
    id: 'SL-1027',
    customer: 'Amina Wanjiku',
    item: 'Maize flour bundle',
    amount: 4400,
    method: 'M-Pesa',
    status: 'Paid',
    date: 'Today, 09:14',
  },
  {
    id: 'SL-1026',
    customer: 'Kevin Otieno',
    item: 'Cooking oil carton',
    amount: 8200,
    method: 'Cash',
    status: 'Paid',
    date: 'Today, 08:42',
  },
  {
    id: 'SL-1025',
    customer: 'Grace Njeri',
    item: 'Retail restock mix',
    amount: 12600,
    method: 'M-Pesa',
    status: 'Pending',
    date: 'Yesterday, 18:20',
  },
  {
    id: 'SL-1024',
    customer: 'Peter Mwangi',
    item: 'Sugar 2kg batch',
    amount: 3600,
    method: 'Credit',
    status: 'Paid',
    date: 'Yesterday, 16:05',
  },
]

export const inventoryItems: InventoryItem[] = [
  {
    sku: 'INV-044',
    name: 'Maize Flour 2kg',
    category: 'Staples',
    stock: 18,
    reorderAt: 24,
    price: 220,
    movement: 'Fast',
  },
  {
    sku: 'INV-031',
    name: 'Cooking Oil 5L',
    category: 'Pantry',
    stock: 12,
    reorderAt: 10,
    price: 1240,
    movement: 'Fast',
  },
  {
    sku: 'INV-018',
    name: 'Sugar 2kg',
    category: 'Staples',
    stock: 42,
    reorderAt: 20,
    price: 310,
    movement: 'Steady',
  },
  {
    sku: 'INV-057',
    name: 'Laundry Soap Box',
    category: 'Household',
    stock: 8,
    reorderAt: 16,
    price: 640,
    movement: 'Slow',
  },
  {
    sku: 'INV-062',
    name: 'Rice 10kg',
    category: 'Staples',
    stock: 27,
    reorderAt: 18,
    price: 1680,
    movement: 'Steady',
  },
]

export const customers: CustomerRecord[] = [
  {
    id: 'CUS-309',
    name: 'Amina Wanjiku',
    phone: '+254 712 440 019',
    balance: 0,
    lastPurchase: 'Today',
    status: 'Clear',
  },
  {
    id: 'CUS-214',
    name: 'Grace Njeri',
    phone: '+254 734 881 260',
    balance: 2600,
    lastPurchase: 'Yesterday',
    status: 'Active deni',
  },
  {
    id: 'CUS-177',
    name: 'Moses Kariuki',
    phone: '+254 700 194 542',
    balance: 5400,
    lastPurchase: 'Apr 29',
    status: 'Overdue',
  },
  {
    id: 'CUS-128',
    name: 'Peter Mwangi',
    phone: '+254 722 631 904',
    balance: 900,
    lastPurchase: 'Apr 27',
    status: 'Active deni',
  },
]

export const formatKes = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value)

export const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')
