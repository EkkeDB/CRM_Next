import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import type {
  User,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  Contract,
  ContractCreateData,
  Counterparty,
  Commodity,
  Currency,
  Trader,
  Broker,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any common headers or auth tokens here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await authApi.refreshToken()
        // Retry the original request
        if (error.config) {
          return apiClient(error.config)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; message: string }> => {
    const response = await apiClient.post('/auth/login/', credentials)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout/')
  },

  register: async (data: RegisterData): Promise<{ message: string; user_id: number }> => {
    const response = await apiClient.post('/auth/register/', data)
    return response.data
  },

  refreshToken: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/token/refresh/')
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/profile/', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/change-password/', data)
    return response.data
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get('/auth/health/')
    return response.data
  },
}

// Contracts API
export const contractsApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    trader?: number
    counterparty?: number
  }): Promise<PaginatedResponse<Contract>> => {
    const response = await apiClient.get('/crm/contracts/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Contract> => {
    const response = await apiClient.get(`/crm/contracts/${id}/`)
    return response.data
  },

  create: async (data: ContractCreateData): Promise<Contract> => {
    const response = await apiClient.post('/crm/contracts/', data)
    return response.data
  },

  update: async (id: number, data: Partial<ContractCreateData>): Promise<Contract> => {
    const response = await apiClient.put(`/crm/contracts/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crm/contracts/${id}/`)
  },

  approve: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/crm/contracts/${id}/approve/`)
    return response.data
  },

  execute: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/crm/contracts/${id}/execute/`)
    return response.data
  },

  complete: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/crm/contracts/${id}/complete/`)
    return response.data
  },

  cancel: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/crm/contracts/${id}/cancel/`)
    return response.data
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/crm/contracts/dashboard_stats/')
    return response.data
  },
}

// Counterparties API
export const counterpartiesApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
    is_supplier?: boolean
    is_customer?: boolean
    country?: string
  }): Promise<PaginatedResponse<Counterparty>> => {
    const response = await apiClient.get('/crm/counterparties/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Counterparty> => {
    const response = await apiClient.get(`/crm/counterparties/${id}/`)
    return response.data
  },

  create: async (data: Omit<Counterparty, 'id' | 'facilities'>): Promise<Counterparty> => {
    const response = await apiClient.post('/crm/counterparties/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await apiClient.put(`/crm/counterparties/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crm/counterparties/${id}/`)
  },
}

// Commodities API
export const commoditiesApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
    commodity_group?: number
  }): Promise<PaginatedResponse<Commodity>> => {
    const response = await apiClient.get('/crm/commodities/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Commodity> => {
    const response = await apiClient.get(`/crm/commodities/${id}/`)
    return response.data
  },

  create: async (data: Omit<Commodity, 'id'>): Promise<Commodity> => {
    const response = await apiClient.post('/crm/commodities/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Commodity>): Promise<Commodity> => {
    const response = await apiClient.put(`/crm/commodities/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crm/commodities/${id}/`)
  },
}

// Reference Data APIs
export const referenceDataApi = {
  // Currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get('/crm/currencies/')
    return response.data.results || response.data
  },

  // Traders
  getTraders: async (): Promise<Trader[]> => {
    const response = await apiClient.get('/crm/traders/')
    return response.data.results || response.data
  },

  // Brokers
  getBrokers: async (): Promise<Broker[]> => {
    const response = await apiClient.get('/crm/brokers/')
    return response.data.results || response.data
  },

  // Commodity Groups
  getCommodityGroups: async () => {
    const response = await apiClient.get('/crm/commodity-groups/')
    return response.data.results || response.data
  },

  // Commodity Types
  getCommodityTypes: async () => {
    const response = await apiClient.get('/crm/commodity-types/')
    return response.data.results || response.data
  },

  // Commodity Subtypes
  getCommoditySubtypes: async () => {
    const response = await apiClient.get('/crm/commodity-subtypes/')
    return response.data.results || response.data
  },

  // Cost Centers
  getCostCenters: async () => {
    const response = await apiClient.get('/crm/cost-centers/')
    return response.data.results || response.data
  },

  // Delivery Formats
  getDeliveryFormats: async () => {
    const response = await apiClient.get('/crm/delivery-formats/')
    return response.data.results || response.data
  },

  // Additives
  getAdditives: async () => {
    const response = await apiClient.get('/crm/additives/')
    return response.data.results || response.data
  },

  // Sociedades
  getSociedades: async () => {
    const response = await apiClient.get('/crm/sociedades/')
    return response.data.results || response.data
  },

  // Trade Operation Types
  getTradeOperationTypes: async () => {
    const response = await apiClient.get('/crm/trade-operation-types/')
    return response.data.results || response.data
  },

  // ICOTERMS
  getIcoterms: async () => {
    const response = await apiClient.get('/crm/icoterms/')
    return response.data.results || response.data
  },
}

// Export the main API client
export default apiClient

