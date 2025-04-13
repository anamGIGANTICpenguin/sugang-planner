import React from 'react';
import cubadultImage from '../../assets/cubadult.png';

const About: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FEF9E1] dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ×
        </button>
        
        <div className="flex flex-col items-center mb-6">
          <img 
              src={cubadultImage} 
              alt="Cub Adult" 
              className="w-30 h-auto opacity-90 mx-auto"
            />
            <div className="h-4" />
          <h2 className="text-2xl font-bold text-[#8B0029] dark:text-[#F8F2DE] mb-2 gugi-regular">
            졸업하고싶은 호랭이
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            version 1.0.0
          </p>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">만든이</h3>
            <p className="text-sm">
              고려대학교 전기전자공학부 소속 <span className="font-bold">휴학생</span>입니다.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">연락처</h3>
            <div className="space-y-2 text-sm">
              <p><a href="https://pf.kakao.com/_xnrxnwn" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">카카오톡 채널</a></p>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg mb-2 text-[#8B0029] dark:text-[#F8F2DE]">Special Thanks to</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>테스트를 도와준 동기들</li>
              <li>이미지를 제공해 준 GPT</li>
              <li>고려대의 모든 호랭이들</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
