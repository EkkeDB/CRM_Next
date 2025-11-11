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
  Deal,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  CounterpartyFacility,
  FacilityConsumption,
  CounterpartyNote,
  Role,
  UserRoleAssignment,
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
      // Reduce noise for common, expected cases during startup
      if (error?.response?.status === 401 || !error?.response || error?.code === 'ECONNABORTED') {
        console.warn('CSRF token fetch warning:', error.response?.status || error?.code || 'network')
      } else {
        console.error('Failed to get CSRF token:', error.response?.status, error.message)
      }
      
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
      if (error?.response?.status === 401) {
        console.warn('Profile unauthenticated (401)')
      } else {
        console.error('Get profile API error:', error.response?.status, error.message)
      }
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

  getDashboardStats: async (params?: { years?: number[]; commodity_ids?: number[] }): Promise<DashboardStats> => {
    const q: any = {}
    if (params?.years && params.years.length) q.years = params.years.join(',')
    if (params?.commodity_ids && params.commodity_ids.length) q.commodities = params.commodity_ids.join(',')
    const response = await apiClient.get('/contracts/dashboard_stats/', { params: q })
    return response.data
  },
  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/contracts/bulk_template/', { responseType: 'blob' as any })
    return response.data as Blob
  },
  bulkUpload: async (file: File, opts?: { create_missing_deal?: boolean; replace_materialized?: boolean; dry_run?: boolean }): Promise<{ created: number; updated: number; errors: any[]; processed: number; dry_run?: boolean }> => {
    const form = new FormData()
    form.append('file', file)
    const params: any = {}
    if (opts?.create_missing_deal !== undefined) params.create_missing_deal = String(opts.create_missing_deal)
    if (opts?.replace_materialized !== undefined) params.replace_materialized = String(opts.replace_materialized)
    if (opts?.dry_run !== undefined) params.dry_run = String(opts.dry_run)
    const response = await apiClient.post('/contracts/bulk_upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    })
    return response.data
  },

  // Preview first N rows via server-driven dry run plan
  previewBulk: async (
    file: File,
    opts?: { preview_rows?: number; create_missing_deal?: boolean; replace_materialized?: boolean }
  ): Promise<{ preview: { rows: any[]; summary: any }; errors: any[]; dry_run?: boolean }> => {
    const form = new FormData()
    form.append('file', file)
    const params: any = { dry_run: 'true' }
    if (opts?.preview_rows) params.preview_rows = String(opts.preview_rows)
    if (opts?.create_missing_deal !== undefined) params.create_missing_deal = String(opts.create_missing_deal)
    if (opts?.replace_materialized !== undefined) params.replace_materialized = String(opts.replace_materialized)
    const response = await apiClient.post('/contracts/bulk_upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    })
    return response.data
  },

  // Downloadable CSV of dry-run errors. Re-uploads the same file but asks for CSV output.
  bulkUploadErrorsCsv: async (file: File, opts?: { create_missing_deal?: boolean; replace_materialized?: boolean }): Promise<Blob> => {
    const form = new FormData()
    form.append('file', file)
    const params: any = { dry_run: 'true', errors_format: 'csv' }
    if (opts?.create_missing_deal !== undefined) params.create_missing_deal = String(opts.create_missing_deal)
    if (opts?.replace_materialized !== undefined) params.replace_materialized = String(opts.replace_materialized)
    const response = await apiClient.post('/contracts/bulk_upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
      responseType: 'blob' as any,
    })
    return response.data as Blob
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

  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/counterparties/bulk_template/', { responseType: 'blob' as any })
    return response.data as Blob
  },

  bulkUpload: async (file: File): Promise<{ created: number; updated: number; errors: any[]; processed: number }> => {
    const form = new FormData()
    form.append('file', file)
    const response = await apiClient.post('/counterparties/bulk_upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Optional helper to download CSV of dry-run errors for counterparties
  bulkUploadErrorsCsv: async (file: File): Promise<Blob> => {
    const form = new FormData()
    form.append('file', file)
    const response = await apiClient.post('/counterparties/bulk_upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { errors_format: 'csv', format: undefined },
      responseType: 'blob' as any,
    })
    return response.data as Blob
  },
}

// Commodities API
export const commoditiesApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
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
    counterparty?: number
  }): Promise<Contact[]> => {
    const response = await apiClient.get('/contacts/', { params })
    const data = response.data.results || response.data
    // Map backend contact to frontend Contact type (company from counterparty)
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company, // provided by serializer
      position: c.position,
      city: c.city,
      country: c.country,
      status: c.status,
      source: c.source,
      notes: c.notes,
      created_at: c.created_at,
      last_contact: c.last_contact,
    }))
  },

  getById: async (id: number): Promise<Contact> => {
    const { data: c } = await apiClient.get(`/contacts/${id}/`)
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      counterparty_id: c.counterparty_id,
      position: c.position,
      city: c.city,
      country: c.country,
      status: c.status,
      source: c.source,
      notes: c.notes,
      created_at: c.created_at,
      last_contact: c.last_contact,
    }
  },

  create: async (data: { counterparty: number } & Omit<Contact, 'id' | 'created_at' | 'last_contact' | 'company'>): Promise<Contact> => {
    const response = await apiClient.post('/contacts/', data)
    const c = response.data
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      position: c.position,
      city: c.city,
      country: c.country,
      status: c.status,
      source: c.source,
      notes: c.notes,
      created_at: c.created_at,
      last_contact: c.last_contact,
    }
  },

  update: async (id: number, data: Partial<{ counterparty: number } & Omit<Contact, 'company'>>): Promise<Contact> => {
    const response = await apiClient.patch(`/contacts/${id}/`, data)
    const c = response.data
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      position: c.position,
      city: c.city,
      country: c.country,
      status: c.status,
      source: c.source,
      notes: c.notes,
      created_at: c.created_at,
      last_contact: c.last_contact,
    }
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/contacts/${id}/`)
  },
}

// AuthZ management API (admin)
export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get('/auth/roles/', { params: { page_size: 1000 } })
    const data = response.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  },
  create: async (data: Partial<Role>): Promise<Role> => {
    const response = await apiClient.post('/auth/roles/', data)
    return response.data
  },
  update: async (id: number, data: Partial<Role>): Promise<Role> => {
    const response = await apiClient.patch(`/auth/roles/${id}/`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/auth/roles/${id}/`)
  },
}

