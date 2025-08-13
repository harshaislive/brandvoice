'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BeforestTransformation } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'

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
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error(`Failed to fetch transformations: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received transformations:', data.transformations?.length || 0, 'records')
      console.log('Total records in database:', data.total_count)
      console.log('First transformation:', data.transformations?.[0])
      
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

  const submitFeedback = async (id: string, feedback: number) => {
    try {
      const response = await fetch(`/api/transform/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      })
      
      if (response.ok) {
        // Update local state
        setTransformations(prev => 
          prev.map(t => t.id === id ? { ...t, user_feedback: feedback } : t)
        )
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">
              Transformation History
            </h1>
            <p className="text-muted-foreground">
              View and manage your brand voice transformations
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Input
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <Select value={filters.content_type || "all"} onValueChange={(value) => handleFilterChange('content_type', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.target_audience || "all"} onValueChange={(value) => handleFilterChange('target_audience', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="prospects">Prospects</SelectItem>
                    <SelectItem value="partners">Partners</SelectItem>
                    <SelectItem value="employees">Employees</SelectItem>
                    <SelectItem value="investors">Investors</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ content_type: '', target_audience: '', search: '' })}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => fetchTransformations(true)}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && transformations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading transformations...</p>
            </div>
          ) : filteredTransformations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transformations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransformations.map((transformation) => (
                <Card key={transformation.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">
                            {transformation.content_type}
                          </Badge>
                          <Badge variant="outline">
                            {transformation.target_audience}
                          </Badge>
                          {transformation.transformation_quality_score && (
                            <Badge variant="default">
                              Quality: {transformation.transformation_quality_score}/5
                            </Badge>
                          )}
                          {transformation.api_model_used && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {transformation.api_model_used}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transformation.created_at && formatDistanceToNow(new Date(transformation.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Feedback Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => submitFeedback(transformation.id, star)}
                            className={`text-lg hover:scale-110 transition-transform ${
                              transformation.user_feedback && star <= transformation.user_feedback
                                ? 'text-yellow-500'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-sm">Transformed Content</h4>
                        <div className="bg-accent/50 p-3 rounded text-sm max-h-32 sm:max-h-none overflow-y-auto">
                          {transformation.transformed_content}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{transformation.transformed_length} characters</span>
                          {transformation.length_change_percent && (
                            <span className={`${
                              transformation.length_change_percent > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({transformation.length_change_percent > 0 ? '+' : ''}{transformation.length_change_percent.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                          View Original Content
                        </summary>
                        <div className="mt-2 bg-muted p-3 rounded text-sm max-h-32 overflow-y-auto">
                          {transformation.original_content}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transformation.original_length} characters
                        </p>
                      </details>
                    </div>

                    {transformation.additional_context && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Additional Context</h4>
                        <p className="text-sm text-muted-foreground">
                          {transformation.additional_context}
                        </p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center py-6">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPage(prev => prev + 1)
                      fetchTransformations(false)
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}