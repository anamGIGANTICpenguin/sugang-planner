import React, { useState, useRef, useEffect } from 'react';
import { Course } from '../../types';
import DynamicInput from '../Common/DynamicInput';

// Helper function to calculate appropriate font size based on text length
const calculateFontSize = (text: string, maxWidth: number): string => {
  const baseSize = 0.75; // 0.75rem = 12px (text-xs)
  const length = text.length;
  
  if (length <= 10) return `${baseSize}rem`; // Default size for short text
  if (length <= 20) return `${baseSize * 0.9}rem`; // Slightly smaller
  if (length <= 30) return `${baseSize * 0.8}rem`; // Even smaller
  return `${baseSize * 0.7}rem`; // Smallest size for very long text
};

// Define grade options with their GPA values
export const gradeOptions = [
  { value: "A+", label: "A+ (4.5)", gpaValue: 4.5 },
  { value: "A0", label: "A0 (4.0)", gpaValue: 4.0 },
  { value: "B+", label: "B+ (3.5)", gpaValue: 3.5 },
  { value: "B0", label: "B0 (3.0)", gpaValue: 3.0 },
  { value: "C+", label: "C+ (2.5)", gpaValue: 2.5 },
  { value: "C0", label: "C0 (2.0)", gpaValue: 2.0 },
  { value: "D+", label: "D+ (1.5)", gpaValue: 1.5 },
  { value: "D0", label: "D0 (1.0)", gpaValue: 1.0 },
  { value: "F", label: "F (0.0)", gpaValue: 0.0 },  // Always counts in GPA
  { value: "P", label: "P (Pass)", gpaValue: null }, // Pass doesn't count in GPA
];

