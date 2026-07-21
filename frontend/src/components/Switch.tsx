import React from 'react';

export type SwitchColor = 'pink' | 'blue' | 'green' | 'purple' | 'yellow' | 'orange';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: SwitchColor | string;
  disabled?: boolean;
  label?: string;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

const colorPresets: Record<string, { active: string; focus: string }> = {
  pink: {
    active: 'bg-pink-500 border-pink-600 dark:bg-pink-600 dark:border-pink-800',
    focus: 'focus:ring-pink-300 dark:focus:ring-pink-900',
  },
  blue: {
    active: 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-800',
    focus: 'focus:ring-blue-300 dark:focus:ring-blue-900',
  },
  green: {
    active: 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-800',
    focus: 'focus:ring-green-300 dark:focus:ring-green-900',
  },
  purple: {
    active: 'bg-purple-500 border-purple-600 dark:bg-purple-600 dark:border-purple-800',
    focus: 'focus:ring-purple-300 dark:focus:ring-purple-900',
  },
  yellow: {
    active: 'bg-yellow-500 border-yellow-600 dark:bg-yellow-500 dark:border-yellow-700',
    focus: 'focus:ring-yellow-300 dark:focus:ring-yellow-900',
  },
  orange: {
    active: 'bg-orange-500 border-orange-600 dark:bg-orange-600 dark:border-orange-800',
    focus: 'focus:ring-orange-300 dark:focus:ring-orange-900',
  },
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  color = 'pink',
  disabled = false,
  label,
  activeColor,
  inactiveColor = 'bg-gray-300 border-gray-400 dark:bg-gray-700 dark:border-gray-600',
  size = 'md',
  className = '',
  id,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onChange(!checked);
    }
  };

  const preset = colorPresets[color] || {
    active: activeColor || 'bg-pink-500 border-pink-600 dark:bg-pink-600 dark:border-pink-800',
    focus: 'focus:ring-pink-300 dark:focus:ring-pink-900',
  };

  const effectiveActiveColor = activeColor || preset.active;
  const focusRingClass = preset.focus;

  const sizeClasses = {
    sm: { track: 'w-11 h-6 border-2', knob: 'w-4 h-4', translate: 'translate-x-5' },
    md: { track: 'w-14 h-8 border-2', knob: 'w-6 h-6', translate: 'translate-x-6' },
    lg: { track: 'w-16 h-9 border-2', knob: 'w-6 h-6', translate: 'translate-x-7' },
  }[size];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-0.5 transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 ${focusRingClass} disabled:cursor-not-allowed disabled:opacity-50 ${
        sizeClasses.track
      } ${checked ? effectiveActiveColor : inactiveColor} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
          sizeClasses.knob
        } ${checked ? sizeClasses.translate : 'translate-x-0'}`}
      />
    </button>
  );
};

export default Switch;
