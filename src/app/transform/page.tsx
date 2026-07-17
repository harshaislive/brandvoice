'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, FileText, LoaderCircle, MessageSquareText, PenLine, RotateCcw, Sparkles, TriangleAlert, Users } from 'lucide-react'
import { Navigation } from '@/components/layout/navigation'
import { DesktopTransformWorkspace, type TransformPhase } from '@/components/transform/desktop-transform-workspace'
import { TransformResultContent } from '@/components/transform/result-content'
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

const PREVIEW_DRAFT = `As we head into the second half of the year, it’s a good moment to pause and look at where we are—and where we’re going.

The first half of 2026 was defined by focus and follow-through. We shipped meaningful updates, strengthened key partnerships, and made real progress on the foundation that will carry us forward.

None of that happens without you. The clarity, care, and commitment you bring to your work show up in the results we see every day.

Looking ahead, our priorities remain clear: deepen our customer impact, simplify how we work, and continue building a company we’re proud to be part of.

Thank you for your continued partnership and for raising the bar—together.

With appreciation,
The Beforest Team`

const PREVIEW_TRANSFORMED = `As we move into the second half of the year, it’s the right time to reflect on our progress—and focus on what’s ahead.

The first half of 2026 was marked by focus and steady execution. We shipped meaningful updates, deepened key partnerships, and strengthened the foundation that will support our next chapter.

That progress is a direct result of you. The clarity, care, and commitment you bring to your work are reflected in the impact we’re achieving together.

Looking ahead, our priorities are clear: deepen customer impact, simplify how we work, and continue building a company we’re proud to build—and grow—together.

Thank you for your continued partnership and for setting the bar higher, every day.

With appreciation,
The Beforest Team`

const PREVIEW_RESULT: TransformResult = {
  transformed_content: PREVIEW_TRANSFORMED,
  transformation_id: 'preview-result',
  original_length: PREVIEW_DRAFT.length,
  transformed_length: PREVIEW_TRANSFORMED.length,
  length_change_percent: Math.round(((PREVIEW_TRANSFORMED.length - PREVIEW_DRAFT.length) / PREVIEW_DRAFT.length) * 100),
  processing_time_ms: 2840,
  quality_score: 4.7,
  justification: {},
}

const LOADING_STEPS = ['Reading your draft', 'Preserving intent', 'Shaping the Beforest voice']

