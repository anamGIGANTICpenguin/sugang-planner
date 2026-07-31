import React from 'react';
import { useGradeScaleStore } from '../../store/gradeScaleStore';
import CustomDropdown from './CustomDropdown';

const GradeScaleToggle: React.FC = () => {
  const { scale, setScale } = useGradeScaleStore();

  const gradeScaleOptions = [
    { value: '4.5', label: '4.5', color: '#333333' },
    { value: '4.3', label: '4.3', color: '#333333' }
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 [&_.custom-dropdown-options]:text-[#333333] gugi-regular">
        <CustomDropdown
          options={gradeScaleOptions}
          value={scale}
          onChange={(value) => setScale(value as '4.5' | '4.3')}
          placeholder="학점 체계 선택"
          className="toolbar-secondary-control rounded-lg px-3 py-2 pr-8 text-sm gugi-regular"
        />
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B0029] dark:text-[#F8F2DE]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <span className="hidden text-sm text-[#8B0029] gugi-regular dark:text-[#F8F2DE] sm:inline">
        만점이야 어흥
      </span>
    </div>
  );
};

export default GradeScaleToggle;
