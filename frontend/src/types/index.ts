// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// User and Authentication Types
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser?: boolean
  date_joined: string
  last_login: string | null
  profile: UserProfile
}

export interface UserProfile {
  phone: string
  company: string
  position: string
  timezone: string
  is_mfa_enabled: boolean
  gdpr_consent: boolean
  gdpr_consent_date: string | null
  created_at: string
  updated_at: string
  last_activity: string | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  phone?: string
  company?: string
  position?: string
  timezone?: string
  gdpr_consent: boolean
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

// Core Business Types
export interface Currency {
  id: number
  currency_code: string
  currency_name: string
  currency_symbol: string
}

export interface CostCenter {
  id: number
  cost_center_name: string
  description: string
}

export interface Trader {
  id: number
  trader_name: string
  email: string
  phone: string
}

export interface CommodityGroup {
  id: number
  commodity_group_name: string
  description: string
}

export interface CommodityType {
  id: number
  commodity_type_name: string
  description: string
}

export interface CommoditySubtype {
  id: number
  commodity_subtype_name: string
  description: string
}

export interface Commodity {
  id: number
  commodity_name_short: string
  commodity_name_full: string
  commodity_group: number
  commodity_type: number
  commodity_subtype: number
  unit_of_measure: string
  is_gmo: boolean
  is_sustainable: boolean
  commodity_subtype_name?: string
  commodity_group_name?: string
  commodity_type_name?: string
}

export interface CounterpartyFacility {
  id: number
  counterparty: number
  counterparty_facility_name: string
  facility_type: string
  address: string
  city: string
  country: string
  province?: string
  region?: string
  segment?: FacilitySegment | ''
  latitude?: number | null
  longitude?: number | null
  created_at: string
  updated_at: string
  is_active: boolean
}

export type FacilitySegment =
  | 'BAKERY'
  | 'PASTRY'
  | 'CANNED_FOOD'
  | 'BOTTLERS'
  | 'MERCHANTS'
  | 'TECHNICAL'
  | 'SNACKS'
  | 'FEED'
  | 'BIODIESEL'
  | 'SAUCES_DRESSINGS'
  | 'FROZEN_FOODS'
  | 'COSMETICS'
  | 'OLEOCHEMICALS'

export interface FacilityConsumption {
  id: number
  facility: number
  commodity: number
  commodity_name?: string
  monthly_volume: string
  yearly_volume: string | null
}

export interface CounterpartyNote {
  id: number
  counterparty: number
  content: string
  created_at: string
  updated_at: string
}

export interface Counterparty {
  id: number
  counterparty_name: string
  counterparty_code: string
  tax_id: string
  city: string
  country: string
  phone: string
  email: string
  contact_person: string
  is_supplier: boolean
  is_customer: boolean
  facilities?: CounterpartyFacility[]
}

export interface Broker {
  id: number
  broker_name: string
  broker_code: string
  contact_person: string
  email: string
  phone: string
}

export interface ICOTERM {
  id: number
  icoterm_name: string
  icoterm_code: string
  description: string
}

export interface DeliveryFormat {
  id: number
  delivery_format_name: string
  delivery_format_cost: string
  description: string
}

export interface Additive {
  id: number
  additive_name: string
  additive_code?: string
  additive_cost: string
  description: string
  is_active: boolean
}

export interface Sociedad {
  id: number
  sociedad_name: string
  tax_id: string
  address: string
}

export interface TradeOperationType {
  id: number
  trade_operation_type_name: string
  operation_code: string
  description: string
  price_type?: 'FLAT' | 'UNPRICED' | 'FUTURES'
  side?: 'BUY' | 'SELL'
}

export interface DealLine {
  id: number
  deal: number
  delivery_period_start: string
  delivery_period_end: string
  quantity: string
  sync_status: 'pending' | 'generated' | 'synced' | 'locked'
  contract_id?: number | null
  contract_number?: string | null
}

export interface Deal {
  id: number
  deal_number: string
  trader: number
  trade_operation_type: number
  sociedad: number
  counterparty: number
  commodity: number
  delivery_format: number
  additive: number
  broker: number
  icoterm: number
  cost_center: number
  broker_fee: string
  broker_fee_currency: number
  freight_cost: string
  forex: string
  price: string
  trade_currency: number
  payment_days: number
  unit_of_measure: string
  entrega: string
  date: string
  status: 'draft' | 'approved' | 'executed' | 'completed' | 'cancelled'
  notes?: string
  created_at?: string
  updated_at?: string
  lines?: DealLine[]
}

export interface Contact {
  id: number
  name: string
  email: string
  phone: string
  company: string
  position: string
  city: string
  country: string
  status: 'active' | 'inactive' | 'lead'
  source: string
  notes: string
  created_at: string
  last_contact: string
  counterparty_id?: number
}

export interface Contract {
  id: number
  contract_number: string
  deal?: number | null
  deal_number?: string | null
  trader: number
  trade_operation_type: number
  sociedad: number
  counterparty: number
  commodity: number
  delivery_format: number
  additive: number
  broker: number
  icoterm: number
  cost_center: number
  broker_fee: string
  broker_fee_currency: number
  freight_cost: string
  forex: string
  price: string
  trade_currency: number
  payment_days: number
  quantity: string
  unit_of_measure: string
  entrega: string
  // Delivery period (legacy single date kept for compatibility) and true ranges
  delivery_period_start?: string
  delivery_period_end?: string
  delivery_period: string
  date: string
  status: ContractStatus
  notes: string
  created_at: string
  updated_at: string
  is_active: boolean
  // Read-only fields
  trader_name?: string
  counterparty_name?: string
  commodity_name?: string
  commodity_group_name?: string
  commodity_type_name?: string
  commodity_subtype_name?: string
  broker_name?: string
  trade_currency_code?: string
  broker_fee_currency_code?: string
  total_value?: string
}

export type ContractStatus = 'draft' | 'approved' | 'executed' | 'completed' | 'cancelled'

export interface ContractCreateData {
  trader: number
  trade_operation_type: number
  sociedad: number
  counterparty: number
  commodity: number
  delivery_format: number
  additive: number
  broker: number
  icoterm: number
  cost_center: number
  broker_fee: string
  broker_fee_currency: number
  freight_cost: string
  forex: string
  price: string
  trade_currency: number
  payment_days: number
  quantity: string
  unit_of_measure: string
  entrega: string
  // Prefer true ranges; legacy single date is optional for backward compatibility
  delivery_period_start?: string
  delivery_period_end?: string
  delivery_period?: string
  date: string
  notes?: string
}

// Dashboard Types
export interface DashboardStats {
  total_contracts: number
  total_value: string
  active_contracts: number
  pending_contracts: number
  available_years?: number[]
  top_counterparties: Array<{
    counterparty__counterparty_name: string
    total_value: string
    contract_count: number
  }>
  top_commodities: Array<{
    commodity__commodity_name_short: string
    total_quantity: string
    contract_count: number
  }>
  monthly_contract_values: Array<{
    month: string
    total_quantity: string | number
    avg_price: string | number
    total_value?: string | number
    contract_count?: number
  }>
  commodities?: string[]
  monthly_volume_breakdown?: Array<{
    month: string
    breakdown: Array<{ commodity: string; volume: number | string }>
  }>
  monthly_avg_price_breakdown?: Array<{
    month: string
    breakdown: Array<{ commodity: string; avg_price: number | string }>
  }>
  commodity_share?: Array<{
    commodity: string
    share: number
    volume: string | number
  }>
}

// Security Types
export interface SecurityLog {
  id: number
  username: string | null
  event_type: string
  ip_address: string
  user_agent: string
  metadata: Record<string, any>
  timestamp: string
}

export interface AuditLog {
  id: number
  username: string | null
  action: string
  model_name: string
  object_id: string
  object_repr: string
  changes: Record<string, any>
  ip_address: string
  timestamp: string
}

// Authorization Types
export interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserRoleAssignment {
  id: number
  user: number
  username?: string
  role: number
  role_name?: string
  constraints: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string | number }>
  validation?: any
}

// Table Types
export interface Column<T> {
  id: keyof T
  header: string
  accessorKey: keyof T
  cell?: (value: any) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
}

export interface TableData<T> {
  data: T[]
  columns: Column<T>[]
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

// Filter Types
export interface FilterOption {
  label: string
  value: string | number
  count?: number
}

export interface FilterGroup {
  name: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'range'
  options?: FilterOption[]
}

// Chart Types
export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType
  disabled?: boolean
  external?: boolean
  badge?: string | number
  children?: NavItem[]
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

// Error Types
export interface ApiError {
  message: string
  status: number
  code?: string
  details?: Record<string, any>
}
