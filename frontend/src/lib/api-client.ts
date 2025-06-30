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

// CSRF token management with enhanced error handling and race condition prevention
interface CSRFTokenState {
  token: string | null
  promise: Promise<string> | null
  lastFetch: number
  failureCount: number
  circuitBreakerOpen: boolean
}

const csrfState: CSRFTokenState = {
  token: null,
  promise: null,
  lastFetch: 0,
  failureCount: 0,
  circuitBreakerOpen: false
}

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 3
const CIRCUIT_BREAKER_TIMEOUT = 30000 // 30 seconds
const TOKEN_CACHE_DURATION = 300000 // 5 minutes
const REQUEST_TIMEOUT = 10000 // 10 seconds

// Function to get CSRF token with robust error handling and circuit breaker
const getCSRFToken = async (): Promise<string> => {
  const now = Date.now()
  
  // Check circuit breaker
  if (csrfState.circuitBreakerOpen) {
    if (now - csrfState.lastFetch < CIRCUIT_BREAKER_TIMEOUT) {
      console.warn('CSRF circuit breaker is open, skipping token fetch')
      return csrfState.token || ''
    } else {
      // Reset circuit breaker
      csrfState.circuitBreakerOpen = false
      csrfState.failureCount = 0
    }
  }
  
  // Return cached token if still valid
  if (csrfState.token && (now - csrfState.lastFetch) < TOKEN_CACHE_DURATION) {
    return csrfState.token
  }
  
  // Return existing promise if request is in progress
  if (csrfState.promise) {
    return csrfState.promise
  }
  
  // Create new request with special config to bypass interceptors and prevent loops
  const csrfAxios = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    withCredentials: true, // Required for CSRF cookies
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  csrfState.promise = csrfAxios.get('/api/auth/csrf/')
    .then(response => {
      // Successful response
      const token = response.data?.csrfToken || ''
      csrfState.token = token
      csrfState.lastFetch = now
      csrfState.failureCount = 0
      csrfState.circuitBreakerOpen = false
      csrfState.promise = null
      
      console.debug('CSRF token fetched successfully')
      return token
    })
    .catch(error => {
      // Failed response
      csrfState.promise = null
      csrfState.failureCount++
      
      console.error('Failed to get CSRF token:', error.response?.status, error.message)
      
      // Open circuit breaker if too many failures
      if (csrfState.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        csrfState.circuitBreakerOpen = true
        console.warn('CSRF circuit breaker opened due to repeated failures')
      }
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        // 401 might indicate session issues, but don't clear auth state immediately
        // Let the response interceptor handle authentication errors
        console.warn('CSRF endpoint returned 401, session may be expired')
      } else if (error.response?.status === 403) {
        // 403 might indicate CORS or permission issues
        console.warn('CSRF endpoint returned 403, possible CORS or permission issue')
      } else if (error.code === 'ECONNABORTED') {
        console.warn('CSRF request timed out')
      } else if (!error.response) {
        console.warn('CSRF request failed with network error')
      }
      
      // Return cached token if available, empty string otherwise
      return csrfState.token || ''
    })
  
  return csrfState.promise
}

// Function to clear CSRF token cache (e.g., on 403 errors)
const clearCSRFTokenCache = (): void => {
  csrfState.token = null
  csrfState.promise = null
  csrfState.lastFetch = 0
  csrfState.failureCount = 0
  csrfState.circuitBreakerOpen = false
}

