// Database types for existing Supabase schema
// These types preserve your existing data structure

export interface User {
  id: string
  username: string
  email: string
  display_name: string
  password_hash: string
  created_at: string
  last_login: string | null
  is_active: boolean
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  mode: 'chat' | 'transform'
  created_at: string
  last_activity: string
  is_archived: boolean
  metadata?: Record<string, unknown>
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, unknown>
  timestamp: string
  token_count?: number
}

export interface Settings {
  id: string
  user_id: string
  setting_key: string
  setting_value: string
  updated_at: string
}

export interface BeforestTransformation {
  id: string
  created_at: string | null
  updated_at: string | null
  original_content: string
  content_type: string
  target_audience: string
  additional_context: string | null
  transformed_content: string
  original_length: number
  transformed_length: number
  length_change_percent: number | null
  justification: Record<string, unknown> | null
  user_ip: string | null
  user_agent: string | null
  session_id: string | null
  processing_time_ms: number | null
  api_model_used: string | null
  transformation_quality_score: number | null
  user_feedback: number | null
  user_email: string | null
}

// API response types
export interface AuthResponse {
  user: {
    id: string
    email: string
    username: string
    displayName: string
  }
  token: string
}

export interface ChatResponse {
  response: string
  messageId: string
  conversationId: string
}

export interface TransformResponse {
  transformed_content: string
  transformation_id: string
  original_length: number
  transformed_length: number
  length_change_percent: number
  processing_time_ms: number
  quality_score: number | null
  justification?: Record<string, unknown>
}

// Request types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username: string
  displayName: string
}

export interface ChatRequest {
  message: string
  conversationId: string
  context?: Record<string, unknown>
}

export interface TransformRequest {
  original_content: string
  content_type: string
  target_audience: string
  additional_context?: string
}

// Database table names (matching your existing schema)
export type DatabaseTables = {
  users: User
  conversations: Conversation
  messages: Message
  settings: Settings
  beforest_transformations: BeforestTransformation
}