'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { 
  SidebarProvider
} from '@/components/ui/sidebar'
import { UnifiedSidebar } from '@/components/chat/unified-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatInput } from '@/components/chat/chat-input'
import { EmptyChatState } from '@/components/chat/empty-chat-state'
import { ChatErrorBoundary } from '@/components/chat/chat-error-boundary'
import { Conversation, Message } from '@/types/database'
import { toast } from 'sonner'
import { generateNewConversationTitle } from '@/lib/chat-title-generator'

interface ChatMessage extends Message {
  isLoading?: boolean
  isSearching?: boolean
  searchQuery?: string
}

export default function ChatPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [userLocation, setUserLocation] = useState({ country: 'US', city: 'New York', region: 'New York' })

  // Fetch conversations
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConversations()
    }
  }, [isAuthenticated, user])

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id)
    } else {
      setMessages([])
    }
  }, [activeConversation])

  const fetchConversations = useCallback(async () => {
    try {
      console.log('fetchConversations called')
      setConversationsLoading(true)
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Fetched conversations:', data)
      
      setConversations(data || [])
      
      // Set active conversation to the most recent one
      if (data && data.length > 0 && !activeConversation) {
        setActiveConversation(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setConversationsLoading(false)
    }
  }, [activeConversation])

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      console.log('Fetching messages for conversation:', conversationId)
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Fetched messages:', data)
      setMessages(data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
    }
  }, [])

  const createConversation = async (title: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, mode: 'chat' })
      })

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Created conversation:', data)
      setConversations(prev => [data, ...prev])
      setActiveConversation(data)
      toast.success('New conversation created')
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast.error('Failed to create conversation')
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.statusText}`)
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (activeConversation?.id === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId)
        setActiveConversation(remaining.length > 0 ? remaining[0] : null)
      }
      toast.success('Conversation deleted')
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const editConversation = async (conversationId: string, title: string) => {
    try {
      console.log('Editing conversation:', { conversationId, title })
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        toast.error('Authentication required')
        return
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title.trim() })
      })

      console.log('Edit conversation response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Edit conversation failed:', errorData)
        throw new Error(errorData.error || `Failed to edit conversation: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Edit conversation success:', data)
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? data : c)
      )
      if (activeConversation?.id === conversationId) {
        setActiveConversation(data)
      }
      toast.success('Conversation renamed')
    } catch (error) {
      console.error('Failed to edit conversation:', error)
      toast.error(`Failed to rename conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleNavigateToTransform = () => {
    console.log('Navigating to transform page...')
    router.push('/transform')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return

    // Create new conversation if none exists
    if (!activeConversation) {
      const generatedTitle = generateNewConversationTitle(newMessage)
      await createConversation(generatedTitle)
      return // The conversation creation will trigger this function again
    }

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      conversation_id: activeConversation.id
    }

    const streamingMessage: ChatMessage = {
      id: `streaming-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      conversation_id: activeConversation.id,
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, streamingMessage])
    const currentMessage = newMessage
    setNewMessage('')
    setIsLoading(true)

    const streamingMessageId = streamingMessage.id

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: currentMessage,
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
        
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'content') {
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: msg.content + data.content, isLoading: false }
                    : msg
                ))
              } else if (data.type === 'web_search') {
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
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, id: data.messageId, isLoading: false }
                    : msg
                ))
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError)
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, isLoading: false }
          : msg
      ))

      // Auto-update title for conversations with generic titles
      if (activeConversation && messages.length === 0) { // First message in conversation
        const isGenericTitle = activeConversation.title.includes('Chat') || 
                              activeConversation.title === 'New Conversation'
        
        if (isGenericTitle) {
          const smartTitle = generateNewConversationTitle(currentMessage)
          if (smartTitle !== activeConversation.title) {
            await editConversation(activeConversation.id, smartTitle)
          }
        }
      }
      
    } catch (error) {
      console.error('Streaming error:', error)
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId))
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access the chat.</p>
          <Button onClick={() => window.location.href = '/auth/signin'} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full overflow-hidden" style={{ height: '100vh', minHeight: '100vh' }}>
      <SidebarProvider>
        <div className="flex h-full w-full">
          <ChatErrorBoundary>
            <UnifiedSidebar
              conversations={conversations}
              activeConversation={activeConversation}
              user={user}
              // @ts-expect-error - Type mismatch between local and component interfaces
              onConversationSelect={setActiveConversation}
              onCreateConversation={createConversation}
              onDeleteConversation={deleteConversation}
              onEditConversation={editConversation}
              onNavigateToTransform={handleNavigateToTransform}
              isLoading={conversationsLoading}
            />
          </ChatErrorBoundary>
          
          {/* Main Content Area */}
          <div className="main-content-area bg-background">
          
          {activeConversation ? (
            <>
              <ChatHeader
                // @ts-expect-error - Type mismatch between interfaces
                activeConversation={activeConversation}
                enableWebSearch={enableWebSearch}
              />
              
              <ChatErrorBoundary>
                <ChatMessages
                  // @ts-expect-error - Type mismatch between local and component interfaces
                  messages={messages}
                  isLoading={isLoading}
                />
              </ChatErrorBoundary>

              <ChatErrorBoundary>
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={sendMessage}
                  isLoading={isLoading}
                  enableWebSearch={enableWebSearch}
                  onWebSearchToggle={setEnableWebSearch}
                  userLocation={userLocation}
                  onLocationChange={setUserLocation}
                />
              </ChatErrorBoundary>
            </>
          ) : (
            <>
              <ChatHeader
                activeConversation={null}
                enableWebSearch={enableWebSearch}
              />
              <EmptyChatState />
            </>
          )}
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}