import React, { DragEvent, useCallback, useRef, useState } from 'react';
import AnchoredPopover from '../Common/AnchoredPopover';
import DynamicInput from '../Common/DynamicInput';
import CourseCell from '../CourseGrid/CourseCell';
import { Category, Course, Semester } from '../../types';

interface CategoryRowProps {
  category: Category;
  semesters: Semester[];
  isFirst: boolean;
  isLast: boolean;
  updateCategory: (
    id: string,
    name: string,
    requiredCredits: number,
    isMajor: boolean,
    majorType?: 'primary' | 'secondary'
  ) => void;
  removeCategory: (id: string) => void;
  addCourse: (categoryId: string, semesterId: string, course: Omit<Course, 'id'>) => void;
  updateCourse: (
    categoryId: string,
    semesterId: string,
    courseId: string,
    updates: Partial<Omit<Course, 'id'>>
  ) => void;
  removeCourse: (categoryId: string, semesterId: string, courseId: string) => void;
  isAnyEditing: boolean;
  onEditStateChange: (isEditing: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onCourseDragStart: () => void;
  onCourseDragEnd: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  semesters,
  isFirst,
  isLast,
  updateCategory,
  removeCategory,
  addCourse,
  updateCourse,
  removeCourse,
  isAnyEditing,
  onEditStateChange,
  onDragStart,
  onDragEnd,
  isDragging,
  onCourseDragStart,
  onCourseDragEnd,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryName, setCategoryName] = useState(category.name);
  const [requiredCredits, setRequiredCredits] = useState(category.requiredCredits.toString());
  const [isMajor, setIsMajor] = useState(category.isMajor);
  const [majorType, setMajorType] = useState<'primary' | 'secondary' | undefined>(
    category.majorType
  );
  const [validationError, setValidationError] = useState('');
  const edgeRadius =
    `${isFirst ? 'rounded-tl-lg' : ''} ${isLast ? 'rounded-bl-lg' : ''}`;

  const editorTitleId = `category-editor-title-${category.id}`;

  const resetForm = useCallback(() => {
    setCategoryName(category.name);
    setRequiredCredits(category.requiredCredits.toString());
    setIsMajor(category.isMajor);
    setMajorType(category.majorType);
    setValidationError('');
  }, [category]);

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

  const submitForm = () => {
    const trimmedName = categoryName.trim();
    const credits = Number.parseFloat(requiredCredits);

    if (!trimmedName || Number.isNaN(credits) || credits < 0) {
      setValidationError('분류 이름과 0 이상의 필요 학점을 입력해주세요.');
      return;
    }

    updateCategory(category.id, trimmedName, credits, isMajor, majorType);
    setIsEditing(false);
    onEditStateChange(false);
    window.requestAnimationFrame(() => anchorRef.current?.focus());
  };

  const deleteCategory = () => {
    if (!window.confirm(`"${category.name}" 분류와 포함된 과목을 모두 삭제하시겠습니까?`)) return;
    removeCategory(category.id);
    setIsEditing(false);
    onEditStateChange(false);
  };

  const totalCredits = semesters.reduce((sum, semester) => {
    const semesterCourses = category.courses[semester.id] || [];
    return (
      sum +
      semesterCourses.reduce((total, course) => {
        if (course.grade === 'F' || course.isRetake || course.isDropped) return total;
        return total + course.credits;
      }, 0)
    );
  }, 0);

  const handleCourseDrop = (
    course: Course,
    targetSemesterId: string,
    sourceSemesterId: string,
    sourceCategoryId?: string
  ) => {
    onCourseDragEnd();
    const sourceCategory = sourceCategoryId || category.id;
    removeCourse(sourceCategory, sourceSemesterId, course.id);
    addCourse(category.id, targetSemesterId, {
      name: course.name,
      credits: course.credits,
      grade: course.grade,
      gpaValue: course.gpaValue,
      isRetake: course.isRetake,
      isDropped: course.isDropped,
      isEnglish: course.isEnglish,
    });
  };

