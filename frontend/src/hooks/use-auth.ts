import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, hasAuthTokens } from '@/lib/api-client'
import type { User, LoginCredentials, RegisterData, ChangePasswordData } from '@/types'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
}

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hasAuthTokens(), // Only make API call if we have auth tokens
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.profile(), data.user)
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: authKeys.profile() })
    },
  })
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    },
  })
}

// Register mutation
export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      // Update cached user data
      queryClient.setQueryData(authKeys.profile(), data)
    },
  })
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
  })
}

// Authentication status hook
export function useAuth() {
  const hasTokens = hasAuthTokens()
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useProfile()

  // If no tokens exist, we're definitely not authenticated
  if (!hasTokens) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isError: false,
      error: null,
    }
  }

  const isAuthenticated = !!user && !isError

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    error,
  }
}

// Check if user has specific permissions (extend as needed)
export function usePermissions() {
  const { user } = useAuth()

  const permissions = {
    canCreateContracts: user?.is_active || false,
    canEditContracts: user?.is_active || false,
    canDeleteContracts: user?.is_active || false,
    canViewReports: user?.is_active || false,
    canManageUsers: user?.is_active || false, // Extend based on your permission system
  }

  return permissions
}