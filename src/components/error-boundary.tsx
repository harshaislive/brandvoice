'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-muted-foreground mb-4">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
                {this.state.error && (
                  <details className="text-left bg-muted p-3 rounded text-sm">
                    <summary className="cursor-pointer font-medium mb-2">
                      Error Details
                    </summary>
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Refresh Page
                </Button>
                <Button
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}