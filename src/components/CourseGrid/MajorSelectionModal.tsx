import React, { useState } from 'react';
import Portal from '../Common/Portal';

interface MajorPrefixOption {
  prefix: string;
  count: number;
  name?: string;
}

interface MajorSelectionModalProps {
  prefixOptions: MajorPrefixOption[];
  onSelect: (primaryPrefix: string, secondaryPrefix: string, otherPrefixes: string[]) => void;
  onCancel: () => void;
}

const MajorSelectionModal: React.FC<MajorSelectionModalProps> = ({ 
  prefixOptions, 
  onSelect, 
  onCancel 
}) => {
  const [primaryPrefix, setPrimaryPrefix] = useState<string>(
    prefixOptions.length > 0 ? prefixOptions[0].prefix : ''
  );
  const [secondaryPrefix, setSecondaryPrefix] = useState<string>(
    prefixOptions.length > 1 ? prefixOptions[1].prefix : ''
  );

  const handleSubmit = () => {
    // Get all prefixes except the selected ones as other prefixes
    const otherPrefixes = prefixOptions
      .filter(option => option.prefix !== primaryPrefix && option.prefix !== secondaryPrefix)
      .map(option => option.prefix);
    
    onSelect(primaryPrefix, secondaryPrefix, otherPrefixes);
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 dark:text-white">전공 선택</h2>
          
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            여러 개의 전공 코드가 발견되었습니다. 본전공과 제2전공을 선택해주세요.
            선택되지 않은 전공 코드들은 "일반선택" 카테고리로 자동 분류됩니다.
          </p>
          
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 dark:text-white">본전공 선택:</h3>
            {prefixOptions.map((option) => (
              <div key={`primary-${option.prefix}`} className="mb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="primaryMajor"
                    value={option.prefix}
                    checked={primaryPrefix === option.prefix}
                    onChange={() => {
                      setPrimaryPrefix(option.prefix);
                      // If secondary is same as new primary, reset secondary
                      if (secondaryPrefix === option.prefix) {
                        setSecondaryPrefix('');
                      }
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="dark:text-white">
                    {option.prefix} ({option.count}개 과목)
                    {option.name && ` - ${option.name}`}
                  </span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2 dark:text-white">제2전공 선택 (선택 사항):</h3>
            {prefixOptions
              .filter(option => option.prefix !== primaryPrefix)
              .map((option) => (
                <div key={`secondary-${option.prefix}`} className="mb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="secondaryMajor"
                      value={option.prefix}
                      checked={secondaryPrefix === option.prefix}
                      onChange={() => setSecondaryPrefix(option.prefix)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="dark:text-white">
                      {option.prefix} ({option.count}개 과목)
                      {option.name && ` - ${option.name}`}
                    </span>
                  </label>
                </div>
              ))}
            <div className="mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="secondaryMajor"
                  value=""
                  checked={secondaryPrefix === ''}
                  onChange={() => setSecondaryPrefix('')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="dark:text-white">
                  제2전공 없음
                </span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!primaryPrefix}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default MajorSelectionModal;
