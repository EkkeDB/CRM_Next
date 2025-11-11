"use client"

import React, { useEffect, useMemo, useState } from 'react'
import UiGuard from '@/components/security/UiGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MultiSelectList from '@/components/ui/multi-select-list'
import { facilityConsumptionsApi } from '@/lib/api-client'

type HeatDatum = { country_code: string | null; country: string | null; region: string | null; province: string | null; lat: number; lng: number; volume: number }

function useLeaflet(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    if (w.L) { setReady(true); return }
    const linkId = 'leaflet-css'
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    const scriptId = 'leaflet-js'
    if (document.getElementById(scriptId)) {
      const check = () => { if (w.L) setReady(true) }
      setTimeout(check, 50)
    } else {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => setReady(true)
      document.body.appendChild(script)
    }
  }, [])
  return ready
}

function normalizeName(s: string | null | undefined): string {
  if (!s) return ''
  try {
    return s
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9/ ]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return (s || '').toLowerCase().trim()
  }
}

function getPtDistrictName(props: any): string {
  return (
    props?.name ||
    props?.district ||
    props?.distrito ||
    props?.nom ||
    props?.nom_distrito ||
    props?.nome ||
    props?.nome_distrito ||
    ''
  ) as string
}

function getEsProvinceName(props: any): string {
  return (
    props?.name ||
    props?.province ||
    props?.provincia ||
    props?.prov_name ||
    props?.nom_prov ||
    props?.provincia_nombre ||
    ''
  ) as string
}

function getEsRegionName(props: any): string | null {
  return (
    props?.region ||
    props?.ccaa ||
    props?.autonomous_community ||
    props?.comunidad ||
    props?.name_regi ||
    props?.nom_ca ||
    null
  ) as string | null
}

function colorFor(value: number, max: number): string {
  const x = max > 0 ? value / max : 0
  if (x >= 0.80) return '#a50f15'
  if (x >= 0.60) return '#ef3b2c'
  if (x >= 0.40) return '#fb6a4a'
  if (x >= 0.20) return '#fc9272'
  if (x > 0)    return '#fcbba1'
  return '#fef0f0'
}

