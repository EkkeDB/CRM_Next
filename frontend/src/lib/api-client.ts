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
  Contact,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
} from '@/types'

// API Configuration
// Smart environment detection for Docker/browser compatibility
const getAPIBaseURL = () => {
  // Client-side (browser) - use external URL
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  
  // Server-side (SSR/container) - use internal URL
  return process.env.NEXT_PUBLIC_API_URL_INTERNAL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
}

const API_BASE_URL = getAPIBaseURL()

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true, // Important for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

<<<<<<< HEAD
// CSRF token cache to prevent infinite recursion
let csrfTokenCache: string | null = null
let csrfTokenPromise: Promise<string> | null = null

// Function to get CSRF token with caching and recursion prevention
const getCSRFToken = async (): Promise<string> => {
  // Return cached token if available
  if (csrfTokenCache) {
    return Promise.resolve(csrfTokenCache)
  }
  
  // Return existing promise if request is in progress
  if (csrfTokenPromise) {
    return csrfTokenPromise
  }
  
  // Create new request with special config to bypass interceptor
  // Use a fresh axios instance to avoid any authentication interference
  const csrfAxios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true, // Keep true for CSRF cookies
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  csrfTokenPromise = csrfAxios.get('/api/auth/csrf/').then(response => {
    csrfTokenCache = response.data.csrfToken
    csrfTokenPromise = null
    return csrfTokenCache || ''
  }).catch(error => {
    console.error('Failed to get CSRF token:', error)
    console.error('Error details:', error.response?.data || error.message)
    csrfTokenPromise = null
    // Clear any bad authentication state that might be causing issues
    clearAuthState()
    return ''
  })
  
  return csrfTokenPromise
}

// Function to clear CSRF token cache (e.g., on 403 errors)
const clearCSRFTokenCache = (): void => {
  csrfTokenCache = null
  csrfTokenPromise = null
}

// Function to clear all authentication state
const clearAuthState = (): void => {
  clearCSRFTokenCache()
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
=======
// Cache for CSRF token to avoid repeated requests
let csrfTokenCache: string | null = null
let csrfTokenPromise: Promise<string> | null = null

// Function to get CSRF token with caching
const getCSRFToken = async (): Promise<string> => {
  // Return cached token if available
  if (csrfTokenCache) {
    return csrfTokenCache
>>>>>>> 612e6669c62694c4c2751ac98743e61f6c1373b7
  }

  // Return ongoing promise if one exists
  if (csrfTokenPromise) {
    return csrfTokenPromise
  }

  // Create new promise to fetch CSRF token
  csrfTokenPromise = (async () => {
    try {
      // Create a simple axios instance without interceptors for CSRF request
      const simpleClient = axios.create({
        baseURL: `${API_BASE_URL}/api`,
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const response = await simpleClient.get('/auth/csrf/')
      csrfTokenCache = response.data.csrfToken
      return response.data.csrfToken
    } catch (error) {
      console.error('Failed to get CSRF token:', error)
      return ''
    } finally {
      csrfTokenPromise = null
    }
  })()

  return csrfTokenPromise
}

// Function to clear CSRF token cache (call when getting 403 errors)
const clearCSRFTokenCache = () => {
  csrfTokenCache = null
  csrfTokenPromise = null
}

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = await getCSRFToken()
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken
      }
    }
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
    // Don't try to refresh tokens for auth endpoints to avoid infinite loops
    const isAuthEndpoint = error.config?.url?.includes('/auth/')
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Try to refresh token
      try {
        await authApi.refreshToken()
        // Retry the original request
        if (error.config) {
          return apiClient(error.config)
        }
      } catch (refreshError) {
        // Clear authentication state and redirect to login
        clearAuthState()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    } else if (error.response?.status === 403) {
      // CSRF token might be invalid, clear cache and retry once
      const errorMessage = error.response?.data?.detail || ''
      if (errorMessage.includes('CSRF') || errorMessage.includes('Forbidden')) {
        clearCSRFTokenCache()
        // Only retry if this isn't already a retry
        if (error.config && !error.config.headers['X-Retry-CSRF']) {
          error.config.headers['X-Retry-CSRF'] = 'true'
          return apiClient(error.config)
        }
      }
    }
    
    // Clear CSRF token cache on 403 errors (CSRF token invalid)
    if (error.response?.status === 403) {
      clearCSRFTokenCache()
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

// Contacts API
export const contactsApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
  }): Promise<Contact[]> => {
    const response = await apiClient.get('/crm/contacts/', { params })
    return response.data.results || response.data
  },

  getById: async (id: number): Promise<Contact> => {
    const response = await apiClient.get(`/crm/contacts/${id}/`)
    return response.data
  },

  create: async (data: Omit<Contact, 'id' | 'created_at' | 'last_contact'>): Promise<Contact> => {
    const response = await apiClient.post('/crm/contacts/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Contact>): Promise<Contact> => {
    const response = await apiClient.put(`/crm/contacts/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crm/contacts/${id}/`)
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

// Traders API - Full CRUD operations
export const tradersApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<PaginatedResponse<Trader>> => {
    const response = await apiClient.get('/crm/traders/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Trader> => {
    const response = await apiClient.get(`/crm/traders/${id}/`)
    return response.data
  },

  create: async (data: Omit<Trader, 'id'>): Promise<Trader> => {
    const response = await apiClient.post('/crm/traders/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Trader>): Promise<Trader> => {
    const response = await apiClient.put(`/crm/traders/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/crm/traders/${id}/`)
  }
}

// Export the main API client
export default apiClient

// Export utility functions
export { clearAuthState, clearCSRFTokenCache }

