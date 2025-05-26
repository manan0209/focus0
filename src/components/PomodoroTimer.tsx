'use client';

import { PomodoroPhase, usePomodoro } from '@/hooks/usePomodoro';
import { PomodoroSettings } from '@/lib/session';
import { Pause, Play, RotateCcw, Settings, SkipForward, Timer } from 'lucide-react';
import { useState } from 'react';

interface PomodoroTimerProps {
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
  className?: string;
}

export default function PomodoroTimer({ 
  settings, 
  onSettingsChange, 
  className = '' 
}: PomodoroTimerProps) {
  const [showSettings, setShowSettings] = useState(false);
  const {
    phase,
    isRunning,
    completedPomodoros,
    currentCycle,
    startTimer,
    pauseTimer,
    resetTimer,
    skipPhase,
    formatTime
  } = usePomodoro(settings);

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return {
          label: 'Work Session',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          emoji: '💼'
        };
      case 'shortBreak':
        return {
          label: 'Short Break',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          emoji: '☕'
        };
      case 'longBreak':
        return {
          label: 'Long Break',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          emoji: '🛌'
        };
      default:
        return {
          label: 'Ready to Start',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          emoji: '⏱️'
        };
    }
  };

  const phaseInfo = getPhaseInfo(phase);

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
            <p className="text-xs text-gray-400 mt-1">
              Take a long break after every N work sessions
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="text-blue-400" size={20} />
            <span className="font-medium text-gray-200">Pomodoro Timer</span>
          </div>
          
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-gray-200 p-1 rounded transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Current Phase */}
        <div className={`p-4 rounded-lg border ${phaseInfo.bgColor} ${phaseInfo.borderColor} mb-4`}>
          <div className="text-center">
            <div className="text-2xl mb-1">{phaseInfo.emoji}</div>
            <h3 className={`font-semibold ${phaseInfo.color} mb-1`}>
              {phaseInfo.label}
            </h3>
            <div className="text-3xl font-mono font-bold text-white mb-2">
              {formatTime()}
            </div>
            {phase !== 'idle' && (
              <div className={`text-sm ${phaseInfo.color}`}>
                Cycle {currentCycle} • {completedPomodoros} completed
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={resetTimer}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRunning ? (
              <div className="flex items-center gap-2">
                <Pause size={18} />
                Pause
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play size={18} />
                Start
              </div>
            )}
          </button>
          
          <button
            onClick={skipPhase}
            disabled={phase === 'idle'}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Skip Phase"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Session Progress</span>
            <span>{completedPomodoros} / {settings.longBreakInterval}</span>
          </div>
          
          <div className="flex gap-1">
            {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded ${
                  i < completedPomodoros % settings.longBreakInterval
                    ? 'bg-blue-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{completedPomodoros}</div>
              <div className="text-xs text-gray-400">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{currentCycle}</div>
              <div className="text-xs text-gray-400">Current Cycle</div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal />}
    </>
  );
}
