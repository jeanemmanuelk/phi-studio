# The Symbol φ Studio — Setup Guide

Complete setup in **~15 minutes**. You only do this once.

---

## What you need to set up

| Service | Purpose | Cost |
|---|---|---|
| **Supabase** | Stores your portfolio list (titles, categories…) | Free |
| **Cloudinary** | Stores and delivers your images & videos | Free |
| **GitHub Pages** | Hosts your website for the world to see | Free |

---

## Step 1 — Supabase (Database)

### 1.1 Create your account
Go to [supabase.com](https://supabase.com) → Sign Up → Create a new project.
Choose any name (e.g. `phi-studio`) and set a strong password. Wait ~1 minute for it to build.

### 1.2 Create the portfolio table
In your Supabase project, click **SQL Editor** in the left sidebar.
Paste the entire block below and click **Run**:

```sql
-- Create the portfolio items table
create table portfolio_items (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  category      text not null check (category in ('weddings', 'events', 'photography')),
  description   text,
  media_type    text not null check (media_type in ('image', 'video')),
  cloudinary_url text not null,
  thumbnail_url  text,
  is_featured   boolean default false,
  created_at    timestamp with time zone default now()
);

-- Enable security
alter table portfolio_items enable row level security;

-- Public visitors can only VIEW
create policy "Public read"
  on portfolio_items for select
  to anon
  using (true);

-- Logged-in admin can add, edit, delete
create policy "Admin full access"
  on portfolio_items for all
  to authenticated
  using (true)
  with check (true);
```

### 1.3 Create your admin account
1. In Supabase, go to **Authentication → Users** in the left sidebar
2. Click **Invite user** (or **Add user**)
3. Enter your email and a strong password — **save these, you'll need them to log in**

### 1.4 Copy your API keys
1. Go to **Settings → API** in the left sidebar
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **Project API keys → anon / public** key

---

## Step 2 — Cloudinary (Media Storage)

### 2.1 Create your account
Go to [cloudinary.com](https://cloudinary.com) → Sign Up for free.

### 2.2 Find your Cloud Name
On your Cloudinary dashboard, your **Cloud Name** is shown at the top. Copy it.

### 2.3 Create an upload preset
1. Click the ⚙️ settings icon → **Upload** tab
2. Scroll to **Upload presets** → click **Add upload preset**
3. Set **Signing mode** to **Unsigned**
4. Set **Folder** to `phi-studio`
5. Set **Preset name** to exactly: `phi_studio`
6. Click **Save**

---

## Step 3 — Fill in your config file

Open the file `js/config.js` in a text editor (e.g. Notepad, TextEdit).
Replace the placeholder values with the ones you copied:

```js
const CONFIG = {
  supabase: {
    url:     'https://YOUR-PROJECT.supabase.co',   // ← paste your Project URL
    anonKey: 'eyJhbGciOiJIUzI1...'                // ← paste your anon key
  },
  cloudinary: {
    cloudName:    'your-cloud-name',               // ← paste your Cloud Name
    uploadPreset: 'phi_studio'                     // ← leave as-is if you used this name
  }
};
```

Save the file.

---

## Step 4 — Host on GitHub Pages

### 4.1 Create a GitHub repository
1. Go to [github.com](https://github.com) → New repository
2. Name it `phi-studio` (or anything you like)
3. Set it to **Public**
4. Click **Create repository**

### 4.2 Upload your files
1. Click **Upload files** on your repository page
2. Drag and drop the entire project folder contents
3. Click **Commit changes**

### 4.3 Enable GitHub Pages
1. Go to your repository → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Choose **main** branch, **/ (root)** folder
4. Click **Save**

Your site will be live at: `https://YOUR-USERNAME.github.io/phi-studio/`

---

## How to upload new work (daily use)

1. Go to `https://YOUR-USERNAME.github.io/phi-studio/admin/`
2. Sign in with your email and password (the ones you set in Supabase Step 1.3)
3. Click **+ Add New Work**
4. Upload your image or video, fill in the title and category
5. Click **Publish Work** — it appears on the site instantly ✓

**To feature work on the homepage:** click the ☆ star icon next to any item in the admin panel. Starred items appear in the "Recent Stories" section on the home page.

---

## Add a photo of Larissa to the About page

1. Put your photo in the project folder (e.g. `assets/larissa.jpg`)
2. Open `about.html` in a text editor
3. Find this line:
   ```html
   <div class="about-img-placeholder">φ</div>
   ```
4. Replace it with:
   ```html
   <img src="assets/larissa.jpg" alt="Larissa Mendy">
   ```
5. Re-upload to GitHub

---

## Questions?

Check the [Supabase Docs](https://supabase.com/docs) or [Cloudinary Docs](https://cloudinary.com/documentation).
