// src/components/CourseGrid/CourseGrid.tsx
import React, { useState, useRef, useEffect } from 'react';
import SemesterHeader from './SemesterHeader';
import CategoryRow from '../CategoryRow/CategoryRow';
import CategoryManager from '../CategoryRow/CategoryManager';
import SemesterSummary from './SemesterSummary';
import { useCourseStore } from '../../store/courseStore';
import DynamicInput from '../Common/DynamicInput';
import DropZone from '../CategoryRow/DropZone';

const CourseGrid: React.FC = () => {
  const [isAnyEditing, setIsAnyEditing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    reorderCategories,
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

  const handleDragStart = (categoryId: string) => {
    setDraggedCategory(categoryId);
  };

  const handleDragEnd = () => {
    if (draggedCategory && dropTargetIndex !== null) {
      const sourceIndex = categories.findIndex(c => c.id === draggedCategory);
      if (sourceIndex !== -1 && sourceIndex !== dropTargetIndex) {
        reorderCategories(sourceIndex, dropTargetIndex);
      }
    }
    setDraggedCategory(null);
    setDropTargetIndex(null);
  };

  const handleDropZoneDragOver = (index: number) => {
    // Get the source index from the currently dragged category
    const sourceIndex = categories.findIndex(c => c.id === draggedCategory);
    
    // Don't allow dropping in zones directly above or below the dragged category
    if (sourceIndex === index || sourceIndex === index - 1) {
      setDropTargetIndex(null);
    } else {
      setDropTargetIndex(index);
    }
  };

  const findClosestDropZone = (mouseY: number) => {
    if (!gridRef.current) return null;

    const dropZones = gridRef.current.querySelectorAll('[data-dropzone]');
    let closest = null;
    let minDistance = Infinity;

    dropZones.forEach((zone, index) => {
      const rect = zone.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - mouseY);
      
      // Don't consider zones adjacent to dragged category
      const sourceIndex = categories.findIndex(c => c.id === draggedCategory);
      if (sourceIndex !== index && sourceIndex !== index - 1) {
        if (distance < minDistance) {
          minDistance = distance;
          closest = index;
        }
      }
    });

    return closest;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggedCategory) return;
    
    const closestIndex = findClosestDropZone(e.clientY);
    if (closestIndex !== null) {
      setDropTargetIndex(closestIndex);
    }
  };

  return (
    <div 
      ref={gridRef}
      className={`course-grid p-4 ${semesters.length >= 9 ? 'condensed-cells' : ''}`}
      onDragOver={handleDragOver}
    >
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
        
        {/* Semester headers - using auto-fit to ensure equal width columns */}
        <div 
          className="grid gap-1" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${semesters.length}, minmax(0, 1fr))`,
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
      {categories.map((category, index) => (
        <React.Fragment key={category.id}>
          <DropZone
            isOver={dropTargetIndex === index}
            onDragOver={(e) => {
              e.preventDefault();
              handleDropZoneDragOver(index);
            }}
            onDrop={handleDragEnd}
            isDisabled={categories.findIndex(c => c.id === draggedCategory) === index - 1}
            data-dropzone={index}
          />
          <CategoryRow
            category={category}
            semesters={semesters}
            updateCategory={updateCategory}
            removeCategory={removeCategory}
            addCourse={addCourse}
            updateCourse={updateCourse}
            removeCourse={removeCourse}
            isAnyEditing={isAnyEditing}
            onEditStateChange={setIsAnyEditing}
            onDragStart={() => handleDragStart(category.id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedCategory === category.id}
          />
          {index === categories.length - 1 && (
            <DropZone
              isOver={dropTargetIndex === categories.length}
              onDragOver={(e) => {
                e.preventDefault();
                handleDropZoneDragOver(categories.length);
              }}
              onDrop={handleDragEnd}
            />
          )}
        </React.Fragment>
      ))}

      {/* Semester summaries with CategoryManager on the left */}
      <div className="grid grid-cols-[120px_1fr] gap-1">
        <div className="p-2">
          <CategoryManager onAddCategory={addCategory} />
        </div>
        <div 
          className="grid gap-1"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${semesters.length}, minmax(0, 1fr))` 
          }}
        >
          {semesters.map((semester) => (
            <SemesterSummary
              key={`summary-${semester.id}`}
              categories={categories}
              semester={semester}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseGrid;