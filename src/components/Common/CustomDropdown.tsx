import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-1 text-xs text-left bg-transparent hover:bg-white/10 rounded transition-colors ${className}`}
      >
        {selectedOption ? (
          <span style={{ color: selectedOption.color }}>
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#E5D0AC] border border-[#8B0029]/20 rounded shadow-lg custom-dropdown-options dark:bg-gray-800 dark:border-[#9f1239]/20">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2 py-1 text-xs hover:bg-[#8B0029]/10 transition-colors
                ${value === option.value ? 'bg-[#8B0029]/5' : ''}
                dark:hover:bg-[#9f1239]/20 dark:text-white`}
              style={{ color: option.color }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
