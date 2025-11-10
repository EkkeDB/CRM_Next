"use client"

import React, { useMemo, useState } from 'react'

export type Option = { id: number | string; name: string }

interface MultiSelectListProps {
  options: Option[]
  selected: Array<number | string>
  onChange: (next: Array<number | string>) => void
  placeholder?: string
  height?: number
}

export default function MultiSelectList({ options, selected, onChange, placeholder = 'Search…', height = 160 }: MultiSelectListProps) {
  const [query, setQuery] = useState('')
  const set = useMemo(() => new Set(selected.map(String)), [selected])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.name.toLowerCase().includes(q))
  }, [options, query])

  const toggle = (id: number | string, e?: React.MouseEvent) => {
    const s = new Set(Array.from(set))
    const sid = String(id)
    if (s.has(sid)) s.delete(sid)
    else s.add(sid)
    const next = Array.from(s)
    onChange(next)
  }

  return (
    <div className="border rounded p-2 bg-white dark:bg-slate-800">
      <input
        className="w-full border rounded px-2 py-1 mb-2 text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <div className="overflow-auto" style={{ maxHeight: height }}>
        {filtered.map(o => {
          const active = set.has(String(o.id))
          return (
            <div
              key={String(o.id)}
              className={`px-2 py-1 text-sm cursor-pointer rounded ${active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              onClick={(e) => toggle(o.id, e)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(o.id) } }}
              role="button"
              tabIndex={0}
              aria-pressed={active}
            >
              {o.name}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-xs text-slate-500 px-2 py-1">No results</div>
        )}
      </div>
    </div>
  )
}
