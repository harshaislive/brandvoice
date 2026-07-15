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
import { Label } from '@/components/ui/label'
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
import { Settings, Brain, CheckCircle, AlertCircle, Save, RotateCcw, ChevronDown, ChevronRight, Copy, Zap, Code2, Lightbulb, Lock, Unlock, Hash, Play, Mail, MessageSquare, Loader2, Target, Leaf, Gem } from 'lucide-react'

const promptSettingsSchema = z.object({
  'prompts.main': z.string().min(10, 'Main prompt must be at least 10 characters'),
  'prompts.transform': z.string().min(10, 'Transform prompt must be at least 10 characters'),
  'prompts.justification': z.string().min(10, 'Justification prompt must be at least 10 characters'),
})

type PromptSettingsForm = z.infer<typeof promptSettingsSchema>

const DEFAULT_PROMPTS = {
  'prompts.main': `You are Beforest's Brand Voice AI Assistant. Your role is to transform content to match our authentic, warm, and premium brand voice.

Brand Voice Principles:
- Authentic & Genuine: Honest, transparent communication without corporate jargon
- Warm & Approachable: Friendly, welcoming tone that's accessible to everyone
- Premium without Pretension: High quality standards while staying humble and grounded

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
  const [previewMode, setPreviewMode] = useState(true)
  const [isUsingDefaults, setIsUsingDefaults] = useState(false)
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [settingsPasscode, setSettingsPasscode] = useState('')
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
        
        const hasCustomPrompts = Object.keys(settings).length > 0 && 
          (settings['prompts.main'] || settings['prompts.transform'] || settings['prompts.justification'])
        
        setIsUsingDefaults(!hasCustomPrompts)
        
        form.reset({
          'prompts.main': settings['prompts.main'] || DEFAULT_PROMPTS['prompts.main'],
          'prompts.transform': settings['prompts.transform'] || DEFAULT_PROMPTS['prompts.transform'],
          'prompts.justification': settings['prompts.justification'] || DEFAULT_PROMPTS['prompts.justification'],
        })
        
        if (data.lastUpdated && hasCustomPrompts) {
          setLastSaved(new Date(data.lastUpdated))
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      setIsUsingDefaults(true)
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
          'Authorization': `Bearer ${token}`,
          'X-Settings-Passcode': settingsPasscode
        },
        body: JSON.stringify({ settings: data }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        setIsUsingDefaults(false)
        toast.success('System prompts saved successfully!')
        await loadSettings()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    if (currentTextarea) {
      const start = currentTextarea.selectionStart
      const end = currentTextarea.selectionEnd
      const text = currentTextarea.value
      const newText = text.substring(0, start) + variable + text.substring(end)
      const fieldName = promptTabs.find(t => t.key === activeTab)?.field
      if (fieldName) {
        // @ts-expect-error - Form library type issues
        form.setValue(fieldName, newText)
      }
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
          additional_context: `Testing prompts from settings page`,
          system_prompt: prompts['prompts.main'],
          transform_prompt: prompts['prompts.transform']
        })
      })

      if (!response.ok) throw new Error()
      const data = await response.json()
      setTestOutput(data.transformed_content || 'No output received')
      toast.success(`Test completed (${data.processing_time_ms}ms)`)
    } catch {
      toast.error(`Failed to test prompts`)
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleEditModeToggle = () => {
    if (previewMode) {
      setShowPasscodeDialog(true)
    } else {
      setPreviewMode(true)
      setSettingsPasscode('')
    }
  }
  
  const verifyPasscode = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/settings/access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Settings-Passcode': passcode
        }
      })

      if (!response.ok) {
        throw new Error('Invalid passcode')
      }

      setSettingsPasscode(passcode)
      setPreviewMode(false)
      setShowPasscodeDialog(false)
      setPasscode('')
      toast.success('Edit mode enabled')
    } catch {
      toast.error('Invalid passcode')
      setPasscode('')
    }
  }

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const promptTabs = [
    {
      key: 'main',
      label: 'System Core',
      icon: Brain,
      description: 'Main AI behavior',
      field: 'prompts.main' as keyof PromptSettingsForm,
    },
    {
      key: 'transform',
      label: 'Transformation',
      icon: Zap,
      description: 'Content rewrite logic',
      field: 'prompts.transform' as keyof PromptSettingsForm,
    },
    {
      key: 'justification',
      label: 'Analysis',
      icon: Code2,
      description: 'Quality scoring logic',
      field: 'prompts.justification' as keyof PromptSettingsForm,
    }
  ]

  const templateVariables = [
    { name: '{original_content}', description: "User's input content" },
    { name: '{content_type}', description: 'Content category' },
    { name: '{target_audience}', description: 'Intended audience' },
    { name: '{additional_context}', description: 'Optional context' },
  ]

  if (isLoading) {
    return (
       <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 lg:pt-0 lg:ml-64 p-6 sm:p-12 flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-serif">Loading studio configuration...</p>
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
         <div className="px-6 py-8 sm:px-12 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
           <div className="max-w-6xl mx-auto flex items-end justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-serif font-light text-foreground mb-2">
                  Configuration
                </h1>
                <p className="text-muted-foreground font-light text-sm">
                  System Prompts & Behavior
                </p>
              </div>
              
               <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditModeToggle}
                  className="gap-2"
                >
                  {previewMode ? (
                    <>
                      <Lock className="h-3 w-3" />
                      Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" />
                      Unlocked
                    </>
                  )}
                </Button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
           <div className="max-w-6xl mx-auto p-6 sm:p-12 space-y-12">
              
              {/* Status Bar */}
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-border/50">
                 <div className="flex items-center gap-3">
                    {isUsingDefaults ? (
                       <AlertCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                       <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                       {isUsingDefaults ? 'Using Default System Prompts' : 'Custom Prompts Active'}
                    </span>
                 </div>
                 {lastSaved && (
                    <span className="text-xs text-muted-foreground">Updated {lastSaved.toLocaleDateString()}</span>
                 )}
              </div>

              {/* Editor Section */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                 <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <TabsList className="flex flex-col h-auto bg-transparent space-y-2 w-full md:w-64 p-0">
                       {promptTabs.map(tab => (
                          <TabsTrigger 
                             key={tab.key} 
                             value={tab.key}
                             className="w-full justify-start px-4 py-3 h-auto border border-transparent data-[state=active]:bg-secondary/10 data-[state=active]:border-border/50 rounded-lg transition-all"
                          >
                             <div className="flex items-center gap-3">
                                <tab.icon className="h-4 w-4 opacity-70" />
                                <div className="text-left">
                                   <div className="font-medium text-sm">{tab.label}</div>
                                   <div className="text-xs text-muted-foreground font-normal opacity-70">{tab.description}</div>
                                </div>
                             </div>
                          </TabsTrigger>
                       ))}
                    </TabsList>

                    {/* Editor Content */}
                    <div className="flex-1 min-w-0">
                       <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             {promptTabs.map(tab => (
                                <TabsContent key={tab.key} value={tab.key} className="mt-0 space-y-4">
                                   <FormField
                                      control={form.control}
                                      name={tab.field}
                                      render={({ field }) => (
                                         <FormItem>
                                            <div className="relative">
                                               {!previewMode ? (
                                                  <div className="group relative">
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
                                                        className="font-mono text-sm min-h-[400px] leading-relaxed p-6 bg-background border-border/50 focus:ring-1 focus:ring-primary/20 resize-y"
                                                        placeholder="Enter prompt configuration..."
                                                     />
                                                     <div className="absolute top-4 right-4 text-xs text-muted-foreground opacity-50">
                                                        Press &apos;/&apos; for variables
                                                     </div>
                                                  </div>
                                               ) : (
                                                  <div className="min-h-[400px] p-6 bg-secondary/5 rounded-lg border border-border/30 overflow-y-auto">
                                                     <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
                                                        {field.value}
                                                     </pre>
                                                  </div>
                                               )}
                                            </div>
                                         </FormItem>
                                      )}
                                   />
                                   
                                   {!previewMode && (
                                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
                                         <Button type="button" variant="ghost" onClick={() => form.reset(DEFAULT_PROMPTS)}>Discard</Button>
                                         <Button type="submit" disabled={isSaving}>
                                            {isSaving ? 'Saving...' : 'Save Configuration'}
                                         </Button>
                                      </div>
                                   )}
                                </TabsContent>
                             ))}
                          </form>
                       </Form>
                    </div>
                 </div>
              </Tabs>

              {/* Testing Playground */}
              <div className="border-t border-border/40 pt-12">
                 <h2 className="text-2xl font-serif font-light mb-6">Playground</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <Label className="text-xs text-muted-foreground">Test Input</Label>
                       <Textarea 
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder="Enter text to test your current prompts..."
                          className="min-h-[200px] bg-background border-border/50"
                       />
                       <div className="flex gap-2">
                          <Button 
                             onClick={testPrompts} 
                             disabled={isTestLoading || !testInput}
                             className="w-full"
                             variant="secondary"
                          >
                             {isTestLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                             ) : (
                                <Play className="h-4 w-4 mr-2" />
                             )}
                             Run Test
                          </Button>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <Label className="text-xs text-muted-foreground">Output</Label>
                       <div className="min-h-[200px] p-4 rounded-md border border-border/50 bg-secondary/5 text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                          {testOutput || "Test output will appear here..."}
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </div>

          {/* Compact Reference Sections */}
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Template Variables */}
              <Collapsible>
                <Card className="bg-blue-50/50 border-blue-200/50 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-blue-100/50 transition-colors p-4">
                      <CardTitle className="flex items-center justify-between text-blue-900 text-sm">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4" />
                          Template Variables
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 text-sm text-blue-800 p-4">
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
              <Collapsible>
                <Card className="bg-green-50/50 border-green-200/50 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-green-100/50 transition-colors p-4">
                      <CardTitle className="flex items-center justify-between text-green-900 text-sm">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Brand Voice Guidelines
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 text-sm text-green-800 p-4">
                      <div className="space-y-2">
                        {[
                          { Icon: Target, title: 'Authentic & Genuine', desc: 'Honest, transparent communication' },
                          { Icon: Leaf, title: 'Warm & Approachable', desc: 'Friendly, welcoming tone' },
                          { Icon: Gem, title: 'Premium without Pretension', desc: 'Quality with humility' }
                        ].map((principle, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-white/60 rounded border border-green-200/50">
                            <principle.Icon className="h-4 w-4 text-green-700" />
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

        {/* Dialogs */}
        <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Enter Passcode</DialogTitle>
                <DialogDescription>
                  Enter the system passcode to edit production prompts.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4 items-center">
                <InputOTP
                    maxLength={6}
                    value={passcode}
                    onChange={setPasscode}
                    onComplete={() => void verifyPasscode()}
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
                  <Button onClick={() => void verifyPasscode()} className="w-full">Verify Access</Button>
              </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showCommandPalette} onOpenChange={setShowCommandPalette}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
              <Command>
                <CommandInput placeholder="Search variables..." />
                <CommandList>
                  <CommandEmpty>No variables found.</CommandEmpty>
                  <CommandGroup heading="Available Variables">
                    {templateVariables.map((variable) => (
                        <CommandItem
                          key={variable.name}
                          onSelect={() => insertVariable(variable.name)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-medium">{variable.name}</span>
                            <span className="text-xs text-muted-foreground">{variable.description}</span>
                          </div>
                        </CommandItem>
                      ))
                    }
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>

      </main>
    </div>
  )
}
