'use client'

import { useEffect, useRef, forwardRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './chat-message'
import { VirtualizedMessages } from './virtualized-messages'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  conversation_id: string
  isLoading?: boolean
  isSearching?: boolean
  searchQuery?: string
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  enableVirtualization?: boolean
  virtualizationThreshold?: number
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ 
    messages, 
    isLoading, 
    className,
    enableVirtualization = true,
    virtualizationThreshold = 50
  }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = (smooth = true) => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }

    // Auto-scroll when new messages arrive
    useEffect(() => {
      if (messages.length > 0) {
        const timer = setTimeout(() => scrollToBottom(), 100)
        return () => clearTimeout(timer)
      }
    }, [messages.length])

    // Scroll when streaming content updates
    useEffect(() => {
      const hasStreamingMessage = messages.some(m => m.isLoading || m.isSearching)
      if (hasStreamingMessage) {
        scrollToBottom(false) // Immediate scroll for streaming
      }
    }, [messages])

    // Use virtualization for better performance with many messages
    const shouldVirtualize = enableVirtualization && messages.length > virtualizationThreshold

    if (messages.length === 0) {
      return (
        <div 
          className={cn(
            "flex-1 flex flex-col items-center justify-center text-center p-4",
            className
          )}
          role="main"
          aria-label="Chat conversation"
        >
          <div className="max-w-md space-y-4">
            <div className="text-6xl mb-4 opacity-50" aria-hidden="true">💭</div>
            <h2 className="text-lg font-medium mb-2">Start the conversation</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ask questions about brand voice or request content transformations.
            </p>
          </div>
        </div>
      )
    }

    if (shouldVirtualize) {
      return (
        <VirtualizedMessages
          ref={ref}
          messages={messages}
          isLoading={isLoading}
          className={className}
          onScrollToBottom={() => scrollToBottom(false)}
        />
      )
    }

    // Standard scrolling implementation for smaller message lists
    return (
      <div 
        ref={ref}
        className={cn("chat-messages-container", className)}
        role="main"
        aria-label="Chat conversation"
      >
        <ScrollArea className="h-full w-full" type="always">
          <div 
            ref={containerRef}
            className="p-4 pb-4 md:pb-24 max-w-4xl mx-auto space-y-1"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isLoading && index === messages.length - 1}
                className="scroll-mt-4"
              />
            ))}
            <div 
              ref={messagesEndRef} 
              className="h-1"
              aria-hidden="true"
            />
          </div>
        </ScrollArea>
      </div>
    )
  }
)

ChatMessages.displayName = 'ChatMessages'