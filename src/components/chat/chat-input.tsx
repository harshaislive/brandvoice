'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Globe, MapPin } from 'lucide-react'
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
        "bg-background/80 backdrop-blur-md transition-all duration-200 pb-6 pt-2 px-6 w-full border-t border-border/40",
        "mobile-input-container", 
        className
      )}
    >
      <div className="max-w-4xl mx-auto">
        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
           <div className="flex items-center gap-2">
             {onWebSearchToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onWebSearchToggle(!enableWebSearch)}
                  className={cn(
                    "rounded-full px-3 h-8 text-xs font-medium transition-all gap-2 border",
                    enableWebSearch
                      ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Globe className="w-3 h-3" />
                  {enableWebSearch ? 'Web Enabled' : 'Search Web'}
                </Button>
              )}
           </div>
           
           {enableWebSearch && userLocation && onLocationChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLocationChange}
                className="rounded-full px-3 h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <MapPin className="h-3 w-3" /> {userLocation.city}
              </Button>
            )}
        </div>

        {/* Input Field */}
        <div className="relative group">
          <div className={cn(
            "relative flex items-end gap-2 rounded-2xl border border-border/60",
            "bg-background/50 shadow-sm transition-all duration-200",
            "hover:border-border/80 hover:shadow-md",
            isFocused && "border-primary/30 ring-1 ring-primary/10 shadow-md bg-background"
          )}>
            <Textarea
              ref={textareaRef}
              placeholder="Ask anything about your brand voice..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "min-h-[56px] max-h-48 resize-none bg-transparent border-0",
                "text-base leading-relaxed placeholder:text-muted-foreground/50 placeholder:font-serif placeholder:italic",
                "focus:ring-0 focus:outline-none px-5 py-4 pr-14",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent rounded-2xl"
              )}
              disabled={isLoading}
              rows={1}
            />

            <div className="pb-3 pr-3">
               <Button
                  onClick={onSend}
                  disabled={!canSend}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-300 shadow-sm",
                    canSend
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-md"
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-3">
           <p className="text-[10px] text-muted-foreground/50 font-medium">
              AI Generated Content • Review for accuracy
           </p>
        </div>
      </div>
    </div>
  )
}
