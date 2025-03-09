import React, { useState, useRef } from 'react';
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
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  semesters,
  updateCategory,
  removeCategory,
  addCourse,
  updateCourse,
  removeCourse,
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
    <div className="category-row border-b border-gray-300 last:border-b-0">
      <div className="grid grid-cols-[120px_1fr] gap-1">
        {/* Category name and required credits */}
        <div 
          className={`p-2 bg-gray-100 border-r-2 font-medium ${
            isEditing ? 'bg-red-50 border-[#8B0029]' : 'border-[#8B0029] hover:bg-gray-200 cursor-pointer'
          }`}
          onClick={isEditing ? undefined : handleCategoryClick}
          ref={categoryRef}
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
                className="w-full p-0 border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
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
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  {category.isMajor && (
                    <span className="text-xs bg-[#8B0029] text-white px-1 rounded mr-1">전공</span>
                  )}
                  <div>{category.name}</div>
                </div>
                <div className="text-xs mt-1">
                  {totalCredits}/{category.requiredCredits} credits
                </div>
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
        <div className={`grid grid-cols-${semesters.length} gap-1`} style={{ display: 'grid', gridTemplateColumns: `repeat(${semesters.length}, 1fr)` }}>
          {semesters.map((semester) => {
            const courses = category.courses[semester.id] || [];
            
            // For each semester cell, we'll show existing courses and an empty cell for adding new ones
            const isEmpty = courses.length === 0;
            
            return (
              <div key={semester.id} className="semester-cell" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {courses.map((course) => (
                  <CourseCell
                    key={course.id}
                    course={course}
                    onAdd={() => {}} // Not used for existing courses
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={() => removeCourse(category.id, semester.id, course.id)}
                  />
                ))}
                
                {/* Empty cell to add a new course - larger if category is empty for this semester */}
                {isEmpty ? (
                  <div 
                    className="cell empty border-0 hover:border hover:border-[#8B0029] hover:bg-red-50 cursor-pointer flex items-center justify-center group"
                    onClick={() => {
                      // Set up temporary course and add it
                      const newCourse = {
                        name: "New Course",
                        credits: 3,
                      };
                      addCourse(category.id, semester.id, newCourse);
                    }}
                    style={{ height: '100%', width: '100%', minHeight: '80px' }}
                  >
                    <span className="text-xl text-[#8B0029] opacity-0 group-hover:opacity-100 transition-opacity duration-200">+</span>
                  </div>
                ) : (
                  <CourseCell
                    key={`empty-${semester.id}-${category.id}`}
                    onAdd={(newCourse) => addCourse(category.id, semester.id, newCourse)}
                    onUpdate={(courseId, updates) => updateCourse(category.id, semester.id, courseId, updates)}
                    onRemove={(courseId) => removeCourse(category.id, semester.id, courseId)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;