import { VideoInfo, PlaylistInfo } from './youtube';

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many work sessions
}

export interface AmbientSound {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  volume: number;
}

export interface StudySession {
  id: string;
  name: string;
  createdAt: string;
  videos: VideoInfo[];
  playlists: PlaylistInfo[];
  currentVideoIndex: number;
  focusTime: number; // in seconds
  pomodoroSettings: PomodoroSettings;
  ambientSounds: AmbientSound[];
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

const DEFAULT_AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    url: '/sounds/rain.mp3',
    enabled: false,
    volume: 0.3
  },
  {
    id: 'forest',
    name: 'Forest',
    url: '/sounds/forest.mp3',
    enabled: false,
    volume: 0.3
  },
  {
    id: 'cafe',
    name: 'Café',
    url: '/sounds/cafe.mp3',
    enabled: false,
    volume: 0.3
  },
  {
    id: 'waves',
    name: 'Ocean Waves',
    url: '/sounds/waves.mp3',
    enabled: false,
    volume: 0.3
  }
];

export function createNewSession(
  name: string,
  videos: VideoInfo[],
  playlists: PlaylistInfo[]
): StudySession {
  return {
    id: generateSessionId(),
    name,
    createdAt: new Date().toISOString(),
    videos,
    playlists,
    currentVideoIndex: 0,
    focusTime: 0,
    pomodoroSettings: { ...DEFAULT_POMODORO_SETTINGS },
    ambientSounds: [...DEFAULT_AMBIENT_SOUNDS],
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
