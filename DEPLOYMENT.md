# 🚀 MediQueue Cloud Deployment Guide

This guide walks you through deploying **MediQueue Backend on Render** and **MediQueue Frontend on Vercel** in under 10 minutes.

---

## 📋 Architecture Overview

- **Backend**: Express + Node.js deployed on **Render** (Web Service).
- **Database**: PostgreSQL hosted on **Neon Cloud** (already configured with SSL).
- **Frontend**: Vite + React 18 SPA deployed on **Vercel** with client-side routing rewrites.

---

## Part 1: Deploy Backend on Render

### Step 1: Create a New Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `VanshHala/MediQueue`.

### Step 2: Configure Service Settings
- **Name**: `mediqueue-backend` (or your choice)
- **Region**: `Oregon (US West)` or closest to your database
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Step 3: Add Environment Variables
Under the **Environment Variables** tab, add the following key-value pairs:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `5000` | Render also binds dynamically |
| `DATABASE_URL` | `postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require` | Your private Neon database URL from .env |
| `JWT_SECRET` | `your_secure_32_character_jwt_secret_here` | 32+ character random secret string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |
| `CLIENT_URL` | `https://your-frontend.vercel.app` | Set initially to `http://localhost:5173` or update once Vercel gives you your URL |

### Step 4: Deploy & Verify
1. Click **Deploy Web Service**.
2. Once deployed, Render will provide a live URL, e.g.:
   `https://mediqueue-backend.onrender.com`
3. Test health check in your browser:
   - `https://mediqueue-backend.onrender.com/` → `{"success": true, "name": "MediQueue API", "status": "operational"}`
   - `https://mediqueue-backend.onrender.com/api/health` → `{"success": true, "message": "MediQueue API server is operational and healthy"}`

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Choose `VanshHala/MediQueue` from your GitHub repositories and click **Import**.

### Step 2: Configure Build Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click `Edit` and select `client`
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)
- **Install Command**: `npm install` (default)

### Step 3: Add Environment Variable
Under **Environment Variables**, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://mediqueue-backend.onrender.com/api` | **Use your live Render backend URL from Part 1** |

*(Note: The client automatically appends `/api` if you omit it, but providing the full `/api` path is best practice).*

### Step 4: Deploy
1. Click **Deploy**.
2. Vercel will build the frontend and provide your production domain (e.g. `https://mediqueue.vercel.app`).
3. Click through and verify all pages (`/`, `/book`, `/blood-requests`, `/find-donors`, `/login`).

---

## Part 3: Final Sync

1. Go back to your **Render** dashboard for `mediqueue-backend`.
2. Update the `CLIENT_URL` environment variable to your final Vercel domain:
   ```
   CLIENT_URL=https://mediqueue.vercel.app
   ```
3. Render will automatically redeploy with the updated origin.

---

## 🛠️ Verification Checklist

- [x] **SPA Routing**: `client/vercel.json` and root `vercel.json` rewrite all requests to `/index.html` so direct links (`/dashboard`, `/blood-requests`) do not return 404s.
- [x] **CORS Support**: Server CORS policy dynamically permits localhost, all `*.vercel.app` domains, and the custom `CLIENT_URL`.
- [x] **Render Host Binding**: Server binds to `0.0.0.0` for Linux container hosting.
- [x] **Database SSL**: Neon PostgreSQL pool is configured with `ssl: { rejectUnauthorized: false }`.
- [x] **Health Check Pings**: Root `/` and `/api/health` return HTTP 200 for Render uptime monitoring.
