'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ChatErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error) => void
  className?: string
}

export class ChatErrorBoundary extends React.Component<
  ChatErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          retry={this.retry}
          className={this.props.className}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  retry: () => void
  className?: string
}

function DefaultErrorFallback({ error, retry, className }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div 
      className={cn(
        "flex-1 flex items-center justify-center p-4",
        className
      )}
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle 
              className="h-8 w-8 text-destructive" 
              aria-hidden="true"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 
            id="error-title"
            className="text-xl font-semibold text-foreground"
          >
            Something went wrong
          </h2>
          <p 
            id="error-description"
            className="text-muted-foreground text-sm leading-relaxed"
          >
            {isDevelopment 
              ? `Error: ${error.message}`
              : "We encountered an unexpected error. Please try again."
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={retry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
          >
            Reload Page
          </Button>
        </div>

        {isDevelopment && (
          <details className="text-left mt-6">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Error Details (Development)
            </summary>
            <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Hook for functional components to handle errors
export function useChatErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Chat error:', error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError,
  }
}