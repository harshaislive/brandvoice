# Next.js Migration Plan - Beforest Brand Voice Transformer

## 🎯 Project Overview

**Objective**: Migrate the existing Flask-based Brand Voice Transformer to a modern Next.js application with authentic Shadcn UI components, while preserving all existing Azure OpenAI and Supabase integrations.

**Current State**: Flask backend with basic HTML/CSS frontend
**Target State**: Full-stack Next.js application with premium Shadcn UI

## 🏗️ Architecture Design

### **Technology Stack**
- **Frontend**: Next.js 14+ with TypeScript
- **UI Framework**: Authentic Shadcn UI components
- **Styling**: Tailwind CSS with Beforest brand system
- **Backend**: Next.js API Routes
- **Database**: Existing Supabase setup (preserve all tables and data)
- **AI Integration**: Existing Azure OpenAI configuration
- **Authentication**: Next.js with Supabase Auth
- **Deployment**: Vercel or similar platform

### **Project Structure**
```
brandvoice-nextjs/
├── src/
│   ├── app/                          # Next.js 13+ App Router
│   │   ├── (auth)/                   # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/                      # Backend API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── chat/                 # Chat functionality
│   │   │   ├── transform/            # Content transformation
│   │   │   ├── settings/             # User settings
│   │   │   └── analytics/            # Usage analytics
│   │   ├── dashboard/                # Main application
│   │   │   ├── chat/                 # Chat interface
│   │   │   ├── transform/            # Transform mode
│   │   │   └── settings/             # User settings
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing page
│   ├── components/                   # React components
│   │   ├── ui/                       # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── chat/                     # Chat-specific components
│   │   │   ├── message-bubble.tsx
│   │   │   ├── chat-input.tsx
│   │   │   └── conversation-list.tsx
│   │   ├── transform/                # Transform-specific components
│   │   │   ├── transform-form.tsx
│   │   │   └── output-display.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── navigation.tsx
│   │   └── shared/                   # Shared components
│   │       ├── loading.tsx
│   │       └── error-boundary.tsx
│   ├── lib/                          # Utilities and configurations
│   │   ├── supabase.ts              # Supabase client
│   │   ├── openai.ts                # Azure OpenAI client
│   │   ├── auth.ts                  # Authentication utilities
│   │   ├── utils.ts                 # General utilities
│   │   └── validations.ts           # Zod schemas
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-chat.ts
│   │   ├── use-auth.ts
│   │   └── use-settings.ts
│   ├── types/                        # TypeScript definitions
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   └── api.ts
│   └── styles/                       # Additional styles
├── public/                           # Static assets
│   ├── fonts/                        # ABC Arizona fonts
│   └── icons/
├── package.json                      # Dependencies
├── tailwind.config.js               # Tailwind configuration
├── next.config.js                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
└── .env.local                       # Environment variables
```

## 🔧 Migration Strategy

### **Phase 1: Project Setup & Foundation**

#### **1.1 Next.js Project Creation**
```bash
# Create new Next.js project
npx create-next-app@latest brandvoice-nextjs --typescript --tailwind --eslint --app

# Navigate to project
cd brandvoice-nextjs

# Install additional dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install openai
npm install @radix-ui/react-icons
npm install class-variance-authority clsx tailwind-merge
npm install @hookform/resolvers react-hook-form zod
npm install sonner # For toast notifications
```

#### **1.2 Shadcn UI Setup**
```bash
# Initialize Shadcn UI
npx shadcn-ui@latest init

# Install core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add sidebar
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add select
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
```

#### **1.3 Beforest Brand Configuration**

