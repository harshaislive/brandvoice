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
      <div className="mb-8 flex flex-col items-center text-center space-y-3">
        <Image
          src="/logo.png"
          alt="Logo"
          width={60}
          height={60}
          className="invert object-contain w-[60px] h-[60px] sm:w-[80px] sm:h-[80px]"
        />
        <p className="text-base sm:text-lg font-semibold text-[#342e29] leading-tight">
          Brand Voice Transformer
        </p>
      </div>

      <div className="space-y-2 flex-1">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Button
              key={item.href}
              variant={pathname === item.href ? 'default' : 'ghost'}
              className="w-full justify-start gap-3 h-11 text-sm"
              asChild
              onClick={onItemClick}
            >
              <Link href={item.href}>
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-auto">
        {isAuthenticated ? (
          <Card className="p-3 sm:p-4 bg-accent/50">
            <div className="mb-3">
              <h3 className="font-medium text-sm">{user?.displayName}</h3>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full h-9"
              onClick={() => {
                logout()
                onItemClick?.()
              }}
            >
              Sign Out
            </Button>
          </Card>
        ) : (
          <Card className="p-3 sm:p-4 bg-accent/50">
            <h3 className="font-medium mb-2 text-sm">Get Started</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Sign in to access your transformations
            </p>
            <div className="space-y-2">
              <Link href="/auth/login">
                <Button size="sm" className="w-full h-9" onClick={onItemClick}>
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" variant="outline" className="w-full h-9" onClick={onItemClick}>
                  Create Account
                </Button>
              </Link>
            </div>
          </Card>
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