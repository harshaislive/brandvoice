'use client'

import { cn } from '@/lib/utils'
import { Sparkles, MessageCircle, PenTool, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyChatStateProps {
  className?: string
}

export function EmptyChatState({ className }: EmptyChatStateProps) {
  return (
    <div
      className={cn(
        "flex-1 flex items-center justify-center p-8 h-full",
        className
      )}
    >
      <div className="text-center max-w-lg space-y-8">
        <div className="flex justify-center">
           <div className="h-20 w-20 rounded-full bg-secondary/30 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl animate-pulse" />
              <Sparkles className="h-8 w-8 text-primary opacity-80" />
           </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-serif font-light text-foreground">
             How can I help you today?
          </h2>
          <p className="text-muted-foreground text-lg font-light leading-relaxed">
             I&apos;m here to help you craft content with your authentic brand voice.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
           <Button variant="outline" className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-background hover:bg-secondary/20 hover:border-primary/20 transition-all group">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary">
                 <PenTool className="h-3 w-3" /> Blog Post
              </span>
              <span className="text-sm font-medium text-foreground text-left">
                 Draft an article about sustainability trends
              </span>
           </Button>

           <Button variant="outline" className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-background hover:bg-secondary/20 hover:border-primary/20 transition-all group">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary">
                 <MessageCircle className="h-3 w-3" /> Social Media
              </span>
              <span className="text-sm font-medium text-foreground text-left">
                 Create a LinkedIn post announcing a new product
              </span>
           </Button>

           <Button variant="outline" className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-background hover:bg-secondary/20 hover:border-primary/20 transition-all group">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground group-hover:text-primary">
                 <Zap className="h-3 w-3" /> Tagline
              </span>
              <span className="text-sm font-medium text-foreground text-left">
                 Brainstorm punchy taglines for a campaign
              </span>
           </Button>
        </div>
      </div>
    </div>
  )
}
