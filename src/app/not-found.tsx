'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-lg mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist in the Beforest Brand Voice Transformer.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            href="/" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link 
            href="/history" 
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}