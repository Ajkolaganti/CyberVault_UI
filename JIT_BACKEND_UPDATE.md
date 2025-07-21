# JIT Access Backend Integration Update

## Updated Backend Response Format

The backend now returns JIT requests with the following structure:

```json
{
  "active": true,
  "business_justification": "Access needed for operational purposes",
  "created_at": "2025-07-21T22:05:46.599151+00:00",
  "expires_at": "2025-07-21T23:05:46.29+00:00",
  "id": "3b2cbc99-b527-487d-af39-2a18aeeb707b",
  "profiles": null,
  "resource": "AWS",
  "system": null,
  "user_id": "1ac024a5-edd1-4247-a10e-2cbebfc76643",
  "username": "kolagantiajaykumar@gmail.com"
}
```

## Frontend Changes Made

### 1. Updated Data Transformation Function

The `transformBackendData` function in `JITAccess.tsx` has been updated to handle the new field names:

**Field Mappings:**
- `username` → `requester` (primary field for user display)
- `business_justification` → `reason` 
- `resource` or `system` → `resource`
- `created_at` → `requestTime`
- `expires_at` → `expiresAt`
- `active` → `status` (true = 'active', false = 'pending')

### 2. Updated API Request Format

When creating new JIT requests, the frontend now sends:

```json
{
  "resource": "Database Server",
  "system": "Production MySQL",
  "reason": "Need to fix critical payment bug affecting customers",
  "durationMinutes": 120
}
```

**Field descriptions:**
- `resource` - The main resource being requested (required)
- `system` - Specific system details (optional)
- `reason` - Business justification for the access (required)
- `durationMinutes` - Duration in minutes (converted from user-friendly format)

**Duration conversion:**
- "30 minutes" → 30
- "1 hour" → 60  
- "2 hours" → 120
- "4 hours" → 240
- "8 hours" → 480
- "24 hours" → 1440

### 3. Enhanced Logging

Added detailed console logging to track data transformation:
- Logs the raw backend data before transformation
- Logs the transformed data after conversion
- Helps debug any field mapping issues

## Testing the Changes

1. **Start your local backend** on port 4000 with the new response format
2. **Start the frontend** with `npm run dev` 
3. **Navigate to JIT Access page** at `http://localhost:5173/jit-access`
4. **Check browser console** for transformation logs
5. **Create a new request** to test the new API format
6. **Verify data displays correctly** in all tabs (Pending, Active, History)

## Expected Behavior

- New requests should appear immediately in the "Pending Requests" tab
- Active requests (where `active: true`) should appear in the "Active Access" tab
- All field mappings should display correctly (username, business justification, etc.)
- Time remaining should be calculated and displayed for active requests

## Debugging

If data is not displaying correctly:

1. **Check browser console** for transformation logs
2. **Verify backend response format** matches the expected structure
3. **Check API request format** when creating new requests
4. **Ensure authentication** is working (user must be logged in)

## Files Modified

- `/src/pages/JITAccess.tsx` - Updated transformation function and API calls
- `/vite.config.ts` - Updated to proxy to local backend (localhost:4000)
- `/BACKEND_CONFIGURATION.md` - Added setup documentation
