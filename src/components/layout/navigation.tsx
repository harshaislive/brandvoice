'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'
import { Home, Zap, History, MessageCircle, BarChart3, Settings, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Navigation() {
  const pathname = usePathname()
  const { isAuthenticated, user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/transform', label: 'Transform', icon: Zap },
    { href: '/history', label: 'History', icon: History },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings }
  ]

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const NavContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="mb-10 flex flex-col items-center text-center space-y-4 pt-4">
        <Image
          src="/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className="invert object-contain w-[60px] h-[60px]"
        />
        <p className="text-xl font-serif font-light text-sidebar-foreground tracking-wide leading-tight">
          Beforest<br/>
          <span className="text-sm font-sans opacity-80">Brand Voice</span>
        </p>
      </div>

      <div className="space-y-1 flex-1 px-2">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Button
              key={item.href}
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-4 h-12 text-base font-light transition-all duration-300 ${
                pathname === item.href 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/10'
              }`}
              asChild
              onClick={onItemClick}
            >
              <Link href={item.href}>
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-auto pt-6 px-2 pb-4">
        {isAuthenticated ? (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-primary/10 p-4 backdrop-blur-sm">
            <div className="mb-3">
              <h3 className="font-serif font-medium text-sidebar-foreground">{user?.displayName}</h3>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent transition-colors"
              onClick={() => {
                logout()
                onItemClick?.()
              }}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-primary/10 p-4 backdrop-blur-sm">
            <h3 className="font-serif font-medium text-sidebar-foreground mb-1">Get Started</h3>
            <p className="text-xs text-sidebar-foreground/60 mb-4">
              Sign in to access your transformations
            </p>
            <div className="space-y-2">
              <Link href="/auth/login" className="block">
                <Button size="sm" className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" onClick={onItemClick}>
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" className="block">
                <Button size="sm" variant="outline" className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground bg-transparent" onClick={onItemClick}>
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header with Menu Button */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b lg:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="invert object-contain w-[32px] h-[32px]"
              />
              <span className="font-semibold text-sm text-primary">Brand Voice Transformer</span>
            </div>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-4">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col h-full">
                  <NavContent onItemClick={() => setIsMobileMenuOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <nav className="w-64 bg-sidebar text-sidebar-foreground min-h-screen p-4 fixed left-0 top-0 overflow-y-auto flex flex-col z-40">
          <NavContent />
        </nav>
      )}
    </>
  )
}