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
  commodity_group_name?: string
  commodity_type_name?: string
  commodity_subtype_name?: string
}

export interface CounterpartyFacility {
  id: number
  counterparty: number
  counterparty_facility_name: string
  facility_type: string
  address: string
  city: string
  country: string
  created_at: string
  updated_at: string
  is_active: boolean
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
  additive_cost: string
  description: string
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
}

export interface Contract {
  id: number
  contract_number: string
  trader: number
  trade_operation_type: number
  sociedad: number
  counterparty: number
  commodity: number
  commodity_group: number
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
  commodity_group: number
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
  delivery_period: string
  date: string
  notes?: string
}

// Dashboard Types
export interface DashboardStats {
  total_contracts: number
  total_value: string
  active_contracts: number
  pending_contracts: number
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
    total_value: string
    contract_count: number
  }>
  contract_status_distribution: Array<{
    status: string
    count: number
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

// Export all types
export type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserProfile,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  Currency,
  CostCenter,
  Trader,
  CommodityGroup,
  CommodityType,
  CommoditySubtype,
  Commodity,
  CounterpartyFacility,
  Counterparty,
  Broker,
  ICOTERM,
  DeliveryFormat,
  Additive,
  Sociedad,
  TradeOperationType,
  Contract,
  ContractStatus,
  ContractCreateData,
  DashboardStats,
  SecurityLog,
  AuditLog,
  FormField,
  Column,
  TableData,
  FilterOption,
  FilterGroup,
  ChartData,
  TimeSeriesData,
  Theme,
  NavItem,
  Notification,
  ApiError,
}