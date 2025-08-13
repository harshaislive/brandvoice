# Beforest Brand Voice Transformer

A modern Next.js application for transforming content with authentic Beforest brand voice using Azure OpenAI and Supabase.

## ✨ Features

### 🎯 Core Functionality
- **Brand Voice Transformation** - Transform any content to match Beforest's authentic, warm, and premium brand voice
- **Real-time Chat Interface** - Interactive conversations with the AI Brand Voice Curator
- **Transformation History** - Complete history of all transformations with filtering and search
- **Analytics Dashboard** - Comprehensive insights into transformation performance and usage

### 🛠️ Technical Features
- **Next.js 15** with App Router and TypeScript
- **Authentic Shadcn UI v4** components via MCP
- **Beforest Brand Colors** - Complete design system integration
- **Supabase Integration** - Preserves all existing data
- **Azure OpenAI** - GPT-4 powered transformations
- **Form Validation** - Zod schemas with react-hook-form
- **Error Handling** - Comprehensive error boundaries and states
- **Responsive Design** - Mobile-first with accessibility

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Existing Supabase database with `beforest_transformations` table
- Azure OpenAI endpoint and API key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Update `.env.local` with your credentials:
   ```bash
   # Azure OpenAI Configuration
   AZURE_OPENAI_ENDPOINT=your_endpoint_here
   AZURE_OPENAI_KEY=your_key_here
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_here

   # Supabase Configuration (REUSE EXISTING)
   NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_existing_service_role_key

   # JWT Configuration
   JWT_SECRET_KEY=your_jwt_secret_here
   PASSWORD_SALT=your_password_salt_here
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open application**
   Navigate to `http://localhost:3000`

## 📱 Application Structure

### Pages
- **`/`** - Home dashboard with navigation
- **`/transform`** - Brand voice transformation form
- **`/history`** - Transformation history with filters
- **`/chat`** - Interactive chat with AI curator
- **`/analytics`** - Performance analytics dashboard
- **`/settings`** - User preferences and configuration
- **`/auth/login`** - User authentication
- **`/auth/register`** - User registration

### API Routes
- **`/api/auth/*`** - Authentication endpoints
- **`/api/transform`** - Transformation creation and history
- **`/api/chat`** - Chat functionality
- **`/api/conversations`** - Conversation management
- **`/api/settings`** - User settings
- **`/api/analytics`** - Usage analytics

## 🎨 Design System

### Beforest Brand Colors
- **Primary**: Forest Green (`#344736`)
- **Secondary**: Soft Gray (`#e7e4df`)
- **Background**: Off White (`#fdfbf7`)
- **Text**: Dark Earth (`#342e29`)
- **Accent**: Soft Green (`#b8dc99`)

### Typography
- **Headings**: ABC Arizona Flare (serif)
- **Body**: ABC Arizona Sans (sans-serif)

## 🗄️ Database Schema

The application works with your existing `beforest_transformations` table:

```sql
CREATE TABLE public.beforest_transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  original_content text NOT NULL,
  content_type varchar(100) NOT NULL,
  target_audience varchar(100) NOT NULL,
  additional_context text,
  transformed_content text NOT NULL,
  original_length integer NOT NULL,
  transformed_length integer NOT NULL,
  length_change_percent numeric(5, 2),
  justification jsonb,
  user_ip inet,
  user_agent text,
  session_id varchar(255),
  processing_time_ms integer,
  api_model_used varchar(100),
  transformation_quality_score numeric(3, 2),
  user_feedback integer CHECK (user_feedback >= 1 AND user_feedback <= 5),
  user_email varchar(255)
);
```

## 🧪 Testing Your Setup

1. **Visit `/history`** to see your existing transformations
2. **Visit `/analytics`** to view transformation metrics  
3. **Visit `/transform`** to create new transformations
4. **Visit `/chat`** to interact with the AI curator

## 🔧 Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint

## 🎯 Brand Voice Guidelines

The application transforms content following Beforest's core principles:

- **🎯 Authentic & Genuine** - Honest, transparent communication
- **🌱 Warm & Approachable** - Friendly tone that's accessible
- **💎 Premium without Pretension** - High quality while staying humble
- **🌿 Nature-inspired** - Sustainable and environmentally conscious

---

**Built with authentic Shadcn UI components and Beforest brand excellence** ✨
