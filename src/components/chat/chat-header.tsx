'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

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
  return (
    <div className="w-full bg-background border-b border-border flex-shrink-0">
      <div className="flex h-16 items-center justify-between px-6 w-full">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="invert object-contain w-[32px] h-[32px] flex-shrink-0"
          />
          <h1 
            className="text-xl font-bold text-foreground truncate"
            title={activeConversation?.title || 'AI Chat'}
          >
            {activeConversation?.title || 'AI Chat'}
          </h1>
        </div>
        
        {/* Right: Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
            🤖 GPT-5
          </Badge>
          {enableWebSearch && (
            <Badge variant="default" className="text-xs font-medium px-3 py-1 bg-blue-600">
              🔍 Search Active
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}