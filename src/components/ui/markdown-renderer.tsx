'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
          code: ({ inline, className, children, ...props }: {inline?: boolean, className?: string, children?: React.ReactNode} & React.HTMLProps<HTMLElement>) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
            
            if (!inline && language) {
              return (
                <div className="relative my-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                    <Badge variant="outline" className="text-xs">
                      {language}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => copyToClipboard(String(children), codeId)}
                    >
                      {copiedCode === codeId ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    // @ts-expect-error - Complex type mismatch between style definition and expected type
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    className="!mt-0 !mb-0 !bg-transparent text-sm"
                    customStyle={{
                      margin: 0,
                      background: 'transparent',
                      padding: '12px 16px',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              )
            }
            
            return (
              <code
                className="relative rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
                {...props}
              >
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
          
          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border rounded-md">
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