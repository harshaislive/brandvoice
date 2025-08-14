'use client'

import * as React from 'react'
import Image from 'next/image'
import { 
  MessageSquare, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Edit3,
  User,
  Zap
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { designTokens } from '@/lib/design-tokens'

interface Conversation {
  id: string
  title: string
  created_at: string
  last_activity: string
  message_count?: number
}

interface UnifiedSidebarProps {
  conversations: Conversation[]
  activeConversation: Conversation | null
  user: { email: string; name?: string } | null
  onConversationSelect: (conversation: Conversation) => void
  onCreateConversation: (title: string) => Promise<void>
  onDeleteConversation: (id: string) => Promise<void>
  onEditConversation: (id: string, title: string) => Promise<void>
  onNavigateToTransform?: () => void
  isLoading?: boolean
  className?: string
}

export function UnifiedSidebar({ 
  conversations, 
  activeConversation, 
  user,
  onConversationSelect,
  onCreateConversation,
  onDeleteConversation,
  onEditConversation,
  onNavigateToTransform,
  isLoading = false,
  className 
}: UnifiedSidebarProps) {
  const [newChatTitle, setNewChatTitle] = React.useState('')
  const [showRenameDialog, setShowRenameDialog] = React.useState(false)
  const [renamingConversation, setRenamingConversation] = React.useState<Conversation | null>(null)
  const [renameTitle, setRenameTitle] = React.useState('')

  const handleCreateChat = async () => {
    if (!newChatTitle.trim()) {
      await onCreateConversation(`Chat ${new Date().toLocaleDateString()}`)
    } else {
      await onCreateConversation(newChatTitle)
    }
    setNewChatTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  const handleRenameStart = (conversation: Conversation) => {
    setRenamingConversation(conversation)
    setRenameTitle(conversation.title)
    setShowRenameDialog(true)
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renamingConversation || !renameTitle.trim()) return
    
    try {
      await onEditConversation(renamingConversation.id, renameTitle.trim())
      setShowRenameDialog(false)
      setRenamingConversation(null)
      setRenameTitle('')
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const handleRenameCancel = () => {
    setShowRenameDialog(false)
    setRenamingConversation(null)
    setRenameTitle('')
  }

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    if (!Array.isArray(conversations)) {
      return {}
    }

    const sorted = [...conversations].sort((a, b) => 
      new Date(b.last_activity || b.created_at).getTime() - new Date(a.last_activity || a.created_at).getTime()
    )

    const groups: Record<string, Conversation[]> = {}

    sorted.forEach(conversation => {
      const date = new Date(conversation.last_activity || conversation.created_at)
      let groupKey: string

      if (isToday(date)) {
        groupKey = 'Today'
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday'
      } else if (isThisWeek(date)) {
        groupKey = 'This Week'
      } else if (isThisMonth(date)) {
        groupKey = 'This Month'
      } else if (isThisYear(date)) {
        groupKey = format(date, 'MMMM yyyy')
      } else {
        groupKey = format(date, 'yyyy')
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(conversation)
    })

    return groups
  }, [conversations])

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month']

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="offcanvas" 
      className={cn(
        "w-[280px] font-sans",
        "bg-[--chat-sidebar-bg] text-[--chat-sidebar-text]",
        "flex flex-col",
        className
      )} 
      style={{ 
        fontFamily: 'ABC Arizona Sans, system-ui, sans-serif',
        '--chat-sidebar-bg': designTokens.chat.sidebar.colors.background,
        '--chat-sidebar-text': designTokens.chat.sidebar.colors.text,
      } as React.CSSProperties}
      role="navigation"
      aria-label="Chat conversations and user menu"
    >
      <SidebarHeader 
        className="border-b transition-colors duration-200"
        style={{
          backgroundColor: designTokens.chat.sidebar.colors.background,
          borderColor: designTokens.chat.sidebar.colors.border,
        }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              className="transition-colors duration-200"
              style={{
                color: designTokens.chat.sidebar.colors.text,
                '--hover-bg': designTokens.chat.sidebar.colors.backgroundHover,
              } as React.CSSProperties}
              onKeyDown={(e) => handleKeyDown(e, () => {})}
              aria-label="AI Chat - GPT-5 Model"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="invert object-contain w-[24px] h-[24px]"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">AI Chat</span>
                <span className="truncate text-xs text-[#ffc083]">GPT-5</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleCreateChat} 
              className="w-full transition-colors duration-200 text-white hover:bg-[#4b3c35] hover:text-[#342e29]"
              onKeyDown={(e) => handleKeyDown(e, handleCreateChat)}
              aria-label="Create new chat conversation"
            >
              <Plus className="size-4" />
              <span>New Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onNavigateToTransform && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={onNavigateToTransform} 
                className="w-full transition-colors duration-200 text-white hover:bg-[#4b3c35] hover:text-[#342e29]"
                onKeyDown={(e) => handleKeyDown(e, onNavigateToTransform)}
                aria-label="Open content transformer"
              >
                <Zap className="size-4" />
                <span>Transform</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent 
        className="flex-1 overflow-y-auto"
        style={{
          backgroundColor: designTokens.chat.sidebar.colors.background,
        }}
      >
        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupLabel 
              className="font-medium transition-colors duration-200"
              style={{
                color: designTokens.chat.sidebar.colors.textSecondary,
              }}
            >
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[...Array(5)].map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton className="text-white hover:bg-[#4b3c35]">
                      <div className="w-4 h-4 rounded bg-[#4b3c35] animate-pulse" />
                      <div className="flex-1 h-4 rounded bg-[#4b3c35] animate-pulse" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : Object.keys(groupedConversations).length === 0 ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <div 
                className="text-center py-8 text-sm transition-colors duration-200"
                style={{
                  color: `${designTokens.chat.sidebar.colors.text}70`,
                }}
                role="status"
                aria-label="No conversations available"
              >
                <MessageSquare 
                  className="size-8 mx-auto mb-2 opacity-50" 
                  aria-hidden="true"
                />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat!</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          // Render grouped conversations
          <>
            {/* Render priority groups in order */}
            {groupOrder.map(groupKey => {
              if (!groupedConversations[groupKey]?.length) return null
              
              return (
                <SidebarGroup key={groupKey}>
                  <SidebarGroupLabel 
                    className="font-medium transition-colors duration-200 text-xs px-2"
                    style={{
                      color: designTokens.chat.sidebar.colors.textSecondary,
                    }}
                  >
                    {groupKey}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupedConversations[groupKey].map((conversation) => (
                        <SidebarMenuItem key={conversation.id}>
                          <SidebarMenuButton
                            isActive={activeConversation?.id === conversation.id}
                            onClick={() => onConversationSelect(conversation)}
                      className={cn(
                        "w-full justify-start transition-all duration-200 group",
                        "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                      )}
                      style={{
                        color: designTokens.chat.sidebar.colors.text,
                        backgroundColor: activeConversation?.id === conversation.id 
                          ? designTokens.chat.sidebar.colors.backgroundActive
                          : 'transparent',
                        '--hover-bg': activeConversation?.id === conversation.id
                          ? designTokens.chat.sidebar.colors.backgroundActiveHover
                          : designTokens.chat.sidebar.colors.backgroundHover,
                      } as React.CSSProperties}
                      onKeyDown={(e) => handleKeyDown(e, () => onConversationSelect(conversation))}
                      aria-label={`Select conversation: ${conversation.title}`}
                      aria-current={activeConversation?.id === conversation.id ? 'page' : undefined}
                    >
                      <MessageSquare 
                        className="size-4 transition-colors duration-200" 
                        style={{ color: designTokens.chat.sidebar.colors.text }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-left text-white">
                          {conversation.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction 
                          showOnHover 
                          className="transition-colors duration-200 focus:ring-2 focus:ring-primary/20"
                          style={{
                            color: designTokens.chat.sidebar.colors.text,
                            '--hover-bg': designTokens.chat.sidebar.colors.backgroundHover,
                          } as React.CSSProperties}
                          aria-label={`More options for ${conversation.title}`}
                        >
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" className="bg-[#fdfbf7] border-[#51514d]">
                        <DropdownMenuItem 
                          onClick={() => handleRenameStart(conversation)}
                          className="text-[#342e29] hover:bg-[#e7e4df] hover:text-[#342e29]"
                        >
                          <Edit3 className="size-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#51514d]" />
                        <DropdownMenuItem 
                          onClick={() => onDeleteConversation(conversation.id)}
                          className="text-[#86312b] hover:bg-[#e7e4df] hover:text-[#342e29] focus:text-[#86312b]"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            })}
            
            {/* Render remaining groups (months/years) */}
            {Object.entries(groupedConversations)
              .filter(([groupKey]) => !groupOrder.includes(groupKey))
              .map(([groupKey, convs]) => (
                <SidebarGroup key={groupKey}>
                  <SidebarGroupLabel 
                    className="font-medium transition-colors duration-200 text-xs px-2"
                    style={{
                      color: designTokens.chat.sidebar.colors.textSecondary,
                    }}
                  >
                    {groupKey}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {convs.map((conversation) => (
                        <SidebarMenuItem key={conversation.id}>
                          <SidebarMenuButton
                            isActive={activeConversation?.id === conversation.id}
                            onClick={() => onConversationSelect(conversation)}
                            className={cn(
                              "w-full justify-start transition-all duration-200 group",
                              "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                            )}
                            style={{
                              color: designTokens.chat.sidebar.colors.text,
                              backgroundColor: activeConversation?.id === conversation.id 
                                ? designTokens.chat.sidebar.colors.backgroundActive
                                : 'transparent',
                              '--hover-bg': activeConversation?.id === conversation.id
                                ? designTokens.chat.sidebar.colors.backgroundActiveHover
                                : designTokens.chat.sidebar.colors.backgroundHover,
                            } as React.CSSProperties}
                            onKeyDown={(e) => handleKeyDown(e, () => onConversationSelect(conversation))}
                            aria-label={`Select conversation: ${conversation.title}`}
                            aria-current={activeConversation?.id === conversation.id ? 'page' : undefined}
                          >
                            <MessageSquare 
                              className="size-4 transition-colors duration-200" 
                              style={{ color: designTokens.chat.sidebar.colors.text }}
                              aria-hidden="true"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="truncate text-left text-white">
                                {conversation.title}
                              </span>
                            </div>
                          </SidebarMenuButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction 
                                showOnHover 
                                className="transition-colors duration-200 focus:ring-2 focus:ring-primary/20"
                                style={{
                                  color: designTokens.chat.sidebar.colors.text,
                                  '--hover-bg': designTokens.chat.sidebar.colors.backgroundHover,
                                } as React.CSSProperties}
                                aria-label={`More options for ${conversation.title}`}
                              >
                                <MoreHorizontal />
                                <span className="sr-only">More</span>
                              </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="bg-[#fdfbf7] border-[#51514d]">
                              <DropdownMenuItem 
                                onClick={() => handleRenameStart(conversation)}
                                className="text-[#342e29] hover:bg-[#e7e4df] hover:text-[#342e29]"
                              >
                                <Edit3 className="size-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#51514d]" />
                              <DropdownMenuItem 
                                onClick={() => onDeleteConversation(conversation.id)}
                                className="text-[#86312b] hover:bg-[#e7e4df] hover:text-[#342e29] focus:text-[#86312b]"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
          </>
        )}
      </SidebarContent>

      {/* Modern Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Conversation</DialogTitle>
              <DialogDescription>
                Give your conversation a new name to help you find it later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="conversation-name">Name</Label>
                <Input
                  id="conversation-name"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="Enter conversation name..."
                  autoFocus
                  maxLength={50}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleRenameCancel}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!renameTitle.trim()}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SidebarFooter 
        className="border-t transition-colors duration-200"
        style={{
          backgroundColor: designTokens.chat.sidebar.colors.background,
          borderColor: designTokens.chat.sidebar.colors.border,
        }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="text-white hover:bg-[#4b3c35] data-[state=open]:bg-[#4b3c35] data-[state=open]:text-white"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-[#86312b] text-white">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">
                      {user?.name || 'User'}
                    </span>
                    <span className="truncate text-xs text-[#ffc083]">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-[#fdfbf7] border-[#51514d]"
                align="end"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuItem className="text-[#342e29] hover:bg-[#e7e4df] hover:text-[#342e29]">
                  <User className="size-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#51514d]" />
                <DropdownMenuItem className="text-[#342e29] hover:bg-[#e7e4df] hover:text-[#342e29]">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}