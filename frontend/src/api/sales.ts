import { apiRequest } from './axios'

export type Sale = {
  id: number
  customerId: number | null
  totalAmount: string
  status: 'pending' | 'completed' | 'cancelled'
  paymentMethod: string | null
  saleDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
  customerName: string | null
  customerEmail: string | null
  customerPhone?: string | null
}

export type SaleItem = {
  id: number
  productId: number
  quantity: number
  unitPrice: string
  totalPrice: string
  productName: string | null
}

export type CreateSalePayload = {
  customerId?: number
  items: Array<{
    productId: number
    quantity: number
    unitPrice: number
  }>
  paymentMethod?: string
  notes?: string
}

export type UpdateSaleStatusPayload = {
  status: 'pending' | 'completed' | 'cancelled'
}

export type SalesResponse = {
  data: Sale[]
  count: number
}

export type SaleResponse = {
  data: Sale & { items: SaleItem[] }
}

export type SalesStatsResponse = {
  data: {
    totalSales: number
    totalRevenue: string
    pendingSales: number
    completedSales: number
  }
}

export type MessageResponse = {
  message: string
  data?: Sale
}

export const getSales = async (filters?: {
  customerId?: number
  status?: string
  startDate?: string
  endDate?: string
}): Promise<SalesResponse> => {
  const params = new URLSearchParams()
  if (filters?.customerId) params.append('customerId', filters.customerId.toString())
  if (filters?.status) params.append('status', filters.status)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const query = params.toString()
  return apiRequest<SalesResponse>(`/sales${query ? `?${query}` : ''}`)
}

export const getSale = async (id: string | number): Promise<SaleResponse> => {
  return apiRequest<SaleResponse>(`/sales/${id}`)
}

export const getSalesStats = async (filters?: {
  customerId?: number
  status?: string
}): Promise<SalesStatsResponse> => {
  const params = new URLSearchParams()
  if (filters?.customerId) params.append('customerId', filters.customerId.toString())
  if (filters?.status) params.append('status', filters.status)

  const query = params.toString()
  return apiRequest<SalesStatsResponse>(`/sales/stats${query ? `?${query}` : ''}`)
}

export const createSale = async (payload: CreateSalePayload): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>('/sales', {
    method: 'POST',
    body: payload,
  })
}

export const updateSaleStatus = async (
  id: string | number,
  payload: UpdateSaleStatusPayload
): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/sales/${id}/status`, {
    method: 'PUT',
    body: payload,
  })
}

export const getCustomerSalesHistory = async (customerId: string | number): Promise<SalesResponse> => {
  return apiRequest<SalesResponse>(`/sales/customers/${customerId}/sales`)
}
