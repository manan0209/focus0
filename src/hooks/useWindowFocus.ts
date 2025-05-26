import { useState, useEffect, useCallback } from 'react';

export function useWindowFocus() {
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [focusStartTime, setFocusStartTime] = useState<number>(Date.now());
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  const handleFocus = useCallback(() => {
    setIsWindowFocused(true);
    setFocusStartTime(Date.now());
  }, []);

  const handleBlur = useCallback(() => {
    setIsWindowFocused(false);
    const sessionTime = Date.now() - focusStartTime;
    setTotalFocusTime(prev => prev + sessionTime);
  }, [focusStartTime]);

  const resetFocusTime = useCallback(() => {
    setTotalFocusTime(0);
    setFocusStartTime(Date.now());
  }, []);

  useEffect(() => {
    // Check if window is focused on mount
    setIsWindowFocused(document.hasFocus());

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', () => {});
    };
  }, [handleFocus, handleBlur]);

  // Calculate current session focus time
  const getCurrentFocusTime = useCallback(() => {
    if (!isWindowFocused) return totalFocusTime;
    return totalFocusTime + (Date.now() - focusStartTime);
  }, [isWindowFocused, totalFocusTime, focusStartTime]);

  return {
    isWindowFocused,
    totalFocusTime: getCurrentFocusTime(),
    resetFocusTime
  };
}
