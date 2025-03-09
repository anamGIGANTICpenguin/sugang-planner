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
      <div className="text-center p-2 bg-white">
        <DynamicInput
          type="text"
          value={semesterName}
          onChange={(value) => setSemesterName(value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full p-0 text-center font-semibold border-0 focus:border-0 focus:ring-0 bg-gradient-to-r from-[#8B0029]/5 to-transparent text-xs rounded-none"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="text-center p-2 bg-gray-100 border-b-2 border-[#8B0029] font-semibold hover:bg-gray-200 cursor-pointer relative"
      onClick={handleClick}
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
      data-semester-id={name}
    >
      <span className="text-xs">{name}</span>
      {showDeleteButton && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs bg-white rounded-full w-4 h-4 flex items-center justify-center shadow"
          title="Delete semester"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SemesterHeader;