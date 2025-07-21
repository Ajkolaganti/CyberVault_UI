# CORS Troubleshooting Guide

## Issue: Frontend requests fail with CORS errors while Postman works

When Postman works but your frontend doesn't, it's typically a CORS configuration issue. Postman doesn't enforce CORS policies, but browsers do.

## Solution 1: Vercel Rewrites (Recommended for Vercel Deployment)

Since you're deploying to Vercel, we've configured `vercel.json` to handle API proxying and CORS headers automatically. This approach bypasses CORS issues by making requests appear to come from the same origin.

### How it works:
- Requests to `/api/*` on your Vercel domain are automatically forwarded to your backend
- Vercel adds the necessary CORS headers
- No browser CORS restrictions since requests appear to be same-origin

### Configuration added:
- `vercel.json` with rewrites and headers
- Updated Vite config for better build optimization

## Solution 2: Fix Your Backend CORS Configuration

If you still prefer to handle CORS on the backend side, update your **separate backend project**:

### 1. Install CORS package (if not already installed)
```bash
npm install cors
```

### 2. Update your backend server configuration

```javascript
const cors = require('cors');

// Allow multiple origins including your frontend and Vercel
const allowedOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3000',      // Alternative React dev server
  'http://127.0.0.1:5173',     // Alternative localhost
  'https://your-vercel-app.vercel.app', // Your Vercel deployment URL
  'https://your-custom-domain.com', // Your custom domain if any
  // Add more origins as needed
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important if you're using cookies or auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Supabase-Token'
  ]
}));
```

### 3. Ensure CORS is applied BEFORE your routes

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// Apply CORS BEFORE other middleware and routes
app.use(cors(/* your config */));

// Then apply other middleware
app.use(express.json());

// Then your routes
app.post('/api/v1/auth/login', ...);
```

### 4. Handle preflight OPTIONS requests

Your backend should automatically handle OPTIONS requests with the CORS configuration above. If you're still having issues, you can explicitly handle them:

```javascript
// Explicitly handle preflight requests
app.options('*', cors()); // Enable preflight for all routes
```

## Testing Steps

1. **Start your backend server** with the updated CORS configuration
2. **Start your frontend** with `npm run dev`
3. **Check browser console** for detailed error messages
4. **Check your backend logs** to see if requests are reaching the server
5. **Verify the origin** in browser developer tools (Network tab)

## Common Issues and Solutions

### Issue: "Access to fetch has been blocked by CORS policy"
**Solution**: Add your frontend origin (`http://localhost:5173`) to the `allowedOrigins` array in your backend.

### Issue: "Request header field authorization is not allowed"
**Solution**: Add `'Authorization'` to the `allowedHeaders` array in your CORS config.

### Issue: "Method POST is not allowed"
**Solution**: Add `'POST'` to the `methods` array in your CORS config.

### Issue: Credentials not being sent
**Solution**: Set `credentials: true` in both:
- Backend CORS config
- Frontend fetch requests (already configured in your authStore)

## Environment Variables

Create a `.env` file in your backend project:

```env
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Then use it in your CORS config:
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  // ... other origins
].filter(Boolean);
```

## Debugging Tips

1. **Check browser Network tab**: Look for failed requests and their response headers
2. **Check backend logs**: See if requests are reaching your server
3. **Test with curl**: Verify your backend works outside the browser
4. **Temporarily allow all origins**: For testing only, use `origin: true` in CORS config

## If you're still having issues:

1. Share your current backend CORS configuration
2. Share the exact error message from browser console
3. Share your backend server startup logs
4. Confirm your backend is running on the expected port/URL

The Vite proxy is configured for local development, and Vercel rewrites handle production deployment to forward requests to your Render backend at `https://cybervault-api-a1fo.onrender.com`.

## Vercel Deployment Benefits

1. **No CORS issues**: Requests appear to come from the same origin
2. **Automatic SSL**: Vercel handles HTTPS for your frontend
3. **Edge caching**: Better performance for API responses
4. **Simplified configuration**: No need to manage CORS headers manually

## Testing with Vercel

1. **Deploy to Vercel**: `vercel --prod` or connect your GitHub repo
2. **Test API calls**: Your frontend will automatically proxy API requests
3. **Check Vercel logs**: Monitor function logs in Vercel dashboard for any issues

## Troubleshooting Vercel Deployment

If you still have issues after deploying to Vercel:

1. **Check Vercel function logs** in the dashboard
2. **Verify your backend is accessible** from Vercel's servers
3. **Ensure your backend accepts requests** from your Vercel domain
4. **Test the rewrite rules** by checking network tab in browser dev tools
