import React, { useState } from 'react';

const Instructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#8B0029] text-white rounded-lg hover:bg-[#6d0020] transition-colors duration-200 dark:bg-[#9f1239] dark:hover:bg-[#881337]"
      >
        <span>사용 설명서</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
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
      </button>
      
      <div 
        className={`mt-4 p-6 bg-white/80 rounded-lg shadow-lg dark:bg-gray-800/80 text-[#333333] dark:text-[#F8F2DE] transform transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 p-0 mt-0'
        }`}
      >
        <div className="space-y-4">
          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">지금까지 들은 과목들과, 들을 과목들을 한 눈에 보게 해주는 웹 어플리케이션입니다.</h3>
            <p className="text-sm">
              학점, 평점 계산 등을 통해 졸업 요건을 쉽게 확인할 수 있습니다.
            </p>
            <p className="text-sm">
            노트북, 태블릿 등의 넓은 화면에서 사용하는 것을 권장합니다.
            </p>
          </section>

          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">기본 사용법</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>카테고리(전공필수, 전공선택, 필수교양, 선택교양 등) 추가: 왼쪽 하단의 + 버튼을 클릭하세요</li>
              <li>학기 추가: 왼쪽 상단의 + 버튼을 클릭하세요</li>
              <li>과목 추가: 과목을 추가하고 싶은 영역을 클릭하세요</li>
              <li>과목 편집: 과목을 클릭하여 수정하세요</li>
              <li>카테고리 순서 변경: 카테고리를 드래그하여 위치를 바꾸세요</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">기능</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>재수강/학점 지우개: 과목 추가/수정 시 체크박스로 설정 가능</li>
              <li>전공 표시: 카테고리 생성/수정 시 '전공' 체크박스로 설정</li>
              <li>GPA 계산: 자동으로 총 평점과 전공 평점을 계산해 줍니다</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-bold mb-2 text-[#8B0029] dark:text-[#F8F2DE]">데이터 저장</h3>
            <p className="text-sm">
              모든 데이터는 자동으로 브라우저에 저장되며, 브라우저 데이터를 삭제하지 않는 한 유지됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
