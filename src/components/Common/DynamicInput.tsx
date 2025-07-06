import React, { useRef, useEffect } from 'react';

interface DynamicInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}

const DynamicInput: React.FC<DynamicInputProps> = ({ 
  value, 
  onChange, 
  onKeyDown, 
  onBlur,
  placeholder,
  className,
  style,
  autoFocus,
  type = 'text',
  min,
  max,
  step
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Only focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  return (
    <div ref={containerRef} className="w-full relative">
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        style={{ fontSize: '14px', ...style }}
        autoFocus={autoFocus}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default DynamicInput;