import React, { useState, useRef, useEffect } from 'react';
import { Course } from '../../types';
import DynamicInput from '../Common/DynamicInput';
import CustomDropdown from '../Common/CustomDropdown';
import { useGradeScaleStore, getGradeOptions } from '../../store/gradeScaleStore';

// Update the credit options array
const creditOptions = [0.5, 1, 2, 3, 4, 5, 6];

// Create creditOptions array for the dropdown
const creditDropdownOptions = creditOptions.map(credit => ({
  value: credit.toString(),
  label: `${credit}학점`
}));

interface CourseCellProps {
  course?: Course;
  onAdd: (course: Omit<Course, 'id'>) => void;
  onUpdate: (courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  onRemove: (courseId: string) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
}

const CourseCell: React.FC<CourseCellProps> = ({ course, onAdd, onUpdate, onRemove, isAnyEditing, onEditStateChange }) => {
  const { scale } = useGradeScaleStore();
  const gradeOptions = getGradeOptions(scale);
  
  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
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
      setIsEnglish(course.isEnglish || false);
    } else {
      // Clear fields for new empty cells
      setCourseName('');
      setCredits('');  // Initialize as empty string
      setGrade('');
      setIsRetake(false);
      setIsEnglish(false);
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
        if (isEnglish !== course.isEnglish) updates.isEnglish = isEnglish;
        
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
          isEnglish: isEnglish,
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
      <div 
        className={`cell editing p-2 border border-[#8B0029] bg-[#E5D0AC] hover:bg-[#d4bd94] rounded-lg 
          transition-all duration-300 ease-in-out origin-top dark:bg-gray-800 dark:border-[#9f1239] dark:text-[#F8F2DE] dark:hover:bg-gray-700`}
        style={{ 
          minHeight: '160px', // Increased height to accommodate vertical layout
          zIndex: 10,
          position: 'relative'
        }}
      >
        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
          <DynamicInput
            type="text"
            value={courseName}
            onChange={(value) => setCourseName(value)}
            onKeyDown={handleKeyDown}
            placeholder="Course name"
            className="w-full p-1 border-0 focus:border-0 focus:ring-0 from-[#8B0029]/5 to-transparent text-xs rounded-none"
            autoFocus
          />
          <div className="relative">
            <CustomDropdown
              options={creditDropdownOptions}
              value={credits}
              onChange={(value) => setCredits(value)}
              placeholder="학점"
              className="bg-transparent pr-7"
            />
            <svg
              className="w-2 h-2 absolute right-2 top-[62%] -translate-y-1/2 text-[#8B0029] pointer-events-none dark:text-[#F8F2DE]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <div className="relative">
            <CustomDropdown
              options={gradeOptions}
              value={grade}
              onChange={(value) => setGrade(value)}
              placeholder="평점"
              className="bg-transparent pr-7"
            />
            <svg
              className="w-2 h-2 absolute right-2 top-[62%] -translate-y-1/2 text-[#8B0029] pointer-events-none dark:text-[#F8F2DE]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={isRetake}
                onChange={(e) => {
                  e.stopPropagation();
                  setIsRetake(e.target.checked);
                  if (e.target.checked) setCredits('0');
                }}
                className="mr-2 rounded border-gray-300"
              />
              <label className="text-xs select-none">재수강/수강철회</label>
            </div>
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={isEnglish}
                onChange={(e) => {
                  e.stopPropagation();
                  setIsEnglish(e.target.checked);
                }}
                className="mr-2 rounded border-gray-300"
              />
              <label className="text-xs select-none">영강</label>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              submitForm();
            }}
            className="w-full text-[#8B0029] hover:text-[#6d0020] text-xs py-1 text-center border border-[#8B0029] hover:bg-[#8B0029]/10 rounded dark:text-[#F8F2DE] dark:border-[#F8F2DE] dark:hover:bg-[#F8F2DE]/10"
          >
            확인
          </button>
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
              className="w-full text-red-500 hover:text-red-700 text-xs py-1 text-center border border-red-500 hover:bg-red-50 rounded"
              title="Delete course"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div 
        className={`cell empty border-0 hover:border hover:border-[#8B0029] hover:bg-[#E5D0AC] cursor-pointer text-center flex items-center justify-center group w-full h-full dark:hover:bg-[#202838] dark:hover:border-[#9f1239] ${
          isAnyEditing ? 'pointer-events-none opacity-50' : ''
        }`}
        onClick={() => {
          if (!isAnyEditing) {
            onAdd({
              name: "새 수업",
              credits: 3,
              grade: undefined,
              gpaValue: null,
              isRetake: false,
              isEnglish: false
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
      className={`cell filled p-2 border border-gray-200 bg-[#E5D0AC] hover:bg-[#d4bd94] cursor-pointer relative flex items-center dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white ${
        course.isRetake ? 'retake-course' : ''
      }`}
      onClick={handleClick}
      style={{ minHeight: '32px', height: '32px', maxWidth: '100%' }}
    >
      <div className="flex-grow pr-10">
        <span className="font-bold text-xs text-[#333333] whitespace-nowrap overflow-hidden overflow-ellipsis block dark:text-white">
          {course.name}
        </span>
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-baseline justify-end flex-shrink-0 bg-inherit gap-0.5">
        {course.credits !== 3 && course.credits !== 0 && (
          <span className="text-[10px] text-[#333333] dark:text-gray-500">({course.credits})</span>
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