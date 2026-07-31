// src/components/CourseGrid/CourseGrid.tsx
import React, { useState, useRef, useEffect } from 'react';
import SemesterHeader from './SemesterHeader';
import CategoryRow from '../CategoryRow/CategoryRow';
import CategoryManager from '../CategoryRow/CategoryManager';
import SemesterSummary from './SemesterSummary';
import { useCourseStore } from '../../store/courseStore';
import DropZone from '../CategoryRow/DropZone';
import './draggable.css';

const CourseGrid: React.FC = () => {
  const [isAnyEditing, setIsAnyEditing] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [isDraggingCourse, setIsDraggingCourse] = useState(false);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Reset drop target index when course dragging starts
  useEffect(() => {
    if (isDraggingCourse) {
      setDropTargetIndex(null);
    }
  }, [isDraggingCourse]);

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
    if (!isDraggingCourse) { // Only set dragged category if not dragging a course
      setDraggedCategory(categoryId);
    }  
  };

  const handleDragEnd = () => {
    if (draggedCategory && dropTargetIndex !== null && !isDraggingCourse) {
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
    if (!gridRef.current || isDraggingCourse) return null;

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
    if (!draggedCategory || isDraggingCourse) return;
    
    const closestIndex = findClosestDropZone(e.clientY);
    if (closestIndex !== null) {
      setDropTargetIndex(closestIndex);
    }
  };

  return (
    <div 
      ref={gridRef}
      className={`course-grid rounded-xl border border-[#8B0029]/10 bg-white/30 shadow-sm dark:border-white/10 dark:bg-gray-900/40 ${
        semesters.length >= 6 ? 'condensed-cells' : ''
      }`}
      onDragOver={handleDragOver}
      role="region"
      aria-label="학기별 수강 계획표"
      tabIndex={0}
    >
      <div className="course-grid-content min-w-[800px] p-3">
      <div className="semester-header-row sticky top-0 z-30 mb-3 grid grid-cols-[120px_1fr] gap-1 bg-[#FEF9E1] py-1 dark:bg-gray-900">
        {/* Empty top-left cell with semester add button (invisible cell, visible button) */}
        <div className="sticky left-0 z-40 border-0 bg-[#FEF9E1] p-2 dark:bg-gray-900">
          <button
            type="button"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-[#E5D0AC] text-center text-[#333333] shadow-sm transition hover:bg-[#dbc096] dark:bg-[#202838] dark:text-[#F8F2DE] dark:hover:bg-[#2d3748]"
            onClick={handleAddSemester}
            title="학기 추가"
            aria-label="학기 추가"
          >
            <span className="text-sm font-bold">+</span>
          </button>
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
          {semesters.map((semester, index) => (
            <SemesterHeader
              key={semester.id}
              name={semester.name}
              isFirst={index === 0}
              isLast={index === semesters.length - 1}
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
            isOver={dropTargetIndex === index && !isDraggingCourse}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isDraggingCourse) { // Only show drop zone if not dragging a course
                handleDropZoneDragOver(index);
              }
            }}
            onDrop={handleDragEnd}
            isDisabled={isDraggingCourse || categories.findIndex(c => c.id === draggedCategory) === index - 1}
            data-dropzone={index}
          />
          <CategoryRow
            category={category}
            semesters={semesters}
            isFirst={index === 0}
            isLast={index === categories.length - 1}
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
            onCourseDragStart={() => setIsDraggingCourse(true)}
            onCourseDragEnd={() => setIsDraggingCourse(false)}
          />
          {index === categories.length - 1 && (
            <DropZone
              isOver={dropTargetIndex === categories.length && !isDraggingCourse}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isDraggingCourse) {
                  handleDropZoneDragOver(categories.length);
                }
              }}
              onDrop={handleDragEnd}
              isDisabled={isDraggingCourse}
            />
          )}
        </React.Fragment>
      ))}

      {/* Semester summaries with CategoryManager on the left */}
      <div className="grid grid-cols-[120px_1fr] gap-1">
        <div className="sticky left-0 z-20 bg-[#FEF9E1] p-2 dark:bg-gray-900">
          <CategoryManager onAddCategory={addCategory} />
        </div>
        <div 
          className="grid gap-1"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${semesters.length}, minmax(0, 1fr))` 
          }}
        >
          {semesters.map((semester, index) => (
            <SemesterSummary
              key={`summary-${semester.id}`}
              categories={categories}
              semester={semester}
              isFirst={index === 0}
              isLast={index === semesters.length - 1}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CourseGrid;
