import { PlaylistInfo, VideoInfo } from './youtube';

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many work sessions
}

export interface StudySession {
  id: string;
  name: string;
  createdAt: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  sourceUrls?: string[]; // Original URLs provided by user for sharing efficiency
  currentVideoIndex: number;
  focusTime: number; // in seconds
  pomodoroSettings: PomodoroSettings;
  isActive: boolean;
  totalStudyTime: number; // in seconds
  completedPomodoros: number;
}

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4
};

export function createNewSession(
  name: string,
  videos: VideoInfo[],
  playlists: PlaylistInfo[],
  sourceUrls?: string[]
): StudySession {
  return {
    id: generateSessionId(),
    name,
    createdAt: new Date().toISOString(),
    videos,
    playlists,
    sourceUrls,
    currentVideoIndex: 0,
    focusTime: 0,
    pomodoroSettings: { ...DEFAULT_POMODORO_SETTINGS },
    isActive: false,
    totalStudyTime: 0,
    completedPomodoros: 0
  };
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveSession(session: StudySession): void {
  const sessions = getSavedSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem('focus0_sessions', JSON.stringify(sessions));
}

export function getSavedSessions(): StudySession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem('focus0_sessions');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved sessions:', error);
    return [];
  }
}

export function getSessionById(sessionId: string): StudySession | null {
  const sessions = getSavedSessions();
  return sessions.find(s => s.id === sessionId) || null;
}

export function deleteSession(id: string): void {
  const sessions = getSavedSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem('focus0_sessions', JSON.stringify(filtered));
}

export function createSessionShareLink(sessionId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/session/${sessionId}`;
}

export function updateSessionFocusTime(sessionId: string, additionalTime: number): void {
  const sessions = getSavedSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.focusTime += additionalTime;
    session.totalStudyTime += additionalTime;
    saveSession(session);
  }
}
