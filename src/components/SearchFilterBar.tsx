import { Search } from 'lucide-react'
import { motion } from '../lib/motion'
import type { FilterState } from '../types'

interface SearchFilterBarProps {
  filters: FilterState
  onChange: (next: FilterState) => void
  customerOptions?: { label: string; value: string }[]
}

export function SearchFilterBar({ filters, onChange, customerOptions = [] }: SearchFilterBarProps) {
  return (
    <div className={motion.card + ' trackdocs-card trackdocs-card-strong trackdocs-signal-panel trackdocs-card-module space-y-4 p-5'}>
      <div className="flex items-center justify-between gap-3">
        <div className="trackdocs-proof-stamp px-3 py-1.5 text-[var(--td-text-muted)]">
          <span className="trackdocs-proof-stamp-dot" />
          FILTER BOARD
        </div>
        <p className="trackdocs-text-helper">Search, status, and company filters stay in one module</p>
      </div>

      <div className="trackdocs-route-line" aria-hidden="true" />

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <label className={motion.entrance + ' flex items-center gap-3 rounded-[24px] border border-[rgba(15,23,42,0.12)] bg-[rgba(255,255,255,0.96)] px-4 py-3 shadow-[0_12px_24px_rgba(17,17,17,0.05)]'}>
          <Search className="h-4 w-4 text-[var(--td-text-muted)]" />
          <input
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Search tracking no, sender, or note"
            className="trackdocs-text-ui w-full bg-transparent trackdocs-text-body text-[var(--td-text-strong)] outline-none placeholder:text-[var(--td-text-muted)]"
          />
        </label>

        <select
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value as FilterState['status'] })}
          className="trackdocs-input trackdocs-text-ui rounded-[24px] px-4 py-3 text-sm outline-none"
        >
          <option value="all">All statuses</option>
          <option value="NOT_RECEIVED">Not received</option>
          <option value="RECEIVED">Received</option>
        </select>

        <select
          value={filters.customerCode}
          onChange={(event) => onChange({ ...filters, customerCode: event.target.value })}
          className="trackdocs-input trackdocs-text-ui rounded-[24px] px-4 py-3 text-sm outline-none"
        >
          <option value="">All companies</option>
          {customerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

