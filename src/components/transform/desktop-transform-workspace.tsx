'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Check,
  Copy,
  FileText,
  LoaderCircle,
  MessageSquareText,
  MoreVertical,
  PenLine,
  Replace,
  RotateCcw,
  Sparkles,
  Square,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TransformResultContent } from './result-content'

export type TransformPhase = 'idle' | 'reading' | 'shaping' | 'finalizing' | 'complete' | 'cancelled' | 'error'

export type DesktopTransformResult = {
  transformed_content: string
  transformation_id: string
  original_length: number
  transformed_length: number
  length_change_percent: number
  processing_time_ms: number
  quality_score: number
  justification: Record<string, unknown>
}

export type DesktopRecentTransformation = {
  id: string
  original_content: string
  content_type: string
  target_audience: string
  created_at: string
}

type DesktopTransformWorkspaceProps = {
  originalContent: string
  onOriginalContentChange: (value: string) => void
  contentType: string
  onContentTypeChange: (value: string) => void
  customContentType: string
  onCustomContentTypeChange: (value: string) => void
  targetAudience: string
  onTargetAudienceChange: (value: string) => void
  customAudience: string
  onCustomAudienceChange: (value: string) => void
  additionalContext: string
  onAdditionalContextChange: (value: string) => void
  contentTypes: ReadonlyArray<readonly [string, string]>
  targetAudiences: readonly string[]
  recent: DesktopRecentTransformation[]
  result: DesktopTransformResult | null
  streamingContent: string
  phase: TransformPhase
  elapsedMs: number
  error: string | null
  canTransform: boolean
  isTransforming: boolean
  onTransform: () => void
  onCancel: () => void
  onCopy: () => void
  onReplaceDraft: () => void
  onReset: () => void
}

function formatRelativeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const difference = Date.now() - date.getTime()
  const hours = Math.max(0, Math.floor(difference / 3_600_000))
  if (hours < 1) return 'Edited just now'
  if (hours < 24) return `Edited ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Edited ${days}d ago`
}

function ResultSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      {[88, 72, 93, 64].map((width, index) => (
        <div key={width} className="space-y-3" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="h-3 rounded-full bg-[#e3ddd2] motion-safe:animate-pulse" style={{ width: `${width}%` }} />
          <div className="h-3 rounded-full bg-[#e9e3da] motion-safe:animate-pulse" style={{ width: `${Math.max(46, width - 16)}%` }} />
        </div>
      ))}
    </div>
  )
}

