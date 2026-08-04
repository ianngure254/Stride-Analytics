import { apiRequest } from './axios'

export type Product = {
  id: number
  name: string
  description: string | null
  price: string
  stock: number
  unit: string
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateProductPayload = {
  name: string
  description?: string
  price: number
  stock?: number
  unit?: string
  category?: string
  isActive?: boolean
}

export type UpdateProductPayload = {
  name?: string
  description?: string
  price?: number
  stock?: number
  unit?: string
  category?: string
  isActive?: boolean
}

export type UpdateStockPayload = {
  qty: number
  operation: 'add' | 'deduct' | 'set'
}

export type ProductsResponse = {
  data: Product[]
  count: number
}

export type ProductResponse = {
  data: Product
}

export type CategoriesResponse = {
  data: string[]
}

export type MessageResponse = {
  message: string
  data?: Product
}

export const getProducts = async (filters?: {
  category?: string
  lowStock?: boolean
  search?: string
}): Promise<ProductsResponse> => {
  const params = new URLSearchParams()
  if (filters?.category) params.append('category', filters.category)
  if (filters?.lowStock) params.append('lowStock', 'true')
  if (filters?.search) params.append('search', filters.search)

  const query = params.toString()
  return apiRequest<ProductsResponse>(`/products${query ? `?${query}` : ''}`)
}

export const getProduct = async (id: string | number): Promise<ProductResponse> => {
  return apiRequest<ProductResponse>(`/products/${id}`)
}

export const getLowStockProducts = async (): Promise<ProductsResponse> => {
  return apiRequest<ProductsResponse>('/products/low-stock')
}

export const getCategories = async (): Promise<CategoriesResponse> => {
  return apiRequest<CategoriesResponse>('/products/categories')
}

export const createProduct = async (payload: CreateProductPayload): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>('/products', {
    method: 'POST',
    body: payload,
  })
}

export const updateProduct = async (
  id: string | number,
  payload: UpdateProductPayload
): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/products/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export const updateStock = async (
  id: string | number,
  payload: UpdateStockPayload
): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/products/${id}/stock`, {
    method: 'PATCH',
    body: payload,
  })
}

export const deleteProduct = async (id: string | number): Promise<MessageResponse> => {
  return apiRequest<MessageResponse>(`/products/${id}`, {
    method: 'DELETE',
  })
}
