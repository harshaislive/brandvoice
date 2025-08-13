'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { Sparkles, Copy, RotateCcw, Target, Type, Users, MessageCircle, Mail, Share2, FileText, Globe, Package, Zap, TrendingUp, Info } from 'lucide-react'
import { toast } from 'sonner'

interface TransformResult {
  transformed_content: string
  transformation_id: string
  original_length: number
  transformed_length: number
  length_change_percent: number
  processing_time_ms: number
  quality_score: number
  justification: Record<string, unknown>
}

const CONTENT_TYPES = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'social', label: 'Social Media', icon: Share2 },
  { value: 'marketing', label: 'Marketing Copy', icon: Target },
  { value: 'blog', label: 'Blog Post', icon: FileText },
  { value: 'website', label: 'Website Copy', icon: Globe },
  { value: 'product', label: 'Product Description', icon: Package },
  { value: 'custom', label: 'Custom Type...', icon: Type }
]

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
  'custom'
]

export default function TransformPage() {
  const { isAuthenticated } = useAuth()
  const [originalContent, setOriginalContent] = useState('')
  const [contentType, setContentType] = useState('')
  const [customContentType, setCustomContentType] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [customAudience, setCustomAudience] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [result, setResult] = useState<TransformResult | null>(null)

  const handleTransform = async () => {
    const finalContentType = contentType === 'custom' ? customContentType : contentType
    const finalAudience = targetAudience === 'custom' ? customAudience : targetAudience
    
    if (!originalContent.trim() || !finalContentType || !finalAudience) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsTransforming(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          original_content: originalContent,
          content_type: finalContentType,
          target_audience: finalAudience,
          additional_context: additionalContext
        })
      })

      if (!response.ok) {
        throw new Error('Transformation failed')
      }

      const data = await response.json()
      setResult(data)
      toast.success('Content transformed successfully!')
      
    } catch (error) {
      console.error('Transform error:', error)
      toast.error('Failed to transform content')
    } finally {
      setIsTransforming(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleReset = () => {
    setOriginalContent('')
    setContentType('')
    setCustomContentType('')
    setTargetAudience('')
    setCustomAudience('')
    setAdditionalContext('')
    setResult(null)
  }

  const selectedContentType = CONTENT_TYPES.find(ct => ct.value === contentType)

  // Helper function to detect and format content
  const formatContent = (content: string) => {
    // Check if content contains markdown
    const hasMarkdown = /(\*\*|__|##|###|\[.*\]\(.*\)|`.*`|\n-|\n\*|\n\d+\.)/.test(content)
    
    // Check if content contains HTML
    const hasHTML = /<\/?[a-z][\s\S]*>/i.test(content)
    
    if (hasHTML || hasMarkdown) {
      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={{
            // Custom styling for markdown elements
            h1: ({...props}) => <h1 className="text-lg font-semibold mb-2" {...props} />,
            h2: ({...props}) => <h2 className="text-base font-semibold mb-2" {...props} />,
            h3: ({...props}) => <h3 className="text-sm font-semibold mb-1" {...props} />,
            p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
            ul: ({...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
            ol: ({...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
            li: ({...props}) => <li className="text-sm" {...props} />,
            code: ({inline, ...props}: {inline?: boolean} & React.HTMLProps<HTMLElement>) => 
              inline ? (
                <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props} />
              ) : (
                <code className="block bg-muted p-2 rounded text-xs overflow-x-auto" {...props} />
              ),
            strong: ({...props}) => <strong className="font-semibold" {...props} />,
            em: ({...props}) => <em className="italic" {...props} />,
            blockquote: ({...props}) => (
              <blockquote className="border-l-2 border-muted-foreground/20 pl-3 text-muted-foreground italic mb-2" {...props} />
            ),
            a: ({...props}) => <a className="text-primary underline" {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }
    
    // Default: preserve line breaks and format as plain text
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16 lg:pt-0 lg:ml-64 flex items-center justify-center p-4 sm:p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                Transform Content
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please sign in to access the content transformation feature.
              </p>
              <Button onClick={() => window.location.href = '/auth/login'} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6 min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col justify-center">
        <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-primary">Transform Content</h1>
                <p className="text-sm text-muted-foreground">Authentic brand voice transformation</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Input Section - Mobile Friendly */}
            <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Type className="h-4 w-4" />
                    Content & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="content" className="text-xs font-medium">Content to Transform *</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your content here..."
                      value={originalContent}
                      onChange={(e) => setOriginalContent(e.target.value)}
                      className="min-h-28 text-sm resize-both"
                    />
                    {originalContent && (
                      <Badge variant="outline" className="text-xs h-5">
                        {originalContent.length} chars
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="content-type" className="text-xs font-medium">Type *</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_TYPES.map((type) => {
                            const IconComponent = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value} className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <IconComponent className="h-3 w-3" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      
                      {contentType === 'custom' && (
                        <Input
                          placeholder="Enter content type..."
                          value={customContentType}
                          onChange={(e) => setCustomContentType(e.target.value)}
                          className="h-8 text-xs mt-1.5"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="audience" className="text-xs font-medium">Audience *</Label>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map((audience) => (
                            <SelectItem key={audience} value={audience} className="text-xs">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                {audience === 'custom' ? 'Custom Audience...' : audience}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {targetAudience === 'custom' && (
                        <Input
                          placeholder="Enter your target audience..."
                          value={customAudience}
                          onChange={(e) => setCustomAudience(e.target.value)}
                          className="h-8 text-xs mt-1.5"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="context" className="text-xs font-medium">Context (Optional)</Label>
                    <Textarea
                      id="context"
                      placeholder="Additional requirements or context..."
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      className="min-h-16 text-sm resize-vertical"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleTransform} 
                      disabled={isTransforming || !originalContent.trim() || !contentType || (contentType === 'custom' && !customContentType.trim()) || !targetAudience || (targetAudience === 'custom' && !customAudience.trim())}
                      className="flex-1 h-8 text-xs gap-1.5"
                      size="sm"
                    >
                      {isTransforming ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          Transforming...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3" />
                          Transform
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Output Section - Mobile Friendly */}
            <div className="space-y-4">
              {result ? (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Result
                        </CardTitle>
                        <Button 
                          onClick={() => copyToClipboard(result.transformed_content)}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-secondary/30 rounded-md p-3 border text-sm">
                        {formatContent(result.transformed_content)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Quality Score */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Quality Score</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">
                                    Quality score (1-5) based on content preservation, 
                                    appropriate length changes, and optimization for the selected content type.
                                    Higher scores indicate better brand voice alignment and audience targeting.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Badge variant="secondary" className="h-4 text-xs px-1">
                            {result.quality_score}/5
                          </Badge>
                        </div>
                        <Progress value={result.quality_score * 20} className="h-1" />
                      </div>

                      {/* Content Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Original</div>
                          <div className="text-sm font-mono">{result.original_length}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Result</div>
                          <div className="text-sm font-mono">{result.transformed_length}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Change</div>
                          <div className={`text-sm font-mono ${result.length_change_percent >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {result.length_change_percent >= 0 ? '+' : ''}{result.length_change_percent}%
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedContentType && (
                          <Badge variant="outline" className="h-5 text-xs gap-1 px-1.5">
                            {React.createElement(selectedContentType.icon, { className: "h-2.5 w-2.5" })}
                            {contentType === 'custom' ? customContentType : selectedContentType.label}
                          </Badge>
                        )}
                        <Badge variant="outline" className="h-5 text-xs gap-1 px-1.5">
                          <Users className="h-2.5 w-2.5" />
                          {targetAudience === 'custom' ? customAudience : targetAudience}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-dashed border-muted-foreground/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="p-3 rounded-full bg-muted/50">
                      <MessageCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Ready to Transform</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Configure your content and settings, then transform to see results here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}