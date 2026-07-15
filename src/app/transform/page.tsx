'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronRight, Copy, FileText, LoaderCircle, PenLine, RotateCcw, Sparkles, TriangleAlert, Users } from 'lucide-react'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type RecentTransformation = {
  id: string
  original_content: string
  content_type: string
  target_audience: string
  created_at: string
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

const PREVIEW_RECENT: RecentTransformation[] = [
  { id: 'preview-1', original_content: 'Stakeholder update — Q3 roadmap', content_type: 'Internal update', target_audience: 'Team', created_at: '2026-07-15T10:42:00+05:30' },
  { id: 'preview-2', original_content: 'Product announcement — Nature at work', content_type: 'Product announcement', target_audience: 'External', created_at: '2026-07-15T09:18:00+05:30' },
  { id: 'preview-3', original_content: 'Newsletter — Rooted in impact', content_type: 'Newsletter', target_audience: 'External', created_at: '2026-07-14T16:33:00+05:30' },
  { id: 'preview-4', original_content: 'Sustainability statement draft', content_type: 'Sustainability', target_audience: 'External', created_at: '2026-07-14T11:07:00+05:30' },
]

function ResultContent({ content }: { content: string }) {
  const hasMarkdown = /(\*\*|__|##|###|\[.*\]\(.*\)|`.*`|\n[-*]|\n\d+\.)/.test(content)
  if (!hasMarkdown) return <p className="whitespace-pre-wrap text-[16px] leading-8 text-[#39372f]">{content}</p>
  return <div className="prose max-w-none prose-headings:font-serif prose-p:leading-8 prose-p:text-[#39372f] prose-li:text-[#39372f]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>
}

function formatRecentDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '', time: '' }
  return {
    date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date),
  }
}

