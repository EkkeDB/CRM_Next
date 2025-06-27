'use client'

import { useState, useEffect } from 'react'
import { authApi, counterpartiesApi, tradersApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TestResult {
  endpoint: string
  status: 'pending' | 'success' | 'error'
  message: string
  responseTime?: number
}

export default function NetworkTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const updateResult = (endpoint: string, status: TestResult['status'], message: string, responseTime?: number) => {
    setResults(prev => prev.map(result => 
      result.endpoint === endpoint 
        ? { ...result, status, message, responseTime }
        : result
    ))
  }

  const runTests = async () => {
    setTesting(true)
    
    const testEndpoints: TestResult[] = [
      { endpoint: 'GET /api/auth/health/', status: 'pending', message: 'Testing...' },
      { endpoint: 'GET /api/auth/csrf/', status: 'pending', message: 'Testing...' },
      { endpoint: 'GET /api/auth/me/', status: 'pending', message: 'Testing...' },
      { endpoint: 'GET /api/crm/counterparties/', status: 'pending', message: 'Testing...' },
      { endpoint: 'GET /api/crm/traders/', status: 'pending', message: 'Testing...' },
    ]
    
    setResults(testEndpoints)

    // Test 1: Health check
    try {
      const startTime = Date.now()
      await authApi.healthCheck()
      const responseTime = Date.now() - startTime
      updateResult('GET /api/auth/health/', 'success', 'Health check passed', responseTime)
    } catch (error: any) {
      updateResult('GET /api/auth/health/', 'error', `Health check failed: ${error.message}`)
    }

    // Test 2: CSRF token
    try {
      const startTime = Date.now()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        updateResult('GET /api/auth/csrf/', 'success', `CSRF token received: ${data.csrfToken?.substring(0, 8)}...`, responseTime)
      } else {
        updateResult('GET /api/auth/csrf/', 'error', `CSRF failed: ${response.status} ${response.statusText}`)
      }
    } catch (error: any) {
      updateResult('GET /api/auth/csrf/', 'error', `CSRF failed: ${error.message}`)
    }

    // Test 3: Auth me (will likely fail if not logged in)
    try {
      const startTime = Date.now()
      await authApi.getProfile()
      const responseTime = Date.now() - startTime
      updateResult('GET /api/auth/me/', 'success', 'Profile fetched successfully', responseTime)
    } catch (error: any) {
      const message = error.response?.status === 401 
        ? 'Not authenticated (expected if not logged in)'
        : `Error: ${error.message}`
      updateResult('GET /api/auth/me/', error.response?.status === 401 ? 'success' : 'error', message)
    }

    // Test 4: Counterparties
    try {
      const startTime = Date.now()
      await counterpartiesApi.getAll({ page: 1, page_size: 1 })
      const responseTime = Date.now() - startTime
      updateResult('GET /api/crm/counterparties/', 'success', 'Counterparties fetched successfully', responseTime)
    } catch (error: any) {
      const message = error.response?.status === 401 
        ? 'Not authenticated (expected if not logged in)'
        : `Error: ${error.message}`
      updateResult('GET /api/crm/counterparties/', error.response?.status === 401 ? 'success' : 'error', message)
    }

    // Test 5: Traders
    try {
      const startTime = Date.now()
      await tradersApi.getAll({ page: 1, page_size: 1 })
      const responseTime = Date.now() - startTime
      updateResult('GET /api/crm/traders/', 'success', 'Traders fetched successfully', responseTime)
    } catch (error: any) {
      const message = error.response?.status === 401 
        ? 'Not authenticated (expected if not logged in)'
        : `Error: ${error.message}`
      updateResult('GET /api/crm/traders/', error.response?.status === 401 ? 'success' : 'error', message)
    }

    setTesting(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Network Connectivity Test</h1>
        <p className="text-gray-600">
          Testing API connectivity to resolve ERR_NAME_NOT_RESOLVED issues
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Current API Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_API_URL}</code>
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="mr-4"
        >
          {testing ? 'Testing...' : 'Run Tests Again'}
        </Button>
      </div>

      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{getStatusIcon(result.status)}</span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {result.endpoint}
                </code>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${getStatusColor(result.status)} font-medium mb-2`}>
                {result.message}
              </p>
              {result.responseTime && (
                <p className="text-sm text-gray-500">
                  Response time: {result.responseTime}ms
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Troubleshooting Guide:</h3>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>• <strong>ERR_NAME_NOT_RESOLVED:</strong> Check Docker networking and NEXT_PUBLIC_API_URL</li>
          <li>• <strong>CORS errors:</strong> Verify CORS_ALLOWED_ORIGINS in Django settings</li>
          <li>• <strong>401 Unauthorized:</strong> Expected for protected endpoints when not logged in</li>
          <li>• <strong>Connection refused:</strong> Backend service might not be running</li>
        </ul>
      </div>
    </div>
  )
}