'use client';

import { useWindowFocus } from '@/hooks/useWindowFocus';
import { PomodoroSettings, saveSession, StudySession } from '@/lib/session';
import { Clock, Home, Share2, Target, GripVertical } from 'lucide-react';
import { useCallback, useEffect, useState, useRef } from 'react';
import UnifiedProgress from './UnifiedProgress';
import VideoPlayer from './VideoPlayer';

interface SessionViewProps {
  session: StudySession;
  onUpdateSession: (session: StudySession) => void;
  onExit: () => void;
}

export default function SessionView({ session, onUpdateSession, onExit }: SessionViewProps) {
  const [currentSession, setCurrentSession] = useState(session);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 24rem = 384px
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const { isWindowFocused, totalFocusTime } = useWindowFocus();

  // Combine videos from individual videos and playlists
  const allVideos = [
    ...currentSession.videos,
    ...currentSession.playlists.flatMap(p => p.videos)
  ];

  const updateSession = useCallback((updates: Partial<StudySession>) => {
    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);
    onUpdateSession(updatedSession);
    saveSession(updatedSession);
  }, [currentSession, onUpdateSession]);

  // Update focus time periodically
  useEffect(() => {
    if (!isWindowFocused) return;

    const interval = setInterval(() => {
      updateSession({
        focusTime: currentSession.focusTime + 1,
        totalStudyTime: currentSession.totalStudyTime + 1
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWindowFocused, currentSession.focusTime, currentSession.totalStudyTime, updateSession]);

  const handleVideoEnd = useCallback(() => {
    if (currentSession.currentVideoIndex < allVideos.length - 1) {
      updateSession({
        currentVideoIndex: currentSession.currentVideoIndex + 1
      });
    }
  }, [currentSession.currentVideoIndex, allVideos.length, updateSession]);

  const handleVideoChange = useCallback((index: number) => {
    updateSession({ currentVideoIndex: index });
  }, [updateSession]);

  const handlePomodoroSettingsChange = useCallback((pomodoroSettings: PomodoroSettings) => {
    updateSession({ pomodoroSettings });
  }, [updateSession]);

  // Resizable sidebar functionality
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 280; // Minimum sidebar width
      const maxWidth = Math.min(600, window.innerWidth * 0.4); // Max 40% of screen width
      
      setSidebarWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Update video titles when player is ready
  const handleVideoTitleUpdate = useCallback((title: string, videoIndex: number) => {
    const updatedVideos = [...allVideos];
    if (updatedVideos[videoIndex]) {
      updatedVideos[videoIndex] = { ...updatedVideos[videoIndex], title };
      
      // Update session with new title
      const videoIsFromMainList = videoIndex < currentSession.videos.length;
      if (videoIsFromMainList) {
        const updatedSessionVideos = [...currentSession.videos];
        updatedSessionVideos[videoIndex] = updatedVideos[videoIndex];
        updateSession({ videos: updatedSessionVideos });
      } else {
        // Video is from a playlist
        const playlistVideoIndex = videoIndex - currentSession.videos.length;
        let currentPlaylistIndex = 0;
        let currentVideoCount = 0;
        
        for (const playlist of currentSession.playlists) {
          if (currentVideoCount + playlist.videos.length > playlistVideoIndex) {
            const videoIndexInPlaylist = playlistVideoIndex - currentVideoCount;
            const updatedPlaylists = [...currentSession.playlists];
            updatedPlaylists[currentPlaylistIndex].videos[videoIndexInPlaylist] = updatedVideos[videoIndex];
            updateSession({ playlists: updatedPlaylists });
            break;
          }
          currentVideoCount += playlist.videos.length;
          currentPlaylistIndex++;
        }
      }
    }
  }, [allVideos, currentSession, updateSession]);

  const shareSession = () => {
    const shareUrl = `${window.location.origin}/session/${currentSession.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Focus0 Study Session: ${currentSession.name}`,
        text: 'Join my focused study session!',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setShowShareModal(true);
      setTimeout(() => setShowShareModal(false), 3000);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (allVideos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Videos Found</h2>
          <p className="text-gray-400 mb-6">This session doesn&apos;t have any videos to play.</p>
          <button
            onClick={onExit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onExit}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Home size={20} />
              <span className="hidden sm:inline">Exit Session</span>
            </button>
            
            <div className="h-6 w-px bg-gray-600" />
            
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-semibold text-white truncate">{currentSession.name}</h1>
              <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTime(currentSession.totalStudyTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Target size={12} />
                  {allVideos.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-gray-500">
              Made with ❤️ by{' '}
              <a 
                href="https://github.com/manan0209" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                devmnn
              </a>
            </span>
            <button
              onClick={shareSession}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout - Resizable */}
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Main Video Area */}
        <div 
          className="flex-1 p-3 lg:p-4 xl:p-6 min-h-0"
          style={{ 
            width: window.innerWidth > 1024 ? `calc(100% - ${sidebarWidth}px)` : '100%'
          }}
        >
          <VideoPlayer
            videos={allVideos}
            currentIndex={currentSession.currentVideoIndex}
            onVideoEnd={handleVideoEnd}
            onVideoChange={handleVideoChange}
            onTitleUpdate={handleVideoTitleUpdate}
            className="w-full h-full min-h-[300px] lg:min-h-[400px]"
          />
        </div>

        {/* Desktop Sidebar with Resize Handle */}
        {typeof window !== 'undefined' && window.innerWidth > 1024 && (
          <>
            {/* Resize Handle */}
            <div
              ref={resizeRef}
              onMouseDown={startResize}
              className={`w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors ${
                isResizing ? 'bg-blue-500' : ''
              } flex items-center justify-center group`}
              style={{ minHeight: '100%' }}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Sidebar */}
            <div 
              className="bg-gray-900/50 backdrop-blur-sm border-l border-gray-700 overflow-y-auto"
              style={{ 
                width: `${sidebarWidth}px`,
                minWidth: '280px',
                maxWidth: '600px'
              }}
            >
              <div className="p-4 space-y-4">
                {/* Unified Progress (Focus + Timer) */}
                <UnifiedProgress
                  isWindowFocused={isWindowFocused}
                  focusTime={Math.floor(totalFocusTime / 1000)}
                  settings={currentSession.pomodoroSettings}
                  onSettingsChange={handlePomodoroSettingsChange}
                />

                {/* Video Queue */}
                <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Video Queue ({allVideos.length})
                  </h3>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allVideos.map((video, index) => (
                      <button
                        key={`${video.id}-${index}`}
                        onClick={() => handleVideoChange(index)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          index === currentSession.currentVideoIndex
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                            #{index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {video.title || 'Loading title...'}
                            </div>
                            {video.duration && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Stats */}
                <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium text-gray-200 mb-3">Session Stats</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Focus Time:</span>
                      <span className="text-white">{formatTime(Math.floor(totalFocusTime / 1000))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Time:</span>
                      <span className="text-white">{formatTime(currentSession.totalStudyTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Videos Watched:</span>
                      <span className="text-white">{currentSession.currentVideoIndex + 1} / {allVideos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pomodoros:</span>
                      <span className="text-white">{currentSession.completedPomodoros}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar (Bottom Sheet Style) */}
        {typeof window !== 'undefined' && window.innerWidth <= 1024 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 max-h-[50vh] overflow-y-auto">
            <div className="flex gap-4 overflow-x-auto">
              {/* Unified Progress (Focus + Timer) */}
              <div className="flex-shrink-0 w-80">
                <UnifiedProgress
                  isWindowFocused={isWindowFocused}
                  focusTime={Math.floor(totalFocusTime / 1000)}
                  settings={currentSession.pomodoroSettings}
                  onSettingsChange={handlePomodoroSettingsChange}
                />
              </div>

              {/* Video Queue */}
              <div className="flex-shrink-0 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-200 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Queue ({allVideos.length})
                </h3>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allVideos.map((video, index) => (
                    <button
                      key={`${video.id}-${index}`}
                      onClick={() => handleVideoChange(index)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        index === currentSession.currentVideoIndex
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs">#{index + 1}</span>
                        <span className="truncate text-xs">
                          {video.title || 'Loading...'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
          <p className="text-sm">Session link copied to clipboard! 📋</p>
        </div>
      )}
    </div>
  );
}
