import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Timer settings (in minutes)
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = () => {
    setIsActive(false);

    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isWork ? 'Work session complete!' : 'Break complete!', {
        body: isWork ? 'Time for a break!' : 'Ready to work?',
        icon: '/favicon.ico'
      });
    }

    // Switch between work and break
    if (isWork) {
      setSessionsCompleted(prev => prev + 1);
      const nextSessions = sessionsCompleted + 1;

      // Every 4th session gets a long break
      if (nextSessions % 4 === 0) {
        setTimeLeft(longBreakDuration * 60);
      } else {
        setTimeLeft(breakDuration * 60);
      }
      setIsWork(false);
    } else {
      setTimeLeft(workDuration * 60);
      setIsWork(true);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Control functions
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsWork(true);
    setTimeLeft(workDuration * 60);
    setSessionsCompleted(0);
  };

  const skipSession = () => {
    setIsActive(false);
    if (isWork) {
      setSessionsCompleted(prev => prev + 1);
      setTimeLeft(breakDuration * 60);
      setIsWork(false);
    } else {
      setTimeLeft(workDuration * 60);
      setIsWork(true);
    }
  };

  // Update timer when settings change
  const updateSettings = (work, shortBreak, longBreak) => {
    setWorkDuration(work);
    setBreakDuration(shortBreak);
    setLongBreakDuration(longBreak);

    if (!isActive) {
      if (isWork) {
        setTimeLeft(work * 60);
      } else if (sessionsCompleted % 4 === 0) {
        setTimeLeft(longBreak * 60);
      } else {
        setTimeLeft(shortBreak * 60);
      }
    }

    setShowSettings(false);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = () => {
    const total = isWork ? workDuration * 60 :
                  (sessionsCompleted % 4 === 0 ? longBreakDuration * 60 : breakDuration * 60);
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pomodoro Timer</h1>
          <p className="text-gray-600">
            {isWork ? '🍅 Work Time' : '☕ Break Time'}
          </p>
        </div>

        {/* Sessions completed */}
        <div className="flex justify-center gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < sessionsCompleted % 4 ? 'bg-pink-500' : 'bg-gray-300'
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-2">
            {sessionsCompleted} sessions
          </span>
        </div>

        {/* Circular Progress Timer */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - getProgress() / 100)}`}
              className={isWork ? 'text-pink-500' : 'text-blue-500'}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {isWork ? 'Focus' : 'Relax'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className={`px-8 py-3 rounded-full font-semibold text-white transition-all transform hover:scale-105 ${
              isActive
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isActive ? '⏸ Pause' : '▶ Start'}
          </button>
          <button
            onClick={resetTimer}
            className="px-8 py-3 rounded-full font-semibold text-white bg-red-500 hover:bg-red-600 transition-all transform hover:scale-105"
          >
            ↻ Reset
          </button>
        </div>

        {/* Skip button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={skipSession}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Skip session →
          </button>
        </div>

        {/* Settings button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-600 hover:text-gray-800 text-sm font-semibold"
          >
            ⚙ Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-bold text-gray-800 mb-4">Timer Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Break (minutes)
                </label>
                <input
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Long Break (minutes)
                </label>
                <input
                  type="number"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  min="1"
                  max="60"
                />
              </div>
              <button
                onClick={() => updateSettings(workDuration, breakDuration, longBreakDuration)}
                className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
