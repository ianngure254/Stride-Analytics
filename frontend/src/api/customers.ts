import { apiRequest } from './axios'

export type Customer = {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  pendingAmount: string | null
  deniStatus: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCustomerPayload = {
  name: string
  email?: string
  phone?: string
  address?: string
  pendingAmount?: number
}

export type UpdateCustomerPayload = {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export type CustomersResponse = {
  data: Customer[]
  count: number
}

export type CustomerResponse = {
  data: Customer
}

export type CustomerStatsResponse = {
  data: {
    totalPurchases: number
    totalSpent: string
    lastPurchaseDate: string | null
    averageOrderValue: string
  }
}

export type MessageResponse = {
  message: string
  data?: Customer
}

export const getCustomers = async (): Promise<CustomersResponse> => {
  return apiRequest<CustomersResponse>('/customers')
}

export const getCustomer = async (id: string | number): Promise<CustomerResponse> => {
  return apiRequest<CustomerResponse>(`/customers/${id}`)
}

export const getCustomerStats = async (id: string | number): Promise<CustomerStatsResponse> => {
  return apiRequest<CustomerStatsResponse>(`/customers/${id}/stats`)
}

export const createCustomer = async (payload: CreateCustomerPayload): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>('/customers', {
    method: 'POST',
    body: payload,
  })
}

export const updateCustomer = async (
  id: string | number,
  payload: UpdateCustomerPayload
): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/customers/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export const deleteCustomer = async (id: string | number): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/customers/${id}`, {
    method: 'DELETE',
  })
}

export const clearCustomer = async (id: string | number): Promise<{ data: Customer; message: string }> => {
  return apiRequest<{ data: Customer; message: string }>(`/customers/${id}/clear`, {
    method: 'PATCH',
  })
}
