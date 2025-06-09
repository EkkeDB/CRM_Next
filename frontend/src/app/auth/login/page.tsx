"use client"

import React, { useState } from 'react'
import { useLogin } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { parseApiError } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Truck } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  
  const login = useLogin()
  const { toast } = useToast()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login.mutateAsync(formData)
      toast({
        title: 'Success',
        description: 'Login successful! Redirecting to dashboard...',
        variant: 'default',
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: parseApiError(error),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Truck className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to NextCRM
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Commodity Trading CRM System
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  disabled={login.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={login.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={login.isPending}
                disabled={login.isPending}
              >
                {login.isPending ? 'Signing in...' : 'Sign in'}
              </Button>

              {/* Demo credentials */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
                <p className="text-xs text-blue-700">Username: admin</p>
                <p className="text-xs text-blue-700">Password: admin123</p>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>&copy; 2025 NextCRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}