  return (
    <div className={`category-row transition-opacity duration-150 ${isDragging ? 'opacity-50' : ''}`}>
      <div className="grid grid-cols-[120px_1fr] gap-1">
        <div
          className={`category-header-cell sticky left-0 z-20 cursor-move overflow-hidden bg-[#E5D0AC] font-medium dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 ${edgeRadius}`}
          draggable={!isAnyEditing}
          onDragStart={(event: DragEvent) => {
            event.dataTransfer.effectAllowed = 'move';
            onDragStart();
          }}
          onDragEnd={onDragEnd}
        >
          <button
            ref={anchorRef}
            type="button"
            onClick={openEditor}
            className={`category-header-trigger flex h-full w-full items-start justify-between p-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${edgeRadius} ${
              isEditing ? 'cell-selected' : ''
            }`}
            aria-label={`${category.name} 수정`}
            aria-expanded={isEditing}
          >
            <div>
              <div className="text-sm text-[#333333] dark:text-white">{category.name}</div>
              <div className="mt-1 text-xs text-[#333333] dark:text-gray-400">
                {totalCredits}/{category.requiredCredits} 학점
              </div>
              {category.isMajor && (
                <div className="mt-1">
                  <span className="rounded bg-[#8B0029] px-1 text-xs text-white">
                    {category.majorType === 'secondary' ? '제2전공' : '본전공'}
                  </span>
                </div>
              )}
            </div>
          </button>

          <AnchoredPopover
            anchorRef={anchorRef}
            ariaLabelledBy={editorTitleId}
            isOpen={isEditing}
            onRequestClose={closeEditor}
            preferredWidth={300}
            className="border border-[#8B0029]/25 bg-[#FEF9E1] p-4 text-[#333333] shadow-2xl dark:border-[#9f1239] dark:bg-gray-800 dark:text-[#F8F2DE]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id={editorTitleId}
                  className="text-sm font-bold text-[#8B0029] dark:text-[#F8F2DE]"
                >
                  수업 분류 수정
                </h2>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded p-1 text-gray-500 hover:bg-black/5 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                  aria-label="수업 분류 편집 닫기"
                >
                  ×
                </button>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">수업 분류</span>
                <DynamicInput
                  type="text"
                  value={categoryName}
                  onChange={value => {
                    setCategoryName(value);
                    setValidationError('');
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') submitForm();
                  }}
                  placeholder="수업 분류"
                  className="w-full rounded-md border border-[#8B0029]/20 bg-white px-2.5 py-2 text-sm text-[#333333] dark:border-white/15 dark:bg-gray-900 dark:text-white"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium">취득해야 하는 총 학점</span>
                <DynamicInput
                  type="number"
                  value={requiredCredits}
                  onChange={value => {
                    setRequiredCredits(value);
                    setValidationError('');
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') submitForm();
                  }}
                  placeholder="학점"
                  className="w-full rounded-md border border-[#8B0029]/20 bg-white px-2.5 py-2 text-sm text-[#333333] dark:border-white/15 dark:bg-gray-900 dark:text-white"
                  min="0"
                  step="1"
                />
              </label>

              <fieldset className="rounded-md bg-black/[0.03] p-3 dark:bg-white/[0.04]">
                <legend className="px-1 text-xs font-medium">전공 유형</legend>
                <div className="mt-1 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isMajor && majorType === 'primary'}
                      onChange={event => {
                        setIsMajor(event.target.checked);
                        setMajorType(event.target.checked ? 'primary' : undefined);
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>본전공</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isMajor && majorType === 'secondary'}
                      onChange={event => {
                        setIsMajor(event.target.checked);
                        setMajorType(event.target.checked ? 'secondary' : undefined);
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>제2전공</span>
                  </label>
                </div>
              </fieldset>

              {validationError && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-300">
                  {validationError}
                </p>
              )}

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={deleteCategory}
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

        <div
          className="grid gap-1"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${semesters.length}, minmax(0, 1fr))`,
          }}
        >
          {semesters.map(semester => {
            const courses = category.courses[semester.id] || [];

            return (
              <div
                key={semester.id}
                className="semester-cell flex h-full min-h-8 max-w-full flex-col"
              >
                {courses.map(course => (
                  <CourseCell
                    key={course.id}
                    course={course}
                    categoryId={category.id}
                    semesterId={semester.id}
                    onAdd={() => undefined}
                    onUpdate={(courseId, updates) =>
                      updateCourse(category.id, semester.id, courseId, updates)
                    }
                    onRemove={() => removeCourse(category.id, semester.id, course.id)}
                    onDrop={(draggedCourse, targetSemId, sourceSemId, sourceCategoryId) =>
                      handleCourseDrop(
                        draggedCourse,
                        targetSemId,
                        sourceSemId,
                        sourceCategoryId
                      )
                    }
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
                    onDragStart={onCourseDragStart}
                    onDragEnd={onCourseDragEnd}
                  />
                ))}

                <div className="flex-grow">
                  <CourseCell
                    key={`empty-${semester.id}-${category.id}`}
                    categoryId={category.id}
                    semesterId={semester.id}
                    onAdd={newCourse => addCourse(category.id, semester.id, newCourse)}
                    onUpdate={(courseId, updates) =>
                      updateCourse(category.id, semester.id, courseId, updates)
                    }
                    onRemove={courseId => removeCourse(category.id, semester.id, courseId)}
                    onDrop={(draggedCourse, targetSemId, sourceSemId, sourceCategoryId) =>
                      handleCourseDrop(
                        draggedCourse,
                        targetSemId,
                        sourceSemId,
                        sourceCategoryId
                      )
                    }
                    isAnyEditing={isAnyEditing}
                    onEditStateChange={onEditStateChange}
                    onDragStart={onCourseDragStart}
                    onDragEnd={onCourseDragEnd}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;
