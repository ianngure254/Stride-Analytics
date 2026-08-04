import { apiRequest } from './axios'

export type SetupBusinessPayload = {
  businessName: string
  plan?: string
}

export type SetupResult = {
  businessId: string
  businessName: string
  plan: string
  setupAt: string
}

export type SetupResponse = {
  message: string
  data: SetupResult
}

export const setupBusiness = async (payload: SetupBusinessPayload): Promise<SetupResponse> => {
  return apiRequest<SetupResponse>('/setup/business', {
    method: 'POST',
    body: payload,
  })
}

export const getBusinessContext = async (): Promise<{ data: { id: string; name: string; plan: string } }> => {
  return apiRequest('/setup/business')
}

export const ensureBusinessContext = async (): Promise<SetupResponse> => {
  return apiRequest<SetupResponse>('/setup/business', { method: 'POST' })
}