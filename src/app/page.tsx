'use client'

import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Sparkles, Zap, History, MessageCircle, Settings, BarChart3, ArrowRight, Target, Leaf } from 'lucide-react'

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="pt-16 lg:pt-0 lg:ml-64 min-h-screen flex flex-col justify-center">
          <div className="max-w-5xl mx-auto px-6 sm:px-12 py-12 lg:py-20 w-full">
            <div className="text-center mb-16 lg:mb-24 space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium tracking-wide mb-4">
                BEFOREST BRAND VOICE
              </div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-light text-foreground leading-[1.1] tracking-tight">
                Brand Voice <span className="italic text-primary">Assistant</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                Generate and refine content aligned with Beforest&apos;s brand guidelines.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
                <Link href="/auth/register">
                  <Button size="lg" className="h-14 px-8 text-lg font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Start Transforming <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium rounded-full border-primary/20 text-primary hover:bg-primary/5 transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <div className="p-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm text-2xl">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-medium mb-3">Voice Generation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatically align content with brand tone guidelines.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                 <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm text-2xl">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-medium mb-3">Quality Check</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ensure content meets professional standards and brand compliance.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                 <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm text-2xl">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-medium mb-3">Usage Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor usage and transformation metrics.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Logged-in user homepage
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-6 sm:p-12 lg:p-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
             <h1 className="text-4xl sm:text-5xl font-serif font-light text-foreground mb-3">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.displayName?.split(' ')[0] || 'there'}.
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              Select a tool to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Link href="/transform" className="group block h-full">
              <div className="h-full p-8 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium mb-2">Transform Content</h3>
                  <p className="text-muted-foreground mb-8 max-w-xs">
                    Convert content to match brand guidelines.
                  </p>
                  <span className="inline-flex items-center text-primary font-medium group-hover:underline underline-offset-4">
                    Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/history" className="group block h-full">
              <div className="h-full p-8 rounded-2xl border border-border bg-card hover:shadow-lg hover:border-secondary-foreground/20 transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <History className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-6 group-hover:bg-secondary/80 transition-colors">
                    <History className="h-7 w-7 text-secondary-foreground" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium mb-2">View History</h3>
                  <p className="text-muted-foreground mb-8 max-w-xs">
                    Access archive of previous transformations.
                  </p>
                   <span className="inline-flex items-center text-foreground font-medium group-hover:underline underline-offset-4">
                    Browse Archive <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link href="/chat" className="group block">
              <div className="p-6 rounded-xl border border-border bg-card hover:bg-accent/10 transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-serif font-medium text-lg">Chat</h4>
                </div>
                <p className="text-sm text-muted-foreground">Interactive conversations with your brand assistant.</p>
              </div>
            </Link>

            <Link href="/settings" className="group block">
              <div className="p-6 rounded-xl border border-border bg-card hover:bg-accent/10 transition-colors">
                 <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Settings className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h4 className="font-serif font-medium text-lg">Settings</h4>
                </div>
                <p className="text-sm text-muted-foreground">Customize your prompts and preferences.</p>
              </div>
            </Link>

            <Link href="/analytics" className="group block">
              <div className="p-6 rounded-xl border border-border bg-card hover:bg-accent/10 transition-colors">
                 <div className="flex items-center gap-4 mb-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <BarChart3 className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <h4 className="font-serif font-medium text-lg">Analytics</h4>
                </div>
                <p className="text-sm text-muted-foreground">View usage insights and performance stats.</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}