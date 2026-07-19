import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Coffee, Brain, ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

interface PomodoroTimerProps {
  className?: string;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [isEnabled, setIsEnabled] = useState(() => {
    const stored = localStorage.getItem('tutorme-pomodoro-enabled');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('tutorme-pomodoro-enabled');
      setIsEnabled(stored === null ? true : stored === 'true');
    };
    
    window.addEventListener('pomodoro-settings-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('pomodoro-settings-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      const newMode = mode === 'focus' ? 'break' : 'focus';
      setMode(newMode);
      setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const addTime = () => setTimeLeft((time) => time + 5 * 60);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = mode === 'focus' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  if (!isEnabled) return null;

  return (
    <div 
      className={`bg-pink-100 dark:bg-pink-900/40 p-3 rounded-2xl border-4 border-pink-300 dark:border-pink-700/50 shadow-[4px_4px_0px_0px_rgba(244,114,182,1)] dark:shadow-[4px_4px_0px_0px_rgba(190,24,93,0.8)] group w-48 ${className.includes('fixed') || className.includes('absolute') ? '' : 'relative'} ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging ? 100 : undefined
      }}
    >
      <div 
        className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-200 dark:bg-pink-800 border-2 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 px-3 py-0.5 rounded-t-xl cursor-${isDragging ? 'grabbing' : 'grab'} opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center`}
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal className="w-5 h-5" />
      </div>

      <div className="absolute -top-2 -right-1 w-6 h-3 bg-yellow-400/80 dark:bg-yellow-500/40 transform rotate-[15deg] backdrop-blur-sm shadow-sm pointer-events-none border border-yellow-500"></div>
      
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300 flex items-center gap-1">
          {mode === 'focus' ? <Brain className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
          {mode === 'focus' ? 'Focus Time' : 'Break Time'}
        </span>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800/50 p-0.5 rounded transition-colors relative z-20"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      <div className={`text-center relative ${isCollapsed ? '' : 'mb-3'}`}>
        <h3 className="text-3xl font-extrabold font-['Kalam',cursive] text-pink-950 dark:text-pink-100 tracking-wider cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          {timeDisplay}
        </h3>
        <div className="w-full bg-pink-200 dark:bg-pink-800/50 rounded-full h-1.5 mt-2 border border-pink-300 dark:border-pink-700 overflow-hidden">
          <div 
            className="bg-pink-500 dark:bg-pink-400 h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="flex justify-center gap-2 mt-3 relative z-20">
          <button 
            onClick={toggleTimer}
            className="flex-1 flex justify-center items-center gap-1 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white py-1.5 rounded-lg border-2 border-pink-700 shadow-[0_2px_0px_0px_rgba(190,24,93,1)] active:translate-y-0.5 active:shadow-none transition-all font-bold text-xs"
          >
            {isActive ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          </button>
          
          <button 
            onClick={addTime}
            title="Add 5 Minutes"
            className="w-8 flex justify-center items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-pink-600 dark:text-pink-400 p-1.5 rounded-lg border-2 border-pink-300 dark:border-pink-700 shadow-[0_2px_0px_0px_rgba(244,114,182,1)] dark:shadow-[0_2px_0px_0px_rgba(190,24,93,0.8)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus className="w-3 h-3" />
          </button>
          
          <button 
            onClick={resetTimer}
            title="Reset Timer"
            className="w-8 flex justify-center items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-pink-600 dark:text-pink-400 p-1.5 rounded-lg border-2 border-pink-300 dark:border-pink-700 shadow-[0_2px_0px_0px_rgba(244,114,182,1)] dark:shadow-[0_2px_0px_0px_rgba(190,24,93,0.8)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