export function DesktopTransformWorkspace({
  originalContent,
  onOriginalContentChange,
  contentType,
  onContentTypeChange,
  customContentType,
  onCustomContentTypeChange,
  targetAudience,
  onTargetAudienceChange,
  customAudience,
  onCustomAudienceChange,
  additionalContext,
  onAdditionalContextChange,
  contentTypes,
  targetAudiences,
  recent,
  result,
  streamingContent,
  phase,
  elapsedMs,
  error,
  canTransform,
  isTransforming,
  onTransform,
  onCancel,
  onCopy,
  onReplaceDraft,
  onReset,
}: DesktopTransformWorkspaceProps) {
  const [comparisonFocus, setComparisonFocus] = useState<'original' | 'beforest'>('original')
  const visibleResult = result?.transformed_content || streamingContent
  const elapsedSeconds = Math.max(0, elapsedMs / 1000).toFixed(1)
  const isStreaming = isTransforming && Boolean(streamingContent)
  const draftWordCount = originalContent.trim() ? originalContent.trim().split(/\s+/).length : 0

  return (
    <div className="relative hidden h-[calc(100dvh-82px)] min-h-[660px] grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden border-t border-[#ded7cb] bg-[#f8f4ec] lg:grid">
      <aside className="flex min-h-0 flex-col border-r border-[#d9d1c5] bg-[#f4eee3] px-7 py-8" aria-label="Transformation controls">
        <div>
          <h1 className="font-serif text-[34px] font-light leading-none tracking-[-0.02em] text-[#26372b]">Transform</h1>
          <p className="mt-3 max-w-[210px] text-[14px] leading-5 text-[#6f6a61]">Refine the tone without losing the thought.</p>
        </div>

        <div className="mt-7 border-t border-[#d8d0c3] pt-6">
          <label className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#39372f]">
            <Users className="h-4 w-4 text-[#496a50]" strokeWidth={1.6} /> Audience
          </label>
          <Select value={targetAudience} onValueChange={onTargetAudienceChange}>
            <SelectTrigger className="h-11 w-full border-[#d1c8ba] bg-[#faf8f2] px-3 text-[13px] shadow-none focus:ring-[#496a50]/25">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>{targetAudiences.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}</SelectContent>
          </Select>
          {targetAudience === 'custom' ? <Input value={customAudience} onChange={(event) => onCustomAudienceChange(event.target.value)} placeholder="Describe the audience" className="mt-2 h-10 border-[#d1c8ba] bg-[#faf8f2] text-[13px] shadow-none" /> : null}
        </div>

        <div className="mt-5">
          <label className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#39372f]">
            <FileText className="h-4 w-4 text-[#496a50]" strokeWidth={1.6} /> Content type
          </label>
          <Select value={contentType} onValueChange={onContentTypeChange}>
            <SelectTrigger className="h-11 w-full border-[#d1c8ba] bg-[#faf8f2] px-3 text-[13px] shadow-none focus:ring-[#496a50]/25">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>{contentTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          {contentType === 'custom' ? <Input value={customContentType} onChange={(event) => onCustomContentTypeChange(event.target.value)} placeholder="Describe the content type" className="mt-2 h-10 border-[#d1c8ba] bg-[#faf8f2] text-[13px] shadow-none" /> : null}
        </div>

        <div className="mt-5">
          <label htmlFor="desktop-transform-context" className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#39372f]">
            <MessageSquareText className="h-4 w-4 text-[#496a50]" strokeWidth={1.6} /> Context <span className="font-normal text-[#817b71]">(optional)</span>
          </label>
          <Textarea id="desktop-transform-context" value={additionalContext} onChange={(event) => onAdditionalContextChange(event.target.value)} maxLength={500} placeholder="Add background, goals, or key points to guide the tone." className="min-h-[102px] resize-none border-[#d1c8ba] bg-[#faf8f2] p-3 text-[13px] leading-5 shadow-none placeholder:text-[#989186] focus-visible:ring-[#496a50]/25" />
          <p className="mt-1.5 text-[11px] tabular-nums text-[#989186]">{additionalContext.length} / 500</p>
        </div>

        <Button type="button" onClick={isTransforming ? onCancel : onTransform} disabled={!isTransforming && !canTransform} className="mt-5 h-12 w-full gap-2 rounded-md bg-[#315d3c] text-[14px] font-medium text-[#faf8f2] shadow-none hover:bg-[#294f33] disabled:bg-[#b9c1b7]">
          {isTransforming ? <><Square className="h-3.5 w-3.5 fill-current" /> Stop transformation</> : <><Sparkles className="h-4 w-4" strokeWidth={1.7} /> Transform draft</>}
        </Button>

        <div className="mt-auto min-h-0 pt-7">
          <div className="flex items-center justify-between border-b border-[#d8d0c3] pb-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#496a50]">Recent drafts</p>
            <Link href="/history" className="text-[11px] text-[#6f6a61] hover:text-[#314536]">View all</Link>
          </div>
          <div className="divide-y divide-[#ddd6ca]">
            {recent.slice(0, 2).map((item) => (
              <Link key={item.id} href={item.id.startsWith('preview-') ? '/history' : `/history?selected=${item.id}`} className="group flex items-start gap-2.5 py-3.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#777168]" strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[12px] font-medium leading-4 text-[#39372f] group-hover:text-[#314536]">{item.original_content || 'Untitled transformation'}</span>
                  <span className="mt-1 block text-[10px] text-[#8b857c]">{formatRelativeDate(item.created_at)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <div className="pointer-events-auto absolute top-[58px] z-20 flex -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-[#d1c8ba] bg-[#faf8f2] p-0.5 text-[10px] shadow-[0_4px_12px_rgb(49_69_54_/_0.08)]" style={{ left: 'calc(50% + 140px)' }} aria-label="Comparison focus">
        <button type="button" onClick={() => setComparisonFocus('original')} aria-pressed={comparisonFocus === 'original'} className={`rounded-[4px] px-3 py-2 transition-colors ${comparisonFocus === 'original' ? 'bg-[#e7eadf] text-[#315d3c]' : 'text-[#625f58] hover:bg-[#eee8de]'}`}>Original</button>
        <button type="button" onClick={() => setComparisonFocus('beforest')} aria-pressed={comparisonFocus === 'beforest'} className={`rounded-[4px] px-3 py-2 transition-colors ${comparisonFocus === 'beforest' ? 'bg-[#e7eadf] text-[#315d3c]' : 'text-[#625f58] hover:bg-[#eee8de]'}`}>Beforest</button>
      </div>

      <section className={`flex min-h-0 flex-col border-r border-[#d9d1c5] bg-[#fbf9f4] transition-colors ${comparisonFocus === 'original' ? 'ring-1 ring-inset ring-[#496a50]/10' : ''}`} aria-labelledby="desktop-original-heading">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#ded7cb] px-8">
          <h2 id="desktop-original-heading" className="flex items-center gap-2.5 text-[13px] font-medium text-[#2c2924]"><PenLine className="h-4 w-4 text-[#496a50]" strokeWidth={1.6} /> Original draft</h2>
          <div className="flex items-center gap-5 text-[11px] text-[#817b71]">
            <span className="tabular-nums">{draftWordCount.toLocaleString()} words</span>
            <span className="flex items-center gap-1.5">Autosaved just now <span className="h-1.5 w-1.5 rounded-full bg-[#4f7a59]" aria-hidden="true" /></span>
            <button type="button" className="rounded p-1 hover:bg-[#eee8de]" aria-label="More draft options"><MoreVertical className="h-4 w-4" /></button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1">
          <Textarea value={originalContent} onChange={(event) => onOriginalContentChange(event.target.value)} placeholder="Paste or write your draft here…" maxLength={10000} className="h-full min-h-full w-full resize-none rounded-none border-0 bg-transparent px-9 py-8 font-serif text-[17px] leading-[2.15] text-[#39372f] shadow-none placeholder:font-serif placeholder:text-[#9a9388] focus-visible:ring-0" />
        </div>
        <footer className="flex h-11 shrink-0 items-center justify-between border-t border-[#e4ded4] px-8 text-[10px] text-[#8b857c]">
          <span>{originalContent.length.toLocaleString()} / 10,000 characters</span>
          <button type="button" onClick={onReset} className="flex items-center gap-1.5 hover:text-[#314536]"><RotateCcw className="h-3.5 w-3.5" /> Clear draft</button>
        </footer>
      </section>

      <section className={`flex min-h-0 flex-col bg-[#fdfbf7] transition-colors ${comparisonFocus === 'beforest' ? 'ring-1 ring-inset ring-[#496a50]/10' : ''}`} aria-labelledby="desktop-result-heading" aria-live="polite" aria-busy={isTransforming}>
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#ded7cb] px-8">
          <h2 id="desktop-result-heading" className="flex items-center gap-2.5 text-[13px] font-medium text-[#2c2924]"><Sparkles className="h-4 w-4 text-[#496a50]" strokeWidth={1.6} /> Beforest version</h2>
          <div className="flex items-center gap-2.5">
            {isTransforming ? (
              <span className="flex items-center gap-2 text-[11px] text-[#496a50]">
                <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" />
                {phase === 'reading' ? 'Reading your draft' : phase === 'finalizing' ? 'Final polish' : 'Shaping the voice'} · {elapsedSeconds}s
              </span>
            ) : result ? (
              <span className="flex items-center gap-1.5 text-[11px] text-[#496a50]"><Check className="h-3.5 w-3.5" /> Ready in {(result.processing_time_ms / 1000).toFixed(1)}s</span>
            ) : null}
            {visibleResult && !isTransforming ? <Button type="button" onClick={onCopy} size="sm" className="h-8 gap-1.5 rounded-md bg-[#315d3c] px-3 text-[12px] text-[#faf8f2] shadow-none hover:bg-[#294f33]"><Copy className="h-3.5 w-3.5" /> Copy</Button> : null}
            {visibleResult && !isTransforming ? <Button type="button" onClick={onReplaceDraft} size="sm" variant="outline" className="h-8 gap-1.5 border-[#d1c8ba] bg-transparent px-3 text-[12px] text-[#39372f] shadow-none hover:bg-[#eee8de]"><Replace className="h-3.5 w-3.5" /> Replace draft</Button> : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-9 py-8">
          {error ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0ddd5] text-[#8b4a38]"><TriangleAlert className="h-5 w-5" /></span>
              <h3 className="mt-5 font-serif text-2xl text-[#3d342e]">The transformation paused.</h3>
              <p className="mt-2 max-w-sm text-[13px] leading-6 text-[#7e4938]">{error}</p>
              <div className="mt-5 flex gap-2">
                <Button type="button" onClick={onTransform} className="h-10 gap-2 bg-[#315d3c] text-[#faf8f2] hover:bg-[#294f33]"><RotateCcw className="h-4 w-4" /> Try again</Button>
                {streamingContent ? <Button type="button" variant="outline" onClick={onCopy} className="h-10 border-[#d1c8ba] bg-transparent">Copy partial result</Button> : null}
              </div>
            </div>
          ) : visibleResult ? (
            <TransformResultContent content={visibleResult} streaming={isStreaming} />
          ) : isTransforming ? (
            <div>
              <div className="mb-8 flex items-center gap-3 text-[13px] text-[#496a50]"><LoaderCircle className="h-4 w-4 motion-safe:animate-spin" /> Preparing the first words…</div>
              <ResultSkeleton />
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-[#777168]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d8d0c3] text-[#496a50]"><Sparkles className="h-5 w-5" strokeWidth={1.5} /></span>
              <p className="mt-5 font-serif text-[22px] text-[#3d4239]">Your Beforest version will appear here.</p>
              <p className="mt-2 max-w-xs text-[12px] leading-5 text-[#8b857c]">Choose an audience and content type, then transform the draft.</p>
            </div>
          )}
        </div>

        <footer className="flex h-11 shrink-0 items-center justify-between border-t border-[#e4ded4] px-8 text-[10px] text-[#8b857c]">
          <span>{phase === 'cancelled' ? 'Transformation stopped — partial text preserved' : result ? `${result.transformed_length.toLocaleString()} characters` : 'AI-generated content · Review for accuracy'}</span>
          {result ? <span>Beforest voice applied</span> : null}
        </footer>
      </section>
    </div>
  )
}
