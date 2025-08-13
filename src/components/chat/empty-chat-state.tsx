'use client'

import { cn } from '@/lib/utils'

interface EmptyChatStateProps {
  className?: string
}

export function EmptyChatState({ className }: EmptyChatStateProps) {
  return (
    <div 
      className={cn(
        "flex-1 flex items-center justify-center p-4",
        className
      )}
      role="main"
      aria-label="No conversation selected"
    >
      <div className="text-center max-w-md space-y-4">
        <div className="text-4xl mb-4" aria-hidden="true">💬</div>
        <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Choose a conversation from the sidebar or start a new one to begin chatting.
        </p>
      </div>
    </div>
  )
}