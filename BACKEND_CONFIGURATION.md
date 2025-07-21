# Backend Configuration Guide

## Development vs Production Setup

### Development Environment
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:4000` (Local backend server)
- **Configuration**: `vite.config.ts` proxy configuration

### Production Environment
- **Frontend**: `https://cyber-vault-ui.vercel.app` (Vercel deployment)
- **Backend**: `https://cybervault-api-a1fo.onrender.com` (Render deployment)
- **Configuration**: `vercel.json` rewrites configuration

## How It Works

### Development
1. Start your local backend server on port 4000
2. Run `npm run dev` to start the frontend on port 5173
3. All `/api/*` requests are automatically proxied to `http://localhost:4000`
4. No CORS issues since the proxy handles the cross-origin requests

### Production
1. Deploy frontend to Vercel
2. Vercel automatically rewrites `/api/*` requests to the remote Render server
3. CORS headers are added automatically by Vercel configuration

## Required Setup

### For Development
1. **Make sure your local backend is running on port 4000**
   ```bash
   # In your backend project directory
   npm start  # or whatever command starts your backend
   ```

2. **Start the frontend development server**
   ```bash
   # In this project directory
   npm run dev
   ```

3. **Access the application**
   - Open `http://localhost:5173/auth` to log in
   - All API requests will be sent to your local backend at `localhost:4000`

### For Production
1. **Deploy to Vercel**
   ```bash
   npm run build
   vercel deploy
   ```

2. **Access the production app**
   - Open `https://cyber-vault-ui.vercel.app/auth`
   - All API requests will be sent to the remote Render server

## Configuration Files

### vite.config.ts (Development)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:4000',  // Local backend
    changeOrigin: true,
    secure: false
  }
}
```

### vercel.json (Production)
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://cybervault-api-a1fo.onrender.com/api/$1"
    }
  ]
}
```

## Testing the Setup

### Test Local Backend Connection
```bash
# Test if your local backend is running
curl http://localhost:4000/api/v1/auth/login

# Test if the proxy is working
curl http://localhost:5173/api/v1/auth/login
```

### Test JIT Access Flow
1. Go to `http://localhost:5173/auth`
2. Register/login with test credentials
3. Navigate to JIT Access page
4. Check browser console for API call logs
5. Verify data appears in the interface

## Troubleshooting

### "Proxy error" in console
- Make sure your local backend is running on port 4000
- Check that your backend has the correct CORS configuration
- Verify your backend endpoints are responding correctly

### "Network error" in frontend
- Check if the backend server is accessible
- Verify the proxy configuration in `vite.config.ts`
- Check browser console for detailed error messages

### Production deployment issues
- Verify the Render backend URL is correct in `vercel.json`
- Check Vercel deployment logs
- Ensure environment variables are set correctly