**Tailwind Config** (`tailwind.config.js`):
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Beforest Primary Colors
        'dark-earth': '#342e29',
        'rich-red': '#86312b',
        'forest-green': '#344736',
        'deep-blue': '#002140',
        
        // Beforest Secondary Colors
        'dark-brown': '#4b3c35',
        'burnt-red': '#9e3430',
        'olive-green': '#415c43',
        'secondary-blue': '#00385e',
        'warm-yellow': '#ffc083',
        'coral-orange': '#ff774a',
        'soft-green': '#b8dc99',
        'light-blue': '#b0ddf1',
        
        // Beforest Neutral Colors
        'brand-black': '#000000',
        'charcoal-gray': '#51514d',
        'soft-gray': '#e7e4df',
        'off-white': '#fdfbf7',
        
        // Shadcn Semantic Mapping
        border: '#e7e4df',
        input: '#e7e4df',
        ring: '#344736',
        background: '#fdfbf7',
        foreground: '#342e29',
        primary: {
          DEFAULT: '#344736',
          foreground: '#fdfbf7',
        },
        secondary: {
          DEFAULT: '#e7e4df',
          foreground: '#342e29',
        },
        muted: {
          DEFAULT: '#e7e4df',
          foreground: '#51514d',
        },
        accent: {
          DEFAULT: '#b8dc99',
          foreground: '#342e29',
        },
        card: {
          DEFAULT: '#fdfbf7',
          foreground: '#342e29',
        },
      },
      fontFamily: {
        'serif': ['ABC Arizona Flare', 'serif'],
        'sans': ['ABC Arizona Sans', 'Inter', 'sans-serif'],
      },
    },
  },
}
```

**Font Setup** (`src/app/globals.css`):
```css
@font-face {
  font-family: 'ABC Arizona Flare';
  src: url('/fonts/ABCArizonaFlare-Regular-Trial.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'ABC Arizona Sans';
  src: url('/fonts/ABCArizonaSans-Regular-Trial.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

### **Phase 2: Backend API Migration**

#### **2.1 Environment Configuration**
**Environment Variables** (`.env.local`):
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment

# Supabase Configuration (REUSE EXISTING)
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret
PASSWORD_SALT=your_password_salt
```

#### **2.2 Database Integration**
**Supabase Client** (`src/lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Server-side client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Client-side client
export const createSupabaseClient = () =>
  createClientComponentClient()
```

**Database Types** (`src/types/database.ts`):
```typescript
export interface User {
  id: string
  username: string
  email: string
  display_name: string
  created_at: string
  last_login: string
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
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface Settings {
  id: string
  user_id: string
  setting_key: string
  setting_value: string
  updated_at: string
}
```

#### **2.3 API Routes Implementation**

**Authentication API** (`src/app/api/auth/login/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Authenticate user against existing Supabase users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Verify password (reuse existing hash verification logic)
    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: '24h' }
    )
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name
      },
      token
    })
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
```

**Chat API** (`src/app/api/chat/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { OpenAIApi, Configuration } from 'openai'
import { supabase } from '@/lib/supabase'
import { getUserFromToken } from '@/lib/auth'

// Reuse existing Azure OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.AZURE_OPENAI_KEY,
  basePath: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  baseOptions: {
    headers: {
      'api-key': process.env.AZURE_OPENAI_KEY,
    },
    params: {
      'api-version': '2023-07-01-preview',
    },
  },
})

const openai = new OpenAIApi(configuration)

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { message, conversationId, context } = await request.json()
    
    // Save user message to database
    const { data: messageRecord } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      })
      .select()
      .single()
    
    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })
    
    // Build chat completion request (reuse existing logic)
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are the Beforest Brand Voice Curator...' },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.7,
    })
    
    const response = completion.data.choices[0].message?.content
    
    // Save assistant response
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response,
      })
    
    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
```

**Transform API** (`src/app/api/transform/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
// Reuse existing transformation logic from Flask app
export async function POST(request: NextRequest) {
  // Implementation mirrors existing Flask /transform endpoint
}
```

### **Phase 3: Frontend Component Development**

#### **3.1 Layout Components**

**Root Layout** (`src/app/layout.tsx`):
```tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Sidebar Component** (`src/components/layout/sidebar.tsx`):
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Sidebar() {
  return (
    <aside className="w-64 bg-dark-earth text-off-white h-full">
      {/* Sidebar content using authentic Shadcn components */}
    </aside>
  )
}
```

#### **3.2 Chat Interface**

**Chat Container** (`src/components/chat/chat-container.tsx`):
```tsx
import { useState, useEffect } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { useChat } from '@/hooks/use-chat'

