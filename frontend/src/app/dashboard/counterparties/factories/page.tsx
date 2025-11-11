'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import UiGuard from '@/components/security/UiGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Factory, Edit, Trash2, Search, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { counterpartiesApi, commoditiesApi, facilitiesApi, facilityConsumptionsApi, utilsApi } from '@/lib/api-client'
import type { Counterparty, Commodity, CounterpartyFacility, FacilityConsumption, FacilitySegment } from '@/types'

const SEGMENT_OPTIONS: { value: FacilitySegment; label: string }[] = [
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'PASTRY', label: 'Pastry' },
  { value: 'CANNED_FOOD', label: 'Canned food' },
  { value: 'BOTTLERS', label: 'Bottlers' },
  { value: 'MERCHANTS', label: 'Merchants' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'SNACKS', label: 'Snacks' },
  { value: 'FEED', label: 'Feed' },
  { value: 'BIODIESEL', label: 'Biodiesel' },
  { value: 'SAUCES_DRESSINGS', label: 'Sauces and dressings' },
  { value: 'FROZEN_FOODS', label: 'Frozen foods' },
  { value: 'COSMETICS', label: 'Cosmetics' },
  { value: 'OLEOCHEMICALS', label: 'Oleochemicals' },
]

function MapPreview({ lat, lng }: { lat?: number | string | null; lng?: number | string | null }) {
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng
  if (latNum == null || lngNum == null || Number.isNaN(latNum) || Number.isNaN(lngNum)) return null
  // Build a small bbox around the point for OSM embed
  const d = 0.01
  const bbox = `${(Number(lngNum) - d).toFixed(6)},${(Number(latNum) - d).toFixed(6)},${(Number(lngNum) + d).toFixed(6)},${(Number(latNum) + d).toFixed(6)}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&marker=${Number(latNum).toFixed(6)}%2C${Number(lngNum).toFixed(6)}&layers=mapnik`
  return (
    <div className="mt-2 rounded-md overflow-hidden border">
      <iframe src={src} width="100%" height="250" frameBorder={0} title="Map preview" />
    </div>
  )
}

