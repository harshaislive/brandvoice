'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
        "chat-input-area mobile-input-container", // Add mobile-specific classes
        isFocused && "border-primary/20",
        className
      )}
    >
      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {/* Web Search Controls */}
        {onWebSearchToggle && (
          <div 
            className="flex items-center justify-between mb-3 p-3 bg-muted/30 rounded-lg transition-colors duration-200"
            role="region"
            aria-label="Web search settings"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={enableWebSearch}
                        onCheckedChange={onWebSearchToggle}
                        id="web-search"
                        aria-describedby="web-search-description"
                      />
                      <label 
                        htmlFor="web-search" 
                        className="text-sm font-medium cursor-pointer select-none"
                      >
                        Web Search
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p id="web-search-description">
                      Enable real-time web search for up-to-date information
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {enableWebSearch && userLocation && onLocationChange && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    aria-label={`Current location: ${userLocation.city}, ${userLocation.country}`}
                  >
                    🌐 {userLocation.city}, {userLocation.country}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-muted"
                        onClick={handleLocationChange}
                        aria-label="Change location for search results"
                      >
                        📍 Change
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update your location for localized search results</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2 sm:gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={enableWebSearch 
                ? "Ask anything - I can search the web for the latest information..."
                : "Ask about brand voice, request transformations, or chat about content..."
              }
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "min-h-[60px] max-h-32 resize-none transition-all duration-200 pr-12",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
                isFocused && "shadow-sm"
              )}
              disabled={isLoading}
              aria-label="Type your message"
              aria-describedby="input-help"
            />
            
            {/* Send button for mobile - overlaid on textarea */}
            <Button
              onClick={onSend}
              disabled={!canSend}
              size="sm"
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8 p-0 sm:hidden transition-all duration-200",
                canSend 
                  ? "opacity-100 scale-100" 
                  : "opacity-50 scale-90"
              )}
              aria-label="Send message"
            >
              {isLoading ? (
                <div 
                  className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"
                  aria-hidden="true"
                />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          {/* Send button for desktop */}
          <Button
            onClick={onSend}
            disabled={!canSend}
            size="lg"
            className={cn(
              "self-end hidden sm:flex transition-all duration-200",
              canSend && "hover:shadow-md"
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <div 
                className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"
                aria-hidden="true"
              />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
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