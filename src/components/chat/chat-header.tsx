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
    <div className="w-full bg-background border-b border-border flex-shrink-0">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 w-full">
        {/* Left: Mobile trigger, Logo and Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          {isMobile && (
            <SidebarTrigger className="mr-2 p-2 hover:bg-accent rounded-md transition-colors" aria-label="Open chat history" />
          )}
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="invert object-contain w-[32px] h-[32px] flex-shrink-0"
          />
          <h1 
            className="text-base md:text-xl font-bold text-foreground truncate"
            title={activeConversation?.title || 'AI Chat'}
          >
            {activeConversation?.title || 'AI Chat'}
          </h1>
        </div>
        
        {/* Right: Badges */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Badge variant="secondary" className="text-xs font-medium px-2 md:px-3 py-1">
            <span className="hidden sm:inline">🤖 GPT-5</span>
            <span className="sm:hidden">🤖</span>
          </Badge>
          {enableWebSearch && (
            <Badge variant="default" className="text-xs font-medium px-2 md:px-3 py-1 bg-blue-600">
              <span className="hidden sm:inline">🔍 Search Active</span>
              <span className="sm:hidden">🔍</span>
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}