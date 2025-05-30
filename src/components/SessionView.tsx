'use client';

import { useWindowFocus } from '@/hooks/useWindowFocus';
import { PomodoroSettings, saveSession, StudySession } from '@/lib/session';
import { Check, Copy, ExternalLink, GripVertical, Share2, SkipBack, SkipForward, Target, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // Default 24rem = 384px
  const [isResizing, setIsResizing] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const { isWindowFocused } = useWindowFocus();

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 1024);
    };

    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Combine videos from individual videos and playlists (memoized to prevent unnecessary re-renders)
  const allVideos = useMemo(() => [
    ...currentSession.videos,
    ...currentSession.playlists.flatMap(p => p.videos)
  ], [currentSession.videos, currentSession.playlists]);

  const updateSession = useCallback((updates: Partial<StudySession>) => {
    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);
    onUpdateSession(updatedSession);
    saveSession(updatedSession);
  }, [currentSession, onUpdateSession]);

  // Update focus time periodically - only when window is focused AND video is playing
  useEffect(() => {
    if (!isWindowFocused || !isVideoPlaying) return;

    const interval = setInterval(() => {
      updateSession({
        focusTime: currentSession.focusTime + 1,
        totalStudyTime: currentSession.totalStudyTime + 1
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWindowFocused, isVideoPlaying, currentSession.focusTime, currentSession.totalStudyTime, updateSession]);

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

  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

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
      
      const containerWidth = window.innerWidth;
      const newWidth = containerWidth - e.clientX;
      const minWidth = 280; // Minimum sidebar width
      const maxWidth = Math.min(600, containerWidth * 0.4); // Max 40% of screen width
      
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

  const shareSession = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Use source URL API for ultra-efficient sharing if available
      if (currentSession.sourceUrls && currentSession.sourceUrls.length > 0) {
        const response = await fetch('/api/sessions/source-urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentSession.name,
            sourceUrls: currentSession.sourceUrls,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create shareable session: ${response.status}`);
        }

        const result = await response.json();
        const { shareUrl } = result;
        setShareLink(shareUrl);
        
        // Auto-copy to clipboard immediately
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        
        // No warnings needed for source URL approach
        setSessionWarning(null);
        setShowShareModal(true);
        
        // Reset copy success after 3 seconds but keep modal open
        setTimeout(() => {
          setCopySuccess(false);
        }, 3000);
      } else {
        // Fallback to metadata API for sessions without source URLs
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: currentSession.name,
            videos: currentSession.videos,
            playlists: currentSession.playlists,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create shareable session: ${response.status}`);
        }

        const result = await response.json();
        
        const { shareUrl, warning } = result;
        setShareLink(shareUrl);
        
        // Keep track of any warnings from the server
        const hasWarning = Boolean(warning);
        
        // Auto-copy to clipboard immediately
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccess(true);
        
        // Store warning in state for display
        setSessionWarning(hasWarning ? warning : null);
        setShowShareModal(true);
        
        // Reset copy success after 3 seconds but keep modal open
        setTimeout(() => {
          setCopySuccess(false);
        }, 3000);
      }
      
    } catch (error) {
      alert(`Failed to share session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Silent fail for clipboard operations
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
      {/* Sleek Header */}
      <header className="bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo & Session Info */}
            <div className="flex items-center gap-4">
              {/* Focus0 Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Focus0</h1>
                  <p className="text-xs text-gray-400">Study Session</p>
                </div>
              </div>
              
              <div className="h-8 w-px bg-gray-600" />
              
              {/* Session Name & Status */}
              <div>
                <h2 className="text-lg font-semibold text-white">{currentSession.name}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isWindowFocused && isVideoPlaying ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    {isWindowFocused && isVideoPlaying ? 'Focused' : 'Unfocused'}
                  </span>
                  <span>Video {currentSession.currentVideoIndex + 1} of {allVideos.length}</span>
                  <span>{formatTime(currentSession.focusTime)} focused</span>
                </div>
              </div>
            </div>

            {/* Center Section - Progress Dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const progressPercent = ((currentSession.currentVideoIndex + 1) / allVideos.length) * 100;
                const dotThreshold = (i + 1) * 10;
                
                let dotColor = 'bg-gray-700'; // Not reached
                if (progressPercent >= dotThreshold) {
                  dotColor = 'bg-green-400'; // Complete
                } else if (progressPercent > (dotThreshold - 10)) {
                  dotColor = 'bg-yellow-400'; // In progress
                }
                
                return (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-colors ${dotColor}`}
                    title={`${dotThreshold}% Progress`}
                  />
                );
              })}
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Video Controls */}
              <div className="hidden md:flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => handleVideoChange(Math.max(0, currentSession.currentVideoIndex - 1))}
                  disabled={currentSession.currentVideoIndex === 0}
                  className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous Video"
                >
                  <SkipBack size={14} />
                </button>
                
                <button
                  onClick={() => handleVideoChange(Math.min(allVideos.length - 1, currentSession.currentVideoIndex + 1))}
                  disabled={currentSession.currentVideoIndex === allVideos.length - 1}
                  className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next Video"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={shareSession}
                disabled={isSharing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white rounded-lg transition-colors font-medium"
                title="Share Session"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">{isSharing ? 'Sharing...' : 'Share'}</span>
              </button>

              {/* Exit Button */}
              <button
                onClick={onExit}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                title="Exit Session"
              >
                <X size={16} />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - Resizable */}
      <div className="flex h-[calc(100vh-88px)] relative">
        {/* Main Video Area */}
        <div 
          className={`flex-1 p-3 lg:p-4 xl:p-6 min-h-0 ${isLargeScreen ? 'pr-0' : ''}`}
          style={isLargeScreen ? { 
            width: `calc(100% - ${sidebarWidth}px)` 
          } : undefined}
        >
          <VideoPlayer
            videos={allVideos}
            currentIndex={currentSession.currentVideoIndex}
            onVideoEnd={handleVideoEnd}
            onVideoChange={handleVideoChange}
            onTitleUpdate={handleVideoTitleUpdate}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            className="w-full h-full min-h-[300px] lg:min-h-[400px]"
          />
        </div>

        {/* Desktop Sidebar with Resize Handle */}
        {isLargeScreen && (
          <>
            {/* Resize Handle */}
            <div
              ref={resizeRef}
              onMouseDown={startResize}
              className={`w-1 bg-gray-600 hover:bg-gray-500 cursor-col-resize transition-colors ${
                isResizing ? 'bg-blue-500' : ''
              } flex items-center justify-center group relative z-10`}
              style={{ minHeight: '100%' }}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} className="text-gray-400" />
              </div>
            </div>

            {/* Sidebar */}
            <div 
              className="bg-gray-900/50 backdrop-blur-sm border-l border-gray-700 overflow-y-auto flex-shrink-0"
              style={{ 
                width: `${sidebarWidth}px`,
                minWidth: '280px',
                maxWidth: '600px'
              }}
            >
              <div className="p-4 space-y-4">
                {/* Unified Progress (Focus + Timer) */}
                <UnifiedProgress
                  isWindowFocused={isWindowFocused && isVideoPlaying}
                  focusTime={currentSession.focusTime}
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
                      <span className="text-white">{formatTime(currentSession.focusTime)}</span>
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
        {!isLargeScreen && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4 max-h-[50vh] overflow-y-auto">
            <div className="flex gap-4 overflow-x-auto">
              {/* Unified Progress (Focus + Timer) */}
              <div className="flex-shrink-0 w-80">
                <UnifiedProgress
                  isWindowFocused={isWindowFocused && isVideoPlaying}
                  focusTime={currentSession.focusTime}
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

      {/* Enhanced Share Modal */}
      {showShareModal && shareLink && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShareModal(false);
            }
          }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Share2 className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Session Shared!</h3>
                  <p className="text-sm text-gray-400">Your session is ready to share</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Success Message */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Check className="text-green-400" size={20} />
                  <div>
                    <p className="text-green-400 font-medium">Link copied to clipboard!</p>
                    <p className="text-green-300/80 text-sm">Share this link with others to let them access your video collection</p>
                  </div>
                </div>
              </div>

              {/* Warning Message (if applicable) */}
              {sessionWarning && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-yellow-400">⚠️</div>
                    <div>
                      <p className="text-yellow-400 font-medium">Sharing Notice</p>
                      <p className="text-yellow-300/80 text-sm">{sessionWarning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">{currentSession.name}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{currentSession.videos.length} videos</span>
                  <span>{currentSession.playlists.length} playlists</span>
                  <span>{allVideos.length} total videos</span>
                </div>
              </div>

              {/* Share Link */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Share Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono break-all">
                    {shareLink}
                  </div>
                  <button
                    onClick={copyShareLink}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      copySuccess 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                    }`}
                  >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => window.open(shareLink, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Preview Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>Note:</strong> Others can view your video collection, but their progress will be tracked separately. Sessions expire after 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
