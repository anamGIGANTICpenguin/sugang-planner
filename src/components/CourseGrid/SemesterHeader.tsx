import React, { useCallback, useId, useRef, useState } from 'react';
import AnchoredPopover from '../Common/AnchoredPopover';
import DynamicInput from '../Common/DynamicInput';

interface SemesterHeaderProps {
  name: string;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (newName: string) => void;
  onDelete: () => void;
}

const SemesterHeader: React.FC<SemesterHeaderProps> = ({
  name,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const editorTitleId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [semesterName, setSemesterName] = useState(name);
  const [validationError, setValidationError] = useState('');
  const edgeRadius =
    `${isFirst ? 'rounded-tl-lg' : ''} ${isLast ? 'rounded-tr-lg' : ''}`;

  const openEditor = () => {
    setSemesterName(name);
    setValidationError('');
    setIsEditing(true);
  };

  const closeEditor = useCallback(() => {
    setSemesterName(name);
    setValidationError('');
    setIsEditing(false);
    window.requestAnimationFrame(() => anchorRef.current?.focus());
  }, [name]);

  const submitForm = () => {
    const trimmedName = semesterName.trim();

    if (!trimmedName) {
      setValidationError('학기 이름을 입력해주세요.');
      return;
    }

    if (trimmedName !== name) {
      onUpdate(trimmedName);
    }

    setValidationError('');
    setIsEditing(false);
    window.requestAnimationFrame(() => anchorRef.current?.focus());
  };

  const handleDelete = () => {
    if (window.confirm(`"${name}" 학기와 포함된 모든 과목을 삭제하시겠습니까?`)) {
      onDelete();
    }
  };

  return (
    <div
      className={`group relative min-h-10 border-b-2 border-[#8B0029] bg-[#E5D0AC] text-center font-semibold dark:border-[#9f1239] dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 ${edgeRadius}`}
      data-semester-id={name}
    >
      <button
        ref={anchorRef}
        type="button"
        onClick={openEditor}
        className={`semester-header-trigger flex h-full min-h-10 w-full items-center justify-center px-2 py-2 text-xs text-[#333333] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 ${edgeRadius} ${
          isEditing ? 'bg-[#8B0029]/10 dark:bg-white/10' : ''
        }`}
        aria-label={`${name} 이름 수정`}
        aria-expanded={isEditing}
        aria-haspopup="dialog"
      >
        {name}
      </button>

      <AnchoredPopover
        anchorRef={anchorRef}
        ariaLabelledBy={editorTitleId}
        isOpen={isEditing}
        onRequestClose={closeEditor}
        preferredWidth={280}
        className="border border-[#8B0029]/20 bg-[#FEF9E1] p-4 text-left text-[#333333] shadow-2xl dark:border-[#9f1239] dark:bg-gray-800 dark:text-[#F8F2DE]"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id={editorTitleId}
                className="text-sm font-bold text-[#8B0029] dark:text-[#F8F2DE]"
              >
                학기 이름 수정
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                계획표에 표시할 이름을 입력하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded p-1 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="학기 이름 편집 닫기"
            >
              ×
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium">학기 이름</span>
            <DynamicInput
              type="text"
              value={semesterName}
              onChange={value => {
                setSemesterName(value);
                setValidationError('');
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') submitForm();
              }}
              placeholder="예: 3학년 1학기"
              className="w-full rounded-lg border border-[#8B0029]/20 bg-white px-3 py-2.5 text-sm font-medium text-[#333333] shadow-inner dark:border-white/15 dark:bg-gray-900 dark:text-white"
              autoFocus
            />
          </label>

          {validationError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-300">
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              삭제
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitForm}
                className="rounded-md bg-[#8B0029] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6d0020]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </AnchoredPopover>
    </div>
  );
};

export default SemesterHeader;
