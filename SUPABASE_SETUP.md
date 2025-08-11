# Supabase Setup Guide for Beforest Brand Voice Transformer

This guide will help you set up Supabase for analytics tracking.

## 🚀 **Quick Setup Steps**

### 1. **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project
4. Choose a region close to your users
5. Set a strong database password

### 2. **Run SQL Schema**
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase_schema.sql`
3. Paste and run the SQL script
4. This creates the `transformations` table and analytics functions

### 3. **Get Your Credentials**
1. Go to **Settings > API** in your Supabase dashboard
2. Copy your **Project URL**
3. Copy your **service_role secret** key (NOT the anon public key)

### 4. **Add to Environment Variables**
Add these to your `.env` file:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## 📊 **What Gets Tracked**

The system automatically tracks:
- **Content transformations** (original → transformed)
- **User preferences** (content type, target audience)
- **Performance metrics** (processing time, character counts)
- **AI justifications** (what changed and why)
- **Session data** (for analytics, no personal info)

## 🔍 **Analytics Endpoints**

### **View Usage Stats**
```bash
GET /analytics?days=7
```

**Response:**
```json
{
  "success": true,
  "period_days": 7,
  "stats": {
    "total_transformations": 42,
    "unique_sessions": 15,
    "most_common_content_type": "email",
    "most_common_audience": "existing-clients",
    "avg_original_length": 127.5,
    "avg_transformed_length": 203.2,
    "total_processing_time_hours": 0.25
  }
}
```

## 📈 **Useful SQL Queries**

### **Daily Usage (Last 30 Days)**
```sql
SELECT 
    DATE(created_at) as date, 
    COUNT(*) as transformations
FROM transformations 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### **Most Popular Content Types**
```sql
SELECT 
    content_type, 
    COUNT(*) as usage_count,
    AVG(length_change_percent) as avg_change
FROM transformations
GROUP BY content_type
ORDER BY usage_count DESC;
```

### **Performance by Audience**
```sql
SELECT 
    target_audience,
    COUNT(*) as transformations,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(original_length) as avg_input_length
FROM transformations
GROUP BY target_audience
ORDER BY transformations DESC;
```

### **Recent Transformations**
```sql
SELECT 
    created_at,
    content_type,
    target_audience,
    original_length,
    transformed_length,
    processing_time_ms
FROM transformations
ORDER BY created_at DESC
LIMIT 20;
```

## 🔒 **Security & Privacy**

- **No Personal Data**: Only content transformations and metadata
- **Session Tracking**: Anonymous session IDs for analytics
- **IP Logging**: For spam prevention (can be disabled)
- **RLS Enabled**: Row Level Security configured
- **Service Key**: Use service_role key for server-side operations

## ⚙️ **Optional: Disable Analytics**

If you don't want analytics tracking:
1. Remove `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from `.env`
2. The app will continue working without saving data
3. Analytics endpoints will return errors

## 📱 **Dashboard Ideas**

You can build a simple dashboard using:
- **Supabase Dashboard**: Built-in table view
- **Grafana**: Connect to Postgres for charts
- **Custom Dashboard**: Use the `/analytics` endpoint
- **Retool/Bubble**: No-code dashboard tools

## 🛠 **Troubleshooting**

### **"Supabase not configured" in logs**
- Check your `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Ensure the keys are not wrapped in quotes

### **"Failed to save transformation"**
- Verify the SQL schema was run correctly
- Check Supabase dashboard for error logs
- Ensure RLS policies allow inserts

### **Analytics endpoint returns errors**
- Run the `get_usage_stats` function from the SQL schema
- Check if the function exists in Supabase SQL Editor

## 🎯 **Next Steps**

1. **Set up alerting** for high usage
2. **Create dashboards** for business insights
3. **Add user feedback** tracking (5-star ratings)
4. **Monitor costs** in Supabase dashboard
5. **Export data** for deeper analysis

Your brand voice transformer will now track all usage for powerful insights into how your team uses the tool! 🚀