import { useQuery } from '@tanstack/react-query'
import { referenceDataApi, counterpartiesApi, commoditiesApi } from '@/lib/api-client'

// Query keys for reference data
export const referenceDataKeys = {
  all: ['referenceData'] as const,
  currencies: () => [...referenceDataKeys.all, 'currencies'] as const,
  traders: () => [...referenceDataKeys.all, 'traders'] as const,
  brokers: () => [...referenceDataKeys.all, 'brokers'] as const,
  commodityGroups: () => [...referenceDataKeys.all, 'commodityGroups'] as const,
  commodityTypes: () => [...referenceDataKeys.all, 'commodityTypes'] as const,
  commoditySubtypes: () => [...referenceDataKeys.all, 'commoditySubtypes'] as const,
  costCenters: () => [...referenceDataKeys.all, 'costCenters'] as const,
  deliveryFormats: () => [...referenceDataKeys.all, 'deliveryFormats'] as const,
  additives: () => [...referenceDataKeys.all, 'additives'] as const,
  sociedades: () => [...referenceDataKeys.all, 'sociedades'] as const,
  tradeOperationTypes: () => [...referenceDataKeys.all, 'tradeOperationTypes'] as const,
  icoterms: () => [...referenceDataKeys.all, 'icoterms'] as const,
  counterparties: () => [...referenceDataKeys.all, 'counterparties'] as const,
  commodities: () => [...referenceDataKeys.all, 'commodities'] as const,
}

// Currencies
export function useCurrencies() {
  return useQuery({
    queryKey: referenceDataKeys.currencies(),
    queryFn: referenceDataApi.getCurrencies,
    staleTime: 30 * 60 * 1000, // 30 minutes - currencies don't change often
  })
}

// Traders
export function useTraders() {
  return useQuery({
    queryKey: referenceDataKeys.traders(),
    queryFn: referenceDataApi.getTraders,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Brokers
export function useBrokers() {
  return useQuery({
    queryKey: referenceDataKeys.brokers(),
    queryFn: referenceDataApi.getBrokers,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Commodity Groups
export function useCommodityGroups() {
  return useQuery({
    queryKey: referenceDataKeys.commodityGroups(),
    queryFn: referenceDataApi.getCommodityGroups,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Commodity Types
export function useCommodityTypes() {
  return useQuery({
    queryKey: referenceDataKeys.commodityTypes(),
    queryFn: referenceDataApi.getCommodityTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Commodity Subtypes
export function useCommoditySubtypes() {
  return useQuery({
    queryKey: referenceDataKeys.commoditySubtypes(),
    queryFn: referenceDataApi.getCommoditySubtypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Cost Centers
export function useCostCenters() {
  return useQuery({
    queryKey: referenceDataKeys.costCenters(),
    queryFn: referenceDataApi.getCostCenters,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Delivery Formats
export function useDeliveryFormats() {
  return useQuery({
    queryKey: referenceDataKeys.deliveryFormats(),
    queryFn: referenceDataApi.getDeliveryFormats,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Additives
export function useAdditives() {
  return useQuery({
    queryKey: referenceDataKeys.additives(),
    queryFn: referenceDataApi.getAdditives,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Sociedades
export function useSociedades() {
  return useQuery({
    queryKey: referenceDataKeys.sociedades(),
    queryFn: referenceDataApi.getSociedades,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Trade Operation Types
export function useTradeOperationTypes() {
  return useQuery({
    queryKey: referenceDataKeys.tradeOperationTypes(),
    queryFn: referenceDataApi.getTradeOperationTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// ICOTERMS
export function useIcoterms() {
  return useQuery({
    queryKey: referenceDataKeys.icoterms(),
    queryFn: referenceDataApi.getIcoterms,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Counterparties (for dropdowns)
export function useCounterpartiesSelect(params?: { is_supplier?: boolean; is_customer?: boolean }) {
  return useQuery({
    queryKey: [...referenceDataKeys.counterparties(), params],
    queryFn: () => counterpartiesApi.getAll({ page_size: 1000, ...params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data.results.map(cp => ({
      value: cp.id,
      label: cp.counterparty_name,
      code: cp.counterparty_code,
    })),
  })
}

// Commodities (for dropdowns)
export function useCommoditiesSelect(params?: { commodity_group?: number }) {
  return useQuery({
    queryKey: [...referenceDataKeys.commodities(), params],
    queryFn: () => commoditiesApi.getAll({ page_size: 1000, ...params }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => data.results.map(commodity => ({
      value: commodity.id,
      label: commodity.commodity_name_short,
      fullName: commodity.commodity_name_full,
      group: commodity.commodity_group_name,
    })),
  })
}

// Combined hook for all reference data needed for contract forms
export function useContractFormData() {
  const currencies = useCurrencies()
  const traders = useTraders()
  const brokers = useBrokers()
  const commodityGroups = useCommodityGroups()
  const commodityTypes = useCommodityTypes()
  const commoditySubtypes = useCommoditySubtypes()
  const costCenters = useCostCenters()
  const deliveryFormats = useDeliveryFormats()
  const additives = useAdditives()
  const sociedades = useSociedades()
  const tradeOperationTypes = useTradeOperationTypes()
  const icoterms = useIcoterms()
  const counterparties = useCounterpartiesSelect()
  const commodities = useCommoditiesSelect()

  return {
    currencies,
    traders,
    brokers,
    commodityGroups,
    commodityTypes,
    commoditySubtypes,
    costCenters,
    deliveryFormats,
    additives,
    sociedades,
    tradeOperationTypes,
    icoterms,
    counterparties,
    commodities,
    
    isLoading: 
      currencies.isLoading ||
      traders.isLoading ||
      brokers.isLoading ||
      commodityGroups.isLoading ||
      commodityTypes.isLoading ||
      commoditySubtypes.isLoading ||
      costCenters.isLoading ||
      deliveryFormats.isLoading ||
      additives.isLoading ||
      sociedades.isLoading ||
      tradeOperationTypes.isLoading ||
      icoterms.isLoading ||
      counterparties.isLoading ||
      commodities.isLoading,
      
    isError:
      currencies.isError ||
      traders.isError ||
      brokers.isError ||
      commodityGroups.isError ||
      commodityTypes.isError ||
      commoditySubtypes.isError ||
      costCenters.isError ||
      deliveryFormats.isError ||
      additives.isError ||
      sociedades.isError ||
      tradeOperationTypes.isError ||
      icoterms.isError ||
      counterparties.isError ||
      commodities.isError,
  }
}

// Utility hook to get formatted options for select components
export function useSelectOptions() {
  const currencies = useCurrencies()
  const traders = useTraders()
  const brokers = useBrokers()
  
  return {
    currencyOptions: currencies.data?.map(currency => ({
      value: currency.id,
      label: `${currency.currency_code} - ${currency.currency_name}`,
    })) || [],
    
    traderOptions: traders.data?.map(trader => ({
      value: trader.id,
      label: trader.trader_name,
    })) || [],
    
    brokerOptions: brokers.data?.map(broker => ({
      value: broker.id,
      label: broker.broker_name,
    })) || [],
  }
}