function waitForPreview(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Transformation cancelled', 'AbortError'))
    }, { once: true })
  })
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
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [previewMode, setPreviewMode] = useState(false)
  const [previewOutcome, setPreviewOutcome] = useState<'success' | 'error'>('success')
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
  const [streamingContent, setStreamingContent] = useState('')
  const [transformPhase, setTransformPhase] = useState<TransformPhase>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const mobileResultRef = useRef<HTMLDivElement>(null)
  const transformAbortRef = useRef<AbortController | null>(null)
  const transformStartedAtRef = useRef(0)
  const cancelledByUserRef = useRef(false)
  const slowToastRef = useRef<string | number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isPreview = process.env.NODE_ENV === 'development' && params.get('preview') === '1'
    setPreviewMode(isPreview)
    setPreviewOutcome(params.get('outcome') === 'error' ? 'error' : 'success')
    if (isPreview && params.get('state') === 'filled') {
      setOriginalContent(PREVIEW_DRAFT)
      setTargetAudience('Young Professionals')
      setContentType('website')
    }
  }, [])

  useEffect(() => {
    if (!previewMode && !isAuthLoading && !isAuthenticated) router.replace('/')
  }, [isAuthLoading, isAuthenticated, previewMode, router])

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
    if (!isTransforming) return
    const updateElapsed = () => setElapsedMs(Date.now() - transformStartedAtRef.current)
    updateElapsed()
    const interval = window.setInterval(updateElapsed, 100)
    return () => window.clearInterval(interval)
  }, [isTransforming])

  useEffect(() => {
    if (isTransforming && elapsedMs >= 10_000 && slowToastRef.current === null) {
      slowToastRef.current = toast.info('Taking a little longer', {
        description: 'The result is still on its way. Your draft is safe.',
        duration: 8_000,
      })
    }
    if (!isTransforming && slowToastRef.current !== null) {
      toast.dismiss(slowToastRef.current)
      slowToastRef.current = null
    }
  }, [elapsedMs, isTransforming])

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
    transformAbortRef.current?.abort()
    const controller = new AbortController()
    transformAbortRef.current = controller
    cancelledByUserRef.current = false
    transformStartedAtRef.current = Date.now()
    setElapsedMs(0)
    setError(null)
    setResult(null)
    setStreamingContent('')
    setTransformPhase('reading')
    setIsTransforming(true)

    let timedOut = false
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 45_000)

    try {
      if (previewMode && !isAuthenticated) {
        await waitForPreview(650, controller.signal)
        if (previewOutcome === 'error') {
          throw new Error('We could not reach the AI service. Your draft is safe—please try again.')
        }
        setTransformPhase('shaping')
        const chunks = PREVIEW_RESULT.transformed_content.match(/.{1,20}(?:\s|$)/g) || [PREVIEW_RESULT.transformed_content]
        let previewContent = ''
        for (const chunk of chunks) {
          await waitForPreview(55, controller.signal)
          previewContent += chunk
          setStreamingContent(previewContent)
        }
        setTransformPhase('finalizing')
        await waitForPreview(350, controller.signal)
        setResult(PREVIEW_RESULT)
        setStreamingContent(PREVIEW_RESULT.transformed_content)
        setTransformPhase('complete')
        toast.success('Transformation complete', { description: 'Ready to review.' })
        return
      }

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/transform/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ original_content: originalContent, content_type: finalContentType, target_audience: finalAudience, additional_context: additionalContext.trim() || undefined }),
        signal: controller.signal,
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error || 'Transformation failed')
      }
      if (!response.body) throw new Error('The streaming response was unavailable')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''
      let completed = false

      while (true) {
        const { value, done } = await reader.read()
        buffer += decoder.decode(value, { stream: !done })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          const dataLine = event.split('\n').find((line) => line.startsWith('data:'))
          if (!dataLine) continue
          const data = JSON.parse(dataLine.slice(5).trim()) as {
            type: 'status' | 'content' | 'complete' | 'error'
            phase?: TransformPhase
            content?: string
            result?: TransformResult
            error?: string
          }

          if (data.type === 'status' && data.phase) setTransformPhase(data.phase)
          if (data.type === 'content' && data.content) {
            accumulatedContent += data.content
            setStreamingContent(accumulatedContent)
            setTransformPhase('shaping')
          }
          if (data.type === 'complete' && data.result) {
            completed = true
            setResult(data.result)
            setStreamingContent(data.result.transformed_content)
            setTransformPhase('complete')
            toast.success('Transformation complete', { description: 'Ready to review.' })
          }
          if (data.type === 'error') throw new Error(data.error || 'Transformation failed')
        }

        if (done) break
      }

      if (!completed) throw new Error('The response ended before the transformation completed')
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        if (cancelledByUserRef.current) return
        const timeoutMessage = timedOut
          ? 'This is taking longer than expected. Your draft is safe—please try again.'
          : 'The connection was interrupted. Your draft and partial result are preserved.'
        setError(timeoutMessage)
        setTransformPhase('error')
        toast.error('Transformation interrupted', { description: timeoutMessage })
        return
      }
      const message = caught instanceof Error ? caught.message : 'Transformation failed'
      setError(message)
      setTransformPhase('error')
      toast.error(message)
    } finally {
      window.clearTimeout(timeout)
      setIsTransforming(false)
      transformAbortRef.current = null
    }
  }

  const cancelTransformation = () => {
    if (!isTransforming) return
    cancelledByUserRef.current = true
    transformAbortRef.current?.abort()
    setIsTransforming(false)
    setTransformPhase('cancelled')
    toast.info('Transformation stopped', { description: streamingContent ? 'The partial result is still available.' : 'Your draft is unchanged.' })
  }

  const copyToClipboard = async () => {
    const content = result?.transformed_content || streamingContent
    if (!content) return
    await navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard', { description: 'The Beforest version is ready to paste.' })
  }

  const replaceDraft = () => {
    const content = result?.transformed_content || streamingContent
    if (!content) return
    setOriginalContent(content)
    toast.success('Draft replaced', { description: 'The Beforest version is now your working draft.' })
  }

  const reset = () => {
    transformAbortRef.current?.abort()
    setOriginalContent('')
    setContentType('')
    setCustomContentType('')
    setTargetAudience('')
    setCustomAudience('')
    setAdditionalContext('')
    setContextOpen(false)
    setResult(null)
    setStreamingContent('')
    setTransformPhase('idle')
    setElapsedMs(0)
    setError(null)
  }

  if ((!isAuthenticated || isAuthLoading) && !previewMode) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4eee3]" aria-live="polite">
        <LoaderCircle className="brand-spinner h-5 w-5 text-[#496a50]" aria-hidden="true" />
        <span className="sr-only">Opening sign in</span>
      </main>
    )
  }

  return (
    <div className="mobile-transform-page min-h-screen bg-[#f4eee3] text-[#2c2924]">
      <Navigation preview={previewMode} />
      <main className="mobile-transform-main mx-auto max-w-[1540px] px-5 pb-[148px] pt-[104px] sm:px-8 lg:mx-0 lg:max-w-none lg:px-0 lg:pb-0 lg:pt-[82px]">
        <header className="lg:hidden">
          <h1 className="font-serif text-[38px] font-light leading-none tracking-[-0.025em] text-[#26372b]">Transform</h1>
          <p className="mt-2 text-[15px] text-[#6f6a61]">Refine the tone without losing the thought.</p>
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

          {(result || error || streamingContent) ? (
            <section ref={mobileResultRef} className={`mt-4 scroll-mt-[96px] overflow-hidden rounded-[14px] border bg-[#faf8f2] ${error ? 'border-[#b9816f]' : 'border-[#d8d0c3]'}`} aria-live="polite">
              <div className="flex items-center justify-between border-b border-[#e3ddd2] px-4 py-3.5 text-sm font-medium">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#496a50]" strokeWidth={1.7} /> Transformed</span>
                {result ? <button type="button" onClick={copyToClipboard} className="flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-[#496a50]"><Copy className="h-4 w-4" strokeWidth={1.7} /> Copy</button> : null}
              </div>
              <div className="p-4">
                {error ? <div className="py-7 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-[#a4674e]" /><p className="mt-3 text-sm text-[#7e4938]">{error}</p><Button type="button" onClick={() => void handleTransform()} variant="ghost" className="mt-2 min-h-11 gap-2 text-[#7e4938]"><RotateCcw className="h-4 w-4" /> Try again</Button></div> : streamingContent ? <TransformResultContent content={result?.transformed_content || streamingContent} streaming={isTransforming} /> : null}
              </div>
            </section>
          ) : null}

          {result ? <div className="mt-3 flex items-center justify-between text-xs text-[#817b71]"><span>{result.processing_time_ms}ms · {result.transformed_length.toLocaleString()} characters</span><button type="button" onClick={reset} className="flex min-h-11 items-center gap-2 px-1 text-[#496a50]"><RotateCcw className="h-3.5 w-3.5" /> Start again</button></div> : null}

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d1c8ba] bg-[#f7f3eb]/96 px-4 pt-3 backdrop-blur-md [padding-bottom:calc(12px+env(safe-area-inset-bottom))]">
            <Button type="button" onClick={isTransforming ? cancelTransformation : handleTransform} disabled={!canTransform && !isTransforming} aria-disabled={!canTransform && !isTransforming} aria-live="polite" className="min-h-[58px] w-full gap-3 rounded-[12px] bg-[#315d3c] px-5 text-[#faf8f2] shadow-[0_-1px_0_rgba(49,69,54,0.08)] hover:bg-[#294f33] disabled:bg-[#c8cec4] disabled:text-[#f8f5ef]">
              {isTransforming ? <><span className="brand-spinner"><LoaderCircle className="h-6 w-6" strokeWidth={2} /></span><span className="flex flex-col items-start leading-tight"><span className="text-[15px] font-medium">Shaping the voice…</span><span className="mt-0.5 text-[11px] font-normal text-[#e0e9df]">{LOADING_STEPS[loadingStep]}</span></span><span className="mobile-loading-dots ml-auto" aria-hidden="true"><i /><i /><i /></span></> : <><Sparkles className="h-5 w-5" strokeWidth={1.7} /><span className="text-[16px] font-medium">Transform draft</span></>}
            </Button>
          </div>
        </div>

        <DesktopTransformWorkspace
          originalContent={originalContent}
          onOriginalContentChange={setOriginalContent}
          contentType={contentType}
          onContentTypeChange={setContentType}
          customContentType={customContentType}
          onCustomContentTypeChange={setCustomContentType}
          targetAudience={targetAudience}
          onTargetAudienceChange={setTargetAudience}
          customAudience={customAudience}
          onCustomAudienceChange={setCustomAudience}
          additionalContext={additionalContext}
          onAdditionalContextChange={setAdditionalContext}
          contentTypes={CONTENT_TYPES}
          targetAudiences={TARGET_AUDIENCES}
          recent={recentRows}
          result={result}
          streamingContent={streamingContent}
          phase={transformPhase}
          elapsedMs={elapsedMs}
          error={error}
          canTransform={canTransform}
          isTransforming={isTransforming}
          onTransform={() => void handleTransform()}
          onCancel={cancelTransformation}
          onCopy={() => void copyToClipboard()}
          onReplaceDraft={replaceDraft}
          onReset={reset}
        />

        <section className="mt-7 lg:hidden" aria-labelledby="recent-work-heading">
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
