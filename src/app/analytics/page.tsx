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
      <div className="space-y-3">
        {Object.entries(analytics.content_type_breakdown).map(([type, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
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
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = analytics.feedback_breakdown[star] || 0
          const percentage = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span>{star}</span>
                  <span className="text-yellow-500">⭐</span>
                </div>
                <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Track your transformation performance and insights
              </p>
            </div>
            
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
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
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={fetchAnalytics}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Transformations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_transformations}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      In the last {timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : timeframe === '90d' ? '90 days' : 'year'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avg_quality_score.toFixed(1)}/5</div>
                    <div className="flex items-center mt-1">
                      <Progress value={analytics.avg_quality_score * 20} className="w-16 mr-2" />
                      <span className="text-xs text-muted-foreground">
                        {(analytics.avg_quality_score * 20).toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.avg_processing_time_ms}ms</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average response time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Length Change</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.avg_length_change_percent > 0 ? '+' : ''}
                      {analytics.avg_length_change_percent.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average content change
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderContentTypeChart()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderFeedbackChart()}
                  </CardContent>
                </Card>
              </div>

              {/* Target Audience Breakdown */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Target Audience Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.target_audience_breakdown).map(([audience, count]) => (
                      <Badge key={audience} variant="secondary" className="gap-1">
                        <span className="capitalize">{audience}</span>
                        <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs">
                          {count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analytics.performance_metrics.total_original_chars.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Original Chars</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analytics.performance_metrics.total_transformed_chars.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transformed Chars</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analytics.performance_metrics.avg_original_length}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Original Length</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {analytics.performance_metrics.avg_transformed_length}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Transformed Length</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Transformations */}
              {analytics.top_performing_transformations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Transformations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.top_performing_transformations.map((transformation) => (
                        <div key={transformation.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {transformation.content_type}
                              </Badge>
                              <Badge variant="outline">
                                {transformation.target_audience}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Quality: {transformation.quality_score}/5
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Feedback: {transformation.user_feedback}⭐
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transformation.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}