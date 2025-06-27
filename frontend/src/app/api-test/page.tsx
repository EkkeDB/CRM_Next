'use client'

import { useState, useEffect } from 'react'
import { tradersApi, authApi } from '@/lib/api-client'
import { Trader } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export default function ApiTestPage() {
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [newTrader, setNewTrader] = useState({ trader_name: '', email: '', phone: '' })
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  // Test connectivity via Next.js API route
  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/ping/')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus('connected')
        addLog(`✓ Backend ping successful: ${data.message} | Server: ${data.server}`)
        toast({
          title: "Connection successful",
          description: "Backend is reachable via proxy",
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      setConnectionStatus('error')
      addLog(`✗ Connection failed: ${error}`)
      toast({
        title: "Connection failed",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Test direct backend connection
  const testDirectConnection = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/auth/ping/`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        addLog(`✓ Direct backend ping successful: ${data.message} | Origin: ${data.origin}`)
        toast({
          title: "Direct connection successful",
          description: "Backend is reachable directly",
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      addLog(`✗ Direct connection failed: ${error}`)
      toast({
        title: "Direct connection failed",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Test health check endpoint
  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await authApi.healthCheck()
      addLog(`✓ Health check successful: ${response.status}`)
      toast({
        title: "Health check passed",
        description: "API endpoints are working",
      })
    } catch (error) {
      addLog(`✗ Health check failed: ${error}`)
      toast({
        title: "Health check failed",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch all traders
  const fetchTraders = async () => {
    setLoading(true)
    try {
      const response = await tradersApi.getAll()
      const tradersList = response.results || response
      setTraders(Array.isArray(tradersList) ? tradersList : [])
      addLog(`✓ Fetched ${Array.isArray(tradersList) ? tradersList.length : 0} traders`)
      toast({
        title: "Traders loaded",
        description: `Found ${Array.isArray(tradersList) ? tradersList.length : 0} traders`,
      })
    } catch (error) {
      addLog(`✗ Failed to fetch traders: ${error}`)
      toast({
        title: "Failed to load traders",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new trader
  const createTrader = async () => {
    if (!newTrader.trader_name.trim()) {
      toast({
        title: "Validation error",
        description: "Trader name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const created = await tradersApi.create(newTrader)
      setTraders(prev => [...prev, created])
      setNewTrader({ trader_name: '', email: '', phone: '' })
      addLog(`✓ Created trader: ${created.trader_name}`)
      toast({
        title: "Trader created",
        description: `${created.trader_name} was created successfully`,
      })
    } catch (error) {
      addLog(`✗ Failed to create trader: ${error}`)
      toast({
        title: "Failed to create trader",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update trader
  const updateTrader = async () => {
    if (!editingTrader) return

    setLoading(true)
    try {
      const updated = await tradersApi.update(editingTrader.id, editingTrader)
      setTraders(prev => prev.map(t => t.id === updated.id ? updated : t))
      setEditingTrader(null)
      addLog(`✓ Updated trader: ${updated.trader_name}`)
      toast({
        title: "Trader updated",
        description: `${updated.trader_name} was updated successfully`,
      })
    } catch (error) {
      addLog(`✗ Failed to update trader: ${error}`)
      toast({
        title: "Failed to update trader",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete trader
  const deleteTrader = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    setLoading(true)
    try {
      await tradersApi.delete(id)
      setTraders(prev => prev.filter(t => t.id !== id))
      addLog(`✓ Deleted trader: ${name}`)
      toast({
        title: "Trader deleted",
        description: `${name} was deleted successfully`,
      })
    } catch (error) {
      addLog(`✗ Failed to delete trader: ${error}`)
      toast({
        title: "Failed to delete trader",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testConnection()
    fetchTraders()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Connection Test</h1>
        <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
          {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Unknown'}
        </Badge>
      </div>

      {/* Connection Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Tests</CardTitle>
          <CardDescription>Test basic connectivity to backend services</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button onClick={testConnection} disabled={loading}>
            Test Ping (Proxy)
          </Button>
          <Button onClick={testDirectConnection} disabled={loading} variant="outline">
            Test Direct Connection
          </Button>
          <Button onClick={testHealthCheck} disabled={loading}>
            Test Health Check
          </Button>
          <Button onClick={fetchTraders} disabled={loading}>
            Reload Traders
          </Button>
        </CardContent>
      </Card>

      {/* Create Trader */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Trader</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Trader Name *"
              value={newTrader.trader_name}
              onChange={(e) => setNewTrader(prev => ({ ...prev, trader_name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newTrader.email}
              onChange={(e) => setNewTrader(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={newTrader.phone}
              onChange={(e) => setNewTrader(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <Button onClick={createTrader} disabled={loading}>
            Create Trader
          </Button>
        </CardContent>
      </Card>

      {/* Traders List */}
      <Card>
        <CardHeader>
          <CardTitle>Traders ({traders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {traders.length === 0 ? (
            <p className="text-gray-500">No traders found</p>
          ) : (
            <div className="space-y-4">
              {traders.map((trader) => (
                <div key={trader.id} className="border rounded p-4 flex items-center justify-between">
                  {editingTrader?.id === trader.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editingTrader.trader_name}
                        onChange={(e) => setEditingTrader(prev => prev ? { ...prev, trader_name: e.target.value } : null)}
                      />
                      <Input
                        value={editingTrader.email || ''}
                        onChange={(e) => setEditingTrader(prev => prev ? { ...prev, email: e.target.value } : null)}
                      />
                      <div className="flex gap-2">
                        <Button onClick={updateTrader} disabled={loading}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingTrader(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold">{trader.trader_name}</h3>
                        <p className="text-sm text-gray-600">{trader.email}</p>
                        <p className="text-sm text-gray-600">{trader.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditingTrader({ ...trader })}>
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => deleteTrader(trader.id, trader.trader_name)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No activity yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`${log.includes('✓') ? 'text-green-600' : log.includes('✗') ? 'text-red-600' : 'text-gray-600'}`}>
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}