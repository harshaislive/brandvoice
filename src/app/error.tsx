'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            ⚠️ Application Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Something went wrong with the Beforest Brand Voice Transformer.
            </p>
            {error.digest && (
              <div className="bg-muted p-3 rounded text-sm mb-4">
                <strong>Error ID:</strong> {error.digest}
              </div>
            )}
            <details className="text-left bg-muted p-3 rounded text-sm">
              <summary className="cursor-pointer font-medium mb-2">
                Technical Details
              </summary>
              <pre className="whitespace-pre-wrap text-xs">
                {error.message}
              </pre>
            </details>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset}>
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}