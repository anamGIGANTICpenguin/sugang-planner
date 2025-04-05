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
      <div className="w-16 relative [&_.custom-dropdown-options]:text-[#333333] gugi-regular">
        <CustomDropdown
          options={gradeScaleOptions}
          value={scale}
          onChange={(value) => setScale(value as '4.5' | '4.3')}
          placeholder="학점 체계"
          className="text-[#FEF9E1] border border-[#FEF9E1] rounded py-1.5 px-3 pr-8 text-sm gugi-regular"
        />
        <svg
          className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#FEF9E1]"
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
      <span className="text-sm text-[#FEF9E1] gugi-regular">만점이야 어흥</span>
    </div>
  );
};

export default GradeScaleToggle;
