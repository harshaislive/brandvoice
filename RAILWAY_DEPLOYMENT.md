# Railway Deployment Guide for Beforest Brand Voice Transformer

## 🚀 **Complete Deployment Checklist**

### 1. **Environment Variables in Railway**

Set these in your Railway project settings:

```env
# Azure OpenAI (Required)
AZURE_OPENAI_ENDPOINT=https://openaiharsha.openai.azure.com/
AZURE_OPENAI_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT=o3-mini
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Supabase (Required for Analytics)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Flask Config
FLASK_ENV=production
PYTHON_VERSION=3.11
```

### 2. **Railway Deployment Methods**

#### **Method 1: GitHub Integration (Recommended)**
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Railway will auto-detect and use our configuration files

#### **Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### **Method 3: Direct Upload**
1. Zip all files (excluding .env and __pycache__)
2. Upload via Railway dashboard

### 3. **Configuration Files Explained**

**`railway.json`** - Railway-specific configuration
- Defines build and deploy commands
- Sets health check endpoint
- Configures restart policies

**`nixpacks.toml`** - Build system configuration
- Specifies Python 3.11
- Installs system dependencies (gcc)
- Configures startup command

**`Procfile`** - Backup deployment file
- Used if Railway doesn't detect other configs
- Simple format for Heroku compatibility

**`runtime.txt`** - Python version specification
- Ensures Python 3.11.7 is used

### 4. **Deployment Commands**

Railway will automatically run:
```bash
# Install dependencies
pip install -r requirements.txt

# Start application
gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 --log-level info app:app
```

### 5. **Verify Deployment**

Check these endpoints:
```bash
# Health check
curl https://your-app.up.railway.app/health

# API info
curl https://your-app.up.railway.app/api/info

# Main app
open https://your-app.up.railway.app
```

### 6. **Troubleshooting**

#### **Supabase Connection Issues**
1. Verify SUPABASE_URL includes `https://`
2. Use service_role key, not anon key
3. Check if transformations table exists

#### **Port Issues**
- Railway automatically sets $PORT
- Never hardcode port numbers
- Use `0.0.0.0` as host

#### **Build Failures**
1. Check logs in Railway dashboard
2. Verify Python version compatibility
3. Ensure all dependencies in requirements.txt

### 7. **Performance Optimization**

**Gunicorn Settings Explained:**
- `-w 4`: 4 worker processes
- `--timeout 120`: 2-minute timeout for o3-mini API calls
- `--log-level info`: Detailed logging

**Scaling:**
- Railway auto-scales based on traffic
- Increase workers for more concurrent users
- Monitor memory usage in Railway metrics

### 8. **Monitoring**

**Railway Dashboard Shows:**
- Deploy logs
- Runtime logs
- Resource usage
- Response times

**Custom Logging:**
- All transformations logged
- Errors tracked
- Performance metrics recorded

### 9. **Database Migration**

Run in Supabase SQL editor:
```sql
-- Use the fixed schema
-- Copy contents of supabase_schema_fixed.sql
```

### 10. **Post-Deployment**

1. **Test all features:**
   - Content transformation
   - Analytics tracking
   - Error handling

2. **Monitor first 24 hours:**
   - Check error logs
   - Verify Supabase writes
   - Monitor response times

3. **Set up alerts:**
   - Railway deployment failures
   - High error rates
   - Resource limits

## 🎯 **Quick Deploy Commands**

```bash
# Clone and deploy
git clone your-repo
cd brand_voice
railway up

# Set environment variables
railway variables set AZURE_OPENAI_KEY=your-key
railway variables set SUPABASE_URL=your-url
railway variables set SUPABASE_SERVICE_KEY=your-key

# Redeploy
railway up
```

## ✅ **Success Indicators**

- Health endpoint returns `{"status": "healthy"}`
- No errors in Railway logs
- Transformations save to Supabase
- Analytics endpoint returns data
- UI loads with proper styling

Your app is now properly configured for Railway deployment with full Supabase integration! 🚂✨