'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ManagedUser = {
  id: string
  email: string
  username: string
  display_name: string
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
  last_login: string | null
}

export default function UsersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' })

  const loadUsers = async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to load users')
    setUsers(data.users)
  }

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadUsers().catch((loadError) => setError(loadError.message))
    }
  }, [authLoading, user?.role])

  const createUser = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create user')
      setForm({ email: '', username: '', displayName: '', password: '' })
      setNotice(`Account created for ${data.user.email}`)
      await loadUsers()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create user')
    } finally {
      setIsSaving(false)
    }
  }

  const setActive = async (managedUser: ManagedUser) => {
    setError('')
    const token = localStorage.getItem('auth_token')
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: managedUser.id, isActive: !managedUser.is_active }),
    })
    const data = await response.json()
    if (!response.ok) return setError(data.error || 'Unable to update user')
    setUsers((current) => current.map((item) => item.id === managedUser.id ? data.user : item))
  }

  if (authLoading) return null

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen bg-background"><Navigation /><main className="pt-24 lg:ml-[280px] p-8"><h1 className="text-2xl font-serif">Admin access required</h1></main></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 lg:ml-[280px] p-6 sm:p-12">
        <div className="mx-auto max-w-5xl space-y-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Beforest administration</p>
            <h1 className="mt-3 text-4xl font-serif">Manage users</h1>
            <p className="mt-2 text-muted-foreground">Create invitation-only accounts and disable access when needed.</p>
          </div>

          <form onSubmit={createUser} className="grid gap-4 rounded-xl border border-border/60 bg-card p-6 sm:grid-cols-2">
            <div className="sm:col-span-2"><h2 className="text-xl font-serif">Create an account</h2></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="username">Username</Label><Input id="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label htmlFor="displayName">Display name</Label><Input id="displayName" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></div>
            <div><Label htmlFor="password">Temporary password</Label><Input id="password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create account'}</Button></div>
          </form>

          {notice && <p className="text-sm text-green-700">{notice}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <section className="space-y-4">
            <h2 className="text-xl font-serif">Accounts</h2>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm"><thead className="border-b bg-muted/30"><tr><th className="p-4">User</th><th className="p-4">Created</th><th className="p-4">Last login</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>
                {users.map((managedUser) => <tr key={managedUser.id} className="border-b last:border-0"><td className="p-4"><div className="font-medium">{managedUser.display_name}</div><div className="text-muted-foreground">{managedUser.email}</div></td><td className="p-4 text-muted-foreground">{new Date(managedUser.created_at).toLocaleDateString()}</td><td className="p-4 text-muted-foreground">{managedUser.last_login ? new Date(managedUser.last_login).toLocaleDateString() : 'Never'}</td><td className="p-4">{managedUser.role === 'admin' ? 'Admin' : managedUser.is_active ? 'Active' : 'Disabled'}</td><td className="p-4 text-right">{managedUser.role !== 'admin' && <Button variant="outline" size="sm" onClick={() => void setActive(managedUser)}>{managedUser.is_active ? 'Disable' : 'Enable'}</Button>}</td></tr>)}
              </tbody></table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