export const roleAssignmentsApi = {
  getAll: async (): Promise<UserRoleAssignment[]> => {
    const response = await apiClient.get('/auth/role-assignments/', { params: { page_size: 1000 } })
    const data = response.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  },
  create: async (data: Partial<UserRoleAssignment>): Promise<UserRoleAssignment> => {
    const response = await apiClient.post('/auth/role-assignments/', data)
    return response.data
  },
  update: async (id: number, data: Partial<UserRoleAssignment>): Promise<UserRoleAssignment> => {
    const response = await apiClient.put(`/auth/role-assignments/${id}/`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/auth/role-assignments/${id}/`)
  },
}

export const authzApi = {
  simulate: async (params?: { user_id?: number; resource?: string; action?: string }): Promise<any> => {
    const response = await apiClient.get('/auth/authz/simulate/', { params })
    return response.data
  },
}

// Facilities API
export const facilitiesApi = {
  getAll: async (params?: { page?: number; page_size?: number; counterparty?: number; search?: string; segment?: string; city?: string; country?: string; province?: string; region?: string; is_active?: boolean }): Promise<PaginatedResponse<CounterpartyFacility>> => {
    const response = await apiClient.get('/counterparty-facilities/', { params })
    return response.data
  },

  getById: async (id: number): Promise<CounterpartyFacility & { consumptions?: FacilityConsumption[] }> => {
    const response = await apiClient.get(`/counterparty-facilities/${id}/`)
    return response.data
  },

  create: async (data: Omit<CounterpartyFacility, 'id' | 'created_at' | 'updated_at' | 'is_active'> & { is_active?: boolean }): Promise<CounterpartyFacility> => {
    const response = await apiClient.post('/counterparty-facilities/', data)
    return response.data
  },

  update: async (id: number, data: Partial<CounterpartyFacility>): Promise<CounterpartyFacility> => {
    const response = await apiClient.patch(`/counterparty-facilities/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/counterparty-facilities/${id}/`)
  },
}

// Facility Consumptions API
export const facilityConsumptionsApi = {
  getByFacility: async (facilityId: number): Promise<FacilityConsumption[]> => {
    const response = await apiClient.get('/facility-consumptions/', { params: { facility: facilityId, page_size: 1000 } })
    return response.data.results || response.data
  },

  getHeatmap: async (params?: { commodities?: number[]; countries?: string[] }): Promise<Array<{ country_code: string | null; country: string | null; region: string | null; province: string | null; lat: number; lng: number; volume: number }>> => {
    const q: any = {}
    if (params?.commodities && params.commodities.length) q.commodities = params.commodities.join(',')
    if (params?.countries && params.countries.length) q.countries = params.countries.join(',')
    const response = await apiClient.get('/facility-consumptions/geo_heatmap/', { params: q })
    return response.data
  },

  create: async (data: Omit<FacilityConsumption, 'id' | 'commodity_name' | 'yearly_volume'>): Promise<FacilityConsumption> => {
    const response = await apiClient.post('/facility-consumptions/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Omit<FacilityConsumption, 'id' | 'facility' | 'commodity' | 'commodity_name'>>): Promise<FacilityConsumption> => {
    const response = await apiClient.patch(`/facility-consumptions/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/facility-consumptions/${id}/`)
  },
}

// Utilities API
export const utilsApi = {
  geocode: async (query: string): Promise<{ lat: number; lng: number; provider: string; region?: string | null; province?: string | null; country_code?: string | null; precision?: string; message?: string }> => {
    const response = await apiClient.get('/geocode/', { params: { q: query } })
    return response.data
  },
}

// Counterparty Notes API
export const counterpartyNotesApi = {
  getByCounterparty: async (counterpartyId: number): Promise<CounterpartyNote[]> => {
    const response = await apiClient.get('/counterparty-notes/', { params: { counterparty: counterpartyId, page_size: 1000 } })
    return response.data.results || response.data
  },

  create: async (data: { counterparty: number; content: string }): Promise<CounterpartyNote> => {
    const response = await apiClient.post('/counterparty-notes/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Pick<CounterpartyNote, 'content'>>): Promise<CounterpartyNote> => {
    const response = await apiClient.patch(`/counterparty-notes/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/counterparty-notes/${id}/`)
  },
}

// Deals API
export const dealsApi = {
  getAll: async (params?: {
    page?: number
    page_size?: number
    search?: string
    status?: string
    trader?: number
    counterparty?: number
  }): Promise<PaginatedResponse<Deal>> => {
    const response = await apiClient.get('/deals/', { params })
    return response.data
  },

  getById: async (id: number): Promise<Deal> => {
    const response = await apiClient.get(`/deals/${id}/`)
    return response.data
  },

  create: async (data: Omit<Deal, 'id' | 'deal_number' | 'created_at' | 'updated_at' | 'lines'> & { lines: Array<{ delivery_period_start: string; delivery_period_end: string; quantity: string }> }): Promise<Deal> => {
    const response = await apiClient.post('/deals/', data)
    return response.data
  },

  update: async (
    id: number,
    data: Partial<Deal> & { lines?: Array<{ delivery_period_start: string; delivery_period_end: string; quantity: string }> },
    options?: { propagate?: boolean }
  ): Promise<Deal> => {
    const params: Record<string, any> = {}
    if (options && options.propagate === false) params.propagate = 'false'
    const response = await apiClient.patch(`/deals/${id}/`, data, { params })
    return response.data
  },

  generateContracts: async (id: number): Promise<{ generated: number }> => {
    const response = await apiClient.post(`/deals/${id}/generate_contracts/`)
    return response.data
  },
}

// Reference Data APIs
export const referenceDataApi = {
  // Currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get('/currencies/')
    return response.data.results || response.data
  },
  createCurrency: async (data: Omit<Currency, 'id'>): Promise<Currency> => {
    const response = await apiClient.post('/currencies/', data)
    return response.data
  },
  updateCurrency: async (id: number, data: Partial<Currency>): Promise<Currency> => {
    const response = await apiClient.put(`/currencies/${id}/`, data)
    return response.data
  },
  deleteCurrency: async (id: number): Promise<void> => {
    await apiClient.delete(`/currencies/${id}/`)
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
  createCommodityGroup: async (data: { commodity_group_name: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/commodity-groups/', data)
    return response.data
  },
  updateCommodityGroup: async (id: number, data: Partial<{ commodity_group_name: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/commodity-groups/${id}/`, data)
    return response.data
  },
  deleteCommodityGroup: async (id: number): Promise<void> => {
    await apiClient.delete(`/commodity-groups/${id}/`)
  },

  // Commodity Types
  getCommodityTypes: async () => {
    const response = await apiClient.get('/commodity-types/')
    return response.data.results || response.data
  },
  createCommodityType: async (data: { commodity_type_name: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/commodity-types/', data)
    return response.data
  },
  updateCommodityType: async (id: number, data: Partial<{ commodity_type_name: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/commodity-types/${id}/`, data)
    return response.data
  },
  deleteCommodityType: async (id: number): Promise<void> => {
    await apiClient.delete(`/commodity-types/${id}/`)
  },

  // Commodity Subtypes
  getCommoditySubtypes: async () => {
    const response = await apiClient.get('/commodity-subtypes/')
    return response.data.results || response.data
  },
  createCommoditySubtype: async (data: { commodity_subtype_name: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/commodity-subtypes/', data)
    return response.data
  },
  updateCommoditySubtype: async (id: number, data: Partial<{ commodity_subtype_name: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/commodity-subtypes/${id}/`, data)
    return response.data
  },
  deleteCommoditySubtype: async (id: number): Promise<void> => {
    await apiClient.delete(`/commodity-subtypes/${id}/`)
  },

  // Cost Centers
  getCostCenters: async () => {
    const response = await apiClient.get('/cost-centers/')
    return response.data.results || response.data
  },
  createCostCenter: async (data: { cost_center_name: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/cost-centers/', data)
    return response.data
  },
  updateCostCenter: async (id: number, data: Partial<{ cost_center_name: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/cost-centers/${id}/`, data)
    return response.data
  },
  deleteCostCenter: async (id: number): Promise<void> => {
    await apiClient.delete(`/cost-centers/${id}/`)
  },

  // Delivery Formats
  getDeliveryFormats: async () => {
    const response = await apiClient.get('/delivery-formats/')
    return response.data.results || response.data
  },
  createDeliveryFormat: async (data: { delivery_format_name: string; delivery_format_cost: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/delivery-formats/', data)
    return response.data
  },
  updateDeliveryFormat: async (id: number, data: Partial<{ delivery_format_name: string; delivery_format_cost: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/delivery-formats/${id}/`, data)
    return response.data
  },
  deleteDeliveryFormat: async (id: number): Promise<void> => {
    await apiClient.delete(`/delivery-formats/${id}/`)
  },

  // Additives
  getAdditives: async () => {
    const response = await apiClient.get('/additives/')
    return response.data.results || response.data
  },
  createAdditive: async (data: { additive_name: string; additive_cost: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/additives/', data)
    return response.data
  },
  updateAdditive: async (id: number, data: Partial<{ additive_name: string; additive_cost: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/additives/${id}/`, data)
    return response.data
  },
  deleteAdditive: async (id: number): Promise<void> => {
    await apiClient.delete(`/additives/${id}/`)
  },

  // Sociedades
  getSociedades: async () => {
    const response = await apiClient.get('/sociedades/')
    return response.data.results || response.data
  },
  createSociedad: async (data: { sociedad_name: string; tax_id?: string; address?: string }): Promise<any> => {
    const response = await apiClient.post('/sociedades/', data)
    return response.data
  },
  updateSociedad: async (id: number, data: Partial<{ sociedad_name: string; tax_id?: string; address?: string }>): Promise<any> => {
    const response = await apiClient.put(`/sociedades/${id}/`, data)
    return response.data
  },
  deleteSociedad: async (id: number): Promise<void> => {
    await apiClient.delete(`/sociedades/${id}/`)
  },

  // Trade Operation Types
  getTradeOperationTypes: async () => {
    const response = await apiClient.get('/trade-operation-types/')
    return response.data.results || response.data
  },
  createTradeOperationType: async (data: { trade_operation_type_name: string; operation_code?: string; description?: string; price_type?: 'FLAT' | 'UNPRICED' | 'FUTURES'; side?: 'BUY' | 'SELL' }): Promise<any> => {
    const response = await apiClient.post('/trade-operation-types/', data)
    return response.data
  },
  updateTradeOperationType: async (id: number, data: Partial<{ trade_operation_type_name: string; operation_code?: string; description?: string; price_type?: 'FLAT' | 'UNPRICED' | 'FUTURES'; side?: 'BUY' | 'SELL' }>): Promise<any> => {
    const response = await apiClient.patch(`/trade-operation-types/${id}/`, data)
    return response.data
  },
  deleteTradeOperationType: async (id: number): Promise<void> => {
    await apiClient.delete(`/trade-operation-types/${id}/`)
  },

  // ICOTERMS
  getIcoterms: async () => {
    const response = await apiClient.get('/icoterms/')
    return response.data.results || response.data
  },
  createIcoterm: async (data: { icoterm_code: string; icoterm_name: string; description?: string }): Promise<any> => {
    const response = await apiClient.post('/icoterms/', data)
    return response.data
  },
  updateIcoterm: async (id: number, data: Partial<{ icoterm_code: string; icoterm_name: string; description?: string }>): Promise<any> => {
    const response = await apiClient.put(`/icoterms/${id}/`, data)
    return response.data
  },
  deleteIcoterm: async (id: number): Promise<void> => {
    await apiClient.delete(`/icoterms/${id}/`)
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

