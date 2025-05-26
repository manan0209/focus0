import { PomodoroSettings } from '@/lib/session';
import { useCallback, useEffect, useRef, useState } from 'react';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle';

export interface PomodoroState {
  phase: PomodoroPhase;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  completedPomodoros: number;
  currentCycle: number;
}

export function usePomodoro(settings: PomodoroSettings) {
  const [state, setState] = useState<PomodoroState>({
    phase: 'idle',
    timeRemaining: settings.workDuration * 60,
    isRunning: false,
    completedPomodoros: 0,
    currentCycle: 1
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const getNextPhase = useCallback((currentPhase: PomodoroPhase, completedPomodoros: number): PomodoroPhase => {
    if (currentPhase === 'work') {
      const shouldTakeLongBreak = (completedPomodoros + 1) % settings.longBreakInterval === 0;
      return shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
    }
    return 'work';
  }, [settings.longBreakInterval]);

  const getPhaseDuration = useCallback((phase: PomodoroPhase): number => {
    switch (phase) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return 0;
    }
  }, [settings]);

  const startTimer = useCallback(() => {
    setState(prev => {
      const newPhase = prev.phase === 'idle' ? 'work' : prev.phase;
      return {
        ...prev,
        phase: newPhase,
        isRunning: true,
        timeRemaining: prev.phase === 'idle' ? getPhaseDuration('work') : prev.timeRemaining
      };
    });
  }, [getPhaseDuration]);

  const pauseTimer = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setState({
      phase: 'idle',
      timeRemaining: settings.workDuration * 60,
      isRunning: false,
      completedPomodoros: 0,
      currentCycle: 1
    });
  }, [settings.workDuration]);

  const skipPhase = useCallback(() => {
    setState(prev => {
      const nextPhase = getNextPhase(prev.phase, prev.completedPomodoros);
      const newCompletedPomodoros = prev.phase === 'work' 
        ? prev.completedPomodoros + 1 
        : prev.completedPomodoros;

      return {
        ...prev,
        phase: nextPhase,
        timeRemaining: getPhaseDuration(nextPhase),
        completedPomodoros: newCompletedPomodoros,
        currentCycle: nextPhase === 'work' ? prev.currentCycle + 1 : prev.currentCycle
      };
    });
  }, [getNextPhase, getPhaseDuration]);

  // Timer tick effect
  useEffect(() => {
    if (state.isRunning && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            // Phase completed
            playNotification();
            const nextPhase = getNextPhase(prev.phase, prev.completedPomodoros);
            const newCompletedPomodoros = prev.phase === 'work' 
              ? prev.completedPomodoros + 1 
              : prev.completedPomodoros;

            return {
              ...prev,
              phase: nextPhase,
              timeRemaining: getPhaseDuration(nextPhase),
              completedPomodoros: newCompletedPomodoros,
              currentCycle: nextPhase === 'work' ? prev.currentCycle + 1 : prev.currentCycle,
              isRunning: true // Auto-start next phase
            };
          }

          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.timeRemaining, getNextPhase, getPhaseDuration, playNotification]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    formatTime: (seconds?: number) => formatTime(seconds ?? state.timeRemaining)
  };
}
