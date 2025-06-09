import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '@/lib/api-client'
import type { Contract, ContractCreateData, DashboardStats } from '@/types'

// Query keys
export const contractKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractKeys.all, 'list'] as const,
  list: (filters: any) => [...contractKeys.lists(), filters] as const,
  details: () => [...contractKeys.all, 'detail'] as const,
  detail: (id: number) => [...contractKeys.details(), id] as const,
  dashboard: () => [...contractKeys.all, 'dashboard'] as const,
}

// Get all contracts with pagination and filters
export function useContracts(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  trader?: number
  counterparty?: number
}) {
  return useQuery({
    queryKey: contractKeys.list(params),
    queryFn: () => contractsApi.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get contract by ID
export function useContract(id: number) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => contractsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: contractKeys.dashboard(),
    queryFn: contractsApi.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create contract mutation
export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.create,
    onSuccess: () => {
      // Invalidate contracts list
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

// Update contract mutation
export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContractCreateData> }) =>
      contractsApi.update(id, data),
    onSuccess: (data) => {
      // Update specific contract in cache
      queryClient.setQueryData(contractKeys.detail(data.id), data)
      // Invalidate contracts list
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

// Delete contract mutation
export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.delete,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: contractKeys.detail(id) })
      // Invalidate contracts list
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

// Contract status change mutations
export function useApproveContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.approve,
    onSuccess: (_, id) => {
      // Invalidate specific contract and lists
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

export function useExecuteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.execute,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

export function useCompleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.complete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

export function useCancelContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: contractsApi.cancel,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: contractKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contractKeys.dashboard() })
    },
  })
}

// Utility hook to get contract status actions
export function useContractActions(contract: Contract) {
  const approveContract = useApproveContract()
  const executeContract = useExecuteContract()
  const completeContract = useCompleteContract()
  const cancelContract = useCancelContract()

  const actions = {
    canApprove: contract.status === 'draft',
    canExecute: contract.status === 'approved',
    canComplete: contract.status === 'executed',
    canCancel: contract.status === 'draft' || contract.status === 'approved',
    
    approve: () => approveContract.mutate(contract.id),
    execute: () => executeContract.mutate(contract.id),
    complete: () => completeContract.mutate(contract.id),
    cancel: () => cancelContract.mutate(contract.id),
    
    isLoading: 
      approveContract.isPending ||
      executeContract.isPending ||
      completeContract.isPending ||
      cancelContract.isPending,
  }

  return actions
}