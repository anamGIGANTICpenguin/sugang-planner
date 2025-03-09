// src/components/CourseGrid/CourseGrid.tsx
import React, { useState } from 'react';
import SemesterHeader from './SemesterHeader';
import CategoryRow from '../CategoryRow/CategoryRow';
import CategoryManager from '../CategoryRow/CategoryManager';
import { useCourseStore } from '../../store/courseStore';
import DynamicInput from '../Common/DynamicInput';

const CourseGrid: React.FC = () => {
  const {
    categories,
    semesters,
    addCategory,
    updateCategory,
    removeCategory,
    addSemester,
    updateSemester,
    removeSemester,
    addCourse,
    updateCourse,
    removeCourse,
  } = useCourseStore();

  const handleUpdateSemester = (id: string, newName: string) => {
    // Use the updateSemester action from the store
    updateSemester(id, newName);
  };

  const handleAddSemester = () => {
    // Add a new semester with a default name
    const nextSemesterNumber = semesters.length + 1;
    addSemester(`Semester ${nextSemesterNumber}`);
  };

  return (
    <div className="course-grid p-4">
      <div className="grid grid-cols-[120px_1fr] gap-1 mb-4 relative">
        {/* Empty top-left cell with semester add button (invisible cell, visible button) */}
        <div className="p-2 relative bg-transparent border-0">
          <div 
            className="text-center bg-white border border-[#8B0029] hover:bg-red-50 cursor-pointer text-[#8B0029] flex items-center justify-center rounded absolute top-1/2 right-2 transform -translate-y-1/2 dark:bg-[#202838] dark:border-[#9f1239] dark:text-[#F8F2DE] dark:hover:bg-[#2d3748]"
            onClick={handleAddSemester}
            style={{ width: '25px', height: '25px' }}
            title="Add new semester"
          >
            <span className="text-sm font-bold">+</span>
          </div>
        </div>
        
        {/* Semester headers */}
        <div 
          className="grid gap-1" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${semesters.length}, 1fr)`, 
            borderRight: '1px dashed rgba(139, 0, 41, 0.15)'
          }}
        >
          {semesters.map((semester) => (
            <SemesterHeader
              key={semester.id}
              name={semester.name}
              onUpdate={(newName) => handleUpdateSemester(semester.id, newName)}
              onDelete={() => removeSemester(semester.id)}
            />
          ))}
        </div>
      </div>

      {/* Category rows */}
      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          semesters={semesters}
          updateCategory={updateCategory}
          removeCategory={removeCategory}
          addCourse={addCourse}
          updateCourse={updateCourse}
          removeCourse={removeCourse}
        />
      ))}

      {/* Category manager */}
      <CategoryManager onAddCategory={addCategory} />
    </div>
  );
};

export default CourseGrid;