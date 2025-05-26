// Focus0 Analytics Utilities
// Track user interactions for better insights

import { track } from '@vercel/analytics';

// Custom events for Focus0 usage tracking
export const analytics = {
  // Session management events
  sessionCreated: (sessionName: string, videoCount: number) => {
    track('session_created', {
      session_name: sessionName,
      video_count: videoCount,
    });
  },

  sessionStarted: (sessionId: string, sessionName: string) => {
    track('session_started', {
      session_id: sessionId,
      session_name: sessionName,
    });
  },

  sessionCompleted: (sessionId: string, totalTime: number, focusTime: number) => {
    track('session_completed', {
      session_id: sessionId,
      total_time_minutes: Math.round(totalTime / 60),
      focus_time_minutes: Math.round(focusTime / 60),
      focus_percentage: Math.round((focusTime / totalTime) * 100),
    });
  },

  // Video interaction events
  videoAdded: (videoType: 'single' | 'playlist') => {
    track('video_added', {
      video_type: videoType,
    });
  },

  videoStarted: (videoId: string, videoTitle: string) => {
    track('video_started', {
      video_id: videoId,
      video_title: videoTitle,
    });
  },

  videoCompleted: (videoId: string, watchTime: number) => {
    track('video_completed', {
      video_id: videoId,
      watch_time_minutes: Math.round(watchTime / 60),
    });
  },

  // Pomodoro timer events
  pomodoroStarted: (workDuration: number) => {
    track('pomodoro_started', {
      work_duration_minutes: workDuration,
    });
  },

  pomodoroCompleted: (phase: 'work' | 'shortBreak' | 'longBreak' | 'idle') => {
    const phaseMap = {
      work: 'work',
      shortBreak: 'short_break',
      longBreak: 'long_break',
      idle: 'idle'
    } as const;
    
    track('pomodoro_completed', {
      phase: phaseMap[phase],
    });
  },

  // Focus tracking events
  focusLost: (sessionId: string, focusDuration: number) => {
    track('focus_lost', {
      session_id: sessionId,
      focus_duration_seconds: focusDuration,
    });
  },

  focusRegained: (sessionId: string, breakDuration: number) => {
    track('focus_regained', {
      session_id: sessionId,
      break_duration_seconds: breakDuration,
    });
  },

  // Feature usage events
  keyboardShortcutUsed: (shortcut: string, action: string) => {
    track('keyboard_shortcut_used', {
      shortcut: shortcut,
      action: action,
    });
  },

  fullscreenToggled: (entered: boolean) => {
    track('fullscreen_toggled', {
      entered: entered,
    });
  },

  playbackSpeedChanged: (speed: number) => {
    track('playback_speed_changed', {
      speed: speed,
    });
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string) => {
    track('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  },

  // Page views (automatic with Vercel Analytics, but custom events for specific pages)
  sessionPageViewed: (sessionId: string, isShared: boolean) => {
    track('session_page_viewed', {
      session_id: sessionId,
      is_shared_session: isShared,
    });
  },
};
