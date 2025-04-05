import React from 'react';
import { useGradeScaleStore } from '../../store/gradeScaleStore';

const GradeScaleToggle: React.FC = () => {
  const { scale, setScale } = useGradeScaleStore();

  return (
    <div className="flex items-center gap-1">
      <select
        value={scale}
        onChange={(e) => setScale(e.target.value as '4.5' | '4.3')}
        className="bg-transparent text-[#FEF9E1] border border-[#FEF9E1] rounded px-2 py-1 text-sm gugi-regular"
      >
        <option value="4.5">4.5</option>
        <option value="4.3">4.3</option>
      </select>
      <span className="text-sm text-[#FEF9E1] gugi-regular">만점이야 어흥</span>
    </div>
  );
};

export default GradeScaleToggle;
