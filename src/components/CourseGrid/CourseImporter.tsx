import React, { useState, useEffect } from 'react';
import TranscriptChart from './TranscriptChart';

const CourseImporter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Add keyboard event listener to close the popup when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        type="button"
        className="mx-auto flex min-h-10 items-center gap-2 rounded-lg bg-[#8B0029] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6d0020] dark:bg-[#9f1239] dark:hover:bg-[#881337]"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="transcript-import-dialog"
        aria-haspopup="dialog"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
          />
        </svg>
        <span>KUPID 업로드</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            // Close if clicking on the backdrop
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            id="transcript-import-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcript-import-title"
            className="relative w-full max-w-3xl"
          >
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-gray-500 hover:bg-[#E5D0AC]/60 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              onClick={() => setIsOpen(false)}
              aria-label="KUPID 업로드 창 닫기"
              autoFocus
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
            <TranscriptChart onSuccess={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseImporter;
