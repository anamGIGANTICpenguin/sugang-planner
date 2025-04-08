// src/components/CategoryRow/CategoryRow.tsx
import React, { useState, useRef, DragEvent } from 'react';
import CourseCell from '../CourseGrid/CourseCell';
import { Category, Course, Semester } from '../../types';
import DynamicInput from '../Common/DynamicInput';

interface CategoryRowProps {
  category: Category;
  semesters: Semester[];
  updateCategory: (id: string, name: string, requiredCredits: number, isMajor: boolean, majorType?: 'primary' | 'secondary') => void;
  removeCategory: (id: string) => void;
  addCourse: (categoryId: string, semesterId: string, course: Omit<Course, 'id'>) => void;
  updateCourse: (categoryId: string, semesterId: string, courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  removeCourse: (categoryId: string, semesterId: string, courseId: string) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onCourseDragStart: () => void;
  onCourseDragEnd: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  semesters,
  updateCategory,
  removeCategory,
  addCourse,
  updateCourse,
  removeCourse,
  isAnyEditing,
  onEditStateChange,
  onDragStart,
  onDragEnd,
  isDragging,
  onCourseDragStart,
  onCourseDragEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [categoryName, setCategoryName] = useState(category.name);
  const [requiredCredits, setRequiredCredits] = useState(category.requiredCredits.toString());
  const [isMajor, setIsMajor] = useState(category.isMajor);
  const [majorType, setMajorType] = useState<'primary' | 'secondary' | undefined>(category.majorType);
  const categoryRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      resetForm();
      setIsEditing(false);
    }
    // Remove Enter key submission
  };

  const handleBlur = () => {
    // No longer submitting on blur
    return;
  };

  const resetForm = () => {
    setCategoryName(category.name);
    setRequiredCredits(category.requiredCredits.toString());
    setIsMajor(category.isMajor);
    setMajorType(category.majorType);
  };

  const submitForm = () => {
    const trimmedName = categoryName.trim();
    const credits = parseFloat(requiredCredits);
    
    if (trimmedName && !isNaN(credits)) {
      updateCategory(category.id, trimmedName, credits, isMajor, majorType);
    } else {
      resetForm();
    }
    
    setIsEditing(false);
  };

  // Calculate total credits for this category
  const totalCredits = semesters.reduce((sum, semester) => {
    const semesterCourses = category.courses[semester.id] || [];
    return sum + semesterCourses.reduce((total, course) => {
      // Don't count F grades towards completed credits
      return total + (course.grade === 'F' ? 0 : course.credits);
    }, 0);
  }, 0);

  const handleCourseDrop = (course: Course, targetSemesterId: string, sourceSemesterId: string) => {
    onCourseDragEnd(); // Add this
    // First remove from source semester
    removeCourse(category.id, sourceSemesterId, course.id);
    
    // Then add to target semester
    addCourse(category.id, targetSemesterId, {
      name: course.name,
      credits: course.credits,
      grade: course.grade,
      gpaValue: course.gpaValue,
      isRetake: course.isRetake,
      isEnglish: course.isEnglish,
    });
  };

  return (
    <div className={`category-row transition-all duration-200 ${
      isDragging ? 'opacity-50' : ''
    }`}>
      <div className="grid grid-cols-[120px_1fr] gap-1">
        {/* Make only the category cell draggable */}
        <div 
          className={`p-2 bg-[#E5D0AC] border-r-2 font-medium ${
            isEditing ? 'border-[#8B0029]' : 'border-[#8B0029] hover:bg-[#d4bd94] cursor-move'
          } dark:bg-gray-800 dark:text-white dark:border-[#9f1239] dark:hover:bg-gray-700`}
          onClick={isEditing ? undefined : handleCategoryClick}
          ref={categoryRef}
          draggable={!isEditing}
          onDragStart={(e: DragEvent) => {
            e.dataTransfer.effectAllowed = 'move';
            onDragStart();
          }}
          onDragEnd={onDragEnd}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2" onBlurCapture={handleBlur}>
              <div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 block">
                  수업 분류
                </span>
                <DynamicInput
                  type="text"
                  value={categoryName}
                  onChange={(value) => setCategoryName(value)}
                  onKeyDown={handleKeyDown}
                  placeholder="수업 분류"
                  className="w-full p-0 border-0 focus:border-0 focus:ring-0 text-xs rounded-none text-[#333333] dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 block">
                  취득해야 하는 총 학점
                </span>
                <DynamicInput
                  type="number"
                  value={requiredCredits}
                  onChange={(value) => setRequiredCredits(value)}
                  onKeyDown={handleKeyDown}
                  placeholder="학점"
                  className="w-12 p-0 border-0 focus:border-0 focus:ring-0 text-xs rounded-none text-[#333333] dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 block">
                  전공 유형
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  <div 
                    className="flex items-center select-none" 
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newValue = !isMajor || majorType !== 'primary';
                      setIsMajor(newValue);
                      setMajorType(newValue ? 'primary' : undefined);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isMajor && majorType === 'primary'}
                      onChange={(e) => {
                        e.stopPropagation();
                        setIsMajor(e.target.checked);
                        setMajorType(e.target.checked ? 'primary' : undefined);
                      }}
                      className="mr-2 rounded border-gray-300"
                    />
                    <label 
                      className="text-xs text-[#333333] dark:text-white select-none"
                    >본전공</label>
                  </div>
                  <div 
                    className="flex items-center select-none"
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newValue = !isMajor || majorType !== 'secondary';
                      setIsMajor(newValue);
                      setMajorType(newValue ? 'secondary' : undefined);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isMajor && majorType === 'secondary'}
                      onChange={(e) => {
                        e.stopPropagation();
                        setIsMajor(e.target.checked);
                        setMajorType(e.target.checked ? 'secondary' : undefined);
                      }}
                      className="mr-2 rounded border-gray-300"
                    />
                    <label 
                      className="text-xs text-[#333333] dark:text-white select-none"
                    >제2전공</label>
                  </div>
                </div>
              </div>
              
              {/* Confirmation button */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    submitForm();
                  }}
                  className="mt-2 w-[75px] bg-[#8B0029] text-white text-xs py-1 px-2 rounded hover:bg-[#7a0024] transition-colors"
                >
                  확인
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetForm();
                    setIsEditing(false);
                  }}
                  className="mt-2 w-[75px] bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[#333333] dark:text-white">{category.name}</div>
                <div className="text-xs mt-1 text-[#333333] dark:text-gray-400">
                  {totalCredits}/{category.requiredCredits} 학점
                </div>
                {category.isMajor && (
                  <div className="mt-1">
                    <span className="text-xs bg-[#8B0029] text-white px-1 rounded">
                      {category.majorType === 'secondary' ? '제2전공' : '본전공'}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
                    removeCategory(category.id);
                  }
                }}
                className="text-[#8B0029] hover:text-red-600 ml-2 p-1 dark:text-gray-400 dark:hover:text-red-300"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          )}
        </div>

        {/* Course cells for each semester */}
        <div 
          className="grid gap-1"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${semesters.length}, minmax(0, 1fr))` 
          }}
        >
          {semesters.map((semester) => {
            const courses = category.courses[semester.id] || [];
            
            // For each semester cell, we'll show existing courses and an empty cell for adding new ones
            return (
              <div key={semester.id} className="semester-cell flex flex-col" style={{ maxWidth: '100%', minHeight: '32px', height: '100%' }}>
                {courses.map((course) => (
                  <CourseCell
                    key={course.id}
                    course={course}
                    categoryId={category.id}
                    semesterId={semester.id}
                    onAdd={() => {}} // Not used for existing courses
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={() => removeCourse(category.id, semester.id, course.id)}
                    onDrop={(draggedCourse, targetSemId, sourceSemId) => 
                      handleCourseDrop(draggedCourse, targetSemId, sourceSemId)}
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
                    onDragStart={onCourseDragStart}
                    onDragEnd={onCourseDragEnd}
                  />
                ))}
                
                {/* Single empty cell that fills remaining space */}
                <div className="flex-grow">
                  <CourseCell
                    key={`empty-${semester.id}-${category.id}`}
                    categoryId={category.id}
                    semesterId={semester.id}
                    onAdd={(newCourse) => !isAnyEditing && addCourse(category.id, semester.id, newCourse)}
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={(courseId) => removeCourse(category.id, semester.id, courseId)}
                    onDrop={handleCourseDrop}
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
                    onDragStart={onCourseDragStart}
                    onDragEnd={onCourseDragEnd}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;