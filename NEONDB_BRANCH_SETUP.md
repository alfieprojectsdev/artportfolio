# NeonDB Branch Connection Guide

> **Goal**: Connect local dev build to NeonDB dev branch for testing before deployment.

---

## NeonDB Branch Structure

NeonDB has separate connection strings for each branch:

| Branch | Connection Host | Status |
|---------|----------------|---------|
| **Production** | `ep-winter-wind-a14i26ba` | Live site data |
| **Development** | `ep-soft-poetry-a1ctpgud` | Isolated test data |

---

## Current Setup

### Your `.env` File (Lines 1-3)

```bash
# Currently using this connection (appears to be production):
DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-winter-wind-a14i26ba-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Dev branch connection (commented out):
# DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Connection String Parts

```
postgresql://
  neondb_owner:npg_Pw7dLU1peQuJ@         # user:password
  ep-winter-wind-a14i26ba-pooler        # HOST (identifies branch)
  .ap-southeast-1.aws.neon.tech/          # Region & service
  neondb?                                 # Database name
  sslmode=require&channel_binding=require     # Connection options
```

**Key identifier**: `ep-winter-wind-a14i26ba` (host) determines which branch you're connected to.

---

## Method 1: Switch Branches in `.env` (Recommended)

### Step 1: Edit `.env` File

```bash
# File: /home/finch/repos/artportfolio/worktrees/astro-cms/.env

# Comment out production:
# DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-winter-wind-a14i26ba-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Uncomment development:
DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Step 2: Restart Dev Server

```bash
cd /home/finch/repos/artportfolio/worktrees/astro-cms
npm run dev
```

**Result**: Your local app now connects to the **dev branch** (empty or isolated data).

### Step 3: Verify Connection

```bash
# Check connection by inspecting process logs or visiting http://localhost:4321
# Open browser console and look for successful API calls
```

---

## Method 2: Environment Variable Override (Temporary)

### Set for Current Session

```bash
# Bash/Zsh
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
cd /home/finch/repos/artportfolio/worktrees/astro-cms
npm run dev
```

### Reset to Production

```bash
unset DATABASE_URL
# Or close terminal and reopen
```

---

## Method 3: Multiple `.env` Files (For Frequent Switching)

### Create Branch-Specific Files

```bash
cd /home/finch/repos/artportfolio/worktrees/astro-cms

# Create dev environment
cp .env .env.production
cp .env .env.development
```

### Edit Each File

**`.env.production`**:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-winter-wind-a14i26ba-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CLOUDINARY_CLOUD_NAME=your-cloud-name
# ... rest of production config
```

**`.env.development`**:
```bash
DATABASE_URL=postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CLOUDINARY_CLOUD_NAME=your-cloud-name
# ... rest of dev config
```

### Switch Branches

```bash
# Use dev branch
cp .env.development .env
npm run dev

# Use production branch
cp .env.production .env
npm run dev
```

---

## Finding Your Branch Connection URLs

### Option 1: Neon Dashboard

1. Go to https://console.neon.tech
2. Select your project
3. Click **Branches** in left sidebar
4. Click on the branch (production or development)
5. Copy **Connection string** under "Connection details"
6. Paste into your `.env`

### Option 2: Neon CLI

```bash
# Install Neon CLI if not installed
npm install -g neonctl

# List branches
neonctl branches list

# Get connection string for specific branch
neonctl connection-string --branch-name development
```

---

## Seeding Dev Branch with Test Data

After connecting to dev branch, you'll likely have an empty database. Seed it for testing:

### Option 1: Via Admin Dashboard

```bash
# Connect to dev branch (Method 1 or 2)
npm run dev

# Visit http://localhost:4321/admin
# Authenticate and add test data:
# - Add 3-4 gallery items
# - Update settings
# - Create test commission requests
```

### Option 2: SQL Script

Create `seed-dev.sql`:

```sql
-- Insert sample gallery items
INSERT INTO portfolio_items (title, image_url, thumbnail_url, category, alt_text, featured, display_order)
VALUES
  ('Test Commission 1', 'https://example.com/img1.jpg', 'https://example.com/img1.jpg?w=400', 'commission', 'Test artwork', true, 1),
  ('Test Fanart 1', 'https://example.com/img2.jpg', 'https://example.com/img2.jpg?w=400', 'fanart', 'Test fanart', true, 2);

-- Insert default settings
INSERT INTO site_settings (commission_status, artist_name, bio, instagram, discord)
VALUES ('open', 'Bred', 'Test bio for dev environment', 'demented.toast', 'toasted_insanity');

-- Insert sample commission request
INSERT INTO commission_requests (client_name, email, discord, art_type, style, status, description)
VALUES ('Test Client', 'test@example.com', 'testuser', 'bust', 'flat', 'pending', 'This is a test commission request');
```

Run seed:

```bash
psql 'postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f seed-dev.sql
```

---

## Testing Deployment to Dev Branch

### Before Pushing

```bash
# 1. Switch to dev branch
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 2. Run local dev
npm run dev

# 3. Test thoroughly:
# - Gallery displays items
# - Admin dashboard works
# - Upload Cloudinary images
# - Add/delete gallery items
# - Update settings
# - Commission form submission
```

### After Verification

If dev environment works correctly, deploy to Vercel:

```bash
# 1. Build project
npm run build

# 2. Test build locally
npm run preview

# 3. Deploy to Vercel
vercel --prod

# 4. Set production DATABASE_URL in Vercel dashboard (not dev)
```

---

## Common Issues & Solutions

### Issue: Connection Refused

**Error**: `Connection refused` or `could not connect to server`

**Solution**:
```bash
# Check if branch exists and URL is correct
psql 'postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c "SELECT version();"
```

### Issue: Tables Not Found

**Error**: `relation "portfolio_items" does not exist`

**Solution**: Run migrations on dev branch:

```bash
# Ensure DATABASE_URL points to dev branch
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Generate migration from schema
npx drizzle-kit generate

# Push schema to dev database
npx drizzle-kit push
```

### Issue: Data Still Shows from Production

**Cause**: Browser cache or didn't restart dev server

**Solution**:
```bash
# Stop dev server (Ctrl+C)
# Clear .env DATABASE_URL cache
unset DATABASE_URL
# Restart with new DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npm run dev
```

---

## Quick Reference Cheat Sheet

```bash
# Connect to dev branch (temporary)
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Connect to production branch (temporary)
export DATABASE_URL="postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-winter-wind-a14i26ba-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Start dev server
npm run dev

# Direct SQL connection to dev
psql 'postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-soft-poetry-a1ctpgud-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Direct SQL connection to production
psql 'postgresql://neondb_owner:npg_Pw7dLU1peQuJ@ep-winter-wind-a14i26ba-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Push schema to current branch
npx drizzle-kit push
```

---

## Summary

| Method | Use Case | Pros | Cons |
|--------|-----------|-------|-------|
| **Method 1** (edit .env) | Frequent branch switching | Permanent change until reverted |
| **Method 2** (env var) | One-time testing | Lost on terminal close |
| **Method 3** (multiple .env) | Complex workflows | File management overhead |

**Recommended**: Use Method 1 for testing before deployment. Keep production URL in `.env.production` as backup.

---

## Production Deployment Checklist

When ready to deploy to production:

- [ ] Switch back to production DATABASE_URL
- [ ] Test locally with production DB (read-only verification)
- [ ] Build succeeds: `npm run build`
- [ ] Preview works: `npm run preview`
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Set production DATABASE_URL in Vercel environment variables
- [ ] Verify live site functionality
- [ ] Revert `.env` back to dev branch for continued development