export default function GeoHeatmapPage() {
  const [commodities, setCommodities] = useState<{ id: number; name: string }[]>([])
  const [selCommodityIds, setSelCommodityIds] = useState<Array<number | string>>([])
  const [data, setData] = useState<HeatDatum[]>([])
  const [loading, setLoading] = useState(true)
  const [geoES, setGeoES] = useState<any | null>(null)
  const [geoPT, setGeoPT] = useState<any | null>(null)

  const ready = useLeaflet()

  // Load commodities and initial data
  useEffect(() => {
    const init = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${base}/api/commodities/?page_size=1000`, { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const list = Array.isArray(json) ? json : (json?.results ?? [])
          setCommodities(list.map((c: any) => ({ id: c.id, name: c.commodity_name_short || c.commodity_name_full })))
        }
      } catch {}
      // initial heat data
      setLoading(true)
      try {
        const hm = await facilityConsumptionsApi.getHeatmap({ countries: ['pt', 'es'] })
        setData(hm || [])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Reload heatmap when commodity selection changes
  useEffect(() => {
    const ids = selCommodityIds.map(v => Number(v)).filter(Boolean)
    const load = async () => {
      setLoading(true)
      try {
        const hm = await facilityConsumptionsApi.getHeatmap({ commodities: ids as number[], countries: ['pt', 'es'] })
        setData(hm || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selCommodityIds])

  // Load GeoJSON for ES provinces and PT districts
  useEffect(() => {
    const loadGeo = async () => {
      const isFeatureCollection = (x: any) => x && x.type === 'FeatureCollection' && Array.isArray(x.features)
      const tryFetch = async (url: string) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const j = await res.json()
          if (!isFeatureCollection(j)) throw new Error('Not a FeatureCollection')
          return j
        } catch (e) {
          console.warn('Geo fetch failed:', url, e)
          return null
        }
      }

      // 1) Try local (if we later vendor assets under public/geo)
      const localES = await tryFetch('/geo/spain-provinces.geojson')
      const localPT = await tryFetch('/geo/portugal-districts.geojson')
      if (localES && localPT) {
        setGeoES(localES)
        setGeoPT(localPT)
        return
      }

      // 2) Try Opendatasoft dataset exports (v2.1). We’ll try a few common dataset ids.
      const odsBase = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets'
      const esCandidates = [
        'provinces-of-spain',
        'spain-provinces',
        'es-administrative-provinces',
        'provincias-es',
        'provinces_spain',
        'georef-spain-province',
      ]
      const ptCandidates = [
        'portugal-districts',
        'portugal-distritos',
        'distritos-de-portugal',
        'portugal_districts',
        'georef-portugal-district',
      ]

      let esGeo: any = null
      for (const id of esCandidates) {
        const url = `${odsBase}/${id}/exports/geojson?lang=en&timezone=UTC`
        // eslint-disable-next-line no-await-in-loop
        const j = await tryFetch(url)
        if (j) { esGeo = j; break }
      }

      let ptGeo: any = null
      for (const id of ptCandidates) {
        const url = `${odsBase}/${id}/exports/geojson?lang=en&timezone=UTC`
        // eslint-disable-next-line no-await-in-loop
        const j = await tryFetch(url)
        if (j) { ptGeo = j; break }
      }

      if (esGeo) setGeoES(esGeo)
      if (ptGeo) setGeoPT(ptGeo)

      if (!esGeo || !ptGeo) {
        // 3) Fallback to GitHub if ODS unsuccessful
        const ghES = await tryFetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/spain-provinces.geojson')
        const ghPT = await tryFetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/portugal-districts.geojson')
        if (ghES) setGeoES(ghES)
        if (ghPT) setGeoPT(ghPT)
      }
    }
    loadGeo()
  }, [])

  const maxVolume = useMemo(() => Math.max(...data.map(d => d.volume || 0), 0), [data])

  // Build lookup maps
  const ptVolumes = useMemo(() => {
    const m = new Map<string, number>()
    data.filter(d => d.country_code === 'pt').forEach(d => {
      const key = normalizeName(d.region)
      m.set(key, (m.get(key) || 0) + (d.volume || 0))
    })
    return m
  }, [data])
  const esVolumes = useMemo(() => {
    const m = new Map<string, { vol: number; region: string | null }>()
    data.filter(d => d.country_code === 'es').forEach(d => {
      const key = normalizeName(d.province)
      const cur = m.get(key) || { vol: 0, region: d.region || null }
      cur.vol += (d.volume || 0)
      if (!cur.region && d.region) cur.region = d.region
      m.set(key, cur)
    })
    return m
  }, [data])

  return (
    <UiGuard token="ui:analytics">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Geo Heatmap</h2>
            <p className="text-muted-foreground mt-1">Choropleth by Portugal districts and Spain provinces. Commodity filter applies.</p>
          </div>
          <div className="w-64">
            <div className="text-xs text-muted-foreground mb-1">Commodities</div>
            <MultiSelectList options={commodities} selected={selCommodityIds} onChange={(next)=> setSelCommodityIds(next)} height={120} />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Map</CardTitle>
          </CardHeader>
          <CardContent>
            <ChoroplethMap ready={ready} geoES={geoES} geoPT={geoPT} ptVolumes={ptVolumes} esVolumes={esVolumes} maxVolume={maxVolume} loading={loading} data={data} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Area Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTables data={data} />
          </CardContent>
        </Card>
      </div>
    </UiGuard>
  )
}

function ChoroplethMap({ ready, geoES, geoPT, ptVolumes, esVolumes, maxVolume, loading, data }:{ ready:boolean; geoES:any; geoPT:any; ptVolumes:Map<string,number>; esVolumes:Map<string,{vol:number;region:string|null}>; maxVolume:number; loading:boolean; data: HeatDatum[] }){
  const [map, setMap] = useState<any>(null)
  const mapId = 'geo-choropleth'

  useEffect(() => {
    if (!ready) return
    if (map) return
    const w = window as any
    const L = w.L
    const el = document.getElementById(mapId)
    if (!el) return
    // Basemap-less map (plain background for a political look)
    const m = L.map(el, { zoomControl: true, scrollWheelZoom: true, attributionControl: false }).setView([40.0, -3.5], 5)
    ;(el as HTMLElement).style.background = '#ffffff'
    setMap(m)
    return () => { try { m.remove() } catch {} }
  }, [ready])

  useEffect(() => {
    if (!map || !(window as any).L) return
    const L = (window as any).L
    // Clear non-base layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) return
      map.removeLayer(layer)
    })
    const layers: any[] = []
    // Portugal districts
    if (geoPT && geoPT.features) {
      const layerPT = L.geoJSON(geoPT, {
        style: (feature: any) => {
          const name: string = getPtDistrictName(feature?.properties || {}) || ''
          const vol = ptVolumes.get(normalizeName(name)) || 0
          return { color: '#333', weight: 1.5, fillColor: colorFor(vol, maxVolume), fillOpacity: 0.85 }
        },
        onEachFeature: (feature: any, lyr: any) => {
          const name: string = getPtDistrictName(feature?.properties || {}) || ''
          const vol = ptVolumes.get(normalizeName(name)) || 0
          const html = `<div><strong>${name}</strong><br/>Volume: ${Math.round(vol)} mt</div>`
          lyr.bindTooltip(html, { sticky: true })
          lyr.on({
            mouseover: (e: any) => {
              const l = e.target
              l.setStyle({ weight: 2.5, color: '#111', fillOpacity: 0.95 })
              try { l.bringToFront() } catch {}
            },
            mouseout: (e: any) => {
              const l = e.target
              l.setStyle({ weight: 1.5, color: '#333', fillOpacity: 0.85 })
            }
          })
        }
      }).addTo(map)
      layers.push(layerPT)
    }
    // Spain provinces
    if (geoES && geoES.features) {
      const layerES = L.geoJSON(geoES, {
        style: (feature: any) => {
          const raw: string = getEsProvinceName(feature?.properties || {}) || ''
          const variants = raw.includes('/') ? raw.split('/') : [raw]
          const norm = variants.map(s => normalizeName(s))
          const vol = norm.reduce((acc, v) => acc || (esVolumes.get(v)?.vol || 0), 0)
          return { color: '#333', weight: 1.5, fillColor: colorFor(vol, maxVolume), fillOpacity: 0.85 }
        },
        onEachFeature: (feature: any, lyr: any) => {
          const raw: string = getEsProvinceName(feature?.properties || {}) || ''
          const variants = (raw.includes('/') ? raw.split('/') : [raw]).map(s => normalizeName(s))
          let vol = 0
          let ccaa: string | null = getEsRegionName(feature?.properties || {}) || null
          for (const v of variants) {
            const rec = esVolumes.get(v)
            if (rec) { vol = rec.vol; ccaa = rec.region || ccaa }
          }
          const html = `<div><strong>${raw}</strong>${ccaa ? `<div>CCAA: ${ccaa}</div>` : ''}<div>Volume: ${Math.round(vol)} mt</div></div>`
          lyr.bindTooltip(html, { sticky: true })
          lyr.on({
            mouseover: (e: any) => {
              const l = e.target
              l.setStyle({ weight: 2.5, color: '#111', fillOpacity: 0.95 })
              try { l.bringToFront() } catch {}
            },
            mouseout: (e: any) => {
              const l = e.target
              l.setStyle({ weight: 1.5, color: '#333', fillOpacity: 0.85 })
            }
          })
        }
      }).addTo(map)
      layers.push(layerES)
    }
    // Fit bounds
    if (layers.length) {
      try {
        const group = (window as any).L.featureGroup(layers)
        map.fitBounds(group.getBounds().pad(0.1))
      } catch {}
    } else if (data && data.length) {
      // Fallback: if polygons failed to load, render centroid markers colored by volume
      const markers: any[] = []
      const maxVol = Math.max(...data.map(d => d.volume || 0), 1)
      data.forEach(d => {
        const color = colorFor(d.volume || 0, maxVol)
        const mk = L.circleMarker([d.lat, d.lng], { radius: 6, color: '#333', weight: 1, fillColor: color, fillOpacity: 0.9 }).addTo(map)
        const title = d.country_code === 'pt'
          ? `<div><strong>${d.region || '-'}</strong><div>Volume: ${Math.round(d.volume || 0)} mt</div></div>`
          : `<div><strong>${d.province || '-'}</strong>${d.region ? `<div>CCAA: ${d.region}</div>` : ''}<div>Volume: ${Math.round(d.volume || 0)} mt</div></div>`
        mk.bindTooltip(title, { sticky: true })
        markers.push(mk)
      })
      try {
        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.2))
      } catch {}
    }
  }, [map, geoES, geoPT, ptVolumes, esVolumes, maxVolume, data])

  return (
    <div className="relative w-full h-[560px] rounded border">
      {loading && <div className="absolute z-[5] m-3 text-xs bg-black/60 text-white px-2 py-1 rounded">Loading…</div>}
      {/* Legend */}
      <div className="absolute right-3 top-3 z-[5] rounded bg-white/90 border p-2 text-xs">
        <div className="font-medium mb-1">Volume scale</div>
        {[0.0,0.2,0.4,0.6,0.8].map((t,i)=> (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="inline-block w-4 h-3 border" style={{ background: colorFor(t*maxVolume, maxVolume) }} />
            <span>{Math.round(t*100)}%+</span>
          </div>
        ))}
      </div>
      <div id={mapId} className="w-full h-full" />
    </div>
  )
}

function AreaTables({ data }: { data: HeatDatum[] }) {
  const esRows = useMemo(() => {
    const rows = new Map<string, { region: string | null; province: string | null; volume: number }>()
    data.filter(d => d.country_code === 'es').forEach(d => {
      const key = `${d.region || ''}||${d.province || ''}`
      const cur = rows.get(key) || { region: d.region, province: d.province, volume: 0 }
      cur.volume += d.volume || 0
      rows.set(key, cur)
    })
    return Array.from(rows.values()).sort((a,b)=> (b.volume - a.volume))
  }, [data])
  const ptRows = useMemo(() => {
    const rows = new Map<string, { region: string | null; volume: number }>()
    data.filter(d => d.country_code === 'pt').forEach(d => {
      const key = d.region || ''
      const cur = rows.get(key) || { region: d.region, volume: 0 }
      cur.volume += d.volume || 0
      rows.set(key, cur)
    })
    return Array.from(rows.values()).sort((a,b)=> (b.volume - a.volume))
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <div className="text-sm font-medium mb-2">Spain — CCAA / Provinces</div>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">CCAA</th>
                <th className="text-left px-3 py-2">Province</th>
                <th className="text-right px-3 py-2">Volume (mt)</th>
              </tr>
            </thead>
            <tbody>
              {esRows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{r.region || '-'}</td>
                  <td className="px-3 py-2">{r.province || '-'}</td>
                  <td className="px-3 py-2 text-right">{Math.round(r.volume).toLocaleString()}</td>
                </tr>
              ))}
              {esRows.length === 0 && (
                <tr><td className="px-3 py-2 text-muted-foreground" colSpan={3}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Portugal — Regions (Districts)</div>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Region</th>
                <th className="text-right px-3 py-2">Volume (mt)</th>
              </tr>
            </thead>
            <tbody>
              {ptRows.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{r.region || '-'}</td>
                  <td className="px-3 py-2 text-right">{Math.round(r.volume).toLocaleString()}</td>
                </tr>
              ))}
              {ptRows.length === 0 && (
                <tr><td className="px-3 py-2 text-muted-foreground" colSpan={2}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