export default function FactoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [facilities, setFacilities] = useState<CounterpartyFacility[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])

  // Counterparty async lookup (server-side search + load more)
  const [cpQuery, setCpQuery] = useState('')
  const [cpOptions, setCpOptions] = useState<Counterparty[]>([])
  const [cpPage, setCpPage] = useState(1)
  const [cpHasMore, setCpHasMore] = useState(false)
  const [cpLoading, setCpLoading] = useState(false)
  const firstCpItemRef = useRef<HTMLDivElement | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CounterpartyFacility | null>(null)
  const [consumptions, setConsumptions] = useState<FacilityConsumption[]>([])

  const [form, setForm] = useState<Partial<CounterpartyFacility>>({
    counterparty: undefined as any,
    counterparty_facility_name: '',
    facility_type: '',
    address: '',
    city: '',
    country: '',
    province: '',
    region: '',
    segment: '' as any,
    latitude: undefined,
    longitude: undefined,
    is_active: true as any,
  })

  // Temporary geocode debug panel state
  const [geoOpen, setGeoOpen] = useState(false)
  const [geoAddr, setGeoAddr] = useState('')
  const [geoCity, setGeoCity] = useState('')
  const [geoCountry, setGeoCountry] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoResult, setGeoResult] = useState<any | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const testGeocode = async () => {
    setGeoLoading(true)
    setGeoError(null)
    setGeoResult(null)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const q = [geoAddr, geoCity, geoCountry].filter(Boolean).join(', ')
      const resp = await fetch(`${base}/api/geocode/?q=${encodeURIComponent(q)}&raw=1`, { credentials: 'include' })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed')
      }
      console.debug('Geocode test result', data)
      setGeoResult(data)
      toast({ title: 'Geocode ok', description: `lat=${data.lat}, lng=${data.lng}, provider=${data.provider}` })
    } catch (e: any) {
      const msg = e?.message || 'Failed to geocode'
      setGeoError(msg)
      console.error('Geocode test error', e)
      toast({ title: 'Geocode error', description: msg, variant: 'destructive' })
    } finally {
      setGeoLoading(false)
    }
  }

  // Filters
  const [q, setQ] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [filterCountry, setFilterCountry] = useState('')

  const cpMap = useMemo(() => {
    const m = new Map<number, string>()
    counterparties.forEach(cp => m.set(cp.id, cp.counterparty_name))
    return m
  }, [counterparties])

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [facRes, cpRes, comRes] = await Promise.all([
        facilitiesApi.getAll({ page_size: 1000, search: q || undefined, region: filterRegion || undefined, province: filterProvince || undefined, country: filterCountry || undefined }),
        counterpartiesApi.getAll({ page_size: 1000 }),
        commoditiesApi.getAll({ page_size: 1000 }),
      ])
      setFacilities(facRes.results || facRes)
      setCounterparties(cpRes.results || cpRes)
      setCommodities(comRes.results || comRes)
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Failed to load factories data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Load counterparties for the select with optional server-side search and paging
  const loadCounterparties = async (page = 1, reset = false) => {
    try {
      setCpLoading(true)
      const params: any = { page }
      const term = (cpQuery || '').trim()
      if (term.length >= 3) params.search = term
      const resp: any = await counterpartiesApi.getAll(params)
      const list: Counterparty[] = resp.results || resp
      const nextUrl = resp?.next
      const count = typeof resp?.count === 'number' ? resp.count : undefined
      // Determine if more pages likely exist
      const hasMore = Boolean(nextUrl) || (typeof count === 'number' && (page * (list?.length || 0)) < count)
      setCpHasMore(hasMore)
      setCpPage(page)
      setCpOptions(prev => (reset ? list : [...prev, ...list]))
    } catch (e) {
      // Fallback to whatever we have
    } finally {
      setCpLoading(false)
    }
  }

  // Debounce search for counterparties select
  useEffect(() => {
    const handle = setTimeout(() => {
      const term = (cpQuery || '').trim()
      if (term.length === 0) {
        // No query: show first page
        loadCounterparties(1, true)
      } else if (term.length >= 3) {
        loadCounterparties(1, true)
      }
      // For 1-2 chars, do nothing to avoid noisy queries
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpQuery])

  // Refresh lookup options whenever dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setCpQuery('')
      loadCounterparties(1, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen])

  const openCreate = () => {
    setEditing(null)
    setConsumptions([])
    setForm({
      counterparty: undefined as any,
      counterparty_facility_name: '',
      facility_type: '',
      address: '',
      city: '',
      country: '',
      province: '',
      region: '',
      segment: '' as any,
      latitude: undefined,
      longitude: undefined,
      is_active: true as any,
    })
    setDialogOpen(true)
  }

  const openEdit = async (facility: CounterpartyFacility) => {
    try {
      setEditing(facility)
      const full = await facilitiesApi.getById(facility.id)
      const latVal: any = (full as any).latitude
      const lngVal: any = (full as any).longitude
      const parsedLat = latVal !== null && latVal !== undefined && String(latVal) !== '' ? parseFloat(String(latVal)) : undefined
      const parsedLng = lngVal !== null && lngVal !== undefined && String(lngVal) !== '' ? parseFloat(String(lngVal)) : undefined
      setForm({ ...(full as any), latitude: parsedLat as any, longitude: parsedLng as any })
      const lines = await facilityConsumptionsApi.getByFacility(facility.id)
      setConsumptions(lines)
      setDialogOpen(true)
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Failed to load facility details', variant: 'destructive' })
    }
  }

  const resetFormState = () => {
    setEditing(null)
    setConsumptions([])
    setForm({
      counterparty: undefined as any,
      counterparty_facility_name: '',
      facility_type: '',
      address: '',
      city: '',
      country: '',
      segment: '' as any,
      latitude: undefined,
      longitude: undefined,
      is_active: true as any,
    })
  }

  const doSave = async (closeAfter: boolean) => {
    try {
      if (!form.counterparty || !form.counterparty_facility_name) {
        toast({ title: 'Missing data', description: 'Please select counterparty and name', variant: 'destructive' })
        return
      }
      // Only send editable fields to the API
      const payload: any = {
        counterparty: form.counterparty as any,
        counterparty_facility_name: form.counterparty_facility_name!,
        facility_type: form.facility_type || '',
        address: form.address || '',
        city: form.city || '',
        country: form.country || '',
        segment: form.segment as any,
        province: form.province || undefined,
        region: form.region || undefined,
        // Send lat/lng as strings with exactly 6 decimals to avoid DecimalField precision errors
        latitude: (typeof form.latitude === 'number' && !Number.isNaN(form.latitude)) ? (form.latitude as number).toFixed(6) : undefined,
        longitude: (typeof form.longitude === 'number' && !Number.isNaN(form.longitude)) ? (form.longitude as number).toFixed(6) : undefined,
        is_active: (form as any).is_active !== false,
      }
      if (!payload.province) delete payload.province
      if (!payload.region) delete payload.region
      if (!payload.segment) delete payload.segment
      if (payload.latitude === undefined) delete payload.latitude
      if (payload.longitude === undefined) delete payload.longitude
      let saved: CounterpartyFacility
      if (editing) {
        saved = await facilitiesApi.update(editing.id, payload)
        setFacilities(facilities.map(f => (f.id === saved.id ? saved : f)))
      } else {
        saved = await facilitiesApi.create(payload as any)
        setFacilities([...facilities, saved])
        setEditing(saved)
      }
      setForm(saved)
      toast({ title: 'Saved', description: 'Facility saved successfully' })
      if (closeAfter) {
        setDialogOpen(false)
        resetFormState()
      }
    } catch (e: any) {
      const data = e?.response?.data
      console.error('Facility save error:', data || e)
      let desc = 'Failed to save facility'
      if (typeof data === 'string') {
        desc = data
      } else if (data && typeof data === 'object') {
        const parts: string[] = []
        if (data.message) parts.push(String(data.message))
        if (data.errors && typeof data.errors === 'object') {
          for (const key of Object.keys(data.errors)) {
            const val = (data.errors as any)[key]
            if (Array.isArray(val)) parts.push(`${key}: ${val.join(', ')}`)
            else if (typeof val === 'string') parts.push(`${key}: ${val}`)
          }
        }
        if (Array.isArray(data.hints)) parts.push(`Hints: ${data.hints.join(' | ')}`)
        desc = parts.join(' | ') || 'Validation failed'
      }
      toast({ title: 'Error', description: desc, variant: 'destructive' })
    }
  }

  const saveFacility = async (e: React.FormEvent) => {
    e.preventDefault()
    await doSave(true)
  }

  const deleteFacility = async (id: number) => {
    if (!confirm('Delete this facility?')) return
    try {
      await facilitiesApi.delete(id)
      setFacilities(facilities.filter(f => f.id !== id))
      toast({ title: 'Deleted', description: 'Facility deleted' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Failed to delete facility', variant: 'destructive' })
    }
  }

  const addConsumption = async () => {
    if (!editing) return
    const newRow = { facility: editing.id, commodity: commodities[0]?.id, monthly_volume: '1', yearly_volume: null } as any
    try {
      const created = await facilityConsumptionsApi.create(newRow)
      setConsumptions([...consumptions, created])
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add consumption line', variant: 'destructive' })
    }
  }

  const updateConsumption = async (row: FacilityConsumption, changes: Partial<FacilityConsumption>) => {
    try {
      const updated = await facilityConsumptionsApi.update(row.id, changes as any)
      setConsumptions(consumptions.map(c => (c.id === row.id ? updated : c)))
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update consumption line', variant: 'destructive' })
    }
  }

  const deleteConsumption = async (row: FacilityConsumption) => {
    if (!confirm('Delete this consumption line?')) return
    try {
      await facilityConsumptionsApi.delete(row.id)
      setConsumptions(consumptions.filter(c => c.id !== row.id))
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete consumption line', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <UiGuard token="ui:factories">
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Factory className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Factories</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> New Factory
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Factory' : 'New Factory'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveFacility} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Counterparty</label>
                  <Select value={String(form.counterparty || '')} onValueChange={(v) => setForm({ ...form, counterparty: parseInt(v) as any })}>
                    <SelectTrigger><SelectValue placeholder="Select counterparty" /></SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-gray-400" />
                          <Input
                            autoFocus
                            placeholder="Search counterparties... (min 3 letters)"
                            value={cpQuery}
                            onChange={(e) => setCpQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' && firstCpItemRef.current) {
                                e.preventDefault()
                                firstCpItemRef.current.focus()
                              }
                            }}
                          />
                        </div>
                      </div>
                      {(cpOptions.length ? cpOptions : counterparties).map((cp, idx) => (
                        <SelectItem
                          key={cp.id}
                          value={String(cp.id)}
                          ref={idx === 0 ? (firstCpItemRef as any) : undefined}
                        >
                          {cp.counterparty_name}
                        </SelectItem>
                      ))}
                      {cpHasMore && (
                        <div className="p-2">
                          <Button variant="outline" size="sm" onClick={() => loadCounterparties(cpPage + 1)} disabled={cpLoading}>
                            {cpLoading ? (
                              <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /> Loading...</span>
                            ) : 'Load more'}
                          </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Facility Name</label>
                  <Input value={form.counterparty_facility_name || ''} onChange={e => setForm({ ...form, counterparty_facility_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Segment</label>
                  <Select value={(form.segment as any) || ''} onValueChange={(v) => setForm({ ...form, segment: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                    <SelectContent>
                      {SEGMENT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Facility Type</label>
                  <Input value={form.facility_type || ''} onChange={e => setForm({ ...form, facility_type: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Country</label>
                  <Input value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Province</label>
                  <Input value={form.province || ''} onChange={e => setForm({ ...form, province: e.target.value })} placeholder="Auto-filled on save; can override" />
                </div>
                <div>
                  <label className="text-sm font-medium">Region / Comunidad</label>
                  <Input value={form.region || ''} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Auto-filled on save; can override" />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <Button type="button" variant="secondary" onClick={async () => {
                    const parts = [form.address, form.city, form.country].filter(Boolean)
                    if (parts.length === 0) {
                      toast({ title: 'Address required', description: 'Enter address, city or country to search', variant: 'destructive' })
                      return
                    }
                    try {
                      const q = parts.join(', ')
                      const res = await utilsApi.geocode(q)
                      // Round to 6 decimals to satisfy backend DecimalField
                      const lat = Number(res.lat.toFixed(6))
                      const lng = Number(res.lng.toFixed(6))
                      setForm({
                        ...form,
                        latitude: lat as any,
                        longitude: lng as any,
                        province: form.province || (res.province ?? ''),
                        region: form.region || (res.region ?? ''),
                      })
                      const descLines = [
                        `Provider: ${res.provider}`,
                        `Lat/Lng: ${lat}, ${lng}`,
                        res.province ? `Province: ${res.province}` : null,
                        res.region ? `Region: ${res.region}` : null,
                        (res as any).message ? (res as any).message : null,
                      ].filter(Boolean)
                      toast({ title: 'Location found', description: descLines.join('\n') })
                    } catch (e: any) {
                      toast({ title: 'Geocode failed', description: e?.response?.data?.error || 'Unable to locate address', variant: 'destructive' })
                    }
                  }}>
                    <Search className="h-4 w-4 mr-2" /> Find on Map
                  </Button>
                </div>
              </div>

              <MapPreview lat={form.latitude as any} lng={form.longitude as any} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => doSave(false)}>Save & Keep Open</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Consumption</h3>
                <Button variant="secondary" size="sm" onClick={addConsumption} disabled={!editing}><Plus className="h-4 w-4 mr-2" />Add line</Button>
              </div>
              {!editing && (
                <p className="text-sm text-muted-foreground mb-2">Save the factory first to add consumption lines.</p>
              )}
              {editing && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commodity</TableHead>
                      <TableHead>Monthly Volume</TableHead>
                      <TableHead>Yearly Volume</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptions.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="w-1/3">
                          <Select value={String(row.commodity)} onValueChange={async (v) => { await updateConsumption(row, { commodity: parseInt(v) } as any) }}>
                            <SelectTrigger><SelectValue placeholder="Select commodity" /></SelectTrigger>
                            <SelectContent>
                              {commodities.map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.commodity_name_short}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input type="number" step={1} min={1} max={5000} value={row.monthly_volume || ''} onChange={async (e) => {
                            // Coerce to integer string and clamp between 1 and 5000
                            const raw = e.target.value
                            let intVal = parseInt(raw, 10)
                            if (Number.isNaN(intVal)) intVal = 1
                            intVal = Math.max(1, Math.min(5000, intVal))
                            await updateConsumption(row, { monthly_volume: String(intVal) } as any)
                          }} />
                        </TableCell>
                        <TableCell>
                          <Input value={row.yearly_volume ?? ''} disabled />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteConsumption(row)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {consumptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No consumption lines yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Temporary Geocode Debug Panel */}
      <div className="mb-4">
        <button className="text-xs underline text-blue-600" onClick={() => setGeoOpen(v => !v)}>
          {geoOpen ? 'Hide geocode tester' : 'Show geocode tester'}
        </button>
        {geoOpen && (
          <div className="mt-2 border rounded p-3 bg-gray-50">
            <div className="text-xs text-gray-600 mb-2">
              Backend rate limit: 30 req/min. Nominatim also enforces ~1 req/sec and User-Agent policy.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <input className="border rounded p-1" placeholder="Address (optional)" value={geoAddr} onChange={e=>setGeoAddr(e.target.value)} />
              <input className="border rounded p-1" placeholder="City" value={geoCity} onChange={e=>setGeoCity(e.target.value)} />
              <input className="border rounded p-1" placeholder="Country" value={geoCountry} onChange={e=>setGeoCountry(e.target.value)} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60" disabled={geoLoading} onClick={testGeocode}>
                {geoLoading ? 'Testing…' : 'Test geocode'}
              </button>
              {geoError && <span className="text-xs text-red-600">{geoError}</span>}
            </div>
            {geoResult && (
              <div className="mt-2 text-xs">
                <div><span className="font-semibold">lat/lng:</span> {geoResult.lat}, {geoResult.lng} ({geoResult.provider})</div>
                <div><span className="font-semibold">country_code:</span> {geoResult.country_code || '—'}{' '}<span className="font-semibold">region:</span> {geoResult.region || '—'}{' '}<span className="font-semibold">province:</span> {geoResult.province || '—'}</div>
                {geoResult.raw && (
                  <pre className="mt-2 bg-white border rounded p-2 overflow-auto max-h-56">{JSON.stringify(geoResult.raw, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factories List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input placeholder="Search name/counterparty/city" value={q} onChange={e => setQ(e.target.value)} className="max-w-xs" />
            <Input placeholder="Province" value={filterProvince} onChange={e => setFilterProvince(e.target.value)} className="max-w-[180px]" />
            <Input placeholder="Region" value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="max-w-[180px]" />
            <Input placeholder="Country" value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="max-w-[160px]" />
            <Button variant="secondary" onClick={fetchAll}><Search className="h-4 w-4 mr-1" /> Filter</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map(f => (
                <TableRow key={f.id}>
                  <TableCell>{f.counterparty_facility_name}</TableCell>
                  <TableCell>{cpMap.get(f.counterparty) || f.counterparty}</TableCell>
                  <TableCell>{SEGMENT_OPTIONS.find(s => s.value === f.segment)?.label || '-'}</TableCell>
                  <TableCell>{f.city}</TableCell>
                  <TableCell>{f.province || '-'}</TableCell>
                  <TableCell>{f.region || '-'}</TableCell>
                  <TableCell>{f.country}</TableCell>
                  <TableCell>
                    <Badge variant={f.is_active ? 'default' : 'secondary'}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(f)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={async () => {
                        const req = { address: (f as any).address, city: f.city, country: f.country }
                        try {
                          console.debug('Re-enrich request', req)
                          const updated = await facilitiesApi.update(f.id, req)
                          console.debug('Re-enrich response', updated)
                          setFacilities(facilities.map(x => x.id === f.id ? updated : x))
                          const dbg: any = { city: (updated as any)?.city, country: (updated as any)?.country, province: (updated as any)?.province, region: (updated as any)?.region, latitude: (updated as any)?.latitude, longitude: (updated as any)?.longitude }
                          toast({ title: 'Enriched', description: `Req: ${req.address || ''}, ${req.city || ''}, ${req.country || ''}\nResp: ${JSON.stringify(dbg)}` })
                        } catch (e: any) {
                          const detail = e?.response?.data ? JSON.stringify(e.response.data).slice(0, 600) : (e?.message || 'Unknown error')
                          console.error('Re-enrich error', e)
                          toast({ title: 'Re-enrich failed', description: detail, variant: 'destructive' })
                        }
                      }}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Re-enrich
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFacility(f.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {facilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">No factories yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </UiGuard>
  )
}
