'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Building, Users, Factory, FileText, ArrowLeft, MapPin, Plus, Edit2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { counterpartiesApi, contactsApi, contractsApi, counterpartyNotesApi } from '@/lib/api-client'
import type { Counterparty, Contact, Contract, CounterpartyFacility, CounterpartyNote } from '@/types'

export default function CustomerDetailPage() {
  const params = useParams() as { id?: string }
  const idParam = params?.id
  const counterpartyId = useMemo(() => {
    const n = Number(idParam)
    return Number.isFinite(n) ? n : NaN
  }, [idParam])

  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counterparty, setCounterparty] = useState<Counterparty | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [notes, setNotes] = useState<CounterpartyNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  useEffect(() => {
    if (!counterpartyId || Number.isNaN(counterpartyId)) {
      setError('Invalid customer id')
      setLoading(false)
      return
    }

    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)
        const [cp, contactsRes, contractsRes, notesRes] = await Promise.all([
          counterpartiesApi.getById(counterpartyId),
          // Add counterparty filter for contacts
          contactsApi.getAll({ page_size: 1000, counterparty: counterpartyId } as any),
          contractsApi.getAll({ page_size: 1000, counterparty: counterpartyId }),
          counterpartyNotesApi.getByCounterparty(counterpartyId),
        ])
        setCounterparty(cp)
        setContacts(contactsRes)
        setContracts(contractsRes.results || contractsRes)
        setNotes(notesRes)
      } catch (e: any) {
        console.error('Failed to load customer detail', e)
        const msg = e?.response?.status === 404 ? 'Customer not found' : 'Failed to load customer details'
        setError(msg)
        toast({ title: 'Error', description: msg, variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [counterpartyId])

  const facilities: CounterpartyFacility[] = (counterparty?.facilities as any) || []

  // Notes handlers
  const addNote = async () => {
    try {
      const content = newNote.trim()
      if (!content || !counterpartyId) return
      const created = await counterpartyNotesApi.create({ counterparty: counterpartyId, content })
      setNotes([created, ...notes])
      setNewNote('')
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
    }
  }

  const saveEdit = async (id: number) => {
    try {
      const content = editingContent.trim()
      if (!content) return
      const updated = await counterpartyNotesApi.update(id, { content })
      setNotes(notes.map(n => (n.id === id ? updated : n)))
      setEditingNoteId(null)
      setEditingContent('')
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            Customer
          </h1>
          <Link href="/dashboard/counterparties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Counterparties
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!counterparty) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            {counterparty.counterparty_name}
          </h1>
          <p className="text-gray-600 mt-2">Customer details and related records</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/counterparties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Counterparties
            </Button>
          </Link>
          <Link href="/dashboard/counterparties/factories">
            <Button variant="outline">
              <Factory className="h-4 w-4 mr-2" /> Manage Factories
            </Button>
          </Link>
          <Link href="/dashboard/contacts">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" /> Manage Contacts
            </Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Customer data | Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Detail label="Code" value={counterparty.counterparty_code || '-'} />
              <Detail label="Tax ID" value={counterparty.tax_id || '-'} />
              <Detail label="Type" value={counterparty.is_customer && counterparty.is_supplier ? 'Customer & Supplier' : counterparty.is_customer ? 'Customer' : 'Supplier'} />
              <Detail label="Contact Person" value={counterparty.contact_person || '-'} />
              <Detail label="Email" value={counterparty.email || '-'} />
              <Detail label="Phone" value={counterparty.phone || '-'} />
              <Detail label="City" value={counterparty.city || '-'} />
              <Detail label="Country" value={counterparty.country || '-'} />
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto pr-1">
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="py-2">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.position || '-'}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-sm">{c.email || '-'}</div>
                          <div className="text-xs text-muted-foreground">{[c.phone, [c.city, c.country].filter(Boolean).join(', ')].filter(Boolean).join(' • ') || '-'}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Factories | Map | Notes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Factory className="h-5 w-5" /> Factories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto pr-1">
              {facilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No factories added.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="py-2">
                          <div className="font-medium">{f.counterparty_facility_name}</div>
                          <div className="text-xs text-muted-foreground">{f.facility_type || '-'}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{[f.city, f.province, f.region, f.country].filter(Boolean).join(', ') || '-'}</div>
                          <div className="text-xs text-muted-foreground">{formatLatLng(f.latitude, f.longitude)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <FacilitiesMap facilities={facilities} />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add note */}
            <div className="flex items-start gap-2 mb-3">
              <textarea
                className="w-full border rounded p-2 text-sm"
                placeholder="Add a note..."
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button onClick={addNote} disabled={!newNote.trim()} className="h-9">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-72 overflow-auto space-y-2 pr-1">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-muted-foreground">{formatTimestamp(n.created_at)}</div>
                      {editingNoteId === n.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => saveEdit(n.id)} disabled={!editingContent.trim()}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingNoteId(null); setEditingContent('') }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setEditingNoteId(n.id); setEditingContent(n.content) }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingNoteId === n.id ? (
                      <textarea className="w-full border rounded p-2 text-sm" rows={3} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contracts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((ct) => (
                  <TableRow key={ct.id}>
                    <TableCell>{ct.contract_number}</TableCell>
                    <TableCell>{ct.date}</TableCell>
                    <TableCell className="capitalize">{ct.status}</TableCell>
                    <TableCell>{ct.commodity_name || '-'}</TableCell>
                    <TableCell>{ct.quantity}</TableCell>
                    <TableCell>{ct.price}</TableCell>
                    <TableCell>{ct.total_value || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function formatTimestamp(ts: string) {
  try {
    const d = new Date(ts)
    return d.toLocaleString()
  } catch {
    return ts
  }
}

function formatLatLng(lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) return '-'
  return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
}

function useLeafletLoader() {
  const [ready, setReady] = useState<boolean>(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    if (w.L) {
      setReady(true)
      return
    }
    const linkId = 'leaflet-css'
    const scriptId = 'leaflet-js'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const scriptExisting = document.getElementById(scriptId) as HTMLScriptElement | null
    if (scriptExisting && (window as any).L) {
      setReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => setReady(true)
    document.body.appendChild(script)
  }, [])
  return ready
}

function FacilitiesMap({ facilities }: { facilities: CounterpartyFacility[] }) {
  const ready = useLeafletLoader()
  const [map, setMap] = useState<any>(null)
  const mapId = 'facilities-map'
  useEffect(() => {
    if (!ready) return
    if (map) return
    const w = window as any
    const L = w.L
    const el = document.getElementById(mapId)
    if (!el) return
    const m = L.map(el).setView([20, 0], 2)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(m)
    setMap(m)
    return () => {
      try { m.remove() } catch {}
    }
  }, [ready])

  useEffect(() => {
    if (!map || !(window as any).L) return
    const L = (window as any).L
    // Clear existing layers except base
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) return
      map.removeLayer(layer)
    })
    const points = facilities
      .map(f => ({ lat: typeof (f as any).latitude === 'number' ? (f as any).latitude : parseFloat(String((f as any).latitude)),
                   lng: typeof (f as any).longitude === 'number' ? (f as any).longitude : parseFloat(String((f as any).longitude)),
                   label: f.counterparty_facility_name }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    const markers: any[] = []
    points.forEach(p => {
      const mk = L.marker([p.lat, p.lng]).addTo(map)
      mk.bindPopup(p.label)
      markers.push(mk)
    })
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.2))
    }
  }, [map, facilities])

  return <div id={mapId} className="h-full w-full rounded" />
}
