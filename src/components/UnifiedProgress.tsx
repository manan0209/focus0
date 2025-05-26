'use client';

import { PomodoroPhase, usePomodoro } from '@/hooks/usePomodoro';
import { PomodoroSettings } from '@/lib/session';
import { Eye, EyeOff, Pause, Play, RotateCcw, Settings, SkipForward } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UnifiedProgressProps {
  isWindowFocused: boolean;
  focusTime: number; // in seconds
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
  className?: string;
}

export default function UnifiedProgress({ 
  isWindowFocused, 
  focusTime, 
  settings,
  onSettingsChange,
  className = '' 
}: UnifiedProgressProps) {
  const [showSettings, setShowSettings] = useState(false);
  const {
    phase,
    isRunning,
    timeRemaining,
    completedPomodoros,
    currentCycle,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    formatTime
  } = usePomodoro(settings);

  // Reset timer when focus is lost
  useEffect(() => {
    if (!isWindowFocused && isRunning) {
      resetTimer();
    }
  }, [isWindowFocused, isRunning, resetTimer]);

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return {
          label: 'Work Session',
          color: 'text-blue-400',
          strokeColor: '#3b82f6',
          emoji: '💼'
        };
      case 'shortBreak':
        return {
          label: 'Short Break',
          color: 'text-green-400',
          strokeColor: '#10b981',
          emoji: '☕'
        };
      case 'longBreak':
        return {
          label: 'Long Break',
          color: 'text-purple-400',
          strokeColor: '#8b5cf6',
          emoji: '🛌'
        };
      default:
        return {
          label: 'Ready to Start',
          color: 'text-gray-400',
          strokeColor: '#6b7280',
          emoji: '⏱️'
        };
    }
  };

  const phaseInfo = getPhaseInfo(phase);

  // Calculate progress based on current phase
  const getPhaseDuration = () => {
    switch (phase) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  };

  const phaseDuration = getPhaseDuration();
  const progress = phase === 'idle' ? 0 : ((phaseDuration - timeRemaining) / phaseDuration) * 100;
  
  // Circle parameters
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Pomodoro Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Work Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.workDuration}
              onChange={(e) => onSettingsChange({
                ...settings,
                workDuration: parseInt(e.target.value) || 25
              })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Short Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakDuration}
              onChange={(e) => onSettingsChange({
                ...settings,
                shortBreakDuration: parseInt(e.target.value) || 5
              })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Long Break (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.longBreakDuration}
              onChange={(e) => onSettingsChange({
                ...settings,
                longBreakDuration: parseInt(e.target.value) || 15
              })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Long Break Interval</label>
            <input
              type="number"
              min="2"
              max="10"
              value={settings.longBreakInterval}
              onChange={(e) => onSettingsChange({
                ...settings,
                longBreakInterval: parseInt(e.target.value) || 4
              })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header with Focus Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Focus Eye Icon */}
          <div className={`p-2 rounded-full transition-colors ${
            isWindowFocused ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isWindowFocused ? <Eye size={18} /> : <EyeOff size={18} />}
          </div>
          
          <div>
            <h3 className={`text-sm font-medium ${phaseInfo.color}`}>
              {phaseInfo.emoji} {phaseInfo.label}
            </h3>
            <p className="text-xs text-gray-400">
              Cycle {currentCycle} • {completedPomodoros} completed
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Unified Circular Progress */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={phaseInfo.strokeColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              style={{
                filter: isWindowFocused ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                opacity: isWindowFocused ? 1 : 0.6
              }}
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold ${phaseInfo.color}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Focus: {Math.floor(focusTime / 60)}m
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            disabled={!isWindowFocused}
            className={`p-2 rounded-lg transition-colors ${
              isWindowFocused 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            title={isWindowFocused ? (isRunning ? 'Pause' : 'Start') : 'Focus required to start timer'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button
            onClick={resetTimer}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Reset"
          >
            <RotateCcw size={16} />
          </button>
          
          <button
            onClick={skipPhase}
            disabled={!isRunning}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Skip Phase"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {showSettings && <SettingsModal />}
    </div>
  );
}
