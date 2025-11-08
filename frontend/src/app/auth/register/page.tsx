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
import { Truck } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    timezone: 'UTC',
    gdpr_consent: false,
  })
  const register = useRegister()
  const { isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username || !formData.email || !formData.password || !formData.password_confirm) {
      toast({ title: 'Missing fields', description: 'Please complete all required fields', variant: 'destructive' })
      return
    }
    try {
      await register.mutateAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: '',
        company: '',
        position: '',
        timezone: formData.timezone,
        gdpr_consent: formData.gdpr_consent,
      } as any)
      toast({ title: 'Account created', description: 'Registration successful. You can now log in.' })
      router.push('/auth/login')
    } catch (error: any) {
      toast({ title: 'Registration failed', description: parseApiError(error), variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

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
            Create your account
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
            Join NextCRM to manage your trading workflow
          </p>
        </div>

        {/* Register Form */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">Sign Up</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Fill the form to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium">Username</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleChange} required placeholder="Choose a username" className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-slate-700 dark:text-slate-300 font-medium">First name</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" className="h-11 bg-white/50 dark:bg-slate-700/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-slate-700 dark:text-slate-300 font-medium">Last name</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" className="h-11 bg-white/50 dark:bg-slate-700/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirm" className="text-slate-700 dark:text-slate-300 font-medium">Confirm password</Label>
                  <Input id="password_confirm" name="password_confirm" type="password" value={formData.password_confirm} onChange={handleChange} required placeholder="••••••••" className="h-12 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 focus:border-primary focus:ring-primary/20" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input id="gdpr_consent" name="gdpr_consent" type="checkbox" checked={formData.gdpr_consent} onChange={handleChange} />
                <Label htmlFor="gdpr_consent" className="text-slate-700 dark:text-slate-300">I consent to data processing (GDPR)</Label>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                {register.isPending ? 'Creating account…' : 'Create account'}
              </Button>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                By creating an account you agree to our Terms and Privacy Policy.
              </div>

              <div className="text-sm text-center text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">Log in</Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; 2025 NextCRM. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
