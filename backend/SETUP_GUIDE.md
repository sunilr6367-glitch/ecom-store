# Odhvica Backend - Setup Guide

## ✅ What Has Been Fixed

### 1. Database Migration (SQLite → PostgreSQL)
- **FIXED**: Migrated from SQLite to PostgreSQL for production scalability
- **FIXED**: Updated all schema definitions to use PostgreSQL types
- **FIXED**: Configured Drizzle ORM for PostgreSQL compatibility

### 2. Environment Configuration
- **ADDED**: `.env` file with secure defaults
- **ADDED**: `.env.example` for team collaboration
- **ADDED**: `.gitignore` to protect sensitive files

### 3. CORS & Security
- **ADDED**: CORS middleware with environment-based configuration
- **ADDED**: Request logging middleware
- **ADDED**: Global error handler (hides internal errors in production)
- **ADDED**: 404 handler

### 4. Input Validation & Safety
- **FIXED**: Added pagination limits (max 100 items per request)
- **FIXED**: Prevented negative offset values
- **FIXED**: Improved error handling to prevent data leaks in production

### 5. Code Quality
- **FIXED**: All TypeScript type errors resolved
- **FIXED**: Removed SQLite dependencies
- **VERIFIED**: Zero compilation errors

---

## 🚀 Next Steps: Database Setup

### Option 1: Supabase (Recommended - FREE)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up with GitHub/Google (free)

2. **Create New Project**
   - Click "New Project"
   - Name: `odhvica-db`
   - Database Password: (save this securely)
   - Region: Choose closest to you (e.g., Mumbai for India)
   - Click "Create new project" (takes ~2 minutes)

3. **Get Connection String**
   - Go to Project Settings → Database
   - Find "Connection string" section
   - Copy the "URI" (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)

4. **Update `.env` File**
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

5. **Run Migrations**
   ```powershell
   npm run generate
   npm run migrate
   ```

### Option 2: Local PostgreSQL (For Testing)

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, set password as `postgres`

2. **Create Database**
   ```powershell
   psql -U postgres
   CREATE DATABASE odhvica_dev;
   \q
   ```

3. **`.env` is already configured** for local PostgreSQL

4. **Run Migrations**
   ```powershell
   npm run generate
   npm run migrate
   ```

---

## 🧪 Testing the Backend

### 1. Start the Server
```powershell
npm run dev
```

You should see:
```
🚀 Odhvica Backend Starting...
📍 Environment: development
🌐 Port: 3000
🔗 URL: http://localhost:3000
✅ CORS Origins: http://localhost:3001, http://localhost:3002, http://localhost:5173
```

### 2. Test Health Check
Open browser: http://localhost:3000

Expected response:
```json
{
  "message": "Odhvica Global Backend is Active",
  "version": "1.0.0",
  "status": "healthy",
  "environment": "development",
  "timestamp": "2026-02-04T14:13:25.000Z"
}
```

### 3. Test Product API
```powershell
# List products (should return empty array initially)
curl http://localhost:3000/products
```

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Database Client** | ✅ Fixed | PostgreSQL configured |
| **Schema** | ✅ Fixed | All tables defined |
| **Migrations** | ⏳ Pending | Run after DB setup |
| **CORS** | ✅ Fixed | Environment-based |
| **Error Handling** | ✅ Fixed | Production-safe |
| **Type Safety** | ✅ Fixed | Zero TS errors |
| **Security** | ✅ Improved | Input validation added |

---

## 🔐 Security Improvements Made

1. **Environment Variables**: Secrets not hardcoded
2. **Error Sanitization**: Internal errors hidden in production
3. **Input Limits**: Pagination capped at 100 items
4. **CORS Whitelist**: Only allowed origins can access API
5. **Request Logging**: All requests logged for monitoring

---

## 💰 Cost Breakdown (Current Setup)

- **Supabase Free Tier**: ₹0/month (500MB DB)
- **Node.js Dependencies**: ₹0 (all open-source)
- **Hosting** (when deployed): ₹0 (Railway/Render free tier)

**Total Monthly Cost**: ₹0

---

## ⚠️ Important Notes

1. **Never commit `.env`** - It's already in `.gitignore`
2. **Change JWT_SECRET** in production
3. **Supabase Free Tier Limits**:
   - 500MB database storage
   - 2GB bandwidth/month
   - 50MB file uploads
   - Good for 5,000-10,000 products

4. **When to Upgrade**:
   - When you exceed 10,000 products
   - When you get 100,000+ visitors/month
   - When you need 99.9% uptime SLA

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
- Check if DATABASE_URL is correct in `.env`
- Verify Supabase project is active
- Check internet connection

### Error: "Port 3000 already in use"
- Change PORT in `.env` to 3001
- Or kill existing process on port 3000

### Error: "Module not found"
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

---

## 📞 Next Steps

1. **Setup Database** (choose Supabase or Local)
2. **Run Migrations** (`npm run generate && npm run migrate`)
3. **Test Backend** (`npm run dev`)
4. **Create Admin Panel** (Next.js frontend)

**Ready to proceed?** Let me know when database is setup and I'll help with migrations!
