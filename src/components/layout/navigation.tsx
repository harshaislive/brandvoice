'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight, History, LogOut, Menu, Settings, UserRoundCog, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'

type RecentTransformation = {
  id: string
  content_type: string
  target_audience: string
  created_at: string
  original_content: string
}

const navItems = [
  { href: '/transform', label: 'Transform', icon: Zap },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function formatRecentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export function Navigation({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [recentTransformations, setRecentTransformations] = useState<RecentTransformation[]>([])

  const showRecent = isAuthenticated || preview

  useEffect(() => {
    if (!isAuthenticated) {
      setRecentTransformations([])
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) return

    const controller = new AbortController()
    fetch('/api/transform?limit=5', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRecentTransformations(data?.transformations || []))
      .catch(() => undefined)

    return () => controller.abort()
  }, [isAuthenticated, pathname])

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-12 px-3 pt-3">
        <Image
          src="/logo.png"
          alt="Beforest"
          width={150}
          height={54}
          priority
          className="h-auto w-[150px] object-contain invert"
        />
      </div>

      <nav className="space-y-2 px-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              onClick={onItemClick}
              className={`h-12 w-full justify-start gap-4 rounded-xl px-4 text-[15px] font-medium transition-colors ${
                active
                  ? 'bg-[#3d5d43] text-[#f4eee4] hover:bg-[#3d5d43] hover:text-[#f4eee4]'
                  : 'text-[#d7cfc2]/80 hover:bg-[#3a3530] hover:text-[#f4eee4]'
              }`}
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5" strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
        {user?.role === 'admin' && (
          <Button
            asChild
            variant="ghost"
            onClick={onItemClick}
            className={`h-12 w-full justify-start gap-4 rounded-xl px-4 text-[15px] font-medium transition-colors ${
              pathname.startsWith('/admin/users')
                ? 'bg-[#3d5d43] text-[#f4eee4] hover:bg-[#3d5d43] hover:text-[#f4eee4]'
                : 'text-[#d7cfc2]/80 hover:bg-[#3a3530] hover:text-[#f4eee4]'
            }`}
          >
            <Link href="/admin/users">
              <UserRoundCog className="h-5 w-5" strokeWidth={1.7} />
              <span>Users</span>
            </Link>
          </Button>
        )}
      </nav>

      {showRecent && (
        <section className="mt-12 min-h-0 flex-1 border-t border-[#514940] px-3 pt-7" aria-labelledby="recent-transformations-title">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="recent-transformations-title" className="text-sm font-medium text-[#f4eee4]">
              Recent transformations
            </h2>
          </div>
          <div className="space-y-4">
            {recentTransformations.length === 0 ? (
              <p className="text-xs leading-relaxed text-[#bdb3a5]">No recent transformations yet.</p>
            ) : (
              recentTransformations.map((item) => (
                <Link
                  key={item.id}
                  href={`/history?selected=${item.id}`}
                  onClick={onItemClick}
                  className="group block"
                >
                  <span className="flex items-center justify-between gap-2 text-xs text-[#ded5c8]">
                    <span className="truncate">{item.original_content.slice(0, 32) || 'Untitled transformation'}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8f9f89] opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-1 block text-[11px] text-[#9e9588]">
                    {formatRecentDate(item.created_at)} · {item.content_type}
                  </span>
                </Link>
              ))
            )}
          </div>
          <Link href="/history" onClick={onItemClick} className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-[#9fbd91] hover:text-[#c1d8b4]">
            View all history <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      <div className="mt-auto border-t border-[#514940] px-3 pb-3 pt-5">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-[#f4eee4]">{user?.displayName || 'Beforest Studio'}</p>
              <p className="truncate text-[11px] text-[#9e9588]">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { logout(); onItemClick?.() }}
              className="rounded-md p-2 text-[#bdb3a5] transition-colors hover:bg-[#3a3530] hover:text-[#f4eee4]"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link href="/auth/login" onClick={onItemClick} className="text-sm text-[#9fbd91] hover:text-[#c1d8b4]">
            Sign in to save transformations
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#514940] bg-[#2b2724] px-4 lg:hidden">
        <Image src="/logo.png" alt="Beforest" width={105} height={38} className="h-auto w-[105px] object-contain invert" />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#f4eee4] hover:bg-[#3a3530] hover:text-[#f4eee4]" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-[#514940] bg-[#2b2724] p-5 text-[#f4eee4]">
            <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
            <NavContent onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] bg-[#2b2724] px-5 py-6 text-[#f4eee4] lg:block">
        <NavContent />
      </aside>
    </>
  )
}
