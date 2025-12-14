'use client'

import { forwardRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { cn } from '@/lib/utils'
import Image from 'next/image'

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
          "flex gap-4 mb-6 sm:mb-8 px-1 sm:px-0 group",
          isUser ? "justify-end" : "justify-start",
          className
        )}
      >
        {!isUser && (
          <div className="shrink-0 h-9 w-9 rounded-full bg-primary flex items-center justify-center mt-1 shadow-sm">
             <Image
               src="/logo.png"
               alt="AI"
               width={18}
               height={18}
               className="invert brightness-0 saturate-100 object-contain filter invert-[1]"
             />
          </div>
        )}

        <div
          className={cn(
            "max-w-[90%] sm:max-w-[85%] md:max-w-[75%]",
            "flex flex-col",
            isUser ? "items-end" : "items-start"
          )}
        >
          <div className={cn(
             "px-6 py-4 shadow-sm relative",
             isUser 
               ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
               : "bg-card border border-border/50 rounded-2xl rounded-tl-sm text-foreground"
          )}>
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
          </div>

          <span className={cn(
             "text-[10px] text-muted-foreground/60 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity px-1",
             isUser ? "text-right" : "text-left"
          )}>
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isUser && (
           <Avatar className="shrink-0 h-9 w-9 mt-1 border border-border/50 shadow-sm">
             <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-serif font-medium">
               YOU
             </AvatarFallback>
           </Avatar>
        )}
      </div>
    )
  }
)

ChatMessage.displayName = 'ChatMessage'

function LoadingContent() {
  return (
    <div className="flex items-center gap-3 min-w-[100px]">
       <span className="text-xs font-medium text-muted-foreground">Thinking</span>
       <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s] opacity-50"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s] opacity-50"></div>
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce opacity-50"></div>
       </div>
    </div>
  )
}

function SearchingContent({ isSearching }: { isSearching?: boolean }) {
  return (
    <div className="space-y-3">
      {isSearching && (
        <div className="flex items-center gap-3">
           <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
           <span className="text-sm text-blue-700 font-medium">Searching the web...</span>
        </div>
      )}
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
        <p className="whitespace-pre-wrap text-base leading-relaxed font-sans">
          {message.content}
        </p>
      ) : (
        <MarkdownRenderer
          content={message.content}
          className="text-base leading-relaxed font-sans prose-neutral prose-p:leading-relaxed prose-headings:font-serif prose-headings:font-medium"
        />
      )}

      {!isUser && isStreaming && message.content && !message.isSearching && (
        <span className="inline-block w-1.5 h-4 bg-primary/40 animate-pulse ml-1 align-middle" />
      )}

      {message.isSearching && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
           <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
           <span className="text-xs text-blue-600 font-medium">Searching updates...</span>
        </div>
      )}
    </div>
  )
}
