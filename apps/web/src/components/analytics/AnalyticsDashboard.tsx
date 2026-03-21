'use client'

import { useEffect, useState } from 'react'
import type { AnalyticsSummary } from '@coverguard/shared'
import { getAnalytics } from '@/lib/api'
import { Search, Building2, Users, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError('Unable to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AnalyticsSkeleton />
  if (error || !data) return (
    <div className="rounded-lg bg-red-50 p-6 text-red-700">{error ?? 'No data'}</div>
  )

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Search className="h-5 w-5 text-brand-600" />}
          bg="bg-brand-50"
          label="Total Searches"
          value={data.totalSearches.toLocaleString()}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5 text-green-600" />}
          bg="bg-green-50"
          label="Saved Properties"
          value={data.totalSavedProperties.toLocaleString()}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-purple-600" />}
          bg="bg-purple-50"
          label="Clients"
          value={data.totalClients.toLocaleString()}
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-orange-600" />}
          bg="bg-orange-50"
          label="Reports Generated"
          value={data.totalReports.toLocaleString()}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Searches by day */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Searches (Last 30 Days)</h3>
          <SearchBarChart data={data.searchesByDay} />
        </div>

        {/* Risk distribution */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Risk Distribution (Saved Properties)</h3>
          {data.riskDistribution.length === 0 ? (
            <p className="text-sm text-gray-400">No saved properties yet.</p>
          ) : (
            <div className="space-y-3">
              {data.riskDistribution.map((item) => (
                <RiskBar key={item.level} level={item.level} count={item.count} total={data.totalSavedProperties} />
              ))}
            </div>
          )}
        </div>

        {/* Top states */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Top States Searched</h3>
          {data.topStates.length === 0 ? (
            <p className="text-sm text-gray-400">No searches yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topStates.slice(0, 8).map((s, i) => (
                <div key={s.state} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                  <span className="font-medium text-gray-800 w-8">{s.state}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-brand-400"
                      style={{ width: `${(s.count / data.topStates[0]!.count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Recent Activity</h3>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{a.description}</p>
                    <p className="text-xs text-gray-400">{formatRelativeTime(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${bg}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  )
}

const RISK_COLORS: Record<string, string> = {
  LOW:       'bg-green-500',
  MODERATE:  'bg-yellow-500',
  HIGH:      'bg-orange-500',
  VERY_HIGH: 'bg-red-500',
  EXTREME:   'bg-red-900',
}

function RiskBar({ level, count, total }: { level: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-xs font-medium text-gray-600">{level.replace('_', ' ')}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-3 rounded-full ${RISK_COLORS[level] ?? 'bg-gray-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-14 text-right">{count} ({pct}%)</span>
    </div>
  )
}

function SearchBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) return <p className="text-sm text-gray-400">No searches yet.</p>
  const max = Math.max(...data.map((d) => d.count), 1)
  const recent = data.slice(-14)

  return (
    <div className="flex items-end gap-1 h-32">
      {recent.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
          <div
            className="w-full rounded-t bg-brand-400 min-h-[4px] transition-all"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-[9px] text-gray-400 rotate-45 origin-left truncate" style={{ width: 20 }}>
            {d.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-56 animate-pulse bg-gray-100" />
        ))}
      </div>
    </div>
  )
}
