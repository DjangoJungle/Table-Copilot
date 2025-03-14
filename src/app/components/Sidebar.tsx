import React from 'react';
import { TableData } from '../types';

interface SidebarProps {
  selectedSpreadsheetIndex: number;
  setSelectedSpreadsheetIndex: (index: number) => void;
}

const repositoryData: TableData[] = [
  {
    id: 'grades',
    name: 'Grades',
    type: 'directory',
    children: [
      { id: 'stu_grade', name: 'stu_grade.csv', type: 'file' },
      { id: 'grade_total', name: 'grade_total.csv', type: 'file' },
      { id: 'math_grade', name: 'math_grade.csv', type: 'file' },
      { id: 'programming_grade', name: 'programming_grade.csv', type: 'file' },
      { id: 'physics_grade', name: 'physics_grade.csv', type: 'file' },
      { id: 'chemistry_grade', name: 'chemistry_grade.csv', type: 'file' },
      { id: 'biology_grade', name: 'biology_grade.csv', type: 'file' },
      { id: 'history_grade', name: 'history_grade.csv', type: 'file' },
    ]
  },
  {
    id: 'students',
    name: 'Students',
    type: 'directory',
    children: [
      { id: 'stu_info', name: 'stu_info.csv', type: 'file' },
      { id: 'class_info', name: 'class_info.csv', type: 'file' },
      { id: 'student_contact', name: 'student_contact.csv', type: 'file' },
      { id: 'student_attendance', name: 'student_attendance.csv', type: 'file' },
      { id: 'student_activities', name: 'student_activities.csv', type: 'file' },
    ]
  },
  {
    id: 'courses',
    name: 'Courses',
    type: 'directory',
    children: [
      { id: 'course_list', name: 'course_list.csv', type: 'file' },
      { id: 'course_schedule', name: 'course_schedule.csv', type: 'file' },
      { id: 'course_prerequisites', name: 'course_prerequisites.csv', type: 'file' },
    ]
  },
  {
    id: 'faculty',
    name: 'Faculty',
    type: 'directory',
    children: [
      { id: 'teacher_info', name: 'teacher_info.csv', type: 'file' },
      { id: 'department_info', name: 'department_info.csv', type: 'file' },
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    type: 'directory',
    children: [
      { id: 'semester_report', name: 'semester_report.csv', type: 'file' },
      { id: 'annual_report', name: 'annual_report.csv', type: 'file' },
      { id: 'performance_metrics', name: 'performance_metrics.csv', type: 'file' },
    ]
  }
];

const FileTreeItem: React.FC<{ item: TableData; level: number }> = ({ item, level }) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const paddingLeft = `${level * 1.5}rem`;

  if (item.type === 'directory') {
    return (
      <div>
        <div
          className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
          style={{ paddingLeft }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 mr-2 transition-transform ${isOpen ? 'transform rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          {item.name}
        </div>
        {isOpen && item.children?.map((child) => (
          <FileTreeItem key={child.id} item={child} level={level + 1} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
      style={{ paddingLeft }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {item.name}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Repository</h2>
      </div>
      <div className="py-2">
        {repositoryData.map((item) => (
          <FileTreeItem key={item.id} item={item} level={0} />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
