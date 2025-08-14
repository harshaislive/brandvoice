'use client'

import { forwardRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  conversation_id: string
  isLoading?: boolean
  isSearching?: boolean
  searchQuery?: string
}

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
  className?: string
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, isStreaming, className }, ref) => {
    const isUser = message.role === 'user'
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex gap-2 sm:gap-3 mb-4 sm:mb-6 px-1 sm:px-0",
          isUser ? "justify-end" : "justify-start",
          "chat-message", // Add class for mobile CSS targeting
          className
        )}
        role="article"
        aria-label={`${isUser ? 'Your' : 'AI'} message from ${new Date(message.timestamp).toLocaleTimeString()}`}
      >
        {!isUser && (
          <Avatar 
            className="shrink-0 w-8 h-8"
            role="img"
            aria-label="AI Assistant"
          >
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              AI
            </AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={cn(
            "max-w-[90%] sm:max-w-[85%] md:max-w-[75%] message-container",
            "px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-lg",
            "transition-all duration-200 text-sm sm:text-base",
            "touch-pan-y", // Allow vertical scrolling through messages
            isUser 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "bg-card border border-border shadow-sm"
          )}
        >
          {message.isLoading ? (
            <LoadingContent />
          ) : message.content === '' && !isUser ? (
            <SearchingContent isSearching={message.isSearching} />
          ) : (
            <MessageContent 
              message={message} 
              isUser={isUser} 
              isStreaming={isStreaming} 
            />
          )}
          
          <MessageTimestamp 
            timestamp={message.timestamp} 
            isUser={isUser} 
          />
        </div>
      </div>
    )
  }
)

ChatMessage.displayName = 'ChatMessage'

function LoadingContent() {
  return (
    <div className="space-y-2" role="status" aria-label="AI is thinking">
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"
          aria-hidden="true"
        />
        <span className="text-sm">Thinking...</span>
      </div>
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

function SearchingContent({ isSearching }: { isSearching?: boolean }) {
  return (
    <div className="space-y-2" role="status" aria-label={isSearching ? "Searching the web" : "Loading"}>
      {isSearching && (
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"
            aria-hidden="true"
          />
          <span className="text-sm text-blue-600">🔍 Searching the web...</span>
        </div>
      )}
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function MessageContent({ 
  message, 
  isUser, 
  isStreaming 
}: { 
  message: ChatMessage
  isUser: boolean
  isStreaming?: boolean
}) {
  return (
    <div className="relative">
      {isUser ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>
      ) : (
        <MarkdownRenderer 
          content={message.content}
          className="text-sm leading-relaxed"
        />
      )}
      
      {!isUser && isStreaming && message.content && !message.isSearching && (
        <span 
          className="inline-block w-2 h-4 bg-current animate-pulse ml-1 align-baseline opacity-70"
          aria-label="AI is typing"
        >
          |
        </span>
      )}
      
      {message.isSearching && (
        <div 
          className="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800"
          role="status"
          aria-label="Searching the web"
        >
          <div 
            className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"
            aria-hidden="true"
          />
          <span className="text-xs text-blue-600 dark:text-blue-400">
            🔍 Searching the web...
          </span>
        </div>
      )}
    </div>
  )
}

function MessageTimestamp({ timestamp, isUser }: { timestamp: string; isUser: boolean }) {
  const timeString = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  return (
    <p 
      className={cn(
        "text-xs mt-2",
        isUser 
          ? "text-primary-foreground/70" 
          : "text-muted-foreground"
      )}
      aria-label={`Message sent at ${timeString}`}
    >
      {timeString}
    </p>
  )
}