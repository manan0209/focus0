'use client';

import { analytics } from '@/lib/analytics';
import { VideoInfo } from '@/lib/youtube';
import { Maximize, Minimize, Monitor, Pause, Play, Settings, SkipBack, SkipForward, Subtitles, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface VideoPlayerProps {
  videos: VideoInfo[];
  currentIndex: number;
  onVideoEnd: () => void;
  onVideoChange: (index: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onTitleUpdate?: (title: string, videoIndex: number) => void;
  className?: string;
}

export default function VideoPlayer({
  videos,
  currentIndex,
  onVideoEnd,
  onVideoChange,
  onTimeUpdate,
  onTitleUpdate,
  className = ''
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [showControls, setShowControls] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = videos[currentIndex];

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: currentIndex > 0 ? 1 : 0, // Auto-play for subsequent videos in playlist
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      enablejsapi: 1,
      cc_load_policy: 0, // Don't auto-load captions - we'll control this
      hl: 'en', // Interface language (English)
      cc_lang_pref: 'en', // Preferred caption language (English)
      cc_language: 'en', // Force English captions when available
      playsinline: 1, // Play inline on mobile
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    },
  };

  // Quality mapping for user-friendly display
  const qualityMap: Record<string, string> = {
    'auto': 'Auto',
    'hd2160': '2160p',
    'hd1440': '1440p',
    'hd1080': '1080p',
    'hd720': '720p',
    'large': '480p',
    'medium': '360p',
    'small': '240p',
    'tiny': '144p'
  };

  const onReady = useCallback((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    playerRef.current = event.target;
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);
    setIsLoading(false);
    
    // Get available quality levels
    try {
      const qualities = event.target.getAvailableQualityLevels();
      
      if (qualities && qualities.length > 0) {
        // Include all available qualities, not just ones in our map
        const allQualities = ['auto', ...qualities.filter((q: any) => q)]; // eslint-disable-line @typescript-eslint/no-explicit-any
        setAvailableQualities(allQualities);
        
        // Set highest quality by default (first in the list after auto is usually highest)
        const highestQuality = qualities[0]; // YouTube typically returns qualities in descending order
        if (highestQuality && highestQuality !== 'auto') {
          event.target.setPlaybackQuality(highestQuality);
          setCurrentQuality(highestQuality);
        } else {
          setCurrentQuality(event.target.getPlaybackQuality() || 'auto');
        }
      } else {
        // Fallback qualities if API fails
        setAvailableQualities(['auto', 'hd1080', 'hd720', 'large', 'medium']);
        // Try to set 1080p as default
        try {
          event.target.setPlaybackQuality('hd1080');
          setCurrentQuality('hd1080');
        } catch {
          setCurrentQuality('auto');
        }
      }
    } catch {
      // Fallback qualities if API fails
      setAvailableQualities(['auto', 'hd1080', 'hd720', 'large', 'medium']);
    }
    
    // Fetch video title from YouTube API
    if (onTitleUpdate && currentVideo) {
      try {
        const videoData = event.target.getVideoData();
        if (videoData && videoData.title) {
          onTitleUpdate(videoData.title, currentIndex);
        }
      } catch {
        // Silently handle video title fetch errors
      }
    }
  }, [onTitleUpdate, currentVideo, currentIndex]);

  const onPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onEnd = useCallback(() => {
    setIsPlaying(false);
    setIsLoading(true); // Show loading for next video
    onVideoEnd();
  }, [onVideoEnd]);

  const onStateChange = useCallback((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const state = event.data;
    const currentVideo = videos[currentIndex];
    
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    setIsPlaying(state === 1);
    
    // Track video events
    if (currentVideo) {
      if (state === 1) { // Video started playing
        analytics.videoStarted(currentVideo.id, currentVideo.title || 'Unknown');
      } else if (state === 0) { // Video ended
        analytics.videoCompleted(currentVideo.id, currentTime);
      }
    }
    
    // Update current quality when video state changes
    if (playerRef.current && state === 1) { // When playing
      setTimeout(() => {
        if (playerRef.current) {
          const actualQuality = playerRef.current.getPlaybackQuality();
          if (actualQuality && actualQuality !== currentQuality) {
            setCurrentQuality(actualQuality);
          }
        }
      }, 1000);
    }
  }, [currentQuality, videos, currentIndex, currentTime]);

  // Update progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && playerRef.current) {
      interval = setInterval(() => {
        if (playerRef.current) {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time, duration);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration, onTimeUpdate]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!playerRef.current) return;
    
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    setShowQualityMenu(false);
  }, []);

  const changeQuality = useCallback((quality: string) => {
    if (!playerRef.current) return;
    
    try {
      playerRef.current.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      setShowQualityMenu(false);
      setShowSpeedMenu(false);
      
      // Force quality change by reloading video if necessary
      if (quality !== 'auto') {
        const currentTime = playerRef.current.getCurrentTime();
        playerRef.current.loadVideoById({
          videoId: currentVideo.id,
          startSeconds: currentTime,
          suggestedQuality: quality
        });
      }
      
      // Update quality after a delay to confirm it was applied
      setTimeout(() => {
        if (playerRef.current) {
          const actualQuality = playerRef.current.getPlaybackQuality();
          // Only update if it's different and not auto-selected by YouTube
          if (actualQuality) {
            setCurrentQuality(actualQuality);
          }
        }
      }, 2000);
    } catch {
      // Silently handle quality change errors
    }
  }, [currentVideo.id]);

  const toggleCaptions = useCallback(() => {
    if (!playerRef.current) return;
    
    try {
      if (captionsEnabled) {
        // Disable captions
        playerRef.current.setOption('captions', 'track', {});
      } else {
        // Enable captions - try multiple approaches
        
        // Method 1: Try to set English captions directly
        try {
          playerRef.current.setOption('captions', 'track', { 'languageCode': 'en' });
        } catch {
          // Method 2: Get available tracks and find English
          const tracks = playerRef.current.getOption('captions', 'tracklist') || [];
          
          if (tracks.length > 0) {
            // Look for English tracks first
            const englishTrack = tracks.find((track: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const lang = track.languageCode?.toLowerCase() || '';
              const name = track.displayName?.toLowerCase() || '';
              return lang.includes('en') || name.includes('english');
            });
            
            // If no English track found, use the first available
            const trackToUse = englishTrack || tracks[0];
            playerRef.current.setOption('captions', 'track', trackToUse);
          }
        }
      }
    } catch {
      // Silently handle caption errors
    }
    
    setCaptionsEnabled(!captionsEnabled);
    setShowSpeedMenu(false);
    setShowQualityMenu(false);
  }, [captionsEnabled]);

  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || duration === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    playerRef.current.seekTo(newTime);
    setCurrentTime(newTime);
  }, [duration]);

  const handleSeek = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    playerRef.current.seekTo(newTime);
  }, [currentTime, duration]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    setShowControls(true);
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Mouse movement handler
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (showSpeedMenu && !target.closest('[data-speed-menu]') && !target.closest('[data-speed-button]')) {
        setShowSpeedMenu(false);
      }
      
      if (showQualityMenu && !target.closest('[data-quality-menu]') && !target.closest('[data-quality-button]')) {
        setShowQualityMenu(false);
      }
    };

    if (showSpeedMenu || showQualityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedMenu, showQualityMenu]);

  useEffect(() => {
    resetControlsTimeout();
  }, [isPlaying, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const previousVideo = useCallback(() => {
    if (currentIndex > 0) {
      onVideoChange(currentIndex - 1);
    }
  }, [currentIndex, onVideoChange]);

  const nextVideo = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      onVideoChange(currentIndex + 1);
    }
  }, [currentIndex, videos.length, onVideoChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when video player is focused or in fullscreen
      if (!isFullscreen && document.activeElement?.tagName === 'INPUT') return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeek(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeek(10);
          break;
        case 'arrowup':
          e.preventDefault();
          // Volume up (YouTube handles this)
          break;
        case 'arrowdown':
          e.preventDefault();
          // Volume down (YouTube handles this)
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'c':
          e.preventDefault();
          toggleCaptions();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const seekPercentage = parseInt(e.key) * 10;
          if (playerRef.current && duration > 0) {
            const seekTime = (seekPercentage / 100) * duration;
            playerRef.current.seekTo(seekTime);
          }
          break;
        case ',':
          e.preventDefault();
          if (playbackRate > 0.25) {
            const newRate = Math.max(0.25, playbackRate - 0.25);
            changePlaybackRate(newRate);
          }
          break;
        case '.':
          e.preventDefault();
          if (playbackRate < 2) {
            const newRate = Math.min(2, playbackRate + 0.25);
            changePlaybackRate(newRate);
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(prev => !prev);
          break;
        case 'q':
          e.preventDefault();
          setShowQualityMenu(prev => !prev);
          setShowSpeedMenu(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, playbackRate, duration, togglePlay, handleSeek, toggleMute, toggleFullscreen, toggleCaptions, changePlaybackRate]);

  // Reset loading state when video changes
  useEffect(() => {
    setIsLoading(true);
  }, [currentVideo.id]);

  if (!currentVideo) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-400">No video selected</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* YouTube Player */}
      <div className="aspect-video w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading video...</p>
            </div>
          </div>
        )}
        <YouTube
          videoId={currentVideo.id}
          opts={opts}
          onReady={onReady}
          onPlay={onPlay}
          onPause={onPause}
          onEnd={onEnd}
          onStateChange={onStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Custom Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top Bar - Video Info */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium text-sm truncate">
                {currentVideo.title || `Video ${currentIndex + 1}`}
              </h3>
              <p className="text-white/70 text-xs">
                {currentIndex + 1} of {videos.length}
              </p>
            </div>
          </div>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-white/20 backdrop-blur-sm rounded-full p-4 text-white hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
              <span>{formatTime(currentTime)}</span>
              <div 
                className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer hover:h-2 transition-all duration-200"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300 relative"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={previousVideo}
                disabled={currentIndex === 0}
                className="text-white/80 hover:text-white disabled:text-white/40 transition-colors p-2"
                title="Previous video"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={() => handleSeek(-10)}
                className="text-white/80 hover:text-white transition-colors p-2"
                title="Rewind 10 seconds"
              >
                <span className="text-xs font-medium">-10s</span>
              </button>
              
              <button
                onClick={togglePlay}
                className="text-white/80 hover:text-white transition-colors p-2"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={() => handleSeek(10)}
                className="text-white/80 hover:text-white transition-colors p-2"
                title="Forward 10 seconds"
              >
                <span className="text-xs font-medium">+10s</span>
              </button>
              
              <button
                onClick={nextVideo}
                disabled={currentIndex === videos.length - 1}
                className="text-white/80 hover:text-white disabled:text-white/40 transition-colors p-2"
                title="Next video"
              >
                <SkipForward size={20} />
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2 relative">
              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors p-2"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                onClick={toggleCaptions}
                className={`text-white/80 hover:text-white transition-colors p-2 ${captionsEnabled ? 'text-blue-400' : ''}`}
                title="Toggle captions"
              >
                <Subtitles size={20} />
              </button>

              {/* Quality Control */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white/80 hover:text-white transition-colors p-2 flex items-center gap-1"
                  title="Video quality"
                  data-quality-button
                >
                  <Monitor size={16} />
                  <span className="text-xs font-medium">{qualityMap[currentQuality] || currentQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-20 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20" data-quality-menu>
                    {availableQualities.map(quality => (
                      <button
                        key={quality}
                        onClick={() => changeQuality(quality)}
                        className={`w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 transition-colors ${
                          currentQuality === quality ? 'bg-blue-500/20 text-blue-400' : ''
                        }`}
                      >
                        {qualityMap[quality] || quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speed Control */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="text-white/80 hover:text-white transition-colors p-2 flex items-center gap-1"
                  title="Playback speed"
                  data-speed-button
                >
                  <Settings size={16} />
                  <span className="text-xs font-medium">{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-24 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-white/20" data-speed-menu>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`w-full text-left px-3 py-2 text-white text-xs hover:bg-white/10 transition-colors ${
                          playbackRate === rate ? 'bg-blue-500/20 text-blue-400' : ''
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white transition-colors p-2"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              
              <button
                onClick={() => setShowKeyboardHelp(prev => !prev)}
                className="text-white/80 hover:text-white transition-colors p-2"
                title="Keyboard shortcuts (?)"
              >
                <span className="text-sm font-bold">?</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help Overlay */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-300">Playback</h4>
                  <div className="space-y-1 text-gray-400">
                    <div className="flex justify-between">
                      <span>Play/Pause</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">Space</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Play/Pause</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">K</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Mute</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">M</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Fullscreen</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">F</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Captions</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">C</kbd>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-300">Navigation</h4>
                  <div className="space-y-1 text-gray-400">
                    <div className="flex justify-between">
                      <span>Seek -10s</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">←</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Seek +10s</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">→</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Go to %</span>
                      <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">1-9</kbd>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3">
                <h4 className="font-medium text-gray-300 mb-2">Speed Control</h4>
                <div className="space-y-1 text-gray-400">
                  <div className="flex justify-between">
                    <span>Decrease speed</span>
                    <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">,</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Increase speed</span>
                    <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">.</kbd>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-gray-400">
                  <span>Show this help</span>
                  <kbd className="bg-gray-800 px-1 py-0.5 rounded text-xs">?</kbd>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
              Made with ❤️ by <a href="https://github.com/manan0209" className="text-blue-400 hover:text-blue-300">devmnn</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
