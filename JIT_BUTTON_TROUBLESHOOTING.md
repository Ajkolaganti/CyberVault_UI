# JIT Access Button Troubleshooting Guide

## Issue: "New Request" button not responding

The code has been cleaned up and should be working. Here's how to test and troubleshoot:

## Step 1: Verify Page Access
1. Open browser to: `http://localhost:5174/jit-access`
2. Make sure you're logged in (if redirected to login, complete auth first)
3. Verify the JIT Access page loads with the "New Request" button visible

## Step 2: Test Button Functionality
1. Click the "New Request" button in the top-right corner
2. Expected behavior: A modal should appear with the title "Request Just-in-Time Access"
3. The modal should contain a form with fields for:
   - Resource/System
   - Business Justification  
   - Requested Duration

## Step 3: Browser Developer Tools Check
1. Press F12 to open developer tools
2. Go to Console tab
3. Click the "New Request" button
4. Look for any JavaScript errors in red
5. Check if there are any blocked network requests

## Step 4: CSS/Layout Issues
1. Right-click the "New Request" button
2. Select "Inspect Element"
3. Check if the button has any CSS that might prevent clicking:
   - `pointer-events: none`
   - `z-index` issues
   - Overlapping elements

## Step 5: Authentication Check
1. In developer tools, go to Application tab
2. Check Local Storage for `cybervault_token`
3. If missing, you may need to log in again

## Common Solutions:

### Solution 1: Hard Refresh
- Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to hard refresh
- This clears cache and reloads all assets

### Solution 2: Clear Browser Data
- Clear cookies and local storage for localhost:5174
- Log in again

### Solution 3: Check Network Tab
- Open Network tab in dev tools
- Click the button
- See if any API calls are being blocked

### Solution 4: Try Different Browser
- Test in Chrome, Firefox, Safari to isolate browser-specific issues

## Current Component Status:
✅ Button click handler: `onClick={() => setShowNewRequestModal(true)}`
✅ Modal state management: `useState(false)`
✅ Modal component: Properly configured with form
✅ No TypeScript errors
✅ All imports correct

## If Still Not Working:
1. Check browser console for specific error messages
2. Try clicking other buttons on the page to see if it's a general issue
3. Verify the page is actually the JIT Access page (check URL and page title)
4. Make sure you're not in an iframe or unusual browsing context

## Quick Test:
Add this temporary button to verify React state is working:
```jsx
<button onClick={() => alert('Test button works!')}>Test Button</button>
```

If the test button works but the main button doesn't, the issue is specific to the Button component or modal.
