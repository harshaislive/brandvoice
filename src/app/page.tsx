'use client'

import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { Sparkles, Zap, History, MessageCircle, Settings, BarChart3 } from 'lucide-react'

export default function Home() {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        
        <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-serif font-bold text-primary mb-4">
                Brand Voice Transformer
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Transform your content with authentic, warm, and premium brand voice
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="gap-2">
                    🚀 Get Started
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="gap-2">
                    🔐 Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 <span>Authentic Voice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Transform content to match genuine, warm, and approachable brand voice
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🌱 <span>Premium Quality</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Maintain premium positioning while staying accessible and expert yet approachable
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 <span>Smart Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track transformation quality and user feedback with detailed analytics
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle>Ready to Transform Your Content?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Whether you need marketing copy, email content, social media posts, or any other content type, 
                  our AI-powered transformation ensures perfect brand alignment every time.
                </p>
                <div className="flex gap-3">
                  <Link href="/auth/register">
                    <Button>Create Account</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline">
                      Sign In to Continue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Logged-in user homepage - minimal and focused
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-semibold text-primary">Welcome back!</h1>
                <p className="text-muted-foreground">Ready to transform some content?</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link href="/transform" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/20 group-hover:scale-[1.02]">
                <CardContent className="p-6 sm:p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Transform Content</h3>
                    <p className="text-muted-foreground">
                      Convert any content to match your authentic brand voice
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button className="w-full group-hover:bg-primary/90">
                      Start Transforming
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/history" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/20 group-hover:scale-[1.02]">
                <CardContent className="p-6 sm:p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-secondary/70 transition-colors">
                    <History className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">View History</h3>
                    <p className="text-muted-foreground">
                      Browse and manage your previous transformations
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      Browse History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/chat" className="group">
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4 text-center space-y-2">
                  <MessageCircle className="h-6 w-6 mx-auto text-primary" />
                  <h4 className="font-medium">Chat</h4>
                  <p className="text-xs text-muted-foreground">Interactive conversations</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings" className="group">
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4 text-center space-y-2">
                  <Settings className="h-6 w-6 mx-auto text-primary" />
                  <h4 className="font-medium">Settings</h4>
                  <p className="text-xs text-muted-foreground">Customize your prompts</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/analytics" className="group">
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-4 text-center space-y-2">
                  <BarChart3 className="h-6 w-6 mx-auto text-primary" />
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-xs text-muted-foreground">Usage insights</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
