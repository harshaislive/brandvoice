'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CirclePlus, ShieldCheck, UserRound } from 'lucide-react'

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
    return <div className="min-h-screen bg-[#f4eee3]"><Navigation /><main className="mx-auto max-w-[1540px] px-6 pt-[126px] lg:px-[52px]"><h1 className="font-serif text-4xl text-[#26372b]">Admin access required</h1></main></div>
  }

  return (
    <div className="min-h-screen bg-[#f4eee3] text-[#2c2924]">
      <Navigation />
      <main className="mx-auto max-w-[1540px] px-5 pb-16 pt-[118px] sm:px-8 lg:px-[52px]">
        <div className="space-y-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#496a50]">Beforest administration</p>
            <h1 className="mt-3 font-serif text-[42px] font-light tracking-[-0.02em] text-[#26372b] sm:text-[54px]">The people with access.</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-[#6f6a61]">Create invitation-only accounts, then enable or pause access whenever you need to.</p>
          </div>

          <form onSubmit={createUser} className="grid gap-5 rounded-[10px] border border-[#ded7cb] bg-[#faf8f2] p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dce5d7] text-[#314536]"><CirclePlus className="h-4 w-4" strokeWidth={1.7} /></span><div><h2 className="text-lg font-medium">Create an account</h2><p className="text-xs text-[#817b71]">Share the temporary password securely.</p></div></div>
            <div><Label htmlFor="email" className="text-xs text-[#625f58]">Email</Label><Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11 border-[#d8d0c3] bg-[#fdfbf7] shadow-none" /></div>
            <div><Label htmlFor="username" className="text-xs text-[#625f58]">Username</Label><Input id="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1.5 h-11 border-[#d8d0c3] bg-[#fdfbf7] shadow-none" /></div>
            <div><Label htmlFor="displayName" className="text-xs text-[#625f58]">Display name</Label><Input id="displayName" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-1.5 h-11 border-[#d8d0c3] bg-[#fdfbf7] shadow-none" /></div>
            <div><Label htmlFor="password" className="text-xs text-[#625f58]">Temporary password</Label><Input id="password" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-11 border-[#d8d0c3] bg-[#fdfbf7] shadow-none" /></div>
            <div className="sm:col-span-2 lg:col-span-4"><Button type="submit" disabled={isSaving} className="h-11 bg-[#3b6345] px-6 shadow-none hover:bg-[#314f39]">{isSaving ? 'Creating…' : 'Create account'}</Button></div>
          </form>

          {notice && <p className="text-sm text-green-700">{notice}</p>}
          {error && <p className="text-sm text-red-700">{error}</p>}

          <section>
            <div className="flex items-center justify-between border-b border-[#d8d0c3] pb-3"><h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#496a50]">Accounts</h2><span className="text-xs text-[#817b71]">{users.length} total</span></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-[#d8d0c3] text-[10px] uppercase tracking-[0.18em] text-[#817b71]"><tr><th className="px-2 py-3 font-medium">User</th><th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Last login</th><th className="p-3 font-medium">Status</th><th className="p-3"></th></tr></thead><tbody>
                {users.map((managedUser) => <tr key={managedUser.id} className="border-b border-[#d8d0c3] transition-colors hover:bg-[#f8f4ec]"><td className="px-2 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7e1d6] text-[#496a50]">{managedUser.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</span><div><div className="font-medium">{managedUser.display_name}</div><div className="text-xs text-[#817b71]">{managedUser.email}</div></div></div></td><td className="p-3 text-[#6f6a61]">{new Date(managedUser.created_at).toLocaleDateString()}</td><td className="p-3 text-[#6f6a61]">{managedUser.last_login ? new Date(managedUser.last_login).toLocaleDateString() : 'Never'}</td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${managedUser.role === 'admin' || managedUser.is_active ? 'bg-[#dce5d7] text-[#314536]' : 'bg-[#eaded9] text-[#7e4938]'}`}>{managedUser.role === 'admin' ? 'Admin' : managedUser.is_active ? 'Active' : 'Paused'}</span></td><td className="p-3 text-right">{managedUser.role !== 'admin' && <Button variant="outline" size="sm" onClick={() => void setActive(managedUser)} className="border-[#cfc6b8] bg-transparent">{managedUser.is_active ? 'Pause' : 'Enable'}</Button>}</td></tr>)}
              </tbody></table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
