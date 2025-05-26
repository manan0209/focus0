'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Timer, TrendingUp } from 'lucide-react';

interface FocusBarProps {
  isWindowFocused: boolean;
  focusTime: number; // in seconds
  sessionGoal?: number; // in seconds
  className?: string;
}

export default function FocusBar({ 
  isWindowFocused, 
  focusTime, 
  sessionGoal = 25 * 60, // 25 minutes default
  className = '' 
}: FocusBarProps) {
  const [displayTime, setDisplayTime] = useState(focusTime);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setDisplayTime(focusTime);
  }, [focusTime]);

  // Calculate progress percentage
  const progressPercentage = Math.min((focusTime / sessionGoal) * 100, 100);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate current streak (minutes of continuous focus)
  useEffect(() => {
    if (isWindowFocused) {
      const currentStreak = Math.floor(focusTime / 60);
      setStreak(currentStreak);
    }
  }, [isWindowFocused, focusTime]);

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isWindowFocused ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isWindowFocused ? <Eye size={16} /> : <EyeOff size={16} />}
          </div>
          <span className="text-sm font-medium text-gray-200">
            Focus Status
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Timer size={12} />
            <span>{formatTime(displayTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{streak}m streak</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}% of goal</span>
        </div>
        
        <div className="relative">
          {/* Background Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            {/* Focus Progress */}
            <div 
              className={`h-full transition-all duration-500 ease-out focus-bar-bg ${
                isWindowFocused ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Pulse Effect when Focused */}
          {isWindowFocused && (
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400/30 to-green-400/30 rounded-full animate-pulse"
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>

        {/* Goal Marker */}
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">0m</span>
          <span className="text-gray-500">{Math.floor(sessionGoal / 60)}m goal</span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-3 p-2 rounded bg-gray-800/50">
        <p className={`text-xs text-center ${
          isWindowFocused ? 'text-green-400' : 'text-red-400'
        }`}>
          {isWindowFocused 
            ? '🎯 Stay focused! Your progress is being tracked.' 
            : '⚠️ Focus lost - switch back to continue tracking.'
          }
        </p>
      </div>

      {/* Achievements */}
      {streak >= 10 && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-center">
          <p className="text-xs text-yellow-400">
            🔥 {streak} minute focus streak! Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}
