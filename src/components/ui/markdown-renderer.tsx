'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'


interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground border-b pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mt-3 mb-2 text-foreground">
              {children}
            </h4>
          ),
          
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-3 text-foreground">
              {children}
            </p>
          ),
          
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-3 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-3 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground">
              {children}
            </li>
          ),
          
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          
          // Inline code
          code: ({ inline, className, children }: {inline?: boolean, className?: string, children?: React.ReactNode}) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
            
            if (!inline && language) {
              return (
                <div className="relative my-4 rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {language}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-muted/60 rounded-md"
                      onClick={() => copyToClipboard(String(children), codeId)}
                    >
                      {copiedCode === codeId ? (
                        <><Check className="h-3 w-3 mr-1" />Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" />Copy</>
                      )}
                    </Button>
                  </div>
                  <div className="overflow-x-auto max-w-full">
                    <pre className="p-4 text-sm bg-transparent">
                      <code className="font-mono text-foreground/90 leading-relaxed block whitespace-pre overflow-x-auto">
                        {String(children).replace(/\n$/, '')}
                      </code>
                    </pre>
                  </div>
                </div>
              )
            }
            
            return (
              <code className="relative rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {children}
              </code>
            )
          },
          
          // Block quotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted-foreground/25 pl-4 italic text-muted-foreground my-4">
              {children}
            </blockquote>
          ),
          
          // Tables with proper overflow handling
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto max-w-full rounded-lg border">
              <table className="w-full border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted/50 px-3 py-2 text-left font-medium text-sm">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">
              {children}
            </td>
          ),
          
          // Horizontal rule
          hr: () => <Separator className="my-6" />,
          
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}