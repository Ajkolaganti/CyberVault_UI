import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface UseInactivityLogoutProps {
  timeout?: number; // in milliseconds
  warningTime?: number; // show warning before logout (in milliseconds)
  checkInterval?: number; // how often to check activity (in milliseconds)
}

export const useInactivityLogout = ({
  timeout = 15 * 60 * 1000, // 15 minutes default
  warningTime = 2 * 60 * 1000, // 2 minutes warning
  checkInterval = 1000, // check every second
}: UseInactivityLogoutProps = {}) => {
  const { user, signOut } = useAuthStore();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Events that indicate user activity
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ];

  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast.error('Session expired due to inactivity. Please log in again.', {
        duration: 6000,
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid #ef4444',
        },
      });
    } catch (error) {
      console.error('Error during inactivity logout:', error);
      // Force logout even if signOut fails
      window.location.reload();
    }
  }, [signOut]);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      toast(
        `⚠️ Your session will expire in ${Math.ceil(warningTime / 60000)} minutes due to inactivity.`,
        {
          duration: 5000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #f59e0b',
          },
        }
      );
    }
  }, [warningTime]);

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity >= timeout) {
      // User has been inactive for too long, log them out
      handleLogout();
    } else if (timeSinceLastActivity >= timeout - warningTime) {
      // Show warning that session will expire soon
      showWarning();
    }
  }, [timeout, warningTime, handleLogout, showWarning]);

  useEffect(() => {
    // Only run if user is logged in
    if (!user) {
      return;
    }

    // Add event listeners for user activity
    const handleActivity = () => updateLastActivity();

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the inactivity check interval
    checkIntervalRef.current = setInterval(checkInactivity, checkInterval);

    // Cleanup function
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, updateLastActivity, checkInactivity, checkInterval]);

  // Reset activity timer when user becomes active again
  useEffect(() => {
    if (user) {
      updateLastActivity();
    }
  }, [user, updateLastActivity]);

  return {
    updateLastActivity,
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
    getRemainingTime: () => Math.max(0, timeout - (Date.now() - lastActivityRef.current)),
  };
};
