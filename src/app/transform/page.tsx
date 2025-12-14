'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { Sparkles, Copy, RotateCcw, Target, Type, Users, MessageCircle, Mail, Share2, FileText, Globe, Package, Zap, TrendingUp, Info, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    const hasHTML = /<\/?[a-z][\s\S]*>/i.test(content)
    const hasMarkdown = /(\*\*|__|##|###|\[.*\]\(.*\)|`.*`|\n-|\n\*|\n\d+\.)/.test(content)
    
    if (hasHTML || hasMarkdown) {
      return (
        <div className="prose prose-sm prose-stone max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({...props}) => <h1 className="text-xl font-serif font-medium mb-3 mt-4" {...props} />,
              h2: ({...props}) => <h2 className="text-lg font-serif font-medium mb-3 mt-4" {...props} />,
              p: ({...props}) => <p className="mb-4 leading-relaxed text-foreground/90" {...props} />,
              ul: ({...props}) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
              li: ({...props}) => <li className="text-sm" {...props} />,
              blockquote: ({...props}) => (
                <blockquote className="border-l-2 border-primary/30 pl-4 italic my-4 text-muted-foreground" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }
    
    return (
      <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-sans">
        {content}
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16 lg:pt-0 lg:ml-64 flex items-center justify-center p-6 h-screen">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-3xl font-serif font-light">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access the studio.</p>
            <Button onClick={() => window.location.href = '/auth/login'}>Sign In</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-6 py-8 sm:px-12 border-b border-border/40">
           <div className="max-w-6xl mx-auto flex items-end justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-light text-foreground mb-2">
                  Content Generator
                </h1>
                <p className="text-muted-foreground font-light text-sm">
                  Create on-brand content instantly.
                </p>
              </div>
              {result && (
                 <Button onClick={handleReset} variant="ghost" size="sm" className="hidden sm:flex">
                    <RotateCcw className="h-4 w-4 mr-2" /> Start New
                 </Button>
              )}
           </div>
        </div>

        <div className="flex-1 p-6 sm:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
            
            {/* Input Column */}
            <div className="space-y-8 flex flex-col h-full">
               <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Source Content</Label>
                    <Textarea
                      placeholder="Paste your draft here..."
                      value={originalContent}
                      onChange={(e) => setOriginalContent(e.target.value)}
                      className="min-h-[200px] lg:min-h-[300px] resize-none p-6 text-base leading-relaxed border-border/50 bg-secondary/10 focus:bg-background focus:ring-1 transition-all rounded-xl"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                       <span>{originalContent.length} characters</span>
                       {originalContent && <span>Ready to refine</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">Format</Label>
                      <Select value={contentType} onValueChange={setContentType}>
                        <SelectTrigger className="h-12 border-border/50 bg-background rounded-lg">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_TYPES.map((type) => {
                            const IconComponent = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4 opacity-50" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      {contentType === 'custom' && (
                        <Input
                           placeholder="Specify type..."
                           value={customContentType}
                           onChange={(e) => setCustomContentType(e.target.value)}
                           className="mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">Target Audience</Label>
                       <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger className="h-12 border-border/50 bg-background rounded-lg">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARGET_AUDIENCES.map((audience) => (
                            <SelectItem key={audience} value={audience}>
                                {audience === 'custom' ? 'Custom Audience...' : audience}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       {targetAudience === 'custom' && (
                        <Input
                          placeholder="Describe audience..."
                          value={customAudience}
                          onChange={(e) => setCustomAudience(e.target.value)}
                           className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                   <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Context / Notes</Label>
                    <Input
                      placeholder="Any specific instructions? (e.g., 'Make it punchy', 'Focus on value')"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      className="h-12 border-border/50 bg-background rounded-lg"
                    />
                  </div>
               </div>

               <div className="pt-4">
                  <Button 
                    onClick={handleTransform} 
                    disabled={isTransforming || !originalContent.trim() || !contentType || !targetAudience}
                    className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {isTransforming ? (
                      <span className="flex items-center gap-2 animate-pulse">
                        <Sparkles className="h-5 w-5 animate-spin" /> Refining Voice...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                         Refine Content <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
               </div>
            </div>

            {/* Output Column */}
            <div className={cn(
               "relative rounded-2xl bg-secondary/30 border border-border/50 p-6 sm:p-8 flex flex-col h-full transition-all duration-500",
               !result && "items-center justify-center opacity-70 bg-secondary/10 border-dashed"
            )}>
               {result ? (
                 <>
                   <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/10">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                            <h3 className="font-serif font-medium">Refined Output</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                               <Badge variant="outline" className="text-[10px] h-5">{result.quality_score}/5 Quality</Badge>
                               <span>{result.transformed_length} chars</span>
                            </div>
                         </div>
                      </div>
                      <Button onClick={() => copyToClipboard(result.transformed_content)} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                         <Copy className="h-4 w-4" />
                      </Button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {formatContent(result.transformed_content)}
                   </div>

                   <div className="mt-6 pt-4 border-t border-border/10">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                         <span>Change: <span className={result.length_change_percent >= 0 ? "text-green-600" : "text-orange-600"}>{result.length_change_percent > 0 ? '+' : ''}{result.length_change_percent}% length</span></span>
                         <span>{result.processing_time_ms}ms</span>
                      </div>
                   </div>
                 </>
               ) : (
                  <div className="text-center space-y-4 max-w-sm mx-auto">
                     <div className="w-16 h-16 rounded-full bg-background border border-border/50 flex items-center justify-center mx-auto shadow-sm">
                        <Type className="h-8 w-8 text-muted-foreground/50" />
                     </div>
                     <h3 className="text-xl font-serif font-light text-muted-foreground">Ready to refine</h3>
                     <p className="text-sm text-muted-foreground/60 leading-relaxed">
                        Your transformed content will appear here, optimized for your audience and tone.
                     </p>
                  </div>
               )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
