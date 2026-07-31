import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Course } from '../../types';
import AnchoredPopover from '../Common/AnchoredPopover';
import CustomDropdown from '../Common/CustomDropdown';
import DynamicInput from '../Common/DynamicInput';
import { getGradeOptions, useGradeScaleStore } from '../../store/gradeScaleStore';

const creditOptions = [0.5, 1, 1.5, 2, 3, 4, 5, 6];
const creditDropdownOptions = creditOptions.map(credit => ({
  value: credit.toString(),
  label: `${credit}학점`,
}));

interface CourseCellProps {
  course?: Course;
  categoryId: string;
  semesterId: string;
  onAdd: (course: Omit<Course, 'id'>) => void;
  onUpdate: (courseId: string, updates: Partial<Omit<Course, 'id'>>) => void;
  onRemove: (courseId: string) => void;
  onDrop?: (
    draggedCourse: Course,
    targetSemesterId: string,
    sourceSemesterId: string,
    sourceCategoryId: string
  ) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const CourseCell: React.FC<CourseCellProps> = ({
  course,
  categoryId,
  semesterId,
  onAdd,
  onUpdate,
  onRemove,
  onDrop,
  isAnyEditing,
  onEditStateChange,
  onDragStart,
  onDragEnd,
}) => {
  const { scale } = useGradeScaleStore();
  const gradeOptions = useMemo(() => getGradeOptions(scale), [scale]);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('');
  const [isRetake, setIsRetake] = useState(false);
  const [isDropped, setIsDropped] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);
  const [validationError, setValidationError] = useState('');

  const editorTitleId = `course-editor-title-${course?.id ?? `${categoryId}-${semesterId}`}`;

  const resetForm = useCallback(() => {
    setCourseName(course?.name ?? '');
    setCredits(course ? course.credits.toString() : '');

    if (course?.grade) {
      const plainLetterGrades = ['A', 'B', 'C', 'D'];
      const formattedGrade = plainLetterGrades.includes(course.grade)
        ? `${course.grade}0`
        : course.grade;
      const exactGrade = gradeOptions.find(option => option.value === formattedGrade);
      const similarGrade = gradeOptions.find(
        option =>
          option.value.replace(/[+0-]/g, '') === formattedGrade.replace(/[+0-]/g, '')
      );
      setGrade(exactGrade?.value ?? similarGrade?.value ?? '');
    } else {
      setGrade('');
    }

    setIsRetake(course?.isRetake ?? false);
    setIsDropped(course?.isDropped ?? false);
    setIsEnglish(course?.isEnglish ?? false);
    setValidationError('');
  }, [course, gradeOptions]);

  const openEditor = () => {
    if (isEditing || isAnyEditing) return;
    resetForm();
    setIsEditing(true);
    onEditStateChange(true);
  };

  const closeEditor = useCallback(() => {
    resetForm();
    setIsEditing(false);
    onEditStateChange(false);
    window.requestAnimationFrame(() => anchorRef.current?.focus());
  }, [onEditStateChange, resetForm]);

  const formatGrade = (gradeText: string) => {
    if (!gradeText) return gradeText;
    return ['A', 'B', 'C', 'D'].includes(gradeText) ? `${gradeText}0` : gradeText;
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    if (newGrade === 'N/A' || newGrade === 'NP') {
      setCredits('0');
    }
  };

  const submitForm = () => {
    const trimmedName = courseName.trim();
    const parsedCredits = Number.parseFloat(credits);

    if (!trimmedName || Number.isNaN(parsedCredits)) {
      setValidationError('과목명과 학점을 모두 입력해주세요.');
      return;
    }

    const formattedGrade = formatGrade(grade);
    const selectedGrade = gradeOptions.find(option => option.value === formattedGrade);
    const gpaValue = selectedGrade?.gpaValue ?? null;

    if (course) {
      const updates: Partial<Omit<Course, 'id'>> = {};
      if (trimmedName !== course.name) updates.name = trimmedName;
      if (parsedCredits !== course.credits) updates.credits = parsedCredits;
      if (formattedGrade !== course.grade) {
        updates.grade = formattedGrade || undefined;
        updates.gpaValue = gpaValue;
      }
      if (isRetake !== course.isRetake) updates.isRetake = isRetake;
      if (isDropped !== course.isDropped) updates.isDropped = isDropped;
      if (isEnglish !== course.isEnglish) updates.isEnglish = isEnglish;

      if (Object.keys(updates).length > 0) {
        onUpdate(course.id, updates);
      }
    } else {
      onAdd({
        name: trimmedName,
        credits: parsedCredits,
        grade: formattedGrade || undefined,
        gpaValue,
        isRetake,
        isDropped,
        isEnglish,
      });
    }

    setIsEditing(false);
    onEditStateChange(false);
    window.requestAnimationFrame(() => anchorRef.current?.focus());
  };

  const deleteCourse = () => {
    if (!course || !window.confirm(`"${course.name}" 과목을 삭제하시겠습니까?`)) return;
    onRemove(course.id);
    setIsEditing(false);
    onEditStateChange(false);
  };