interface CourseCellProps {
  course?: Course;
  onAdd: (course: Omit<Course, 'id'>) => void;
  onUpdate: (courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  onRemove: (courseId: string) => void;
}

const CourseCell: React.FC<CourseCellProps> = ({ course, onAdd, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('');
  const [selectActive, setSelectActive] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  // Initialize with course data if available
  useEffect(() => {
    if (course) {
      setCourseName(course.name || '');
      setCredits(course.credits?.toString() || '');
      setGrade(course.grade || '');
    } else {
      // Clear fields for new empty cells
      setCourseName('');
      setCredits('');
      setGrade('');
    }
  }, [course]);

  useEffect(() => {
    // Position the editing popup when it becomes visible
    if (isEditing && cellRef.current) {
      // Position the editing form near the click position
      if (clickPosition.x > 0 && clickPosition.y > 0) {
        // Position the popup slightly above and to the right of the click point
        cellRef.current.style.left = `${clickPosition.x - 20}px`;
        cellRef.current.style.top = `${clickPosition.y - 70}px`;
        
        // Make sure the popup is fully visible in the viewport
        const rect = cellRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Adjust if it goes off the right edge
        if (rect.right > viewportWidth) {
          cellRef.current.style.left = `${viewportWidth - rect.width - 10}px`;
        }
        
        // Adjust if it goes off the top
        if (rect.top < 10) {
          cellRef.current.style.top = '10px';
        }
      }
      
      const input = cellRef.current.querySelector('input');
      if (input) input.focus();
    }
  }, [isEditing, clickPosition]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      // Record the click position
      setClickPosition({ x: e.clientX, y: e.clientY });
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitForm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // We won't use a standard blur handler
  const conditionallySubmitForm = (e: React.FocusEvent) => {
    // Don't submit if we're interacting with the select dropdown
    if (selectActive) return;
    
    // Check if the focus is moving outside our cell container
    if (!cellRef.current?.contains(e.relatedTarget as Node)) {
      submitForm();
    }
  };

  const handleGradeCode = (gradeText: string) => {
    // Change plain letter grades to include '0'
    const plainLetterGrades = ['A', 'B', 'C', 'D'];
    if (plainLetterGrades.includes(gradeText)) {
      return gradeText + '0';
    }
    return gradeText;
  };

  const submitForm = () => {
    const parsedCredits = parseFloat(credits);
    
    if (courseName.trim() && !isNaN(parsedCredits)) {
      // Format the grade to ensure A0, B0, C0, D0 format
      const formattedGrade = handleGradeCode(grade);
      
      // Get the GPA value for the selected grade
      const selectedGrade = gradeOptions.find(option => option.value === formattedGrade) || 
                           gradeOptions.find(option => option.value === grade);
      const gpaValue = selectedGrade ? selectedGrade.gpaValue : null;
      
      if (course) {
        // Update existing course
        const updates: Partial<Omit<Course, 'id'>> = {};
        if (courseName !== course.name) updates.name = courseName;
        if (parsedCredits !== course.credits) updates.credits = parsedCredits;
        if (formattedGrade !== course.grade) {
          updates.grade = formattedGrade;
          updates.gpaValue = gpaValue;
        }
        
        if (Object.keys(updates).length > 0) {
          onUpdate(course.id, updates);
        }
      } else {
        // Add new course
        onAdd({
          name: courseName,
          credits: parsedCredits,
          grade: formattedGrade || undefined,
          gpaValue: gpaValue,
        });
      }
    } else if (course && courseName.trim() === '') {
      // Remove course if name is cleared
      onRemove(course.id);
    }
    
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <>
        <div 
          className="cell filled p-2 border border-transparent bg-transparent flex items-center overflow-hidden"
          style={{ minHeight: '32px', height: '32px', visibility: 'hidden', maxWidth: '100%' }}
        >
          <div className="course-name-fade flex-grow pr-10">
            <span className="font-bold text-xs whitespace-nowrap">{course?.name || 'Placeholder'}</span>
          </div>

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-end flex-shrink-0">
            <span className="text-xs text-gray-500">({course?.credits || 0})</span>
            <span className="font-medium text-xs w-8 text-center">Grade</span>
          </div>
        </div>
        
        <div 
          ref={cellRef}
          className="cell editing p-2 border border-[#8B0029] bg-white hover:bg-red-50 rounded fixed z-50" 
          onBlurCapture={conditionallySubmitForm}
          style={{ 
            minHeight: '60px',
            minWidth: '180px',
            maxWidth: '250px',
            position: 'fixed'
          }}
        >
          <div className="flex flex-col gap-1">
            <DynamicInput
              type="text"
              value={courseName}
              onChange={(value) => setCourseName(value)}
              onKeyDown={handleKeyDown}
              placeholder="Course name"
              className="w-full p-0 border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <DynamicInput
                type="number"
                value={credits}
                onChange={(value) => setCredits(value)}
                onKeyDown={handleKeyDown}
                placeholder="Cr."
                className="w-1/3 p-0 border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
                step="1"
                min="0"
              />
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={() => setSelectActive(true)}
                onMouseUp={() => setTimeout(() => setSelectActive(false), 200)}
                onBlur={() => setSelectActive(false)}
                className="w-2/3 p-0 text-xs border-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent focus:ring-0 rounded-none"
                style={{ WebkitAppearance: 'menulist-button', appearance: 'menulist-button' }}
              >
                <option value="">Grade</option>
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} {option.gpaValue !== null ? `(${option.gpaValue})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <div 
        className="cell empty border-0 hover:border hover:border-[#8B0029] hover:bg-red-50 cursor-pointer text-center flex items-center justify-center group w-full"
        onClick={handleClick}
        style={{ height: '16px' }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-lg leading-none text-[#8B0029] opacity-0 group-hover:opacity-100 transition-opacity duration-200">+</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="cell filled p-2 border border-gray-200 hover:bg-gray-100 cursor-pointer relative flex items-center overflow-hidden"
      onClick={handleClick}
      style={{ minHeight: '32px', height: '32px', maxWidth: '100%' }}
    >
      <div className="course-name-fade flex-grow pr-10">
        <span className="font-bold text-xs whitespace-nowrap" style={{ fontSize: calculateFontSize(course.name, 70) }}>
          {course.name}
        </span>
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-end flex-shrink-0">
        <span className="text-xs text-gray-500">({course.credits})</span>
        {course.grade && (
          <span className={`font-medium text-xs ml-0 w-8 text-center ${
            course.grade === 'F' ? 'text-red-600' : 
            course.grade === 'P' ? 'text-gray-600' :
            course.grade.includes('0') ? 'text-blue-600' :
            course.grade.includes('+') ? 'text-green-600' : 'text-blue-600'
          }`}>
            {/* Apply A0, B0, C0, D0 format to displayed grade */}
            {course.grade.length === 1 && ['A', 'B', 'C', 'D'].includes(course.grade) 
              ? course.grade + '0' 
              : course.grade}
          </span>
        )}
      </div>
    </div>
  );
};

export default CourseCell;