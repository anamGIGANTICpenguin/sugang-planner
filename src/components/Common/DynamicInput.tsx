import React, { useState, useRef, useEffect } from 'react';

interface DynamicInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
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
  autoFocus,
  type = 'text',
  min,
  max,
  step
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(14); // Start with default font size
  
  // Adjust font size whenever value changes
  useEffect(() => {
    adjustFontSize();
  }, [value]);
  
  // Focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const adjustFontSize = () => {
    if (!containerRef.current || !inputRef.current) return;
    
    // Reset font size to measure properly
    inputRef.current.style.fontSize = '14px';
    
    // Get the optimal size
    const containerWidth = containerRef.current.clientWidth;
    const valueWidth = getTextWidth(value || placeholder || '', getComputedStyle(inputRef.current).font);
    
    if (valueWidth <= 0 || containerWidth <= 0) return;
    
    // Calculate the ratio
    const ratio = containerWidth / valueWidth;
    let newFontSize = 14;
    
    if (ratio < 0.8) {
      // Text is too long, reduce font size
      newFontSize = Math.max(9, Math.floor(14 * ratio));
    } else if (ratio > 1.5 && valueWidth > 0) {
      // Text is very short, increase font size (but not too much)
      newFontSize = Math.min(16, Math.floor(14 * Math.min(ratio, 1.2)));
    }
    
    setFontSize(newFontSize);
  };
  
  // Helper function to measure text width
  const getTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  };
  
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
        style={{ fontSize: `${fontSize}px` }}
        autoFocus={autoFocus}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
};

export default DynamicInput;