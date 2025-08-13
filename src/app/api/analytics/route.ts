import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Get analytics data for transformations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '7d' // 7d, 30d, 90d, 1y
    const userEmail = searchParams.get('user_email')
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Base query
    let query = supabase
      .from('beforest_transformations')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (userEmail) {
      query = query.eq('user_email', userEmail)
    }

    const { data: transformations, error } = await query

    if (error) {
      console.error('Error fetching analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' }, 
        { status: 500 }
      )
    }

    // Calculate analytics
    const analytics = {
      total_transformations: transformations.length,
      timeframe,
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      content_type_breakdown: {} as Record<string, number>,
      target_audience_breakdown: {} as Record<string, number>,
      avg_processing_time_ms: 0,
      avg_quality_score: 0,
      avg_length_change_percent: 0,
      feedback_breakdown: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      },
      daily_volume: {} as Record<string, number>,
      top_performing_transformations: [] as Array<{
        id: string
        content_type: string
        target_audience: string
        quality_score: number
        user_feedback: number
        created_at: string
      }>,
      performance_metrics: {
        total_original_chars: 0,
        total_transformed_chars: 0,
        avg_original_length: 0,
        avg_transformed_length: 0
      }
    }

    if (transformations.length === 0) {
      return NextResponse.json({ analytics })
    }

    // Process transformations for analytics
    let totalProcessingTime = 0
    let totalQualityScore = 0
    let totalLengthChange = 0
    let qualityScoreCount = 0
    let lengthChangeCount = 0

    transformations.forEach(t => {
      // Content type breakdown
      analytics.content_type_breakdown[t.content_type] = 
        (analytics.content_type_breakdown[t.content_type] || 0) + 1

      // Target audience breakdown
      analytics.target_audience_breakdown[t.target_audience] = 
        (analytics.target_audience_breakdown[t.target_audience] || 0) + 1

      // Processing time
      if (t.processing_time_ms) {
        totalProcessingTime += t.processing_time_ms
      }

      // Quality score
      if (t.transformation_quality_score) {
        totalQualityScore += t.transformation_quality_score
        qualityScoreCount++
      }

      // Length change
      if (t.length_change_percent !== null) {
        totalLengthChange += t.length_change_percent
        lengthChangeCount++
      }

      // Feedback breakdown
      if (t.user_feedback && t.user_feedback >= 1 && t.user_feedback <= 5) {
        analytics.feedback_breakdown[t.user_feedback as keyof typeof analytics.feedback_breakdown]++
      }

      // Daily volume
      const date = new Date(t.created_at).toISOString().split('T')[0]
      analytics.daily_volume[date] = (analytics.daily_volume[date] || 0) + 1

      // Performance metrics
      analytics.performance_metrics.total_original_chars += t.original_length
      analytics.performance_metrics.total_transformed_chars += t.transformed_length
    })

    // Calculate averages
    analytics.avg_processing_time_ms = Math.round(totalProcessingTime / transformations.length)
    analytics.avg_quality_score = qualityScoreCount > 0 ? 
      Math.round((totalQualityScore / qualityScoreCount) * 100) / 100 : 0
    analytics.avg_length_change_percent = lengthChangeCount > 0 ? 
      Math.round((totalLengthChange / lengthChangeCount) * 100) / 100 : 0

    analytics.performance_metrics.avg_original_length = 
      Math.round(analytics.performance_metrics.total_original_chars / transformations.length)
    analytics.performance_metrics.avg_transformed_length = 
      Math.round(analytics.performance_metrics.total_transformed_chars / transformations.length)

    // Top performing transformations (highest quality scores with feedback)
    analytics.top_performing_transformations = transformations
      .filter(t => t.transformation_quality_score && t.user_feedback)
      .sort((a, b) => 
        (b.transformation_quality_score + b.user_feedback) - 
        (a.transformation_quality_score + a.user_feedback)
      )
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        content_type: t.content_type,
        target_audience: t.target_audience,
        quality_score: t.transformation_quality_score,
        user_feedback: t.user_feedback,
        created_at: t.created_at
      }))

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics' }, 
      { status: 500 }
    )
  }
}