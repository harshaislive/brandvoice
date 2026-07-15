'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronRight, Copy, FileText, LoaderCircle, MessageSquareText, PenLine, RotateCcw, Sparkles, TriangleAlert, Users } from 'lucide-react'
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

const PREVIEW_RESULT: TransformResult = {
  transformed_content: 'We have completed the first phase of fieldwork. The early findings are clear, and they give us a stronger foundation for what comes next.\n\nA few gaps remain. None change the direction or the timeline. We will close them with care, then share the full analysis and partner update by the end of the week.\n\nThank you for holding the work with steadiness and intent.',
  transformation_id: 'preview-result',
  original_length: 181,
  transformed_length: 355,
  length_change_percent: 96,
  processing_time_ms: 2840,
  quality_score: 4.7,
  justification: {},
}

const PREVIEW_DRAFT = 'Hi team,\n\nWe wrapped up the fieldwork phase last week. A few gaps remain, but nothing changes our timeline. I will share the full analysis and partner update by end of week.'

const LOADING_STEPS = ['Reading your draft', 'Preserving intent', 'Shaping the Beforest voice']

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
  const [additionalContext, setAdditionalContext] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [result, setResult] = useState<TransformResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentTransformation[]>([])
  const [contextOpen, setContextOpen] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const mobileResultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isPreview = process.env.NODE_ENV === 'development' && params.get('preview') === '1'
    setPreviewMode(isPreview)
    if (isPreview && params.get('state') === 'filled') {
      setOriginalContent(PREVIEW_DRAFT)
      setTargetAudience('Young Professionals')
      setContentType('website')
    }
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

  useEffect(() => {
    if (!isTransforming) {
      setLoadingStep(0)
      return
    }
    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % LOADING_STEPS.length)
    }, 1400)
    return () => window.clearInterval(interval)
  }, [isTransforming])

  useEffect(() => {
    if (!result) return
    const timeout = window.setTimeout(() => {
      mobileResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(timeout)
  }, [result])

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
      if (previewMode && !isAuthenticated) {
        await new Promise((resolve) => window.setTimeout(resolve, 3200))
        setResult(PREVIEW_RESULT)
        toast.success('Transformation complete')
        return
      }
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ original_content: originalContent, content_type: finalContentType, target_audience: finalAudience, additional_context: additionalContext.trim() || undefined }),
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
    setAdditionalContext('')
    setContextOpen(false)
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
    <div className="mobile-transform-page min-h-screen bg-[#f4eee3] text-[#2c2924]">
      <Navigation preview={previewMode} />
      <main className="mobile-transform-main mx-auto max-w-[1540px] px-5 pb-[148px] pt-[104px] sm:px-8 lg:px-[52px] lg:pb-14 lg:pt-[118px]">
        <header>
          <h1 className="font-serif text-[38px] font-light leading-none tracking-[-0.025em] text-[#26372b] lg:hidden">Transform</h1>
          <h1 className="hidden max-w-[920px] font-serif text-[60px] font-light leading-[1.04] tracking-[-0.025em] text-[#26372b] lg:block">Bring every word back to Beforest.</h1>
          <p className="mt-2 text-[15px] text-[#6f6a61] lg:mt-3 lg:text-[16px]">Refine the tone without losing the thought.</p>
        </header>

        <div className="mobile-transform-shell lg:hidden">
          <section className="mt-5 overflow-hidden rounded-[14px] border border-[#d8d0c3] bg-[#faf8f2]" aria-labelledby="mobile-draft-heading">
            <div className="flex items-center justify-between border-b border-[#e3ddd2] px-4 py-3.5">
              <h2 id="mobile-draft-heading" className="flex items-center gap-2 text-sm font-medium"><PenLine className="h-4 w-4 text-[#496a50]" strokeWidth={1.7} /> Draft</h2>
              <span className="text-[11px] tabular-nums text-[#908a80]">{originalContent.length.toLocaleString()} / 10,000</span>
            </div>
            <Textarea id="mobile-source-content" value={originalContent} onChange={(event) => setOriginalContent(event.target.value)} placeholder="Paste or write your draft here…" maxLength={10000} className="h-[300px] min-h-[300px] resize-none rounded-none border-0 bg-transparent px-4 py-4 text-[17px] leading-8 shadow-none [field-sizing:fixed] placeholder:text-[#8b857c] focus-visible:ring-0" />
          </section>

          <section className="mt-3 grid grid-cols-2 gap-3" aria-label="Transformation controls">
            <div className="min-w-0 rounded-[12px] border border-[#d8d0c3] bg-[#faf8f2] px-3 pt-2.5">
              <label className="flex items-center gap-1.5 text-[11px] text-[#6f6a61]"><Users className="h-3.5 w-3.5 text-[#496a50]" strokeWidth={1.7} /> Audience</label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="h-11 w-full border-0 bg-transparent px-0 text-[14px] shadow-none focus:ring-0"><SelectValue placeholder="Select audience" /></SelectTrigger>
                <SelectContent>{TARGET_AUDIENCES.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-0 rounded-[12px] border border-[#d8d0c3] bg-[#faf8f2] px-3 pt-2.5">
              <label className="flex items-center gap-1.5 text-[11px] text-[#6f6a61]"><FileText className="h-3.5 w-3.5 text-[#496a50]" strokeWidth={1.7} /> Content type</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="h-11 w-full border-0 bg-transparent px-0 text-[14px] shadow-none focus:ring-0"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </section>

          {(targetAudience === 'custom' || contentType === 'custom') ? (
            <div className="mt-3 grid gap-3">
              {targetAudience === 'custom' ? <Input value={customAudience} onChange={(event) => setCustomAudience(event.target.value)} placeholder="Describe the audience" className="h-12 rounded-[12px] border-[#d8d0c3] bg-[#faf8f2] shadow-none" /> : null}
              {contentType === 'custom' ? <Input value={customContentType} onChange={(event) => setCustomContentType(event.target.value)} placeholder="Describe the content type" className="h-12 rounded-[12px] border-[#d8d0c3] bg-[#faf8f2] shadow-none" /> : null}
            </div>
          ) : null}

          <section className="mt-3 overflow-hidden rounded-[12px] border border-[#d8d0c3] bg-[#faf8f2]">
            <button type="button" onClick={() => setContextOpen((open) => !open)} aria-expanded={contextOpen} className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
              <MessageSquareText className="h-5 w-5 shrink-0 text-[#496a50]" strokeWidth={1.6} />
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Optional context</span><span className="block truncate text-xs text-[#817b71]">Intent, facts, or a call to action</span></span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-[#6f6a61] transition-transform duration-200 ${contextOpen ? 'rotate-180' : ''}`} />
            </button>
            {contextOpen ? <div className="border-t border-[#e3ddd2] p-3"><Textarea value={additionalContext} onChange={(event) => setAdditionalContext(event.target.value)} maxLength={500} autoFocus placeholder="Add intent, facts to preserve, or a specific call to action…" className="min-h-24 resize-none border-0 bg-transparent p-1 text-[15px] leading-6 shadow-none focus-visible:ring-0" /></div> : null}
          </section>

          {(result || error) ? (
            <section ref={mobileResultRef} className={`mt-4 scroll-mt-[96px] overflow-hidden rounded-[14px] border bg-[#faf8f2] ${error ? 'border-[#b9816f]' : 'border-[#d8d0c3]'}`} aria-live="polite">
              <div className="flex items-center justify-between border-b border-[#e3ddd2] px-4 py-3.5 text-sm font-medium">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#496a50]" strokeWidth={1.7} /> Transformed</span>
                {result ? <button type="button" onClick={copyToClipboard} className="flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-[#496a50]"><Copy className="h-4 w-4" strokeWidth={1.7} /> Copy</button> : null}
              </div>
              <div className="p-4">
                {error ? <div className="py-7 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-[#a4674e]" /><p className="mt-3 text-sm text-[#7e4938]">{error}</p><Button type="button" onClick={() => void handleTransform()} variant="ghost" className="mt-2 min-h-11 gap-2 text-[#7e4938]"><RotateCcw className="h-4 w-4" /> Try again</Button></div> : result ? <ResultContent content={result.transformed_content} /> : null}
              </div>
            </section>
          ) : null}

          {result ? <div className="mt-3 flex items-center justify-between text-xs text-[#817b71]"><span>{result.processing_time_ms}ms · {result.transformed_length.toLocaleString()} characters</span><button type="button" onClick={reset} className="flex min-h-11 items-center gap-2 px-1 text-[#496a50]"><RotateCcw className="h-3.5 w-3.5" /> Start again</button></div> : null}

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d1c8ba] bg-[#f7f3eb]/96 px-4 pt-3 backdrop-blur-md [padding-bottom:calc(12px+env(safe-area-inset-bottom))]">
            <Button type="button" onClick={handleTransform} disabled={!canTransform && !isTransforming} aria-disabled={!canTransform || isTransforming} aria-live="polite" className="min-h-[58px] w-full gap-3 rounded-[12px] bg-[#315d3c] px-5 text-[#faf8f2] shadow-[0_-1px_0_rgba(49,69,54,0.08)] hover:bg-[#294f33] disabled:bg-[#c8cec4] disabled:text-[#f8f5ef]">
              {isTransforming ? <><span className="brand-spinner"><LoaderCircle className="h-6 w-6" strokeWidth={2} /></span><span className="flex flex-col items-start leading-tight"><span className="text-[15px] font-medium">Shaping the voice…</span><span className="mt-0.5 text-[11px] font-normal text-[#e0e9df]">{LOADING_STEPS[loadingStep]}</span></span><span className="mobile-loading-dots ml-auto" aria-hidden="true"><i /><i /><i /></span></> : <><Sparkles className="h-5 w-5" strokeWidth={1.7} /><span className="text-[16px] font-medium">Transform draft</span></>}
            </Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <section className="mt-7 flex gap-4 rounded-[10px] border border-[#ded7cb] bg-[#f8f4ec] p-5" aria-label="Transformation controls">
            <div className="grid max-w-[640px] flex-1 grid-cols-2 gap-4">
              <div><label className="mb-1.5 flex items-center gap-2 text-xs text-[#6f6a61]"><Users className="h-4 w-4" strokeWidth={1.7} /> Audience</label><Select value={targetAudience} onValueChange={setTargetAudience}><SelectTrigger className="h-11 border-[#d8d0c3] bg-[#faf8f2] text-sm shadow-none focus:ring-[#496a50]/25"><SelectValue placeholder="Select audience" /></SelectTrigger><SelectContent>{TARGET_AUDIENCES.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}</SelectContent></Select></div>
              <div><label className="mb-1.5 flex items-center gap-2 text-xs text-[#6f6a61]"><FileText className="h-4 w-4" strokeWidth={1.7} /> Content type</label><Select value={contentType} onValueChange={setContentType}><SelectTrigger className="h-11 border-[#d8d0c3] bg-[#faf8f2] text-sm shadow-none focus:ring-[#496a50]/25"><SelectValue placeholder="Select content type" /></SelectTrigger><SelectContent>{CONTENT_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <Button type="button" onClick={handleTransform} disabled={!canTransform} className="ml-auto h-12 w-[248px] gap-2 self-end rounded-lg bg-[#3b6345] px-9 text-[15px] font-medium text-[#faf8f2] shadow-none hover:bg-[#314f39] disabled:bg-[#aeb9ab]">
              {isTransforming ? <><span className="brand-spinner"><LoaderCircle className="h-4 w-4" /></span> Transforming</> : <><Sparkles className="h-4 w-4" strokeWidth={1.7} /> Transform</>}
            </Button>
          </section>

          {(targetAudience === 'custom' || contentType === 'custom') ? <div className="mt-3 grid grid-cols-2 gap-3">{targetAudience === 'custom' ? <Input value={customAudience} onChange={(event) => setCustomAudience(event.target.value)} placeholder="Describe the audience" className="h-11 bg-[#faf8f2]" /> : <div />}{contentType === 'custom' ? <Input value={customContentType} onChange={(event) => setCustomContentType(event.target.value)} placeholder="Describe the content type" className="h-11 bg-[#faf8f2]" /> : null}</div> : null}

          <div className="relative mt-3"><MessageSquareText className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777168]" strokeWidth={1.6} /><Input value={additionalContext} onChange={(event) => setAdditionalContext(event.target.value)} maxLength={500} placeholder="Optional context — intent, facts to preserve, or a specific call to action" className="h-11 border-[#d8d0c3] bg-[#faf8f2] pl-10 shadow-none" /></div>

          <section className="mt-3 grid grid-cols-[1.28fr_0.95fr] gap-3" aria-label="Transformation workspace">
            <div className="flex min-h-[390px] flex-col rounded-[10px] border border-[#ded7cb] bg-[#faf8f2]"><div className="flex items-center gap-2 border-b border-[#e3ddd2] px-5 py-4 text-sm font-medium"><PenLine className="h-4 w-4" strokeWidth={1.7} /> Draft</div><div className="relative flex flex-1"><Textarea id="source-content" value={originalContent} onChange={(event) => setOriginalContent(event.target.value)} placeholder="Paste your content here..." maxLength={10000} className="min-h-[320px] flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-5 text-[16px] leading-8 shadow-none placeholder:text-[#8b857c] focus-visible:ring-0" /><span className="absolute bottom-4 right-5 text-xs text-[#908a80]">{originalContent.length.toLocaleString()} / 10,000</span></div></div>
            <div className={`flex min-h-[390px] flex-col rounded-[10px] border bg-[#faf8f2] ${error ? 'border-[#b9816f]' : 'border-[#ded7cb]'}`} aria-live="polite" aria-busy={isTransforming}><div className="flex items-center justify-between border-b border-[#e3ddd2] px-5 py-4 text-sm font-medium"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" strokeWidth={1.7} /> Transformed</span>{result ? <button type="button" onClick={copyToClipboard} className="flex items-center gap-2 text-sm font-medium text-[#496a50] hover:text-[#314536]"><Copy className="h-4 w-4" strokeWidth={1.7} /> Copy</button> : null}</div><div className="flex flex-1 p-5">{isTransforming ? <div className="flex flex-1 items-center justify-center gap-3 text-sm text-[#6f6a61]"><span className="brand-spinner text-[#496a50]"><LoaderCircle className="h-5 w-5" /></span> {LOADING_STEPS[loadingStep]}…</div> : error ? <div className="flex flex-1 flex-col items-center justify-center text-center"><TriangleAlert className="h-7 w-7 text-[#a4674e]" /><p className="mt-3 text-sm text-[#7e4938]">{error}</p><Button type="button" onClick={() => void handleTransform()} variant="ghost" className="mt-2 gap-2 text-[#7e4938]"><RotateCcw className="h-4 w-4" /> Try again</Button></div> : result ? <div className="w-full overflow-y-auto"><ResultContent content={result.transformed_content} /></div> : <div className="flex flex-1 flex-col items-center justify-center text-center text-[#777168]"><FileText className="h-12 w-12 text-[#9d968b]" strokeWidth={1.2} /><p className="mt-5 text-sm">Your transformed content will appear here.</p><p className="mt-1 text-xs text-[#969086]">Refined in the Beforest voice.</p></div>}</div></div>
          </section>
          {result ? <div className="mt-3 flex items-center justify-between text-xs text-[#817b71]"><span>{result.processing_time_ms}ms · {result.transformed_length.toLocaleString()} characters</span><button type="button" onClick={reset} className="flex items-center gap-2 hover:text-[#314536]"><RotateCcw className="h-3.5 w-3.5" /> Start again</button></div> : null}
        </div>

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
