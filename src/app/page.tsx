'use client';

import SessionView from '@/components/SessionView';
import VideoUrlInput from '@/components/VideoUrlInput';
import { StudySession, createNewSession, deleteSession, getSavedSessions } from '@/lib/session';
import { PlaylistInfo, VideoInfo } from '@/lib/youtube';
import { BookOpen, Clock, Github, Play, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [savedSessions, setSavedSessions] = useState<StudySession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionVideos, setSessionVideos] = useState<VideoInfo[]>([]);
  const [sessionPlaylists, setSessionPlaylists] = useState<PlaylistInfo[]>([]);

  useEffect(() => {
    setSavedSessions(getSavedSessions());
  }, []);

  const handleVideosAdded = (videos: VideoInfo[], playlists: PlaylistInfo[]) => {
    setSessionVideos(prev => [...prev, ...videos]);
    setSessionPlaylists(prev => [...prev, ...playlists]);
  };

  const createSession = () => {
    if (!sessionName.trim() || (sessionVideos.length === 0 && sessionPlaylists.length === 0)) {
      return;
    }

    const session = createNewSession(sessionName.trim(), sessionVideos, sessionPlaylists);
    setCurrentSession(session);
  };

  const loadSession = (session: StudySession) => {
    setCurrentSession(session);
  };

  const handleSessionUpdate = (updatedSession: StudySession) => {
    setCurrentSession(updatedSession);
    setSavedSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const exitSession = () => {
    setCurrentSession(null);
  };

  const resetForm = () => {
    setSessionName('');
    setSessionVideos([]);
    setSessionPlaylists([]);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (currentSession) {
    return (
      <SessionView
        session={currentSession}
        onUpdateSession={handleSessionUpdate}
        onExit={exitSession}
      />
    );
  }

  const totalVideos = sessionVideos.length + sessionPlaylists.reduce((acc, p) => acc + p.videos.length, 0);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Focus0</h1>
                <p className="text-sm text-gray-400">YouTube Study Tool</p>
              </div>
            </div>
            
            <a
              href="https://github.com/manan0209"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Create Session */}
          <div className="space-y-6">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen size={24} />
                Create New Session
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g., React Tutorial Marathon"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Session Preview */}
                {(sessionVideos.length > 0 || sessionPlaylists.length > 0) && (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Session Preview</h3>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Videos:</span>
                        <span>{totalVideos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Playlists:</span>
                        <span>{sessionPlaylists.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={createSession}
                    disabled={!sessionName.trim() || totalVideos === 0}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    Start Session
                  </button>
                  
                  {(sessionVideos.length > 0 || sessionPlaylists.length > 0 || sessionName) && (
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <VideoUrlInput onVideosAdded={handleVideosAdded} />
          </div>

          {/* Right Column - Saved Sessions */}
          <div className="space-y-6">
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={24} />
                Saved Sessions
              </h2>

              {savedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-gray-400">No saved sessions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Create your first focused study session above
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedSessions.map((session) => {
                    const totalVideos = session.videos.length + session.playlists.reduce((acc, p) => acc + p.videos.length, 0);
                    
                    return (
                      <div
                        key={session.id}
                        className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-white truncate">{session.name}</h3>
                            <p className="text-xs text-gray-400">
                              Created {new Date(session.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-3">
                          <div className="flex justify-between">
                            <span>Videos:</span>
                            <span>{totalVideos}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Focus Time:</span>
                            <span>{formatTime(session.focusTime)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => loadSession(session)}
                          className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                        >
                          <Play size={16} />
                          Resume Session
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Features Overview */}
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">✨ Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Distraction-free YouTube player
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Focus tracking with window detection
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  Built-in Pomodoro timer
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  Session sharing & persistence
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  Support for videos & playlists
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer Attribution */}
        <footer className="mt-12 pt-8 border-t border-gray-800">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Made with ❤️ by{' '}
              <a 
                href="https://github.com/manan0209" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                devmnn
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
