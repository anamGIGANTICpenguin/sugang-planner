import React, { useState, useRef, useEffect } from 'react';
import { Course } from '../../types';
import DynamicInput from '../Common/DynamicInput';
import Portal from '../Common/Portal';

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

const creditOptions = [1, 2, 3];

interface CourseCellProps {
  course?: Course;
  onAdd: (course: Omit<Course, 'id'>) => void;
  onUpdate: (courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  onRemove: (courseId: string) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
}

const CourseCell: React.FC<CourseCellProps> = ({ course, onAdd, onUpdate, onRemove, isAnyEditing, onEditStateChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [selectActive, setSelectActive] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  // Get grade color based on grade value
  const getGradeColor = (grade: string): string => {
    if (!grade) return 'text-gray-600';
    
    if (grade === 'A+') return 'text-[#4290f5]';
    if (grade === 'P') return 'text-blue-600';
    if (grade === 'A0') return 'text-green-600';
    if (grade === 'B+') return 'text-yellow-600';
    if (grade === 'B0') return 'text-orange-500';
    if (grade === 'F') return 'text-red-600';
    return 'text-orange-600'; // default for C+, C0, D+, D0, etc.
  };

  // Initialize with course data if available
  useEffect(() => {
    if (course) {
      setCourseName(course.name || '');
      setCredits(course.credits?.toString() || '');
      setGrade(course.grade || '');
      setIsRetake(course.isRetake || false);
    } else {
      // Clear fields for new empty cells
      setCourseName('');
      setCredits('');  // Initialize as empty string
      setGrade('');
      setIsRetake(false);
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
    if (!isEditing && !isAnyEditing) {
      setClickPosition({ x: e.clientX, y: e.clientY });
      setIsEditing(true);
      onEditStateChange(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitForm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      onEditStateChange(false);
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
      
      // Force credits to 0 if it's a retake
      const finalCredits = isRetake ? 0 : parsedCredits;

      if (course) {
        // Update existing course
        const updates: Partial<Omit<Course, 'id'>> = {};
        if (courseName !== course.name) updates.name = courseName;
        if (finalCredits !== course.credits) updates.credits = finalCredits;
        if (formattedGrade !== course.grade) {
          updates.grade = formattedGrade;
          updates.gpaValue = gpaValue;
        }
        if (isRetake !== course.isRetake) updates.isRetake = isRetake;
        
        if (Object.keys(updates).length > 0) {
          onUpdate(course.id, updates);
        }
      } else {
        // Add new course
        onAdd({
          name: courseName,
          credits: finalCredits,
          grade: formattedGrade || undefined,
          gpaValue: gpaValue,
          isRetake: isRetake,
        });
      }
    } else if (course && courseName.trim() === '') {
      // Remove course if name is cleared
      onRemove(course.id);
    }
    
    setIsEditing(false);
    onEditStateChange(false);
  };

  if (isEditing) {
    return (
      <>
        <div 
          className="cell filled p-2 border border-gray-200 bg-gray-100 flex items-center overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          style={{ minHeight: '32px', height: '32px', maxWidth: '100%' }}
        >
          <div className="course-name-fade flex-grow pr-10">
            <span className="font-bold text-xs whitespace-nowrap">{course?.name || ''}</span>
          </div>

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-end flex-shrink-0">
            <span className="text-xs text-gray-500">({course?.credits || 0})</span>
            {course?.grade && (
              <span className={`font-medium text-xs ml-0 w-8 text-center ${getGradeColor(course.grade)}`}>
                {course.grade.length === 1 && ['A', 'B', 'C', 'D'].includes(course.grade) 
                  ? course.grade + '0' 
                  : course.grade}
              </span>
            )}
          </div>
        </div>
        
        <Portal>
          <div 
            ref={cellRef}
            className="cell editing p-2 border border-[#8B0029] bg-gray-100 hover:bg-gray-100 rounded fixed z-[9999] dark:bg-gray-800 dark:border-gray-600 dark:text-[#F8F2DE] dark:hover:bg-gray-800" 
            onBlurCapture={conditionallySubmitForm}
            style={{ 
              minHeight: '140px',
              width: '160px',  // Changed from 200px to 160px (20% reduction)
              position: 'fixed',
              left: `${clickPosition.x - 20}px`,
              top: `${clickPosition.y - 70}px`
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                onEditStateChange(false);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#8B0029] hover:bg-[#6d0020] text-white text-base leading-none font-normal dark:bg-[#9f1239] dark:hover:bg-[#881337]"
              title="Close"
              style={{ paddingBottom: '1px' }} // Fine-tune vertical alignment
            >
              ×
            </button>
            <div className="flex flex-col gap-3">
              <DynamicInput
                type="text"
                value={courseName}
                onChange={(value) => setCourseName(value)}
                onKeyDown={handleKeyDown}
                placeholder="Course name"
                className="w-full p-1 border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-16 p-1 text-xs border-0 bg-transparent focus:ring-0 rounded-none dark:text-white"
                  style={{ WebkitAppearance: 'menulist-button', appearance: 'menulist-button' }}
                  disabled={isRetake}
                >
                  <option value="">학점</option>
                  {creditOptions.map(credit => (
                    <option key={credit} value={credit}>
                      {credit}학점
                    </option>
                  ))}
                </select>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onMouseDown={() => setSelectActive(true)}
                  onMouseUp={() => setTimeout(() => setSelectActive(false), 200)}
                  onBlur={() => setSelectActive(false)}
                  className="flex-1 p-1 text-xs border-0 bg-transparent focus:ring-0 rounded-none dark:text-white"
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
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={isRetake}
                  onChange={(e) => {
                    setIsRetake(e.target.checked);
                    if (e.target.checked) {
                      setCredits('0');
                    }
                  }}
                  className="mr-2 rounded border-gray-300"
                />
                <label className="text-xs">재수강 / 학점지우개</label>
              </div>
              {course && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this course?")) {
                      onRemove(course.id);
                      setIsEditing(false);
                      onEditStateChange(false);
                    }
                  }}
                  className="w-full text-red-500 hover:text-red-700 text-xs py-1 mt-1 text-center border border-red-500 hover:bg-red-50 rounded"
                  title="Delete course"
                >
                  Delete Course
                </button>
              )}
            </div>
          </div>
        </Portal>
      </>
    );
  }

  if (!course) {
    return (
      <div 
        className={`cell empty border-0 hover:border hover:border-[#8B0029] hover:bg-red-50 cursor-pointer text-center flex items-center justify-center group w-full h-full dark:hover:bg-[#202838] dark:hover:border-[#9f1239] ${
          isAnyEditing ? 'pointer-events-none opacity-50' : ''
        }`}
        onClick={() => {
          if (!isAnyEditing) {
            onAdd({
              name: "New Course",
              credits: 3,
              grade: undefined,
              gpaValue: null,
              isRetake: false
            });
          }
        }}
        style={{ minHeight: '32px', height: '100%' }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-lg leading-none text-[#8B0029] opacity-0 group-hover:opacity-100 transition-opacity duration-200 dark:text-[#F8F2DE]">+</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`cell filled p-2 border border-gray-200 bg-gray-100 hover:bg-gray-200 cursor-pointer relative flex items-center dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white ${
        course.isRetake ? 'retake-course' : ''
      }`}
      onClick={handleClick}
      style={{ minHeight: '32px', height: '32px', maxWidth: '100%' }}
    >
      <div className="flex-grow pr-10">
        <span className="font-bold text-xs whitespace-nowrap overflow-hidden overflow-ellipsis block">
          {course.name}
        </span>
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-baseline justify-end flex-shrink-0 bg-inherit gap-0.5">
        {course.credits !== 3 && course.credits !== 0 && (
          <span className="text-[10px] text-gray-500">({course.credits})</span>
        )}
        {course.grade && (
          <span className={`font-medium text-xs text-right ${getGradeColor(course.grade)}`}>
            {course.grade === 'P' || course.grade === 'F'
              ? <>{course.grade}<span className="invisible">0</span></>
              : course.grade.length === 1 && ['A', 'B', 'C', 'D'].includes(course.grade)
                ? course.grade + '0'
                : course.grade}
          </span>
        )}
      </div>
    </div>
  );
};

export default CourseCell;