'use client'

import { useEffect, useState } from 'react'
import type { User } from '@/lib/shared/types'
import { getMe, updateMe } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { User as UserIcon, Lock, Bell, Shield, CheckCircle } from 'lucide-react'

type Section = 'profile' | 'security' | 'notifications'

export default function AccountPage() {
  const [section, setSection] = useState<Section>('profile')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const navItems: Array<{ id: Section; label: string; icon: React.ElementType }> = [
    { id: 'profile',       label: 'Profile',        icon: UserIcon    },
    { id: 'security',      label: 'Security',        icon: Lock        },
    { id: 'notifications', label: 'Notifications',   icon: Bell        },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Account & Settings</h1>
          <p className="mt-1 text-gray-500">Manage your profile, preferences, and security settings.</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <nav className="hidden w-44 shrink-0 flex-col gap-1 sm:flex">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  section === id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1">
            {loading ? (
              <div className="card h-64 animate-pulse bg-gray-100" />
            ) : (
              <>
                {section === 'profile'       && <ProfileSection user={user} onSave={setUser} />}
                {section === 'security'      && <SecuritySection />}
                {section === 'notifications' && <NotificationsSection />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSection({ user, onSave }: { user: User | null; onSave: (u: User) => void }) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    company:   user?.company   ?? '',
    licenseNumber: user?.licenseNumber ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMe(form)
      onSave(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <UserIcon className="h-5 w-5 text-brand-600" />
        Profile Information
      </h2>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name</label>
            <input
              className="input mt-1"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Last name</label>
            <input
              className="input mt-1"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input type="email" disabled className="input mt-1 opacity-60" value={user?.email ?? ''} />
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed here. Contact support.</p>
        </div>

        <div>
          <label className="label">Role</label>
          <input disabled className="input mt-1 capitalize opacity-60" value={user?.role?.toLowerCase() ?? ''} />
        </div>

        {(user?.role === 'AGENT' || user?.role === 'LENDER') && (
          <>
            <div>
              <label className="label">Company / Brokerage</label>
              <input
                className="input mt-1"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">License Number</label>
              <input
                className="input mt-1"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6 py-2.5"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved
            </>
          ) : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

function SecuritySection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    setLoading(true)
    setMessage(null)
    // Demo: just show success
    await new Promise(resolve => setTimeout(resolve, 500))
    setMessage({ type: 'success', text: 'Password updated successfully' })
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Lock className="h-5 w-5 text-brand-600" />
        Security
      </h2>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input mt-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            className="input mt-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {message && (
          <div className={`rounded p-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary px-6 py-2.5">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
          <Shield className="h-4 w-4 text-green-600" />
          Active Sessions
        </h3>
        <p className="text-sm text-gray-500">
          You can sign out of all sessions if you believe your account has been compromised.
        </p>
        <button className="btn-secondary mt-3 px-4 py-2 text-sm text-red-600 hover:border-red-300">
          Sign out all sessions
        </button>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    quoteUpdates:   true,
    riskAlerts:     true,
    weeklyDigest:   false,
    newCarriers:    true,
    marketChanges:  false,
  })

  return (
    <div className="card p-6">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Bell className="h-5 w-5 text-brand-600" />
        Notification Preferences
      </h2>

      <div className="space-y-4">
        {[
          { key: 'quoteUpdates',  label: 'Quote Request Updates',   desc: 'When a carrier responds to your quote request' },
          { key: 'riskAlerts',    label: 'Risk Alerts',             desc: 'When risk data for a saved property changes significantly' },
          { key: 'newCarriers',   label: 'New Carrier Availability', desc: "When a new carrier starts writing in areas you've searched" },
          { key: 'weeklyDigest',  label: 'Weekly Digest',           desc: 'Weekly summary of your property searches and market conditions' },
          { key: 'marketChanges', label: 'Market Condition Changes', desc: 'When the insurance market tightens or improves in your areas' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs[key as keyof typeof prefs]}
              onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      <button className="btn-primary mt-6 px-6 py-2.5">Save Preferences</button>
    </div>
  )
}
