// src/components/CategoryRow/CategoryManager.tsx
import React, { useState } from 'react';

interface CategoryManagerProps {
  onAddCategory: (name: string, requiredCredits: number, isMajor: boolean) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ onAddCategory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [requiredCredits, setRequiredCredits] = useState('');
  const [isMajor, setIsMajor] = useState(false);

  const handleAddClick = () => {
    // Create a new category with default values
    onAddCategory("OO 전공", 15, false);
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
  };

  const resetForm = () => {
    setCategoryName('');
    setRequiredCredits('');
    setIsMajor(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = categoryName.trim();
    const credits = parseFloat(requiredCredits);
    
    if (trimmedName && !isNaN(credits) && credits >= 0) {
      onAddCategory(trimmedName, credits, isMajor);
      resetForm();
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="category-manager p-4 border border-gray-300 rounded mb-4 bg-gray-50">
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-medium mb-3">Add New Category</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Electives, Core Courses"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Required Credits</label>
              <input
                type="number"
                value={requiredCredits}
                onChange={(e) => setRequiredCredits(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., 15"
                min="0"
                step="1"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isMajor"
                  checked={isMajor}
                  onChange={(e) => setIsMajor(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isMajor" className="block text-sm">전공 (Major) Category</label>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#8B0029] text-white rounded hover:bg-[#6d0020]"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="category-manager">
      <button
        onClick={handleAddClick}
        className="w-full p-2 bg-[#E5D0AC] text-[#333333] rounded hover:bg-[#d4bd94] flex items-center justify-center text-xl dark:bg-gray-800 dark:text-[#F8F2DE] dark:hover:bg-gray-700"
        title="Add new category"
      >
        +
      </button>
    </div>
  );
};

export default CategoryManager;