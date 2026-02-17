# Backend Deployment Guide

## Option A: Deploy to Render.com (Recommended - Free Tier Available)

### Steps:
1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: realtime-poll-rooms-api
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Add environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
7. Click "Create Web Service" and wait for deployment

### Get your backend URL:
After deployment, you'll get a URL like: `https://realtime-poll-rooms-api.onrender.com`

---

## Option B: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Import GitHub repo
3. Select the repository
4. Add MongoDB plugin from marketplace
5. Configure services:
   - **Start Command**: `cd backend && npm install && node server.js`
6. Deploy and get your public URL

---

## Option C: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create realtime-poll-rooms-api`
4. Add environment variable: `heroku config:set MONGO_URI=your_mongodb_uri`
5. Deploy: `git push heroku main`

---

## After Backend Deployment:

1. Copy your backend URL (e.g., `https://realtime-poll-rooms-api.onrender.com`)
2. Update Vercel environment variables with this URL