export function ChatContainer() {
  const { messages, sendMessage, isLoading } = useChat()
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  )
}
```

**Message Bubble** (`src/components/chat/message-bubble.tsx`):
```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar>
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <Card className={`max-w-lg ${isUser ? 'bg-forest-green text-off-white' : 'bg-card'}`}>
        <CardContent className="p-4">
          <p className="text-sm">{message.content}</p>
        </CardContent>
      </Card>
      {isUser && (
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
```

#### **3.3 Transform Interface**

**Transform Form** (`src/components/transform/transform-form.tsx`):
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'

export function TransformForm() {
  const { register, handleSubmit } = useForm()
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl text-forest-green">
          Brand Voice Transformation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Form implementation with Shadcn components */}
      </CardContent>
    </Card>
  )
}
```

### **Phase 4: Data Migration & Integration**

#### **4.1 Database Preservation**
- **No migration needed** - Reuse existing Supabase tables
- **Verify compatibility** of existing schema with new API structure
- **Test data integrity** with new Next.js API routes

#### **4.2 Authentication Migration**
- **Preserve user accounts** - All existing users continue working
- **Update session handling** - Migrate from Flask sessions to JWT
- **Test login flow** - Ensure seamless user experience

#### **4.3 Settings Migration**
- **Preserve user preferences** - All settings maintained
- **Update settings API** - New Next.js endpoints for configuration
- **Test functionality** - Ensure all preferences work correctly

### **Phase 5: Advanced Features**

#### **5.1 Real-time Features**
```tsx
// WebSocket integration for real-time chat
// Server-sent events for live updates
// Optimistic UI updates for better UX
```

#### **5.2 Enhanced UI Components**
```tsx
// Advanced Shadcn components:
// - Command palette for quick actions
// - Drag-and-drop file uploads
// - Rich text editor for content
// - Dark/light theme switching
```

#### **5.3 Performance Optimizations**
```tsx
// Next.js optimizations:
// - Image optimization
// - Route prefetching
// - Code splitting
// - Static generation where possible
```

## 🚀 Implementation Timeline

### **Week 1: Foundation Setup**
- [ ] Create Next.js project structure
- [ ] Configure Tailwind with Beforest colors
- [ ] Install and configure Shadcn UI
- [ ] Set up font loading and typography
- [ ] Create basic layout components

### **Week 2: Backend API Development**
- [ ] Implement authentication API routes
- [ ] Create chat API endpoints
- [ ] Develop transform API functionality
- [ ] Set up settings API
- [ ] Configure Supabase integration

### **Week 3: Frontend Component Development**
- [ ] Build sidebar and navigation
- [ ] Create chat interface components
- [ ] Develop transform form and output
- [ ] Implement settings panels
- [ ] Add loading states and error handling

### **Week 4: Integration & Testing**
- [ ] Connect frontend to backend APIs
- [ ] Test user authentication flow
- [ ] Verify chat functionality
- [ ] Test transform operations
- [ ] Performance optimization

### **Week 5: Polish & Deployment**
- [ ] Final UI polish and animations
- [ ] Comprehensive testing
- [ ] Deploy to production
- [ ] Performance monitoring
- [ ] User acceptance testing

## 🎯 Success Criteria

### **Functional Requirements**
- [ ] All existing features work identically
- [ ] User authentication preserved
- [ ] Chat functionality enhanced
- [ ] Transform mode improved
- [ ] Settings management upgraded
- [ ] Real-time updates implemented

### **Technical Requirements**
- [ ] Modern TypeScript codebase
- [ ] Authentic Shadcn UI components
- [ ] Perfect Beforest brand integration
- [ ] Responsive design across all devices
- [ ] Fast loading times (< 2s)
- [ ] SEO optimized

### **User Experience Requirements**
- [ ] Intuitive navigation
- [ ] Smooth animations and transitions
- [ ] Clear visual hierarchy
- [ ] Accessible design (WCAG 2.1 AA)
- [ ] Mobile-first responsive design

## 📋 Risk Assessment & Mitigation

### **Technical Risks**
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API compatibility issues | High | Medium | Thorough testing with existing data |
| Authentication migration complexity | High | Low | Gradual migration with fallback |
| Performance degradation | Medium | Low | Regular performance monitoring |
| Component styling conflicts | Low | Medium | Isolated component development |

### **Business Risks**
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User experience disruption | High | Low | Parallel development and testing |
| Extended downtime | Medium | Low | Blue-green deployment strategy |
| Feature regression | High | Low | Comprehensive testing suite |

## 🎉 Expected Outcomes

### **Immediate Benefits**
- **Modern UI/UX** with authentic Shadcn components
- **Better Performance** with Next.js optimizations
- **TypeScript Safety** reducing runtime errors
- **Enhanced Developer Experience** with modern tooling

### **Long-term Benefits**
- **Easier Maintenance** with clean component architecture
- **Faster Feature Development** with reusable components
- **Better SEO** with Next.js server-side rendering
- **Scalable Architecture** for future growth

### **User Experience Improvements**
- **Faster Loading** with optimized assets
- **Smoother Interactions** with React state management
- **Better Mobile Experience** with responsive design
- **Enhanced Accessibility** with proper ARIA implementation

---

## 📞 Next Steps

1. **Review and Approve** this migration plan
2. **Set up Development Environment** for Next.js
3. **Begin Phase 1** - Foundation setup
4. **Regular Progress Reviews** weekly check-ins
5. **User Testing Sessions** throughout development

**This comprehensive plan ensures a smooth migration to Next.js while preserving all existing functionality and significantly enhancing the user experience with authentic Shadcn UI components and modern web technologies.**