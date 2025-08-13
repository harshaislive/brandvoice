'use client'

import { useEffect, useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.error('Global error:', error)
  }, [error])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4 text-red-600">Application Error</h1>
        <p className="text-gray-600 mb-4">
          Something went wrong with the Beforest Brand Voice Transformer.
        </p>
        {error.digest && (
          <div className="bg-gray-100 p-3 rounded text-sm mb-4">
            <strong>Error ID:</strong> {error.digest}
          </div>
        )}
        <details className="text-left bg-gray-100 p-3 rounded text-sm mb-4">
          <summary className="cursor-pointer font-medium mb-2">
            Technical Details
          </summary>
          <pre className="whitespace-pre-wrap text-xs">
            {error.message}
          </pre>
        </details>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}