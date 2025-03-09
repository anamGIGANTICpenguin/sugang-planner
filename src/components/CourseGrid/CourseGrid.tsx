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

  const [isAddingSemester, setIsAddingSemester] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');

  const handleUpdateSemester = (id: string, newName: string) => {
    // Use the updateSemester action from the store
    updateSemester(id, newName);
  };

  const handleAddSemester = () => {
    const trimmedName = newSemesterName.trim();
    if (trimmedName) {
      addSemester(trimmedName);
      setNewSemesterName('');
      setIsAddingSemester(false);
    }
  };

  return (
    <div className="course-grid p-4">
      <div className="grid grid-cols-[120px_1fr] gap-1 mb-4 relative">
        {/* Empty top-left cell with semester add button */}
        <div className="bg-gray-100 p-2 border-b-2 border-r-2 border-gray-300 relative">
          {isAddingSemester ? (
            <div className="text-center p-2 bg-white border border-[#8B0029] rounded absolute top-1/2 right-2 transform -translate-y-1/2 z-10 w-32">
              <DynamicInput
                type="text"
                value={newSemesterName}
                onChange={(value) => setNewSemesterName(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSemester();
                  if (e.key === 'Escape') setIsAddingSemester(false);
                }}
                onBlur={() => {
                  if (newSemesterName.trim()) {
                    handleAddSemester();
                  } else {
                    setIsAddingSemester(false);
                  }
                }}
                placeholder="Semester name"
                className="w-full p-0 text-center border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
                autoFocus
              />
            </div>
          ) : (
            <div 
              className="text-center bg-white border border-[#8B0029] hover:bg-red-50 cursor-pointer text-[#8B0029] flex items-center justify-center rounded absolute top-1/2 right-2 transform -translate-y-1/2"
              onClick={() => setIsAddingSemester(true)}
              style={{ width: '25px', height: '25px' }}
            >
              <span className="text-sm font-bold">+</span>
            </div>
          )}
        </div>
        
        {/* Semester headers */}
        <div 
          className="grid grid-cols-repeat gap-1" 
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