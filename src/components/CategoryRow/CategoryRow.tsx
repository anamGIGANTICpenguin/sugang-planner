// src/components/CategoryRow/CategoryRow.tsx
import React, { useState, useRef, DragEvent } from 'react';
import CourseCell from '../CourseGrid/CourseCell';
import { Category, Course, Semester } from '../../types';
import DynamicInput from '../Common/DynamicInput';

interface CategoryRowProps {
  category: Category;
  semesters: Semester[];
  updateCategory: (id: string, name: string, requiredCredits: number, isMajor: boolean) => void;
  removeCategory: (id: string) => void;
  addCourse: (categoryId: string, semesterId: string, course: Omit<Course, 'id'>) => void;
  updateCourse: (categoryId: string, semesterId: string, courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  removeCourse: (categoryId: string, semesterId: string, courseId: string) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
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
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [categoryName, setCategoryName] = useState(category.name);
  const [requiredCredits, setRequiredCredits] = useState(category.requiredCredits.toString());
  const [isMajor, setIsMajor] = useState(category.isMajor);
  const categoryRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitForm();
    } else if (e.key === 'Escape') {
      resetForm();
      setIsEditing(false);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only submit the form if focus is leaving the category editing area entirely
    if (categoryRef.current && !categoryRef.current.contains(e.relatedTarget as Node)) {
      submitForm();
    }
  };

  const resetForm = () => {
    setCategoryName(category.name);
    setRequiredCredits(category.requiredCredits.toString());
    setIsMajor(category.isMajor);
  };

  const submitForm = () => {
    const trimmedName = categoryName.trim();
    const credits = parseFloat(requiredCredits);
    
    if (trimmedName && !isNaN(credits)) {
      updateCategory(category.id, trimmedName, credits, isMajor);
    } else {
      resetForm();
    }
    
    setIsEditing(false);
  };

  // Calculate total credits for this category
  const totalCredits = semesters.reduce((sum, semester) => {
    const semesterCourses = category.courses[semester.id] || [];
    return sum + semesterCourses.reduce((total, course) => total + course.credits, 0);
  }, 0);

  return (
    <div className={`category-row transition-all duration-200 ${
      isDragging ? 'opacity-50' : ''
    }`}>
      <div className="grid grid-cols-[120px_1fr] gap-1">
        {/* Make only the category cell draggable */}
        <div 
          className={`p-2 bg-gray-100 border-r-2 font-medium ${
            isEditing ? 'bg-red-50 border-[#8B0029]' : 'border-[#8B0029] hover:bg-gray-200 cursor-move'
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
              <DynamicInput
                type="text"
                value={categoryName}
                onChange={(value) => setCategoryName(value)}
                onKeyDown={handleKeyDown}
                placeholder="Category name"
                className="w-full p-0 border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
                autoFocus
              />
              <DynamicInput
                type="number"
                value={requiredCredits}
                onChange={(value) => setRequiredCredits(value)}
                onKeyDown={handleKeyDown}
                placeholder="Required credits"
                className="w-20 p-0 border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
                min="0"
                step="1"
              />
              <div className="flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={isMajor} 
                  onChange={(e) => setIsMajor(e.target.checked)}
                  className="mr-2 rounded border-gray-300"
                />
                <label className="text-xs">전공 (Major)</label>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <div>{category.name}</div>
                <div className="text-xs mt-1 text-[11px] dark:text-gray-400">
                  {totalCredits}/{category.requiredCredits} 학점
                </div>
                {category.isMajor && (
                  <div className="mt-1">
                    <span className="text-xs bg-[#8B0029] text-white px-1 rounded">전공</span>
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
                className="text-gray-400 hover:text-red-600 ml-2 p-1"
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
                    onAdd={() => {}} // Not used for existing courses
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={() => removeCourse(category.id, semester.id, course.id)}
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
                  />
                ))}
                
                {/* Single empty cell that fills remaining space */}
                <div className="flex-grow">
                  <CourseCell
                    key={`empty-${semester.id}-${category.id}`}
                    onAdd={(newCourse) => !isAnyEditing && addCourse(category.id, semester.id, newCourse)}
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={(courseId) => removeCourse(category.id, semester.id, courseId)}
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
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