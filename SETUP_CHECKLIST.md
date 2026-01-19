# Setup Checklist - Astro + NeonDB + Cloudinary CMS

Follow these steps to get the art portfolio CMS running locally and deployed.

---

## Phase 1: External Services Setup

### 1.1 NeonDB (Database)

- [ ] Log in to [Neon Console](https://console.neon.tech/)
- [ ] Create a new project (or use existing)
- [ ] Copy the connection string from Dashboard → Connection Details
  - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
- [ ] Save as `DATABASE_URL`

### 1.2 Cloudinary (Image Hosting)

- [ ] Log in to [Cloudinary Console](https://console.cloudinary.com/)
- [ ] Go to **Dashboard** → note your **Cloud Name**
- [ ] Save as `CLOUDINARY_CLOUD_NAME`

**Create Upload Preset:**

- [ ] Go to **Settings** → **Upload** → scroll to **Upload presets**
- [ ] Click **Add upload preset**
- [ ] Configure:
  | Setting | Value |
  |---------|-------|
  | Preset name | `artportfolio-unsigned` |
  | Signing Mode | **Unsigned** |
  | Folder | `artportfolio` (optional) |
- [ ] Click **Save**
- [ ] Save preset name as `CLOUDINARY_UPLOAD_PRESET`

### 1.3 Admin Password

- [ ] Choose a secure password for admin access
- [ ] Save as `ADMIN_PASSWORD`

---

## Phase 2: Local Environment Setup

### 2.1 Create Environment File

```bash
cd /home/finch/repos/artportfolio/worktrees/astro-cms
cp .env.example .env
```

### 2.2 Edit `.env` with Your Values

```bash
# .env
DATABASE_URL=postgresql://your-actual-connection-string
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=artportfolio-unsigned
ADMIN_PASSWORD=your-secure-password
```

- [ ] `DATABASE_URL` filled in
- [ ] `CLOUDINARY_CLOUD_NAME` filled in
- [ ] `CLOUDINARY_UPLOAD_PRESET` filled in
- [ ] `ADMIN_PASSWORD` filled in

### 2.3 Install Dependencies

```bash
npm install
```

- [ ] Dependencies installed successfully

### 2.4 Push Database Schema

```bash
npx drizzle-kit push
```

- [ ] Tables created: `portfolio_items`, `commission_requests`, `site_settings`

---

## Phase 3: Local Testing

### 3.1 Start Development Server

```bash
npm run dev
```

- [ ] Server starts on `http://localhost:4321`

### 3.2 Test Public Site

- [ ] Visit `http://localhost:4321`
- [ ] Page loads (may show empty gallery - that's expected)
- [ ] Pricing section displays default values
- [ ] No console errors

### 3.3 Test Admin Panel

- [ ] Visit `http://localhost:4321/admin`
- [ ] Browser prompts for username/password
- [ ] Enter any username + your `ADMIN_PASSWORD`
- [ ] Admin dashboard loads with 3 tabs

### 3.4 Test Image Upload

- [ ] Go to **Gallery** tab in admin
- [ ] Click **Upload Image**
- [ ] Cloudinary widget opens
- [ ] Upload a test image
- [ ] Image appears in gallery list
- [ ] Image shows on public site

### 3.5 Test Settings

- [ ] Go to **Settings** tab
- [ ] Change commission status to "Closed"
- [ ] Click **Save Settings**
- [ ] Refresh public site
- [ ] Status shows "CLOSED"

---

## Phase 4: Vercel Deployment (When Ready)

### 4.1 Push to GitHub

```bash
git push -u origin astro-neon-cloudinary
```

### 4.2 Connect to Vercel

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click **Add New** → **Project**
- [ ] Import your GitHub repo
- [ ] Select the `astro-neon-cloudinary` branch

### 4.3 Configure Environment Variables

In Vercel project settings → Environment Variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your NeonDB connection string |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | `artportfolio-unsigned` |
| `ADMIN_PASSWORD` | Your admin password |

- [ ] All 4 environment variables added

### 4.4 Deploy

- [ ] Click **Deploy**
- [ ] Wait for build to complete
- [ ] Test production URL

---

## Troubleshooting

### "Cannot connect to database"

- Check `DATABASE_URL` is correct (no typos)
- Ensure NeonDB project is not paused (free tier pauses after inactivity)
- Try the connection string in a tool like `psql` to verify

### "Cloudinary widget doesn't open"

- Verify `CLOUDINARY_CLOUD_NAME` matches your dashboard
- Check browser console for errors
- Ensure upload preset is set to **Unsigned**

### "Admin login fails"

- Password is case-sensitive
- Username can be anything (only password is checked)
- Clear browser cache and try again

### "Images don't appear on public site"

- Check browser console for CORS errors
- Verify Cloudinary URLs are accessible
- Try hard refresh (Ctrl+Shift+R)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build for production |
| `npx drizzle-kit push` | Push schema to database |
| `npx drizzle-kit studio` | Open Drizzle Studio (DB browser) |

| URL | Purpose |
|-----|---------|
| `http://localhost:4321` | Public portfolio |
| `http://localhost:4321/admin` | Admin dashboard |

---

## Next Steps After Setup

1. Upload existing portfolio images via admin
2. Configure pricing in Settings tab
3. Update bio and social links
4. Test commission form (if added)
5. Share admin credentials with daughter

---

**Setup complete when all boxes are checked!**
