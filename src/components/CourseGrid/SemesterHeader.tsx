// src/components/CourseGrid/SemesterHeader.tsx
import React, { useState } from 'react';
import DynamicInput from '../Common/DynamicInput';

interface SemesterHeaderProps {
  name: string;
  onUpdate: (newName: string) => void;
  onDelete: () => void;
}

const SemesterHeader: React.FC<SemesterHeaderProps> = ({ name, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [semesterName, setSemesterName] = useState(name);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitForm();
    } else if (e.key === 'Escape') {
      setSemesterName(name);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    submitForm();
  };

  const submitForm = () => {
    const trimmedName = semesterName.trim();
    if (trimmedName && trimmedName !== name) {
      onUpdate(trimmedName);
    } else {
      setSemesterName(name);
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${name}"? All courses in this semester will be removed.`)) {
      onDelete();
    }
  };

  if (isEditing) {
    return (
      <div className="text-center p-2 bg-white dark:bg-[#202838]">
        <DynamicInput
          type="text"
          value={semesterName}
          onChange={(value) => setSemesterName(value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full p-0 text-center font-semibold border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none dark:bg-[#202838] dark:text-[#F8F2DE] dark:focus:ring-0 dark:focus:outline-none"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="text-center p-2 bg-gray-100 border-b border-[#8B0029] font-semibold hover:bg-gray-200 cursor-pointer relative dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-[#9f1239] rounded-t-lg"
      onClick={handleClick}
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
      data-semester-id={name}
    >
      <span className="text-xs">{name}</span>
      {showDeleteButton && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs dark:text-[#F8F2DE] dark:hover:text-red-300 dark:bg-transparent dark:shadow-none"
          title="Delete semester"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SemesterHeader;