  const getGradeColor = (gradeValue: string): string => {
    if (!gradeValue) return 'text-gray-600 dark:text-gray-400';
    if (gradeValue.startsWith('A')) return 'text-blue-600 dark:text-blue-400';
    if (gradeValue.startsWith('B')) return 'text-green-600 dark:text-green-400';
    if (gradeValue.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    if (gradeValue.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
    if (gradeValue === 'F' || gradeValue === 'NP') return 'text-red-600 dark:text-red-400';
    if (gradeValue === 'P') return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    if (!course) return;
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({ course, sourceCategoryId: categoryId, sourceSemesterId: semesterId })
    );
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('opacity-50', 'dragging');
    onDragStart?.();
  };

  const handleDragEnd = (event: React.DragEvent<HTMLButtonElement>) => {
    event.currentTarget.classList.remove('opacity-50', 'dragging');
    document.querySelectorAll('.drop-highlight').forEach(element => {
      element.classList.remove('drop-highlight');
    });
    onDragEnd?.();
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('drop-highlight');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>) => {
    event.currentTarget.classList.remove('drop-highlight');
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('drop-highlight');

    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      if (data.sourceCategoryId === categoryId && data.sourceSemesterId === semesterId) return;
      if (onDrop && data.course) {
        onDrop(data.course, semesterId, data.sourceSemesterId, data.sourceCategoryId);
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  };

  const editor = (
    <AnchoredPopover
      anchorRef={anchorRef}
      ariaLabelledBy={editorTitleId}
      isOpen={isEditing}
      onRequestClose={closeEditor}
      preferredWidth={288}
      className="border border-[#8B0029]/25 bg-[#FEF9E1] p-4 text-[#333333] shadow-2xl dark:border-[#9f1239] dark:bg-gray-800 dark:text-[#F8F2DE]"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id={editorTitleId} className="text-sm font-bold text-[#8B0029] dark:text-[#F8F2DE]">
            {course ? '과목 수정' : '과목 추가'}
          </h2>
          <button
            type="button"
            onClick={closeEditor}
            className="rounded p-1 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
            aria-label="과목 편집 닫기"
          >
            ×
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">과목명</span>
          <DynamicInput
            type="text"
            value={courseName}
            onChange={value => {
              setCourseName(value);
              setValidationError('');
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') submitForm();
            }}
            placeholder="과목명"
            className="w-full rounded-md border border-[#8B0029]/20 bg-white px-2.5 py-2 text-sm text-[#333333] dark:border-white/15 dark:bg-gray-900 dark:text-white"
            autoFocus
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="mb-1 block text-xs font-medium">학점</span>
            <div className="rounded-md border border-[#8B0029]/20 bg-white px-1 py-1 dark:border-white/15 dark:bg-gray-900">
              <CustomDropdown
                options={creditDropdownOptions}
                value={credits}
                onChange={value => {
                  setCredits(value);
                  setValidationError('');
                }}
                placeholder="학점 선택"
                optionsClassName="credit-dropdown-options"
                disabled={grade === 'N/A' || grade === 'NP'}
              />
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium">평점</span>
            <div className="rounded-md border border-[#8B0029]/20 bg-white px-1 py-1 dark:border-white/15 dark:bg-gray-900">
              <CustomDropdown
                options={gradeOptions}
                value={grade}
                onChange={handleGradeChange}
                placeholder="평점 선택"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-md bg-black/[0.03] p-2.5 dark:bg-white/[0.04]">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isRetake || isDropped}
              onChange={event => {
                setIsRetake(event.target.checked);
                setIsDropped(event.target.checked);
              }}
              className="rounded border-gray-300"
            />
            <span>재수강/학점포기</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isEnglish}
              onChange={event => setIsEnglish(event.target.checked)}
              className="rounded border-gray-300"
            />
            <span>영강</span>
          </label>
        </div>

        {validationError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-300">
            {validationError}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {course && (
              <button
                type="button"
                onClick={deleteCourse}
                className="rounded-md px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                삭제
              </button>
            )}
          </div>
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
  );

  if (!course) {
    return (
      <>
        <button
          ref={anchorRef}
          type="button"
          aria-label="과목 추가"
          aria-expanded={isEditing}
          onClick={openEditor}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cell empty h-full min-h-8 w-full cursor-pointer border-0 ${
            isAnyEditing && !isEditing ? 'pointer-events-none opacity-50' : ''
          } ${isEditing ? 'cell-selected' : ''}`}
        />
        {editor}
      </>
    );
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={`cell filled relative flex h-8 min-h-8 max-w-full cursor-pointer items-center border border-gray-200 bg-[#E5D0AC] p-2 text-left transition-[background-color,border-color,box-shadow,opacity] duration-150 dark:border-gray-700 dark:bg-gray-800 dark:text-white ${
          course.isRetake || course.isDropped ? 'retake-course' : ''
        } ${isEditing ? 'cell-selected' : ''}`}
        onClick={openEditor}
        aria-expanded={isEditing}
        draggable={!isAnyEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex-grow pr-10 text-left">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold leading-tight text-[#333333] dark:text-white">
            {course.name.replace(/\s*\(영강\)|\s*\(외국어강의\)/g, '').substring(0, 10) +
              (course.name.length > 10 ? '...' : '')}
          </span>
        </div>

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-baseline justify-end gap-0.5 bg-inherit">
          {(course.credits !== 3 || course.isEnglish) && (
            <span className="text-[10px] font-normal text-gray-500 opacity-75 dark:text-gray-400">
              {course.credits !== 3 && course.isEnglish
                ? `(${course.credits},E)`
                : course.credits !== 3
                  ? `(${course.credits})`
                  : '(E)'}
            </span>
          )}
          {course.grade && (
            <span className={`text-right text-xs font-medium ${getGradeColor(course.grade)}`}>
              {course.grade === 'P' || course.grade === 'F' ? (
                <>
                  {course.grade}
                  <span className="invisible">0</span>
                </>
              ) : course.grade.length === 1 && ['A', 'B', 'C', 'D'].includes(course.grade) ? (
                `${course.grade}0`
              ) : (
                course.grade
              )}
            </span>
          )}
        </div>
      </button>
      {editor}
    </>
  );
};

export default CourseCell;