// Function to clear all authentication state
const clearAuthState = (): void => {
  clearCSRFTokenCache()
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

// Request interceptor with enhanced error handling
apiClient.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests that require it
    const isCSRFEndpoint = config.url?.includes('/auth/csrf')
    const isHealthEndpoint = config.url?.includes('/auth/health')
    
    // Add CSRF token for all non-GET requests except CSRF endpoint itself and health check
    if (config.method !== 'get' && !isCSRFEndpoint && !isHealthEndpoint) {
      try {
        const csrfToken = await getCSRFToken()
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken
          console.debug('Added CSRF token to request:', config.url)
        } else {
          console.warn('No CSRF token available for request:', config.url)
        }
      } catch (error) {
        console.error('Failed to get CSRF token for request:', config.url, error)
        // Continue with request without CSRF token rather than failing
        // The server will return 403 if CSRF is required, and we'll handle it in response interceptor
      }
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Track retry attempts to prevent infinite loops
const retryTracker = new WeakMap()

// Response interceptor with enhanced error handling and loop prevention
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config
    
    if (!originalRequest) {
      return Promise.reject(error)
    }
    
    // Prevent infinite loops by tracking retry attempts
    const retryCount = retryTracker.get(originalRequest) || 0
    if (retryCount >= 2) {
      console.warn('Max retry attempts reached for request:', originalRequest.url)
      return Promise.reject(error)
    }
    
    // Don't try to refresh tokens for auth endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/')
    const isCSRFEndpoint = originalRequest.url?.includes('/auth/csrf')
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Mark this request as being retried
      retryTracker.set(originalRequest, retryCount + 1)
      
      try {
        // Try to refresh token
        await authApi.refreshToken()
        
        // Clear CSRF token to force refresh on next request
        clearCSRFTokenCache()
        
        // Retry the original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        
        // Clear authentication state and redirect to login
        clearAuthState()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    // Handle CSRF-related errors
    if (error.response?.status === 403) {
      // Clear CSRF token cache to force refresh on next request
      clearCSRFTokenCache()
      
      // If this is not already a CSRF endpoint retry, and not already retried, try once more
      if (!isCSRFEndpoint && retryCount === 0) {
        retryTracker.set(originalRequest, retryCount + 1)
        
        try {
          // Force CSRF token refresh and retry
          const newToken = await getCSRFToken()
          if (newToken && originalRequest.headers) {
            originalRequest.headers['X-CSRFToken'] = newToken
          }
          return apiClient(originalRequest)
        } catch (csrfError) {
          console.error('CSRF token refresh failed:', csrfError)
        }
      }
    }
    
    // Handle network errors with exponential backoff for critical operations
    if (!error.response && retryCount === 0 && originalRequest.method !== 'get') {
      retryTracker.set(originalRequest, retryCount + 1)
      
      // Wait before retry (simple backoff)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        return apiClient(originalRequest)
      } catch (retryError) {
        console.error('Network retry failed:', retryError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; message: string }> => {
    try {
      // Ensure we have a fresh CSRF token before login
      console.log('Fetching CSRF token before login...')
      const csrfToken = await getCSRFToken()
      console.log('CSRF token obtained:', csrfToken ? 'Yes' : 'No')
      
      const response = await apiClient.post('/auth/login/', credentials)
      console.log('Login API response:', response.status, response.statusText)
      return response.data
    } catch (error: any) {
      console.error('Login API error:', error.response?.status, error.response?.statusText, error.message)
      console.error('Login API error details:', error.response?.data)
      // Re-throw to ensure error is properly propagated
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout/')
    } catch (error: any) {
      console.error('Logout API error:', error.response?.status, error.message)
      throw error
    }
  },

  register: async (data: RegisterData): Promise<{ message: string; user_id: number }> => {
    try {
      const response = await apiClient.post('/auth/register/', data)
      return response.data
    } catch (error: any) {
      console.error('Register API error:', error.response?.status, error.message)
      throw error
    }
  },

  refreshToken: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post('/auth/token/refresh/')
      return response.data
    } catch (error: any) {
      console.error('Refresh token API error:', error.response?.status, error.message)
      throw error
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/me/')
      return response.data
    } catch (error: any) {
      console.error('Get profile API error:', error.response?.status, error.message)
      throw error
    }
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put('/auth/profile/', data)
      return response.data
    } catch (error: any) {
      console.error('Update profile API error:', error.response?.status, error.message)
      throw error
    }
  },

  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post('/auth/change-password/', data)
      return response.data
    } catch (error: any) {
      console.error('Change password API error:', error.response?.status, error.message)
      throw error
    }
  },

  healthCheck: async (): Promise<{ status: string }> => {
    try {
      const response = await apiClient.get('/auth/health/')
      return response.data
    } catch (error: any) {
      console.error('Health check API error:', error.response?.status, error.message)
      throw error
    }
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
    const response = await apiClient.get('/contracts/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Contract> => {
    const response = await apiClient.get(`/contracts/${id}/`)
    return response.data
  },

  create: async (data: ContractCreateData): Promise<Contract> => {
    const response = await apiClient.post('/contracts/', data)
    return response.data
  },

  update: async (id: number, data: Partial<ContractCreateData>): Promise<Contract> => {
    const response = await apiClient.put(`/contracts/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contracts/${id}/`)
  },

  approve: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/contracts/${id}/approve/`)
    return response.data
  },

  execute: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/contracts/${id}/execute/`)
    return response.data
  },

  complete: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/contracts/${id}/complete/`)
    return response.data
  },

  cancel: async (id: number): Promise<{ status: string }> => {
    const response = await apiClient.post(`/contracts/${id}/cancel/`)
    return response.data
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/contracts/dashboard_stats/')
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
    const response = await apiClient.get('/counterparties/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Counterparty> => {
    const response = await apiClient.get(`/counterparties/${id}/`)
    return response.data
  },

  create: async (data: Omit<Counterparty, 'id' | 'facilities'>): Promise<Counterparty> => {
    const response = await apiClient.post('/counterparties/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Counterparty>): Promise<Counterparty> => {
    const response = await apiClient.put(`/counterparties/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/counterparties/${id}/`)
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
    const response = await apiClient.get('/commodities/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Commodity> => {
    const response = await apiClient.get(`/commodities/${id}/`)
    return response.data
  },

  create: async (data: Omit<Commodity, 'id'>): Promise<Commodity> => {
    const response = await apiClient.post('/commodities/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Commodity>): Promise<Commodity> => {
    const response = await apiClient.put(`/commodities/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/commodities/${id}/`)
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
    const response = await apiClient.get('/contacts/', { params })
    return response.data.results || response.data
  },

  getById: async (id: number): Promise<Contact> => {
    const response = await apiClient.get(`/contacts/${id}/`)
    return response.data
  },

  create: async (data: Omit<Contact, 'id' | 'created_at' | 'last_contact'>): Promise<Contact> => {
    const response = await apiClient.post('/contacts/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Contact>): Promise<Contact> => {
    const response = await apiClient.put(`/contacts/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contacts/${id}/`)
  },
}

// Reference Data APIs
export const referenceDataApi = {
  // Currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get('/currencies/')
    return response.data.results || response.data
  },

  // Traders
  getTraders: async (): Promise<Trader[]> => {
    const response = await apiClient.get('/traders/')
    return response.data.results || response.data
  },

  // Brokers
  getBrokers: async (): Promise<Broker[]> => {
    const response = await apiClient.get('/brokers/')
    return response.data.results || response.data
  },

  // Commodity Groups
  getCommodityGroups: async () => {
    const response = await apiClient.get('/commodity-groups/')
    return response.data.results || response.data
  },

  // Commodity Types
  getCommodityTypes: async () => {
    const response = await apiClient.get('/commodity-types/')
    return response.data.results || response.data
  },

  // Commodity Subtypes
  getCommoditySubtypes: async () => {
    const response = await apiClient.get('/commodity-subtypes/')
    return response.data.results || response.data
  },

  // Cost Centers
  getCostCenters: async () => {
    const response = await apiClient.get('/cost-centers/')
    return response.data.results || response.data
  },

  // Delivery Formats
  getDeliveryFormats: async () => {
    const response = await apiClient.get('/delivery-formats/')
    return response.data.results || response.data
  },

  // Additives
  getAdditives: async () => {
    const response = await apiClient.get('/additives/')
    return response.data.results || response.data
  },

  // Sociedades
  getSociedades: async () => {
    const response = await apiClient.get('/sociedades/')
    return response.data.results || response.data
  },

  // Trade Operation Types
  getTradeOperationTypes: async () => {
    const response = await apiClient.get('/trade-operation-types/')
    return response.data.results || response.data
  },

  // ICOTERMS
  getIcoterms: async () => {
    const response = await apiClient.get('/icoterms/')
    return response.data.results || response.data
  },
}

// Traders API (currently limited - needs backend implementation for full CRUD)
export const tradersApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<Trader[]> => {
    // Use the reference data endpoint for now
    return referenceDataApi.getTraders()
  },

  getById: async (id: number): Promise<Trader> => {
    const traders = await referenceDataApi.getTraders()
    const trader = traders.find(t => t.id === id)
    if (!trader) throw new Error('Trader not found')
    return trader
  },

  create: async (data: Omit<Trader, 'id'>): Promise<Trader> => {
    // This endpoint needs to be implemented in the backend
    throw new Error('Create trader endpoint not implemented in backend. Please contact administrator.')
  },

  update: async (id: number, data: Partial<Trader>): Promise<Trader> => {
    // This endpoint needs to be implemented in the backend  
    throw new Error('Update trader endpoint not implemented in backend. Please contact administrator.')
  },

  delete: async (id: number): Promise<void> => {
    // This endpoint needs to be implemented in the backend
    throw new Error('Delete trader endpoint not implemented in backend. Please contact administrator.')
  }
}

// Client-side authentication state check with retry logic
// NOTE: We cannot check HttpOnly cookies via document.cookie (by design for security)
// This function now only checks for non-HttpOnly auth-related cookies (like CSRF tokens)
const hasNonHttpOnlyAuthCookies = (): boolean => {
  if (typeof document === 'undefined') {
    return false // SSR - assume no auth
  }
  
  // Check for non-HttpOnly cookies that might indicate an active session
  // We cannot and should not check HttpOnly cookies from JavaScript
  const cookies = document.cookie.split(';').map(cookie => cookie.trim())
  const hasCSRFToken = cookies.some(cookie => cookie.startsWith('csrftoken='))
  
  console.debug('Non-HttpOnly auth cookies check:', { hasCSRFToken, cookies: document.cookie })
  // Don't return false just because we can't see HttpOnly cookies
  // This will be handled by the useProfile query which makes an API call
  return true // Always assume tokens might exist - let the API call determine auth state
}

// Wait for authentication to be established (via API call, not cookie detection)
const waitForAuthentication = async (maxAttempts: number = 5, delayMs: number = 100): Promise<boolean> => {
  console.debug('Waiting for authentication to be established via API calls...')
  // Since we can't check HttpOnly cookies, we just wait a moment for the browser
  // to process the Set-Cookie headers, then let the API call determine auth state
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return true // Always return true - let the /auth/me API call determine the real state
}

// Additional utility functions for debugging and state management
export const getCSRFTokenState = () => ({ ...csrfState })
export const forceCSRFTokenRefresh = () => {
  clearCSRFTokenCache()
  return getCSRFToken()
}

// Export the main API client
export default apiClient

// Export utility functions  
export { clearAuthState, clearCSRFTokenCache, getCSRFToken, hasNonHttpOnlyAuthCookies, waitForAuthentication }

