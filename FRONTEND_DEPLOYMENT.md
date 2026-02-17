# Frontend Deployment to Vercel

## Prerequisites
- GitHub account with your code pushed
- Vercel account (free)
- Backend URL (from Option A/B/C)

## Steps:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy to Vercel
```bash
cd d:\Projects\realtime-poll-rooms
vercel
```

### 3. Configure during setup
When prompted, accept the defaults:
- Use current directory: **Yes**
- Link to existing project: **No** (first time)
- Project name: `realtime-poll-rooms-frontend`
- Root directory: `./`
- Build command: Should auto-detect as `cd frontend && npm run build`
- Output directory: `frontend/dist`

### 4. Add Environment Variables
After first deployment, add environment variables in Vercel dashboard:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `realtime-poll-rooms-frontend`
3. Go to **Settings** → **Environment Variables**
4. Add these variables (replace with your actual backend URL):

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_API_URL` | `https://your-backend-url.onrender.com` | Production |
| `VITE_SOCKET_URL` | `https://your-backend-url.onrender.com` | Production |

For development:
| `VITE_API_URL` | `http://localhost:3000` | Preview, Development |
| `VITE_SOCKET_URL` | `http://localhost:3000` | Preview, Development |

### 5. Redeploy with environment variables
```bash
vercel --prod
```

---

## Connect Frontend to Backend

After deploying your backend (Render/Railway/Heroku):
1. Copy your backend URL
2. Update the environment variables in Vercel with the backend URL
3. Vercel will automatically redeploy with the new variables

Your app will now be live at: `https://realtime-poll-rooms-frontend.vercel.app`
