'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { BarChart3, TrendingUp, Clock, Zap, Star, Activity } from 'lucide-react'

interface Analytics {
  total_transformations: number
  timeframe: string
  date_range: {
    start: string
    end: string
  }
  content_type_breakdown: Record<string, number>
  target_audience_breakdown: Record<string, number>
  avg_processing_time_ms: number
  avg_quality_score: number
  avg_length_change_percent: number
  feedback_breakdown: Record<string, number>
  daily_volume: Record<string, number>
  top_performing_transformations: Array<{
    id: string
    content_type: string
    target_audience: string
    quality_score: number
    user_feedback: number
    created_at: string
  }>
  performance_metrics: {
    total_original_chars: number
    total_transformed_chars: number
    avg_original_length: number
    avg_transformed_length: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, fetchAnalytics])

  const renderContentTypeChart = () => {
    if (!analytics?.content_type_breakdown) return null

    const total = Object.values(analytics.content_type_breakdown).reduce((sum, count) => sum + count, 0)
    
    return (
      <div className="space-y-4">
        {Object.entries(analytics.content_type_breakdown).map(([type, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={type} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                <span className="text-muted-foreground text-xs">{percentage.toFixed(1)}% ({count})</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          )
        })}
      </div>
    )
  }

  const renderFeedbackChart = () => {
    if (!analytics?.feedback_breakdown) return null

    const total = Object.values(analytics.feedback_breakdown).reduce((sum, count) => sum + count, 0)
    
    return (
      <div className="space-y-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = analytics.feedback_breakdown[star] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs w-3">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                </div>
                <span className="text-muted-foreground text-xs">{percentage.toFixed(1)}% ({count})</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-background">
           <Navigation />
           <main className="mx-auto max-w-[1540px] px-6 pb-16 pt-[118px] lg:px-[52px]">
              <div className="max-w-6xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-10 w-32" />
                 </div>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                 </div>
              </div>
           </main>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="mx-auto max-w-[1540px] px-6 pb-16 pt-[118px] lg:px-[52px]">
        <div className="max-w-6xl mx-auto">
           {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-light text-foreground mb-2">
                Performance
              </h1>
              <p className="text-muted-foreground font-light text-sm">
                Insights & Metrics
              </p>
            </div>
            
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[140px] bg-secondary/10 border-transparent hover:bg-secondary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
               <span>{error}</span>
               <Button variant="outline" size="sm" onClick={fetchAnalytics} className="border-destructive/30 hover:bg-destructive/10">Retry</Button>
            </div>
          )}

          {analytics && (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
                <div className="p-6 rounded-2xl bg-secondary/5 border border-border/40 space-y-2">
                   <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <BarChart3 className="h-4 w-4" /> Total
                   </div>
                   <div className="text-3xl font-serif font-medium">{analytics.total_transformations}</div>
                   <p className="text-xs text-muted-foreground">Transformations</p>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/5 border border-border/40 space-y-2">
                   <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <TrendingUp className="h-4 w-4" /> Quality
                   </div>
                   <div className="text-3xl font-serif font-medium">{analytics.avg_quality_score.toFixed(1)}</div>
                   <div className="flex items-center gap-2">
                      <Progress value={analytics.avg_quality_score * 20} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">/ 5.0</span>
                   </div>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/5 border border-border/40 space-y-2">
                   <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Clock className="h-4 w-4" /> Speed
                   </div>
                   <div className="text-3xl font-serif font-medium">{analytics.avg_processing_time_ms}ms</div>
                   <p className="text-xs text-muted-foreground">Avg. Latency</p>
                </div>

                <div className="p-6 rounded-2xl bg-secondary/5 border border-border/40 space-y-2">
                   <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Activity className="h-4 w-4" /> Delta
                   </div>
                   <div className="text-3xl font-serif font-medium flex items-center gap-1">
                      {analytics.avg_length_change_percent > 0 ? '+' : ''}{analytics.avg_length_change_percent.toFixed(0)}%
                   </div>
                   <p className="text-xs text-muted-foreground">Length Change</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg font-serif font-medium">Content Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 rounded-2xl bg-card border border-border/40">
                    {renderContentTypeChart()}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none bg-transparent">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-lg font-serif font-medium">Quality Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 rounded-2xl bg-card border border-border/40">
                    {renderFeedbackChart()}
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              {analytics.top_performing_transformations.length > 0 && (
                <div className="mb-10">
                   <h3 className="text-lg font-serif font-medium mb-4">Top Performing Content</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.top_performing_transformations.map((t) => (
                         <div key={t.id} className="p-4 rounded-xl border border-border/40 bg-card hover:shadow-sm transition-all flex items-center justify-between">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs font-normal">{t.content_type}</Badge>
                                  <span className="text-xs text-muted-foreground">• {t.target_audience}</span>
                               </div>
                               <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
                            </div>
                            <div className="flex items-center gap-3">
                               <div className="flex flex-col items-end">
                                  <span className="text-sm font-medium">{t.quality_score}/5</span>
                                  <span className="text-xs text-muted-foreground">Quality</span>
                               </div>
                               {t.user_feedback > 0 && (
                                  <div className="flex flex-col items-end">
                                     <span className="text-sm font-medium flex items-center gap-1">{t.user_feedback} <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /></span>
                                     <span className="text-xs text-muted-foreground">User</span>
                                  </div>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Data Density (Performance) */}
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    <div>
                       <div className="text-2xl font-serif text-primary">{analytics.performance_metrics.total_original_chars.toLocaleString()}</div>
                       <div className="text-xs text-primary/60 mt-1">Input Chars</div>
                    </div>
                    <div>
                       <div className="text-2xl font-serif text-primary">{analytics.performance_metrics.total_transformed_chars.toLocaleString()}</div>
                       <div className="text-xs text-primary/60 mt-1">Output Chars</div>
                    </div>
                     <div>
                       <div className="text-2xl font-serif text-primary">{analytics.performance_metrics.avg_original_length.toFixed(0)}</div>
                       <div className="text-xs text-primary/60 mt-1">Avg Input</div>
                    </div>
                     <div>
                       <div className="text-2xl font-serif text-primary">{analytics.performance_metrics.avg_transformed_length.toFixed(0)}</div>
                       <div className="text-xs text-primary/60 mt-1">Avg Output</div>
                    </div>
                 </div>
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  )
}
