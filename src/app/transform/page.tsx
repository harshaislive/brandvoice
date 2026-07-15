'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, FileText, LoaderCircle, RotateCcw, Sparkles, TriangleAlert, Users } from 'lucide-react'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

type TransformResult = {
  transformed_content: string
  transformation_id: string
  original_length: number
  transformed_length: number
  length_change_percent: number
  processing_time_ms: number
  quality_score: number
  justification: Record<string, unknown>
}

const CONTENT_TYPES = [
  ['email', 'Email'],
  ['social', 'Social media'],
  ['marketing', 'Marketing copy'],
  ['blog', 'Blog post'],
  ['website', 'Website copy'],
  ['product', 'Product description'],
  ['custom', 'Custom type'],
] as const

const TARGET_AUDIENCES = [
  'General Consumers',
  'Health Enthusiasts',
  'Eco-conscious Shoppers',
  'Premium Customers',
  'Young Professionals',
  'Wellness Community',
  'Sustainability Advocates',
  'Luxury Market',
  'Fitness Community',
  'Mindful Living',
  'custom',
]

function ResultContent({ content }: { content: string }) {
  const hasMarkdown = /(\*\*|__|##|###|\[.*\]\(.*\)|`.*`|\n[-*]|\n\d+\.)/.test(content)
  if (!hasMarkdown) return <p className="whitespace-pre-wrap leading-8 text-[#e7ded1]">{content}</p>

  return (
    <div className="prose prose-invert max-w-none prose-headings:font-serif prose-p:leading-8 prose-p:text-[#e7ded1] prose-li:text-[#e7ded1]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

export default function TransformPage() {
  const { isAuthenticated } = useAuth()
  const [previewMode, setPreviewMode] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [contentType, setContentType] = useState('')
  const [customContentType, setCustomContentType] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [customAudience, setCustomAudience] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [result, setResult] = useState<TransformResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPreviewMode(process.env.NODE_ENV === 'development' && window.location.search.includes('preview=1'))
  }, [])

  const finalContentType = contentType === 'custom' ? customContentType.trim() : contentType
  const finalAudience = targetAudience === 'custom' ? customAudience.trim() : targetAudience
  const canTransform = Boolean(originalContent.trim() && finalContentType && finalAudience && !isTransforming)

  const handleTransform = async () => {
    if (!canTransform) {
      setError('Add your content, audience, and content type to continue.')
      toast.error('Complete the required fields first')
      return
    }

    setError(null)
    setResult(null)
    setIsTransforming(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          original_content: originalContent,
          content_type: finalContentType,
          target_audience: finalAudience,
          additional_context: additionalContext,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Transformation failed')
      }

      setResult(await response.json())
      toast.success('Transformation complete')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Transformation failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsTransforming(false)
    }
  }

  const copyToClipboard = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.transformed_content)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy the transformation')
    }
  }

  const reset = () => {
    setOriginalContent('')
    setContentType('')
    setCustomContentType('')
    setTargetAudience('')
    setCustomAudience('')
    setAdditionalContext('')
    setResult(null)
    setError(null)
  }

  if (!isAuthenticated && !previewMode) {
    return (
      <div className="min-h-screen bg-[#2b2724] text-[#f4eee4]">
        <Navigation />
        <main className="flex min-h-screen items-center justify-center px-6 lg:ml-[280px]">
          <div className="max-w-sm text-center">
            <h1 className="font-serif text-3xl">Sign in to transform</h1>
            <p className="mt-3 text-sm leading-6 text-[#bdb3a5]">Your transformations are saved to your private history.</p>
            <Button onClick={() => { window.location.href = '/auth/login' }} className="mt-7 bg-[#3d5d43] text-[#f4eee4] hover:bg-[#496d50]">Sign in</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2b2724] text-[#f4eee4]">
      <Navigation preview={previewMode} />
      <main className="min-h-screen px-5 pb-16 pt-24 sm:px-10 lg:ml-[280px] lg:px-16 lg:pt-20">
        <div className="mx-auto max-w-[900px]">
          <header className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#9fbd91]">Beforest brand voice</p>
            <h1 className="mt-5 font-serif text-4xl leading-tight text-[#f4eee4] sm:text-5xl">Transform your message.<br />Find your voice.</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-[#bdb3a5]">Paste your content below and we&apos;ll refine it to match your audience and content type.</p>
          </header>

          <section className="mt-12" aria-labelledby="source-content-label">
            <Label id="source-content-label" htmlFor="source-content" className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a9a092]">Source content</Label>
            <div className="relative mt-3">
              <Textarea
                id="source-content"
                value={originalContent}
                onChange={(event) => setOriginalContent(event.target.value)}
                placeholder="Paste your content here..."
                maxLength={10000}
                className="min-h-[190px] resize-none rounded-xl border-[#62584e] bg-[#312d29] p-6 text-base leading-7 text-[#f4eee4] placeholder:text-[#948b80] focus:border-[#8eae82] focus:ring-[#8eae82]/30"
              />
              <span className="absolute bottom-3 right-4 text-[11px] text-[#8f877d]">{originalContent.length.toLocaleString()} / 10,000</span>
            </div>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2" aria-label="Transformation context">
            <div>
              <Label className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#a9a092]"><Users className="h-4 w-4" /> Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="h-14 rounded-xl border-[#62584e] bg-[#312d29] text-[#e7ded1] focus:ring-[#8eae82]/30"><SelectValue placeholder="Select audience" /></SelectTrigger>
                <SelectContent className="border-[#62584e] bg-[#312d29] text-[#e7ded1]">
                  {TARGET_AUDIENCES.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}
                </SelectContent>
              </Select>
              {targetAudience === 'custom' && <Input value={customAudience} onChange={(event) => setCustomAudience(event.target.value)} placeholder="Describe the audience" className="mt-2 h-11 border-[#62584e] bg-[#312d29] text-[#f4eee4]" />}
            </div>
            <div>
              <Label className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#a9a092]"><FileText className="h-4 w-4" /> Content type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="h-14 rounded-xl border-[#62584e] bg-[#312d29] text-[#e7ded1] focus:ring-[#8eae82]/30"><SelectValue placeholder="Select content type" /></SelectTrigger>
                <SelectContent className="border-[#62584e] bg-[#312d29] text-[#e7ded1]">
                  {CONTENT_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              {contentType === 'custom' && <Input value={customContentType} onChange={(event) => setCustomContentType(event.target.value)} placeholder="Describe the content type" className="mt-2 h-11 border-[#62584e] bg-[#312d29] text-[#f4eee4]" />}
            </div>
          </section>

          <section className="mt-7" aria-live="polite" aria-busy={isTransforming}>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#a9a092]">Transformed content</Label>
              {result && <Button type="button" onClick={copyToClipboard} variant="ghost" size="sm" className="gap-2 text-[#9fbd91] hover:bg-[#3a3530] hover:text-[#c1d8b4]"><Copy className="h-4 w-4" /> Copy</Button>}
            </div>
            <div className={`min-h-[150px] rounded-xl border p-6 ${result ? 'border-[#62584e] bg-[#312d29]' : error ? 'border-[#8d6256] bg-[#382e2b]' : 'border-[#62584e] bg-[#312d29]'}`}>
              {isTransforming ? (
                <div className="flex min-h-[110px] items-center justify-center gap-3 text-sm text-[#bdb3a5]"><LoaderCircle className="h-5 w-5 animate-spin text-[#9fbd91]" /> Refining your message…</div>
              ) : error ? (
                <div className="flex min-h-[110px] flex-col items-center justify-center text-center"><TriangleAlert className="h-5 w-5 text-[#d79d86]" /><p className="mt-3 text-sm text-[#e1c0b1]">{error}</p><Button type="button" onClick={() => { setError(null); void handleTransform() }} variant="ghost" className="mt-2 gap-2 text-[#e0b8a7] hover:bg-[#463530] hover:text-[#f0d1c2]"><RotateCcw className="h-4 w-4" /> Try again</Button></div>
              ) : result ? (
                <ResultContent content={result.transformed_content} />
              ) : (
                <div className="flex min-h-[110px] items-center justify-center text-center text-sm text-[#8f877d]">Your transformed content will appear here.</div>
              )}
            </div>
            {result && <p className="mt-3 text-right text-[11px] text-[#8f877d]">{result.processing_time_ms}ms · {result.transformed_length.toLocaleString()} characters</p>}
          </section>

          <Button type="button" onClick={handleTransform} disabled={!canTransform} className="mt-8 h-14 w-full rounded-xl bg-[#3d5d43] text-base font-medium text-[#f4eee4] hover:bg-[#496d50] disabled:bg-[#3d5d43]/40 disabled:text-[#bdb3a5]">
            {isTransforming ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Transforming</> : <><Sparkles className="mr-2 h-5 w-5" /> Transform</>}
          </Button>
          {result && <Button type="button" onClick={reset} variant="ghost" className="mx-auto mt-3 flex gap-2 text-[#a9a092] hover:bg-[#3a3530] hover:text-[#f4eee4]"><RotateCcw className="h-4 w-4" /> Start a new transformation</Button>}
          <p className="mt-6 text-center text-xs text-[#8f877d]">Your content is secure and saved to your private transformation history.</p>
        </div>
      </main>
    </div>
  )
}
