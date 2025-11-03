'use client';

/**
 * Cleanup Handler
 * Handles application shutdown and resource cleanup
 */

import { useEffect } from 'react';
import { destroyConnectionPool } from '@/lib/services/connection-pool';
import { cleanupRateLimiters } from '@/lib/services/rate-limiter';

export function CleanupHandler() {
  useEffect(() => {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      try {
        // Clean up connection pool
        destroyConnectionPool();

        // Clean up rate limiters
        cleanupRateLimiters();

        // Clear OAuth states older than 1 hour
        const now = Date.now();
        const states = JSON.parse(localStorage.getItem('oauth-states') || '{}');
        const validStates: Record<string, unknown> = {};

        for (const [key, state] of Object.entries(states)) {
          const stateData = state as { timestamp?: number };
          if (stateData.timestamp && now - stateData.timestamp < 3600000) {
            validStates[key] = state;
          }
        }

        localStorage.setItem('oauth-states', JSON.stringify(validStates));
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };

    // Cleanup on visibility change (tab close/hide)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic cleanup (every 5 minutes)
    const cleanupInterval = setInterval(() => {
      cleanupRateLimiters();
    }, 300000);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(cleanupInterval);
      handleBeforeUnload();
    };
  }, []);

  return null; // This component doesn't render anything
}

