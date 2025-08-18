"use client"

import React, { useState, useEffect } from 'react'
import { useRegister, useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { parseApiError } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck, Mail, Phone, User, Building, Shield } from 'lucide-react'
import type { RegisterData } from '@/types'

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    position: '',
    timezone: 'UTC',
    gdpr_consent: false,
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  
  const register = useRegister()
  const { isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Required field validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }
    if (!formData.password_confirm) {
      errors.password_confirm = 'Please confirm your password'
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Passwords do not match'
    }
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!formData.gdpr_consent) {
      errors.gdpr_consent = 'You must agree to the terms and privacy policy'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below and try again',
        variant: 'destructive',
      })
      return
    }
    
    try {
      const result = await register.mutateAsync(formData)
      
      // Show success message
      setSuccessMessage('Signup received. Pending admin approval.')
      toast({
        title: 'Registration Successful',
        description: 'Signup received. Pending admin approval.',
        variant: 'default',
      })
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      toast({
        title: 'Registration Failed',
        description: parseApiError(error),
        variant: 'destructive',
      })
    }
  }

  // Show success state
  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-white/20">
                  <Shield className="h-12 w-12 text-green-500" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Registration Successful
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              Your account is pending approval
            </p>
          </div>

          {/* Success Card */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 shadow-2xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200/50 dark:border-green-800/50">
                  <p className="text-green-800 dark:text-green-300 font-semibold">
                    {successMessage}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                    You will be able to log in once an administrator approves your account.
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Redirecting to login page...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-white/20">
                <Truck className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Welcome to NextCRM
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
            Commodity Trading Management Platform
          </p>
        </div>

        {/* Registration Form */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Sign up for your NextCRM account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Username *
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  disabled={register.isPending}
                  className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                />
                {validationErrors.username && (
                  <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={register.isPending}
                  className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
                )}
              </div>

              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-slate-700 dark:text-slate-300 font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    disabled={register.isPending}
                    className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                  />
                  {validationErrors.first_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-slate-700 dark:text-slate-300 font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    disabled={register.isPending}
                    className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                  />
                  {validationErrors.last_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                  Password *
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={register.isPending}
                  className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="password_confirm" className="text-slate-700 dark:text-slate-300 font-medium">
                  Confirm Password *
                </Label>
                <Input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={register.isPending}
                  className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                />
                {validationErrors.password_confirm && (
                  <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.password_confirm}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)"
                  disabled={register.isPending}
                  className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                />
              </div>

              {/* Company and Position (Optional) */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-slate-700 dark:text-slate-300 font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Company
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter your company name (optional)"
                    disabled={register.isPending}
                    className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-slate-700 dark:text-slate-300 font-medium">
                    Position
                  </Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Enter your position (optional)"
                    disabled={register.isPending}
                    className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* GDPR Consent */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    id="gdpr_consent"
                    name="gdpr_consent"
                    type="checkbox"
                    checked={formData.gdpr_consent}
                    onChange={handleChange}
                    disabled={register.isPending}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                  />
                  <Label htmlFor="gdpr_consent" className="text-sm text-slate-700 dark:text-slate-300">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:text-primary/80 underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                      Privacy Policy
                    </Link>
                    {' '}*
                  </Label>
                </div>
                {validationErrors.gdpr_consent && (
                  <p className="text-sm text-red-600 dark:text-red-400">{validationErrors.gdpr_consent}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={register.isPending}
              >
                {register.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; 2025 NextCRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}