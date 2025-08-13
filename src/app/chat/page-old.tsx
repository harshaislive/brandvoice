'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { 
  SidebarProvider,
  SidebarInset 
} from '@/components/ui/sidebar'
import { UnifiedSidebar } from '@/components/chat/unified-sidebar'
import { Conversation, Message } from '@/types/database'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessage extends Message {
  isLoading?: boolean
  isSearching?: boolean
  searchQuery?: string
}

export default function ChatPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [newConversationTitle, setNewConversationTitle] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [userLocation, setUserLocation] = useState({ country: 'US', city: 'New York', region: 'New York' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
        if (data.conversations?.length > 0 && !activeConversation) {
          setActiveConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setConversationsLoading(false)
    }
  }, [isAuthenticated, activeConversation])

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!isAuthenticated) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    }
  }, [isAuthenticated, fetchConversations])

  useEffect(() => {
    if (activeConversation && isAuthenticated) {
      fetchMessages(activeConversation.id)
    }
  }, [activeConversation, isAuthenticated, fetchMessages])

  const createConversation = async () => {
    if (!newConversationTitle.trim() || !isAuthenticated) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newConversationTitle,
          mode: 'chat'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(prev => [data.conversation, ...prev])
        setActiveConversation(data.conversation)
        setNewConversationTitle('')
        setShowNewConversation(false)
        toast.success('New conversation created!')
      }
    } catch {
      toast.error('Failed to create conversation')
    }
  }

  const deleteConversation = async (conversationId: string) => {
    // Placeholder function - implement deletion logic here
    console.log('Delete conversation:', conversationId)
  }

  const editConversation = async (conversationId: string, newTitle: string) => {
    // Placeholder function - implement edit logic here
    console.log('Edit conversation:', conversationId, newTitle)
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversation(conversation)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: activeConversation.id,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    const streamingMessageId = (Date.now() + 1).toString()
    const streamingMessage: ChatMessage = {
      id: streamingMessageId,
      conversation_id: activeConversation.id,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: false
    }

    setMessages(prev => [...prev, userMessage, streamingMessage])
    setNewMessage('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          conversationId: activeConversation.id,
          enableWebSearch,
          userLocation
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'content') {
                console.log('Frontend received chunk:', JSON.stringify(data.content))
                
                // Update the streaming message with new content
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: msg.content + data.content, isSearching: false }
                    : msg
                ))
              } else if (data.type === 'web_search') {
                // Handle web search status
                if (data.status === 'searching') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === streamingMessageId 
                      ? { ...msg, isSearching: true, searchQuery: data.query }
                      : msg
                  ))
                } else if (data.status === 'completed') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === streamingMessageId 
                      ? { ...msg, isSearching: false }
                      : msg
                  ))
                }
              } else if (data.type === 'complete') {
                // Update with final message ID from database
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, id: data.messageId }
                    : msg
                ))
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      setMessages(prev => prev.filter(m => m.id !== streamingMessageId))
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access the chat.</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <UnifiedSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          user={user}
          // @ts-expect-error - Type mismatch between local and component interfaces
          onConversationSelect={handleConversationSelect}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          onEditConversation={editConversation}
        />
        
        <SidebarInset className="flex-1">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Conversations Sidebar Panel */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <div className="h-full flex flex-col border-r bg-muted/30">
                {/* Sidebar Header */}
                <div className="p-4 border-b bg-background/50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <Button
                      size="sm"
                      onClick={() => setShowNewConversation(!showNewConversation)}
                      className="btn-base btn-primary"
                    >
                      + New
                    </Button>
                  </div>

                  {showNewConversation && (
                    <Card className="mb-4">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <Input
                            placeholder="Conversation title..."
                            value={newConversationTitle}
                            onChange={(e) => setNewConversationTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createConversation()}
                            className="input-enhanced"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={createConversation}
                              className="btn-base btn-primary"
                              disabled={!newConversationTitle.trim()}
                            >
                              Create
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setShowNewConversation(false)}
                              className="btn-base btn-outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1 px-4">
                  {conversationsLoading ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a new conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-2 rounded-md cursor-pointer transition-all duration-200 border ${
                            activeConversation?.id === conversation.id 
                              ? 'bg-accent border-primary shadow-sm' 
                              : 'hover:bg-accent/20 border-transparent hover:border-accent/40'
                          }`}
                          onClick={() => setActiveConversation(conversation)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate leading-tight">{conversation.title}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {conversation.last_activity && 
                                  formatDistanceToNow(new Date(conversation.last_activity), { addSuffix: true })
                                }
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 shrink-0">
                              {conversation.mode}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Chat Area Panel */}
            <ResizablePanel defaultSize={75}>
              <div className="h-full flex flex-col">
                {activeConversation ? (
                  <>
                    {/* Chat Header - Fixed */}
                    <div className="border-b p-4 bg-background shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-xl font-semibold">{activeConversation.title}</h1>
                          <p className="text-sm text-muted-foreground">
                            Brand Voice Conversation • {activeConversation.mode}
                          </p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>

                    {/* Messages - Scrollable */}
                    <div className="flex-1 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-4 min-h-full">
                          <div className="space-y-3 max-w-4xl mx-auto">
                            {messages.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="text-4xl mb-4">💬</div>
                                <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                                <p className="text-muted-foreground">
                                  Ask questions about Beforest&apos;s brand voice or request content transformations.
                                </p>
                              </div>
                            ) : (
                              messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex gap-2 ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  {message.role === 'assistant' && (
                                    <Avatar className="shrink-0 w-8 h-8">
                                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        AI
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  
                                  <div className={`max-w-lg px-3 py-2 rounded-lg ${
                                    message.role === 'user' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-card border border-border'
                                  }`}>
                                    {message.isLoading ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                          <span className="text-sm">Thinking...</span>
                                        </div>
                                        <div className="space-y-2">
                                          <Skeleton className="h-3 w-full" />
                                          <Skeleton className="h-3 w-4/5" />
                                          <Skeleton className="h-3 w-3/4" />
                                        </div>
                                      </div>
                                    ) : message.content === '' && message.role === 'assistant' ? (
                                      <div className="space-y-2">
                                        {message.isSearching ? (
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                            <span className="text-sm text-blue-600">🔍 Searching the web...</span>
                                          </div>
                                        ) : null}
                                        <div className="space-y-2">
                                          <Skeleton className="h-3 w-full" />
                                          <Skeleton className="h-3 w-4/5" />
                                          <Skeleton className="h-3 w-2/3" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        {message.role === 'assistant' ? (
                                          <MarkdownRenderer 
                                            content={message.content}
                                            className="text-sm leading-relaxed"
                                          />
                                        ) : (
                                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                        )}
                                        {message.role === 'assistant' && isLoading && message.content && !message.isSearching && (
                                          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 align-baseline opacity-70">|</span>
                                        )}
                                        {message.isSearching && (
                                          <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                            <span className="text-xs text-blue-600 dark:text-blue-400">🔍 Searching the web...</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <p className={`text-xs mt-1 ${
                                      message.role === 'user' 
                                        ? 'text-primary-foreground/70' 
                                        : 'text-muted-foreground'
                                    }`}>
                                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                                    </p>
                                  </div>

                                  {message.role === 'user' && (
                                    <Avatar className="shrink-0 w-8 h-8">
                                      <AvatarFallback className="bg-secondary text-xs">
                                        U
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              ))
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Message Input - Fixed */}
                    <div className="border-t p-4 bg-background shrink-0">
                      <div className="max-w-4xl mx-auto">
                        {/* Web Search Controls */}
                        <div className="flex items-center justify-between mb-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={enableWebSearch}
                                      onCheckedChange={setEnableWebSearch}
                                      id="web-search"
                                    />
                                    <label 
                                      htmlFor="web-search" 
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Web Search
                                    </label>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enable real-time web search for up-to-date information</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            
                            {enableWebSearch && (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  🌐 {userLocation.city}, {userLocation.country}
                                </Badge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={() => {
                                        // Simple location detection or allow user to set
                                        const newLocation = prompt('Enter your location (City, Country)', `${userLocation.city}, ${userLocation.country}`)
                                        if (newLocation) {
                                          const [city, country] = newLocation.split(',').map(s => s.trim())
                                          setUserLocation({ city: city || 'New York', country: country || 'US', region: city || 'New York' })
                                        }
                                      }}
                                    >
                                      📍 Change
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Update your location for localized search results</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              🤖 GPT-5
                            </Badge>
                            {enableWebSearch && (
                              <Badge variant="default" className="text-xs">
                                🔍 Search Active
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Textarea
                            placeholder={enableWebSearch 
                              ? "Ask anything - I can search the web for the latest information..."
                              : "Ask about brand voice, request transformations, or chat about content..."
                            }
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="min-h-[60px] max-h-32 resize-none input-enhanced"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || isLoading}
                            size="lg"
                            className={`self-end btn-base ${
                              !newMessage.trim() || isLoading 
                                ? 'btn-disabled' 
                                : 'btn-primary hover:scale-105'
                            }`}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current loading-spinner" />
                            ) : (
                              enableWebSearch ? '🔍' : '📤'
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Press Enter to send, Shift+Enter for new line
                          {enableWebSearch && (
                            <span className="ml-2 text-blue-600">• Web search enabled for real-time information</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                      <p className="text-muted-foreground">
                        Choose a conversation from the sidebar or start a new one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}