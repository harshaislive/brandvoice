'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Navigation } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Settings, Brain, CheckCircle, AlertCircle, Save, RotateCcw, ChevronDown, ChevronRight, Copy, Zap, Code2, Lightbulb, Lock, Unlock, Hash, Play, Mail, MessageSquare, Loader2 } from 'lucide-react'

const promptSettingsSchema = z.object({
  'prompts.main': z.string().min(10, 'Main prompt must be at least 10 characters'),
  'prompts.transform': z.string().min(10, 'Transform prompt must be at least 10 characters'),
  'prompts.justification': z.string().min(10, 'Justification prompt must be at least 10 characters'),
})

type PromptSettingsForm = z.infer<typeof promptSettingsSchema>

const DEFAULT_PROMPTS = {
  'prompts.main': `You are Beforest's Brand Voice AI Assistant. Your role is to transform content to match our authentic, warm, and premium brand voice.

Brand Voice Principles:
🎯 Authentic & Genuine: Honest, transparent communication without corporate jargon
🌱 Warm & Approachable: Friendly, welcoming tone that's accessible to everyone
💎 Premium without Pretension: High quality standards while staying humble and grounded

Always maintain these principles while adapting tone for the specific content type and target audience.`,

  'prompts.transform': `Transform the following content to match Beforest's brand voice while maintaining its core message and purpose.

Original Content: {original_content}
Content Type: {content_type}
Target Audience: {target_audience}
Additional Context: {additional_context}

Apply Beforest's brand voice principles:
- Authentic & Genuine: Use honest, transparent language
- Warm & Approachable: Make it friendly and accessible
- Premium without Pretension: Maintain quality while staying humble

Return only the transformed content, maintaining the original structure and key points.`,

  'prompts.justification': `Analyze the content transformation and provide justification.

Original: {original_content}
Transformed: {transformed_content}
Content Type: {content_type}
Target Audience: {target_audience}

Provide analysis on:
1. Brand elements applied
2. Audience optimization changes
3. Tone and voice adjustments made
4. Quality assessment (1-5 score)

Format as JSON with: brand_elements_applied (array), audience_optimization (string), quality_score (number).`
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('main')
  const [previewMode, setPreviewMode] = useState(true) // Always start in preview
  const [isUsingDefaults, setIsUsingDefaults] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    variables: false,
    guidelines: false
  })
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [currentTextarea, setCurrentTextarea] = useState<HTMLTextAreaElement | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')
  const [testContentType, setTestContentType] = useState<'email' | 'whatsapp'>('email')
  const [isTestLoading, setIsTestLoading] = useState(false)

  const form = useForm<PromptSettingsForm>({
    resolver: zodResolver(promptSettingsSchema),
    defaultValues: DEFAULT_PROMPTS,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const settings = data.settings || {}
        
        // Check if we have any custom prompts or using defaults
        const hasCustomPrompts = Object.keys(settings).length > 0 && 
          (settings['prompts.main'] || settings['prompts.transform'] || settings['prompts.justification'])
        
        setIsUsingDefaults(!hasCustomPrompts)
        
        // Map settings to form values
        form.reset({
          'prompts.main': settings['prompts.main'] || DEFAULT_PROMPTS['prompts.main'],
          'prompts.transform': settings['prompts.transform'] || DEFAULT_PROMPTS['prompts.transform'],
          'prompts.justification': settings['prompts.justification'] || DEFAULT_PROMPTS['prompts.justification'],
        })
        
        if (data.lastUpdated && hasCustomPrompts) {
          setLastSaved(new Date(data.lastUpdated))
        }
        
        if (!hasCustomPrompts) {
          toast.info('No custom prompts found. Using default prompts.')
        }
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setIsUsingDefaults(true)
      toast.error('Failed to load settings from database. Using defaults.')
      form.reset(DEFAULT_PROMPTS)
    } finally {
      setIsLoading(false)
    }
  }, [form])

  const onSubmit = async (data: PromptSettingsForm) => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: data }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        setIsUsingDefaults(false)
        toast.success('System prompts saved to database successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('Failed to save settings to database')
    } finally {
      setIsSaving(false)
    }
  }

  const resetSinglePrompt = (key: keyof PromptSettingsForm) => {
    // @ts-expect-error - Form library type issues
    form.setValue(key, DEFAULT_PROMPTS[key])
    toast.success('Prompt reset to default')
  }

  const copyPrompt = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleEditModeToggle = () => {
    if (previewMode) {
      setShowPasscodeDialog(true)
    } else {
      setPreviewMode(true)
    }
  }

  const verifyPasscode = () => {
    // In production, you'd get this from process.env.PASS_CODE
    const correctPasscode = process.env.NEXT_PUBLIC_PASS_CODE || '123456'
    
    if (passcode === correctPasscode) {
      setPreviewMode(false)
      setShowPasscodeDialog(false)
      setPasscode('')
      toast.success('Edit mode enabled')
    } else {
      toast.error('Invalid passcode')
      setPasscode('')
    }
  }

  const templateVariables = [
    { name: '{original_content}', description: "User's input content for transformation" },
    { name: '{content_type}', description: 'Content category (marketing, email, etc.)' },
    { name: '{target_audience}', description: 'Intended audience for the content' },
    { name: '{additional_context}', description: 'Optional user-provided context' },
    { name: '{transformed_content}', description: 'Final result (justification only)' }
  ]

  const insertVariable = (variable: string) => {
    if (currentTextarea) {
      const start = currentTextarea.selectionStart
      const end = currentTextarea.selectionEnd
      const text = currentTextarea.value
      const newText = text.substring(0, start) + variable + text.substring(end)
      
      // Update the form value
      const fieldName = promptTabs.find(t => t.key === activeTab)?.field
      if (fieldName) {
        // @ts-expect-error - Form library type issues
        form.setValue(fieldName, newText)
      }
      
      // Focus back and set cursor position
      setTimeout(() => {
        currentTextarea.focus()
        currentTextarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
    setShowCommandPalette(false)
    setCommandQuery('')
  }

  const testPrompts = async () => {
    if (!testInput.trim()) {
      toast.error('Please enter some text to transform')
      return
    }

    setIsTestLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const prompts = form.getValues()
      
      const response = await fetch('/api/test-prompts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original_content: testInput,
          content_type: testContentType,
          target_audience: testContentType === 'email' ? 'professional contacts' : 'casual messaging',
          additional_context: `Testing prompts from settings page - optimize for ${testContentType} format and best practices`,
          system_prompt: prompts['prompts.main'],
          transform_prompt: prompts['prompts.transform']
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTestOutput(data.transformed_content || 'No output received')
      toast.success(`Prompts tested successfully! (${data.processing_time_ms}ms)`)
    } catch (error) {
      console.error('Test prompts error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to test prompts: ${errorMessage}`)
    } finally {
      setIsTestLoading(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Navigation />
        <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Skeleton className="h-[400px] w-full rounded-xl" />
              </div>
              <div className="lg:col-span-3">
                <Skeleton className="h-[500px] w-full rounded-xl" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const promptTabs = [
    {
      key: 'main',
      label: 'System Core',
      icon: Brain,
      description: 'Main AI system prompt that defines brand voice behavior',
      field: 'prompts.main' as keyof PromptSettingsForm,
      color: 'text-purple-600 bg-purple-100',
      category: 'Foundation'
    },
    {
      key: 'transform',
      label: 'Transform Engine',
      icon: Zap,
      description: 'Template for content transformation with dynamic variables',
      field: 'prompts.transform' as keyof PromptSettingsForm,
      color: 'text-blue-600 bg-blue-100',
      category: 'Processing'
    },
    {
      key: 'justification',
      label: 'Analysis Core',
      icon: Code2,
      description: 'Framework for transformation analysis and quality assessment',
      field: 'prompts.justification' as keyof PromptSettingsForm,
      color: 'text-green-600 bg-green-100',
      category: 'Analytics'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Navigation />
      
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <Settings className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    AI Prompt Studio
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Configure the intelligent prompts that power Beforest&apos;s brand voice transformation engine
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditModeToggle}
                  className="gap-2"
                >
                  {previewMode ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Enable Edit Mode
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Preview Mode
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-card/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                {isUsingDefaults ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-foreground">Using default prompts</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-foreground">Last saved: {lastSaved.toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-foreground">Custom prompts loaded</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isUsingDefaults ? (
                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-200">Default Mode</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Database Mode</Badge>
                )}
                <Badge variant="outline" className="text-xs">v4.2.1</Badge>
              </div>
            </div>
          </div>

          {/* Alert Section */}
          <Alert className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold">Production Environment</AlertTitle>
            <AlertDescription className="text-amber-700 mt-1">
              These prompts control the AI&apos;s behavior in production. Changes affect all transformations immediately.
              <strong className="block mt-1">Always test in development before applying to production.</strong>
            </AlertDescription>
          </Alert>

          {/* Main Content - Mobile Responsive */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="rounded-xl border border-border/50 bg-card/30">
            <div className="lg:grid lg:grid-cols-[300px,1fr]">
              {/* Mobile Tab List */}
              <div className="lg:hidden border-b bg-muted/50">
                <TabsList className="h-auto p-2 bg-transparent justify-start w-full overflow-x-auto">
                  {promptTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.key} 
                      value={tab.key}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-2 text-xs whitespace-nowrap"
                    >
                      <tab.icon className="h-3 w-3 mr-1" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block p-6 border-r space-y-4">
                <div className="space-y-1 mb-6">
                  <h3 className="font-semibold text-lg">Prompt Modules</h3>
                  <p className="text-sm text-muted-foreground">Select a prompt to configure</p>
                </div>
                
                <TabsList className="h-auto flex-col w-full bg-transparent p-0 space-y-3">
                  {promptTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.key} 
                      value={tab.key}
                      className="w-full p-4 rounded-lg border transition-all text-left group justify-start h-auto data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm hover:border-primary/50 hover:bg-accent/50"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={`p-2 rounded-md ${tab.color} transition-colors`}>
                          <tab.icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{tab.label}</h4>
                            <Badge variant="outline" className="text-xs">{tab.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{tab.description}</p>
                        </div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {/* Main Content */}
              <div className="flex-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
                    {promptTabs.map((tab) => (
                      <TabsContent key={tab.key} value={tab.key} className="flex-1 flex flex-col mt-0">
                        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
                          {/* Editor Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`p-2 sm:p-3 rounded-lg ${tab.color}`}>
                                <tab.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                              </div>
                              <div>
                                <h2 className="text-xl sm:text-2xl font-bold">{tab.label}</h2>
                                <p className="text-sm text-muted-foreground">{tab.description}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyPrompt(form.getValues()[tab.field])}
                                className="text-xs"
                              >
                                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Copy
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => resetSinglePrompt(tab.field)}
                                className="text-xs"
                              >
                                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Reset
                              </Button>
                            </div>
                          </div>

                          {/* Editor Content */}
                          <FormField
                            control={form.control}
                            name={tab.field}
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  Prompt Configuration
                                </FormLabel>
                                
                                {!previewMode ? (
                                  <FormControl>
                                    <div className="relative">
                                      <Textarea
                                        {...field}
                                        ref={(el) => {
                                          if (el) setCurrentTextarea(el)
                                          field.ref(el)
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '/' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                                            e.preventDefault()
                                            setShowCommandPalette(true)
                                          }
                                        }}
                                        placeholder={`Configure your ${tab.label.toLowerCase()} prompt... (Press '/' for variables)`}
                                        className="h-[200px] sm:h-[280px] font-mono text-sm resize-none border-0 bg-muted/30 focus:bg-background transition-colors pr-4 sm:pr-48"
                                      />
                                      <div className="hidden sm:flex absolute top-3 right-3 flex-col gap-1 items-end">
                                        <div className="flex gap-1">
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {(field.value as string).length} chars
                                          </Badge>
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {(field.value as string).split('\n').length} lines
                                          </Badge>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-xs text-blue-600">
                                          <Hash className="h-3 w-3 mr-1" />
                                          Press / for variables
                                        </Badge>
                                      </div>
                                      <div className="flex sm:hidden justify-between mt-2">
                                        <div className="flex gap-2">
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {(field.value as string).length} chars
                                          </Badge>
                                          <Badge variant="secondary" className="font-mono text-xs">
                                            {(field.value as string).split('\n').length} lines
                                          </Badge>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-xs text-blue-600">
                                          <Hash className="h-3 w-3 mr-1" />
                                          Press / for variables
                                        </Badge>
                                      </div>
                                    </div>
                                  </FormControl>
                                ) : (
                                  <div className="h-[200px] sm:h-[280px] p-4 bg-muted/30 rounded-lg border border-dashed border-border overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                                      {field.value}
                                    </pre>
                                  </div>
                                )}
                                
                                <FormDescription className="text-sm">
                                  {tab.key === 'main' && 'Core AI system prompt that defines brand voice behavior'}
                                  {tab.key === 'transform' && 'Template for content transformation with {placeholder} variables'}
                                  {tab.key === 'justification' && 'Framework for transformation analysis and quality assessment'}
                                </FormDescription>
                                
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {/* Footer Actions */}
                        <div className="border-t bg-card/50 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs sm:text-sm">Auto-save enabled</span>
                              </div>
                              <div className="h-4 w-px bg-border"></div>
                              <span className="text-xs sm:text-sm">Last change: {new Date().toLocaleTimeString()}</span>
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => form.reset(DEFAULT_PROMPTS)}
                                className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                                size="sm"
                              >
                                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                                Discard Changes
                              </Button>
                              
                              <Button
                                type="submit"
                                disabled={isSaving}
                                className="gap-2 min-w-[120px] sm:min-w-[140px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary flex-1 sm:flex-none text-xs sm:text-sm"
                                size="sm"
                              >
                                {isSaving ? (
                                  <>
                                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    Deploying...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Deploy to Production
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </form>
                </Form>
              </div>
            </div>
          </Tabs>

          {/* Test Prompts Section */}
          <Card className="mt-8 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Play className="h-5 w-5" />
                Test Your Prompts
              </CardTitle>
              <p className="text-sm text-blue-700">
                Test how your configured prompts transform content for different formats
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-medium text-blue-900">Input Content</h4>
                    <div className="flex gap-1">
                      <Button
                        variant={testContentType === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestContentType('email')}
                        className="gap-2"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </Button>
                      <Button
                        variant={testContentType === 'whatsapp' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestContentType('whatsapp')}
                        className="gap-2"
                      >
                        <MessageSquare className="h-3 w-3" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder={`Enter text to transform for ${testContentType}...`}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="h-[200px] resize-none"
                  />
                  
                  <Button
                    onClick={testPrompts}
                    disabled={isTestLoading || !testInput.trim()}
                    className="w-full gap-2"
                  >
                    {isTestLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testing Prompts...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Test Transformation
                      </>
                    )}
                  </Button>
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900">Transformed Output</h4>
                    {testOutput && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(testOutput)
                          toast.success('Output copied to clipboard')
                        }}
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    )}
                  </div>
                  
                  <div className="h-[200px] p-4 bg-white/60 rounded-lg border border-blue-200/50 overflow-y-auto">
                    {testOutput ? (
                      <pre className="whitespace-pre-wrap text-sm text-blue-900 font-mono leading-relaxed">
                        {testOutput}
                      </pre>
                    ) : (
                      <p className="text-sm text-blue-600/60 italic">
                        Output will appear here after testing...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Reference Sections */}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Template Variables */}
              <Collapsible open={expandedSections.variables} onOpenChange={() => toggleSection('variables')}>
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-blue-100/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-blue-900">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-5 w-5" />
                          Template Variables
                        </div>
                        {expandedSections.variables ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 text-sm text-blue-800">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { var: '{original_content}', desc: "User's input content" },
                          { var: '{content_type}', desc: "Content category" },
                          { var: '{target_audience}', desc: "Intended audience" },
                          { var: '{additional_context}', desc: "Optional context" },
                          { var: '{transformed_content}', desc: "Final result (justification only)" }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded border border-blue-200/50">
                            <code className="font-mono text-xs font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                              {item.var}
                            </code>
                            <span className="text-xs text-blue-700">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Brand Guidelines */}
              <Collapsible open={expandedSections.guidelines} onOpenChange={() => toggleSection('guidelines')}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-green-100/50 transition-colors">
                      <CardTitle className="flex items-center justify-between text-green-900">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          Brand Voice Guidelines
                        </div>
                        {expandedSections.guidelines ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 text-sm text-green-800">
                      <div className="space-y-2">
                        {[
                          { icon: '🎯', title: 'Authentic & Genuine', desc: 'Honest, transparent communication' },
                          { icon: '🌱', title: 'Warm & Approachable', desc: 'Friendly, welcoming tone' },
                          { icon: '💎', title: 'Premium without Pretension', desc: 'Quality with humility' }
                        ].map((principle, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded border border-green-200/50">
                            <span className="text-base">{principle.icon}</span>
                            <div>
                              <h4 className="font-medium text-green-900 text-xs">{principle.title}</h4>
                              <p className="text-xs text-green-700">{principle.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </div>
          
          {/* Passcode Dialog */}
          <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Enter Passcode
                </DialogTitle>
                <DialogDescription>
                  Enter the passcode to enable edit mode for system prompts.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={passcode}
                    onChange={setPasscode}
                    onComplete={verifyPasscode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowPasscodeDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={verifyPasscode} disabled={passcode.length !== 6}>
                    Verify
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Command Palette for Variables */}
          <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
            <DialogContent className="sm:max-w-lg p-0">
              <Command>
                <CommandInput 
                  placeholder="Search template variables..." 
                  value={commandQuery}
                  onValueChange={setCommandQuery}
                />
                <CommandList>
                  <CommandEmpty>No variables found.</CommandEmpty>
                  <CommandGroup heading="Template Variables">
                    {templateVariables
                      .filter(variable => 
                        variable.name.toLowerCase().includes(commandQuery.toLowerCase()) ||
                        variable.description.toLowerCase().includes(commandQuery.toLowerCase())
                      )
                      .map((variable) => (
                        <CommandItem
                          key={variable.name}
                          onSelect={() => insertVariable(variable.name)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-blue-600" />
                              <code className="font-mono text-sm font-medium">
                                {variable.name}
                              </code>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {variable.description}
                            </span>
                          </div>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}