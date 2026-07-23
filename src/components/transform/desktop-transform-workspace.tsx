'use client'

import Link from 'next/link'
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
import { getRecentDraftLabel } from '@/lib/transformation-display'
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
  const visibleResult = result?.transformed_content || streamingContent
  const elapsedSeconds = Math.max(0, elapsedMs / 1000).toFixed(1)
  const isStreaming = isTransforming && Boolean(streamingContent)
  const draftWordCount = originalContent.trim() ? originalContent.trim().split(/\s+/).length : 0

  return (
    <div className="relative hidden h-[calc(100dvh-82px)] min-h-[660px] grid-cols-[292px_minmax(0,1fr)_minmax(0,1fr)] overflow-hidden border-t border-[#cfd6cf] bg-[#e8eee8] lg:grid">
      <aside className="brand-sidebar-scroll flex min-h-0 flex-col overflow-y-auto overscroll-contain border-r border-[#486050] bg-[#203c2c] px-7 py-8 text-[#f7f3ea]" aria-label="Transformation controls">
        <div>
          <h1 className="font-serif text-[36px] font-light leading-none tracking-[-0.02em] text-[#f7f3ea]">Transform</h1>
          <p className="mt-3 max-w-[215px] text-[14px] leading-5 text-[#c7d3c8]">Refine the tone without losing the thought.</p>
        </div>

        <div className="mt-7 border-t border-[#526858] pt-6">
          <label className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#eef2eb]">
            <Users className="h-4 w-4 text-[#b9cbaa]" strokeWidth={1.6} /> Audience
          </label>
          <Select value={targetAudience} onValueChange={onTargetAudienceChange}>
            <SelectTrigger className="h-11 w-full border-[#6f806f] bg-[#f7f5ef] px-3 text-[13px] text-[#26372b] shadow-none focus:ring-[#b9cbaa]/35">
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>{targetAudiences.map((audience) => <SelectItem key={audience} value={audience}>{audience === 'custom' ? 'Custom audience' : audience}</SelectItem>)}</SelectContent>
          </Select>
          {targetAudience === 'custom' ? <Input value={customAudience} onChange={(event) => onCustomAudienceChange(event.target.value)} placeholder="Describe the audience" className="mt-2 h-10 border-[#6f806f] bg-[#f7f5ef] text-[13px] text-[#26372b] shadow-none" /> : null}
        </div>

        <div className="mt-5">
          <label className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#eef2eb]">
            <FileText className="h-4 w-4 text-[#b9cbaa]" strokeWidth={1.6} /> Content type
          </label>
          <Select value={contentType} onValueChange={onContentTypeChange}>
            <SelectTrigger className="h-11 w-full border-[#6f806f] bg-[#f7f5ef] px-3 text-[13px] text-[#26372b] shadow-none focus:ring-[#b9cbaa]/35">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>{contentTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          {contentType === 'custom' ? <Input value={customContentType} onChange={(event) => onCustomContentTypeChange(event.target.value)} placeholder="Describe the content type" className="mt-2 h-10 border-[#6f806f] bg-[#f7f5ef] text-[13px] text-[#26372b] shadow-none" /> : null}
        </div>

        <div className="mt-5">
          <label htmlFor="desktop-transform-context" className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#eef2eb]">
            <MessageSquareText className="h-4 w-4 text-[#b9cbaa]" strokeWidth={1.6} /> Context <span className="font-normal text-[#aebcaf]">(optional)</span>
          </label>
          <Textarea id="desktop-transform-context" value={additionalContext} onChange={(event) => onAdditionalContextChange(event.target.value)} maxLength={500} placeholder="Add background, goals, or key points to guide the tone." className="min-h-[102px] resize-none border-[#6f806f] bg-[#f7f5ef] p-3 text-[13px] leading-5 text-[#26372b] shadow-none placeholder:text-[#7f897d] focus-visible:ring-[#b9cbaa]/35" />
          <p className="mt-1.5 text-[11px] tabular-nums text-[#aebcaf]">{additionalContext.length} / 500</p>
        </div>

        <div className="mt-auto min-h-0 pt-7">
          <div className="flex items-center justify-between border-b border-[#526858] pb-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#b9cbaa]">Recent drafts</p>
            <Link href="/history" className="text-[11px] text-[#c7d3c8] hover:text-white">View all</Link>
          </div>
          <div className="divide-y divide-[#425b4a]">
            {recent.slice(0, 2).map((item) => (
              <Link key={item.id} href={item.id.startsWith('preview-') ? '/history' : `/history?selected=${item.id}`} title={item.original_content || 'Untitled transformation'} className="group flex min-h-11 items-center gap-2.5 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-[#aebcaf]" strokeWidth={1.5} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium leading-5 text-[#edf2eb] group-hover:text-white">
                  {getRecentDraftLabel(item.original_content)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col border-r border-[#cbd3cb] bg-[#fbfaf7]" aria-labelledby="desktop-original-heading">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#d8ddd8] border-t-2 border-t-[#b7a98d] bg-[#f5f1e8] px-8">
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
        <footer className="flex h-14 shrink-0 items-center justify-between border-t border-[#e4ded4] px-8 text-[10px] text-[#8b857c]">
          <span>{originalContent.length.toLocaleString()} / 10,000 characters</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onReset} className="flex min-h-9 items-center gap-1.5 px-1 hover:text-[#314536]"><RotateCcw className="h-3.5 w-3.5" /> Clear draft</button>
            <Button type="button" onClick={isTransforming ? onCancel : onTransform} disabled={!isTransforming && !canTransform} size="sm" className="h-9 gap-2 rounded-md bg-[#315d3c] px-4 text-[12px] font-semibold text-[#faf8f2] shadow-none hover:bg-[#294f33] disabled:bg-[#c8cec4] disabled:text-[#f8f5ef]">
              {isTransforming ? <><Square className="h-3 w-3 fill-current" /> Stop</> : <><Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} /> Transform draft</>}
            </Button>
          </div>
        </footer>
      </section>

      <section className="flex min-h-0 flex-col bg-[#eef4ee]" aria-labelledby="desktop-result-heading" aria-live="polite" aria-busy={isTransforming}>
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#cbd8cc] border-t-2 border-t-[#315d3c] bg-[#e3ece2] px-8">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-9 py-8 [scrollbar-color:#91a593_transparent] [scrollbar-width:thin]">
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#b9cbb9] bg-[#e3ece2] text-[#315d3c]"><Sparkles className="h-5 w-5" strokeWidth={1.5} /></span>
              <p className="mt-5 font-serif text-[22px] text-[#2f4736]">Your Beforest version will appear here.</p>
              <p className="mt-2 max-w-xs text-[12px] leading-5 text-[#718175]">Choose an audience and content type, then transform the draft.</p>
            </div>
          )}
        </div>

        <footer className="flex h-11 shrink-0 items-center justify-between border-t border-[#ced9cf] bg-[#e8f0e7] px-8 text-[10px] text-[#6c7d70]">
          <span>{phase === 'cancelled' ? 'Transformation stopped — partial text preserved' : result ? `${result.transformed_length.toLocaleString()} characters` : 'AI-generated content · Review for accuracy'}</span>
          {result ? <span>Beforest voice applied</span> : null}
        </footer>
      </section>
    </div>
  )
}
