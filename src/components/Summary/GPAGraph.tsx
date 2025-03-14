import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useCourseStore } from '../../store/courseStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GPAGraph: React.FC = () => {
  const { categories, semesters } = useCourseStore();

  // Calculate GPA for each semester
  const semesterGPAs = semesters.map(semester => {
    let totalGpaPoints = 0;
    let totalGpaCredits = 0;
    let majorGpaPoints = 0;
    let majorGpaCredits = 0;

    categories.forEach(category => {
      const courses = category.courses[semester.id] || [];
      courses.forEach(course => {
        if (course.gpaValue !== null && course.grade && course.grade !== 'P') {
          // Overall GPA
          totalGpaCredits += course.credits;
          totalGpaPoints += course.credits * (course.gpaValue || 0);
          
          // Major GPA
          if (category.isMajor) {
            majorGpaCredits += course.credits;
            majorGpaPoints += course.credits * (course.gpaValue || 0);
          }
        }
      });
    });

    return {
      total: totalGpaCredits > 0 ? totalGpaPoints / totalGpaCredits : null,
      major: majorGpaCredits > 0 ? majorGpaPoints / majorGpaCredits : null
    };
  });

  const data = {
    labels: semesters.map(sem => sem.name),
    datasets: [
      {
        label: '총 GPA',
        data: semesterGPAs.map(gpa => gpa.total),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: '전공 GPA',
        data: semesterGPAs.map(gpa => gpa.major),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 4.5,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#F8F2DE'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#F8F2DE'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#F8F2DE'
        }
      }
    }
  };

  return (
    <div className="bg-white/20 p-2 rounded-lg w-full h-full">
      <div className="h-full min-h-[400px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default GPAGraph;
