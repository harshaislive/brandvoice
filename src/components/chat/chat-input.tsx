'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserLocation {
  country: string
  city: string
  region: string
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isLoading?: boolean
  enableWebSearch?: boolean
  onWebSearchToggle?: (enabled: boolean) => void
  userLocation?: UserLocation
  onLocationChange?: (location: UserLocation) => void
  className?: string
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  enableWebSearch = false,
  onWebSearchToggle,
  userLocation,
  onLocationChange,
  className
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading) {
        onSend()
      }
    }
  }

  const handleLocationChange = () => {
    if (!onLocationChange || !userLocation) return
    
    const newLocation = prompt(
      'Enter your location (City, Country)', 
      `${userLocation.city}, ${userLocation.country}`
    )
    
    if (newLocation) {
      const [city, country] = newLocation.split(',').map(s => s.trim())
      onLocationChange({ 
        city: city || 'New York', 
        country: country || 'US', 
        region: city || 'New York' 
      })
    }
  }

  const canSend = value.trim() && !isLoading

  return (
    <div 
      className={cn(
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 transition-all duration-200",
        "mobile-input-container", // Add mobile-specific classes
        isFocused && "border-primary/20",
        className
      )}
    >
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* Modern Web Search Toggle - ChatGPT Style */}
        {onWebSearchToggle && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant={enableWebSearch ? "default" : "outline"}
                size="sm"
                onClick={() => onWebSearchToggle(!enableWebSearch)}
                className={cn(
                  "rounded-full px-3 py-1 h-7 text-xs font-medium transition-all",
                  enableWebSearch 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                    : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <svg className="w-3 h-3 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                Search {enableWebSearch ? 'enabled' : 'web'}
              </Button>
              
              {enableWebSearch && userLocation && onLocationChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLocationChange}
                  className="rounded-full px-3 py-1 h-7 text-xs text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                >
                  🌐 {userLocation.city}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ChatGPT-style Message Input */}
        <div className="relative">
          <div className={cn(
            "relative flex items-center gap-2 rounded-3xl border border-border/50",
            "bg-background/60 backdrop-blur-sm transition-all duration-200",
            "hover:border-border focus-within:border-primary/50 focus-within:shadow-sm",
            isFocused && "border-primary/50 shadow-sm"
          )}>
            <Textarea
              ref={textareaRef}
              placeholder={enableWebSearch 
                ? "Message ChatGPT..."
                : "Message ChatGPT..."
              }
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "min-h-[52px] max-h-32 resize-none bg-transparent border-0",
                "text-base sm:text-sm leading-6 placeholder:text-muted-foreground/60",
                "focus:ring-0 focus:outline-none px-4 py-3 pr-12",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
              disabled={isLoading}
              aria-label="Type your message"
              rows={1}
            />
            
            {/* ChatGPT-style send button */}
            <Button
              onClick={onSend}
              disabled={!canSend}
              size="icon"
              className={cn(
                "absolute right-2 h-8 w-8 rounded-full transition-all duration-200",
                "flex items-center justify-center",
                canSend 
                  ? "bg-foreground text-background hover:bg-foreground/90 scale-100" 
                  : "bg-muted text-muted-foreground scale-95 cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Help text */}
        <div 
          id="input-help"
          className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-1"
        >
          <span>Press Enter to send, Shift+Enter for new line</span>
          {enableWebSearch && (
            <span className="text-blue-600 dark:text-blue-400">
              • Web search enabled for real-time information
            </span>
          )}
        </div>
      </div>
    </div>
  )
}