'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BeforestTransformation } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { ChevronRight, Filter, Search, Copy, Star, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const [transformations, setTransformations] = useState<BeforestTransformation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    content_type: '',
    target_audience: '',
    search: ''
  })
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchTransformations = useCallback(async (reset = false) => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '20',
        offset: reset ? '0' : (page * 20).toString(),
        ...(filters.content_type && { content_type: filters.content_type }),
        ...(filters.target_audience && { target_audience: filters.target_audience })
      })

      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/transform?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transformations`)
      }

      const data = await response.json()
      
      if (reset) {
        setTransformations(data.transformations || [])
        setPage(0)
      } else {
        setTransformations(prev => [...prev, ...(data.transformations || [])])
      }
      
      setHasMore((data.transformations?.length || 0) === 20)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transformations')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, page, filters])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransformations(true)
    }
  }, [filters, isAuthenticated, fetchTransformations])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredTransformations = transformations.filter(t => 
    (!filters.search || 
     t.original_content.toLowerCase().includes(filters.search.toLowerCase()) ||
     t.transformed_content.toLowerCase().includes(filters.search.toLowerCase()))
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Content copied to clipboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-8 sm:px-12 border-b border-border/40">
           <div className="max-w-6xl mx-auto space-y-4">
              <h1 className="text-3xl sm:text-4xl font-serif font-light text-foreground">
                History
              </h1>
              <p className="text-muted-foreground font-light text-sm">
                History of Transformations
              </p>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search archive..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-9 bg-secondary/10 border-transparent hover:bg-secondary/20 focus:bg-background transition-colors h-10"
                    />
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <Select value={filters.content_type || "all"} onValueChange={(value) => handleFilterChange('content_type', value === "all" ? "" : value)}>
                      <SelectTrigger className="w-[140px] h-10 border-transparent bg-secondary/10 hover:bg-secondary/20">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFilters({ content_type: '', target_audience: '', search: '' })}
                      className="h-10 w-10 shrink-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-secondary/5">
          <div className="max-w-6xl mx-auto p-6 sm:p-12">
            
            {loading && transformations.length === 0 ? (
               <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-secondary/10 rounded-xl animate-pulse" />
                  ))}
               </div>
            ) : filteredTransformations.length === 0 ? (
               <div className="text-center py-20 opacity-50">
                  <p className="font-serif text-xl italic mb-2">The archive is empty</p>
                  <p className="text-sm">No transformations match your criteria.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {filteredTransformations.map((t) => (
                     <div 
                        key={t.id}
                        className={cn(
                           "group bg-card rounded-xl border border-border/40 overflow-hidden transition-all duration-300 hover:shadow-md",
                           expandedId === t.id ? "ring-1 ring-primary/20" : ""
                        )}
                     >
                        {/* List Item Header (Clickable) */}
                        <div 
                           onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                           className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer"
                        >
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                 <Badge variant="secondary" className="bg-secondary/50 font-normal">{t.content_type}</Badge>
                                 <span>•</span>
                                 <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                              </div>
                              <h3 className="font-serif font-medium text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                 {t.transformed_content.substring(0, 60)}...
                              </h3>
                           </div>
                           <ChevronRight className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform duration-300",
                              expandedId === t.id ? "rotate-90" : ""
                           )} />
                        </div>

                        {/* Expanded Content */}
                        <div className={cn(
                           "grid transition-all duration-300 ease-in-out",
                           expandedId === t.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        )}>
                           <div className="overflow-hidden bg-secondary/5 border-t border-border/40">
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                 
                                 {/* Transformed */}
                                 <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                       <span className="text-xs text-primary font-medium">Result</span>
                                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(t.transformed_content)}>
                                          <Copy className="h-3 w-3" />
                                       </Button>
                                    </div>
                                    <div className="p-4 bg-background rounded-lg border border-border/50 text-sm leading-relaxed whitespace-pre-wrap">
                                       {t.transformed_content}
                                    </div>
                                    <div className="flex gap-2">
                                       {t.transformation_quality_score && (
                                          <Badge variant="outline" className="text-xs">Quality: {t.transformation_quality_score}/5</Badge>
                                       )}
                                       {t.length_change_percent && (
                                          <Badge variant="outline" className={cn("text-xs", t.length_change_percent > 0 ? "text-green-600" : "text-orange-600")}>
                                             {t.length_change_percent > 0 ? '+' : ''}{t.length_change_percent}% length
                                          </Badge>
                                       )}
                                    </div>
                                 </div>

                                 {/* Original */}
                                 <div className="space-y-3">
                                    <span className="text-xs text-muted-foreground font-medium">Original</span>
                                    <div className="p-4 bg-secondary/10 rounded-lg border border-transparent text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                       {t.original_content}
                                    </div>
                                    {t.additional_context && (
                                       <div className="pt-2">
                                          <p className="text-xs text-muted-foreground italic">Context: {t.additional_context}</p>
                                       </div>
                                    )}
                                 </div>

                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {hasMore && !loading && filteredTransformations.length > 0 && (
               <div className="flex justify-center pt-8">
                  <Button variant="outline" onClick={() => {
                     setPage(prev => prev + 1)
                     fetchTransformations(false)
                  }}>
                     Load older items
                  </Button>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
