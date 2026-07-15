'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'

const primaryItems = [
  { href: '/transform', label: 'Transform' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
]

export function Navigation({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const items = user?.role === 'admin'
    ? [...primaryItems, { href: '/admin/users', label: 'Users' }]
    : primaryItems

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={mobile ? 'flex flex-col gap-1' : 'flex items-center gap-10'} aria-label="Primary navigation">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative px-1 py-3 text-[15px] font-medium transition-colors ${
              active ? 'text-[#26372b]' : 'text-[#625f58] hover:text-[#26372b]'
            } ${mobile ? 'rounded-md px-3' : ''}`}
          >
            {item.label}
            {!mobile && active ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#496a50]" /> : null}
          </Link>
        )
      })}
    </nav>
  )

  const Account = () => isAuthenticated ? (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#496a50] text-sm font-medium text-[#faf8f2]">
        {(user?.displayName || user?.email || 'B').charAt(0).toUpperCase()}
      </div>
      <div className="hidden min-w-0 text-left xl:block">
        <p className="max-w-32 truncate text-sm font-medium text-[#2c2924]">{user?.displayName || user?.username}</p>
        <p className="max-w-32 truncate text-[11px] text-[#817b71]">{user?.role === 'admin' ? 'Administrator' : 'Beforest team'}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-md p-2 text-[#777168] transition-colors hover:bg-[#ebe4d8] hover:text-[#314536]"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.7} />
      </button>
    </div>
  ) : preview ? (
    <span className="text-xs text-[#817b71]">Preview</span>
  ) : (
    <Link href="/auth/login" className="text-sm font-medium text-[#314536] hover:text-[#496a50]">Sign in</Link>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[82px] border-b border-[#ded7cb] bg-[#f7f3eb]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-[52px]">
        <Link href="/transform" aria-label="Beforest Brand Voice home" className="shrink-0">
          <Image src="/logo.png" alt="Beforest" width={154} height={41} priority className="h-auto w-[136px] sm:w-[148px]" />
        </Link>

        <div className="hidden md:block"><NavLinks /></div>
        <div className="hidden min-w-[150px] justify-end md:flex"><Account /></div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-[#ded7cb] bg-[#f7f3eb] p-6">
            <SheetHeader className="mb-8 text-left"><SheetTitle className="font-serif text-2xl">Brand Voice</SheetTitle></SheetHeader>
            <NavLinks mobile />
            <div className="mt-8 border-t border-[#ded7cb] pt-6"><Account /></div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