export default function TransformPage() {
  const { isAuthenticated } = useAuth()
  const [previewMode, setPreviewMode] = useState(false)
  const [originalContent, setOriginalContent] = useState('')
  const [contentType, setContentType] = useState('')
  const [customContentType, setCustomContentType] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [customAudience, setCustomAudience] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [result, setResult] = useState<TransformResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentTransformation[]>([])

  useEffect(() => {
    setPreviewMode(process.env.NODE_ENV === 'development' && window.location.search.includes('preview=1'))
  }, [])

  useEffect(() => {
    if (previewMode && !isAuthenticated) {
      setRecent(PREVIEW_RECENT)
      return
    }
    if (!isAuthenticated) return
    const token = localStorage.getItem('auth_token')
    const controller = new AbortController()
    fetch('/api/transform?limit=4', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRecent(data?.transformations || []))
      .catch(() => undefined)
    return () => controller.abort()
  }, [isAuthenticated, previewMode, result])

  const finalContentType = contentType === 'custom' ? customContentType.trim() : contentType
  const finalAudience = targetAudience === 'custom' ? customAudience.trim() : targetAudience
  const canTransform = Boolean(originalContent.trim() && finalContentType && finalAudience && !isTransforming)
  const recentRows = useMemo(() => recent.slice(0, 4), [recent])

  const handleTransform = async () => {
    if (!canTransform) return
    setError(null)
    setResult(null)
    setIsTransforming(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ original_content: originalContent, content_type: finalContentType, target_audience: finalAudience }),
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
    await navigator.clipboard.writeText(result.transformed_content)
    toast.success('Copied to clipboard')
  }

  const reset = () => {
    setOriginalContent('')
    setContentType('')
    setCustomContentType('')
    setTargetAudience('')
    setCustomAudience('')
    setResult(null)
    setError(null)
  }

  if (!isAuthenticated && !previewMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="flex min-h-screen items-center justify-center px-6 pt-[82px]">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-4xl font-light text-[#26372b]">Sign in to transform</h1>
            <p className="mt-4 text-sm leading-6 text-[#6f6a61]">Brand Voice is invitation-only, and every transformation is saved to your private history.</p>
            <Button asChild className="mt-7 h-11 bg-[#314536] px-7 text-[#faf8f2] hover:bg-[#496a50]"><Link href="/auth/login">Sign in</Link></Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4eee3] text-[#2c2924]">
      <Navigation preview={previewMode} />
      <main className="mx-auto max-w-[1540px] px-5 pb-14 pt-[118px] sm:px-8 lg:px-[52px]">
        <header>
          <h1 className="max-w-[920px] font-serif text-[42px] font-light leading-[1.04] tracking-[-0.025em] text-[#26372b] sm:text-[54px] lg:text-[60px]">Bring every word back to Beforest.</h1>
          <p className="mt-3 text-[16px] text-[#6f6a61]">Refine the tone without losing the thought.</p>
        </header>

        <section className="mt-7 flex flex-col gap-4 rounded-[10px] border border-[#ded7cb] bg-[#f8f4ec] p-4 lg:flex-row lg:items-end lg:px-5" aria-label="Transformation controls">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-[640px]">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs text-[#6f6a61]"><Users className="h-4 w-4" strokeWidth={1.7} /> Audience</label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="h-11 border-[#d8d0c3] bg-[#faf8f2] text-sm shadow-none focus:ring-[#496a50]/25"><SelectValue placeholder="Select audience" /></SelectTrigger>
                <SelectContent>{TARGET_AUDIENCES.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs text-[#6f6a61]"><FileText className="h-4 w-4" strokeWidth={1.7} /> Content type</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="h-11 border-[#d8d0c3] bg-[#faf8f2] text-sm shadow-none focus:ring-[#496a50]/25"><SelectValue placeholder="Select content type" /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" onClick={handleTransform} disabled={!canTransform} className="h-12 w-full gap-2 rounded-lg bg-[#3b6345] px-9 text-[15px] font-medium text-[#faf8f2] shadow-none hover:bg-[#314f39] disabled:bg-[#aeb9ab] lg:ml-auto lg:w-[248px]">
            {isTransforming ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Transforming</> : <><Sparkles className="h-4 w-4" strokeWidth={1.7} /> Transform</>}
          </Button>
        </section>

        {(targetAudience === 'custom' || contentType === 'custom') ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {targetAudience === 'custom' ? <Input value={customAudience} onChange={(event) => setCustomAudience(event.target.value)} placeholder="Describe the audience" className="h-11 bg-[#faf8f2]" /> : <div />}
            {contentType === 'custom' ? <Input value={customContentType} onChange={(event) => setCustomContentType(event.target.value)} placeholder="Describe the content type" className="h-11 bg-[#faf8f2]" /> : null}
          </div>
        ) : null}

        <section className="mt-3 grid gap-3 lg:grid-cols-[1.28fr_0.95fr]" aria-label="Transformation workspace">
          <div className="flex min-h-[390px] flex-col rounded-[10px] border border-[#ded7cb] bg-[#faf8f2]">
            <div className="flex items-center gap-2 border-b border-[#e3ddd2] px-5 py-4 text-sm font-medium"><PenLine className="h-4 w-4" strokeWidth={1.7} /> Draft</div>
            <div className="relative flex flex-1">
              <Textarea id="source-content" value={originalContent} onChange={(event) => setOriginalContent(event.target.value)} placeholder="Paste your content here..." maxLength={10000} className="min-h-[320px] flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-5 text-[16px] leading-8 shadow-none placeholder:text-[#8b857c] focus-visible:ring-0" />
              <span className="absolute bottom-4 right-5 text-xs text-[#908a80]">{originalContent.length.toLocaleString()} / 10,000</span>
            </div>
          </div>

          <div className={`flex min-h-[390px] flex-col rounded-[10px] border bg-[#faf8f2] ${error ? 'border-[#b9816f]' : 'border-[#ded7cb]'}`} aria-live="polite" aria-busy={isTransforming}>
            <div className="flex items-center justify-between border-b border-[#e3ddd2] px-5 py-4 text-sm font-medium">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" strokeWidth={1.7} /> Transformed</span>
              {result ? <button type="button" onClick={copyToClipboard} className="flex items-center gap-2 text-sm font-medium text-[#496a50] hover:text-[#314536]"><Copy className="h-4 w-4" strokeWidth={1.7} /> Copy</button> : null}
            </div>
            <div className="flex flex-1 p-5">
              {isTransforming ? (
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[#6f6a61]"><LoaderCircle className="h-5 w-5 animate-spin text-[#496a50]" /> Refining your message…</div>
              ) : error ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center"><TriangleAlert className="h-7 w-7 text-[#a4674e]" /><p className="mt-3 text-sm text-[#7e4938]">{error}</p><Button type="button" onClick={() => void handleTransform()} variant="ghost" className="mt-2 gap-2 text-[#7e4938]"><RotateCcw className="h-4 w-4" /> Try again</Button></div>
              ) : result ? (
                <div className="w-full overflow-y-auto"><ResultContent content={result.transformed_content} /></div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-[#777168]"><FileText className="h-12 w-12 text-[#9d968b]" strokeWidth={1.2} /><p className="mt-5 text-sm">Your transformed content will appear here.</p><p className="mt-1 text-xs text-[#969086]">Refined in the Beforest voice.</p></div>
              )}
            </div>
          </div>
        </section>

        {result ? <div className="mt-3 flex items-center justify-between text-xs text-[#817b71]"><span>{result.processing_time_ms}ms · {result.transformed_length.toLocaleString()} characters</span><button type="button" onClick={reset} className="flex items-center gap-2 hover:text-[#314536]"><RotateCcw className="h-3.5 w-3.5" /> Start again</button></div> : null}

        <section className="mt-7" aria-labelledby="recent-work-heading">
          <div className="flex items-center justify-between border-b border-[#d8d0c3] pb-3">
            <h2 id="recent-work-heading" className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#496a50]">Recent work</h2>
            <Link href="/history" className="text-xs text-[#6f6a61] hover:text-[#314536]">View all history</Link>
          </div>
          {recentRows.length ? recentRows.map((item) => {
            const formatted = formatRecentDate(item.created_at)
            return (
              <Link key={item.id} href={item.id.startsWith('preview-') ? '/history' : `/history?selected=${item.id}`} className="grid min-h-[52px] grid-cols-[1fr_auto] items-center gap-4 border-b border-[#ddd6ca] px-2 py-3 text-sm transition-colors hover:bg-[#f8f4ec] md:grid-cols-[1.5fr_0.55fr_0.45fr_0.7fr_0.55fr_auto]">
                <span className="flex min-w-0 items-center gap-3 font-medium"><FileText className="h-4 w-4 shrink-0 text-[#777168]" strokeWidth={1.5} /><span className="truncate">{item.original_content || 'Untitled transformation'}</span></span>
                <span className="hidden text-[#777168] md:block">{formatted.date}</span><span className="hidden text-[#777168] md:block">{formatted.time}</span><span className="hidden truncate text-[#777168] md:block">{item.content_type}</span><span className="hidden truncate text-[#777168] md:block">{item.target_audience}</span><ChevronRight className="h-4 w-4 text-[#817b71]" strokeWidth={1.5} />
              </Link>
            )
          }) : <div className="border-b border-[#ddd6ca] py-7 text-sm text-[#817b71]">Your recent transformations will appear here.</div>}
        </section>
      </main>
    </div>
  )
}
