import React from 'react';

interface DropZoneProps {
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDisabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ isOver, onDragOver, onDrop, isDisabled = false }) => {
  return (
    <div
      className={`h-0.5 ${
        isOver && !isDisabled ? 'h-8 bg-[#8B0029]/10' : ''
      }`}
      onDragOver={isDisabled ? undefined : onDragOver}
      onDrop={isDisabled ? undefined : onDrop}
      data-dropzone=""
      style={{
        overflow: 'hidden',
        transform: isOver && !isDisabled ? 'scaleY(1)' : 'scaleY(0.5)',
        transformOrigin: 'center',
        transition: `all ${isOver ? '150ms' : '500ms'} cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    />
  );
};

export default DropZone;
