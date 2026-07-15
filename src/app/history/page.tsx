'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, Copy, FileText, RotateCcw, Search } from 'lucide-react'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BeforestTransformation } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const [transformations, setTransformations] = useState<BeforestTransformation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentType, setContentType] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchTransformations = useCallback(async (reset = false, requestedPage = 0) => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        limit: '20',
        offset: reset ? '0' : String(requestedPage * 20),
        ...(contentType && { content_type: contentType }),
      })
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/transform?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Unable to load transformation history')
      const data = await response.json()
      const rows = data.transformations || []
      setTransformations((current) => reset ? rows : [...current, ...rows])
      if (reset) setPage(0)
      setHasMore(rows.length === 20)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load transformation history')
    } finally {
      setLoading(false)
    }
  }, [contentType, isAuthenticated])

  useEffect(() => {
    void fetchTransformations(true)
  }, [contentType, isAuthenticated, fetchTransformations])

  const rows = transformations.filter((item) => !search || `${item.original_content} ${item.transformed_content}`.toLowerCase().includes(search.toLowerCase()))
  const resetFilters = () => { setSearch(''); setContentType('') }

  return (
    <div className="min-h-screen bg-[#f4eee3] text-[#2c2924]">
      <Navigation />
      <main className="mx-auto max-w-[1540px] px-5 pb-16 pt-[118px] sm:px-8 lg:px-[52px]">
        <header className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#496a50]">Transformation archive</p>
          <h1 className="mt-3 font-serif text-[42px] font-light leading-tight tracking-[-0.02em] text-[#26372b] sm:text-[54px]">Every thought, refined.</h1>
          <p className="mt-3 text-[15px] leading-7 text-[#6f6a61]">Revisit your previous work, compare the draft and final voice, or copy a result back into use.</p>
        </header>

        <section className="mt-8 flex flex-col gap-3 border-y border-[#d8d0c3] py-4 sm:flex-row" aria-label="History filters">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777168]" strokeWidth={1.6} />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your archive" className="h-11 border-[#d8d0c3] bg-[#faf8f2] pl-10 shadow-none" />
          </div>
          <Select value={contentType || 'all'} onValueChange={(value) => setContentType(value === 'all' ? '' : value)}>
            <SelectTrigger className="h-11 w-full border-[#d8d0c3] bg-[#faf8f2] shadow-none sm:w-[190px]"><SelectValue placeholder="All content types" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All content types</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="social">Social media</SelectItem><SelectItem value="blog">Blog</SelectItem></SelectContent>
          </Select>
          <Button variant="ghost" onClick={resetFilters} className="h-11 gap-2 text-[#625f58]"><RotateCcw className="h-4 w-4" strokeWidth={1.6} /> Reset</Button>
        </section>

        <section className="mt-7" aria-live="polite">
          <div className="grid grid-cols-[1fr_auto] border-b border-[#d8d0c3] px-2 pb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#817b71] md:grid-cols-[1.5fr_0.65fr_0.65fr_0.7fr_auto]">
            <span>Transformation</span><span className="hidden md:block">Type</span><span className="hidden md:block">Audience</span><span className="hidden md:block">Created</span><span className="w-5" />
          </div>

          {loading && transformations.length === 0 ? (
            <div className="space-y-px">{[1, 2, 3, 4].map((item) => <div key={item} className="h-[68px] animate-pulse border-b border-[#ded7cb] bg-[#f8f4ec]" />)}</div>
          ) : error ? (
            <div className="border-b border-[#d8d0c3] py-14 text-center"><p className="text-sm text-[#8b4e3b]">{error}</p><Button variant="ghost" onClick={() => void fetchTransformations(true)} className="mt-2">Try again</Button></div>
          ) : rows.length === 0 ? (
            <div className="border-b border-[#d8d0c3] py-20 text-center"><FileText className="mx-auto h-9 w-9 text-[#9d968b]" strokeWidth={1.3} /><h2 className="mt-5 font-serif text-2xl text-[#314536]">Nothing here yet</h2><p className="mt-2 text-sm text-[#777168]">Your transformations will collect here as you work.</p><Button asChild className="mt-6 bg-[#3b6345] hover:bg-[#314f39]"><Link href="/transform">Create a transformation</Link></Button></div>
          ) : rows.map((item) => {
            const expanded = expandedId === item.id
            return (
              <article key={item.id} className="border-b border-[#d8d0c3]">
                <button type="button" onClick={() => setExpandedId(expanded ? null : item.id)} className="grid min-h-[68px] w-full grid-cols-[1fr_auto] items-center gap-4 px-2 py-3 text-left transition-colors hover:bg-[#f8f4ec] md:grid-cols-[1.5fr_0.65fr_0.65fr_0.7fr_auto]">
                  <span className="flex min-w-0 items-center gap-3"><FileText className="h-4 w-4 shrink-0 text-[#777168]" strokeWidth={1.5} /><span className="min-w-0"><span className="block truncate text-[15px] font-medium">{item.original_content || 'Untitled transformation'}</span><span className="mt-0.5 block text-xs text-[#817b71] md:hidden">{item.content_type} · {item.target_audience}</span></span></span>
                  <span className="hidden truncate text-sm text-[#6f6a61] md:block">{item.content_type}</span><span className="hidden truncate text-sm text-[#6f6a61] md:block">{item.target_audience}</span><span className="hidden text-sm text-[#6f6a61] md:block">{item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'Unknown'}</span><ChevronDown className={cn('h-4 w-4 text-[#817b71] transition-transform', expanded && 'rotate-180')} strokeWidth={1.5} />
                </button>
                {expanded ? <div className="grid gap-px border-t border-[#e5ded2] bg-[#ded7cb] md:grid-cols-2">
                  <div className="bg-[#f7f2e9] p-5 sm:p-7"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#817b71]">Draft</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#625f58]">{item.original_content}</p></div>
                  <div className="bg-[#faf8f2] p-5 sm:p-7"><div className="flex items-center justify-between"><p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#496a50]">Transformed</p><button type="button" onClick={() => { void navigator.clipboard.writeText(item.transformed_content); toast.success('Copied to clipboard') }} className="flex items-center gap-2 text-xs text-[#496a50]"><Copy className="h-3.5 w-3.5" /> Copy</button></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#39372f]">{item.transformed_content}</p></div>
                </div> : null}
              </article>
            )
          })}
        </section>

        {hasMore && !loading && rows.length > 0 ? <div className="flex justify-center pt-8"><Button variant="outline" onClick={() => { const nextPage = page + 1; setPage(nextPage); void fetchTransformations(false, nextPage) }} className="border-[#cfc6b8] bg-transparent">Load older work</Button></div> : null}
      </main>
    </div>
  )
}
