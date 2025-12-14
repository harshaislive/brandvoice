'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

interface ChatHeaderProps {
  activeConversation?: Conversation | null
  enableWebSearch?: boolean
  className?: string
}

export function ChatHeader({
  activeConversation,
  enableWebSearch
}: ChatHeaderProps) {
  const isMobile = useIsMobile()

  return (
    <div className="w-full bg-background/80 backdrop-blur-md border-b border-border/40 flex-shrink-0 sticky top-0 z-20">
      <div className="flex h-16 items-center justify-between px-6 w-full max-w-5xl mx-auto">
        {/* Left: Mobile trigger, Logo and Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          {isMobile && (
            <SidebarTrigger className="mr-2 p-2 hover:bg-secondary/50 rounded-full transition-colors" aria-label="Open chat history" />
          )}
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="invert object-contain w-[20px] h-[20px] opacity-80"
                />
             </div>
             <div className="flex flex-col justify-center">
                <h1
                  className="text-lg font-serif font-medium text-foreground truncate leading-tight"
                  title={activeConversation?.title || 'AI Assistant'}
                >
                  {activeConversation?.title || 'AI Assistant'}
                </h1>
                {activeConversation && (
                   <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                      Conversation
                   </span>
                )}
             </div>
          </div>
        </div>

        {/* Right: Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1 bg-secondary/50 border-transparent text-muted-foreground">
            <span className="hidden sm:inline">GPT-5</span>
            <span className="sm:hidden">AI</span>
          </Badge>
          {enableWebSearch && (
            <Badge variant="outline" className="text-xs font-medium px-3 py-1 border-blue-200 text-blue-700 bg-blue-50">
              <span className="hidden sm:inline">Search Active</span>
              <span className="sm:hidden">Web</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
