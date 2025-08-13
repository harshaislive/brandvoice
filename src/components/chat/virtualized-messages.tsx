'use client'

import { useMemo, useCallback, useRef, useEffect, forwardRef } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { useResizeObserver } from '@/hooks/use-resize-observer'
import { ChatMessage } from './chat-message'
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

interface VirtualizedMessagesProps {
  messages: Message[]
  isLoading?: boolean
  className?: string
  itemHeight?: number
  onScrollToBottom?: () => void
}

const ITEM_HEIGHT = 120 // Approximate height per message
const OVERSCAN_COUNT = 5 // Number of items to render outside visible area

export const VirtualizedMessages = forwardRef<HTMLDivElement, VirtualizedMessagesProps>(
  ({ 
    messages,
    isLoading,
    className,
    itemHeight = ITEM_HEIGHT,
    onScrollToBottom,
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<List>(null)
    const { height } = useResizeObserver(containerRef as React.RefObject<HTMLElement>)

    // Memoize message data for performance
    const messageData = useMemo(() => ({
      messages,
      isLoading,
    }), [messages, isLoading])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (messages.length > 0 && listRef.current) {
        listRef.current.scrollToItem(messages.length - 1, 'end')
      }
    }, [messages.length])

    // Handle manual scroll to bottom
    const scrollToBottom = useCallback(() => {
      if (listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, 'end')
        onScrollToBottom?.()
      }
    }, [messages.length, onScrollToBottom])

    // Render individual message item
    const MessageItem = useCallback(({ index, style, data }: ListChildComponentProps) => {
      const { messages: msgs, isLoading: loading } = data
      const message = msgs[index]
      const isStreaming = loading && index === msgs.length - 1

      return (
        <div
          style={{
            ...style,
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingBottom: '1rem',
          }}
        >
          <ChatMessage
            message={message}
            isStreaming={isStreaming}
            className="max-w-4xl mx-auto"
          />
        </div>
      )
    }, [])

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

    return (
      <div 
        ref={ref || containerRef}
        className={cn("flex-1 overflow-hidden relative", className)}
        role="main"
        aria-label="Chat conversation"
      >
        {height && (
          <List
            ref={listRef}
            height={height}
            width="100%"
            itemCount={messages.length}
            itemSize={itemHeight}
            itemData={messageData}
            overscanCount={OVERSCAN_COUNT}
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {MessageItem}
          </List>
        )}
        
        {/* Scroll to bottom button */}
        {messages.length > 10 && (
          <button
            onClick={scrollToBottom}
            className={cn(
              "absolute bottom-4 right-4 z-10",
              "bg-primary text-primary-foreground",
              "rounded-full p-2 shadow-lg",
              "hover:bg-primary/90 transition-all duration-200",
              "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
            )}
            aria-label="Scroll to bottom of conversation"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

VirtualizedMessages.displayName = 'VirtualizedMessages'