"use client";
import React, { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import { CustomAssistant } from "./components/CustomAssistant";
import { StudentInfo, ProgrammingGrade, GradeTotal } from "./types";

const initialStudentInfo: StudentInfo[] = [
  { Id: 1, Name: "Lily", Major: "CS", MathsGrade: 78, Status: "graduate", Year: 2023 },
  { Id: 2, Name: "Sam", Major: "SE", MathsGrade: 93, Status: "graduate", Year: 2024 },
  { Id: 3, Name: "Adam", Major: "Math", MathsGrade: 95, Status: "undergraduate", Year: 2025 },
];

const programmingGradeData: ProgrammingGrade[] = [
  { Id: 1, Name: "Lily", Grade: 91, Level: "A" },
  { Id: 3, Name: "Adam", Grade: 63, Level: "C" },
];

const gradeTotalData: GradeTotal[] = [
  { Id: 2, Name: "Sam", Major: "SE", Maths: 93, CSharp: 83, AvgGrade: 88, Rank: 10 },
  { Id: 6, Name: "Lisa", Major: "CS", Maths: 88, CSharp: 92, AvgGrade: 90, Rank: 8 },
];

// Sample data for all tables
const allTablesData = {
  'stu_info': initialStudentInfo,
  'programming_grade': programmingGradeData,
  'grade_total': gradeTotalData,
  // Add more tables as needed
};

const HomePage = () => {
  const [currentTableData, setCurrentTableData] = useState<any[] | null>(null);
  const [currentTableName, setCurrentTableName] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAction = async (actionName: string, params?: any) => {
    switch (actionName) {
      case 'showProgrammingGrade':
        return {
          type: 'table' as const,
          content: programmingGradeData,
          tableName: 'programming_grade'
        };
      case 'showGradeTotal':
        return {
          type: 'table' as const,
          content: gradeTotalData,
          tableName: 'grade_total'
        };
      case 'showStudentInfo':
        return {
          type: 'table' as const,
          content: initialStudentInfo,
          tableName: 'stu_info'
        };
      default:
        return {
          type: 'text' as const,
          content: 'Sorry, I don\'t understand this command.',
        };
    }
  };

  const loadTableToWorkspace = (tableName: string, data: any[]) => {
    setCurrentTableData(data);
    setCurrentTableName(tableName);
    setShowStats(false);
  };

  const renderTableHeaders = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);
    
    return (
      <tr>
        {headers.map(header => (
          <th key={header} className="px-4 py-2 bg-gray-100">{header}</th>
        ))}
      </tr>
    );
  };

  const renderTableRows = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);
    
    return data.map((row, rowIndex) => (
      <tr key={rowIndex} className="border-t">
        {headers.map(header => (
          <td key={`${rowIndex}-${header}`} className="px-4 py-2 text-center">
            {row[header]}
          </td>
        ))}
      </tr>
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setCurrentTableData(parsedData);
          setCurrentTableName(file.name.replace(/\.[^/.]+$/, ""));
          setShowStats(false);
        } else {
          alert("Invalid data format. Please upload a valid JSON array.");
        }
      } catch (error) {
        alert("Error parsing file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
    
    // Reset the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!currentTableData) return;
    
    const dataStr = JSON.stringify(currentTableData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTableName || 'table_data'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    if (!currentTableData || currentTableData.length === 0) return;
    
    const stats: any = {};
    const numericColumns: string[] = [];
    const headers = Object.keys(currentTableData[0]);
    
    // Identify numeric columns
    headers.forEach(header => {
      if (typeof currentTableData[0][header] === 'number') {
        numericColumns.push(header);
      }
    });
    
    // Calculate statistics for numeric columns
    numericColumns.forEach(column => {
      const values = currentTableData.map(row => row[column]);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      stats[column] = {
        min,
        max,
        avg: avg.toFixed(2),
        sum: sum.toFixed(2)
      };
    });
    
    // Count rows
    stats.rowCount = currentTableData.length;
    
    setStatsData(stats);
    setShowStats(true);
  };

  const renderStats = () => {
    if (!statsData) return null;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Table Statistics</h3>
        <p className="mb-2">Row Count: {statsData.rowCount}</p>
        
        {Object.keys(statsData).filter(key => key !== 'rowCount').map(column => (
          <div key={column} className="mb-4">
            <h4 className="font-medium text-blue-600">{column}</h4>
            <div className="grid grid-cols-4 gap-2 mt-1">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Min</span>
                <p>{statsData[column].min}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Max</span>
                <p>{statsData[column].max}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Average</span>
                <p>{statsData[column].avg}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Sum</span>
                <p>{statsData[column].sum}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <Sidebar
          selectedSpreadsheetIndex={0}
          setSelectedSpreadsheetIndex={() => {}}
        />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <h2 className="text-xl font-semibold">Table Workspace</h2>
              </div>
              {currentTableName && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {currentTableName}
                </div>
              )}
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Upload a table (JSON format)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  disabled={!currentTableData}
                  className={`flex items-center space-x-1 px-3 py-2 border rounded-md transition-colors ${
                    currentTableData 
                      ? 'bg-white border-gray-300 hover:bg-gray-50' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Download current table as JSON"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
                
                <button
                  onClick={calculateStats}
                  disabled={!currentTableData}
                  className={`flex items-center space-x-1 px-3 py-2 border rounded-md transition-colors ${
                    currentTableData 
                      ? 'bg-white border-gray-300 hover:bg-gray-50' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Calculate statistics for numeric columns"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Statistics</span>
                </button>
                
                <button
                  onClick={() => {
                    setCurrentTableData(null);
                    setCurrentTableName(null);
                    setShowStats(false);
                  }}
                  disabled={!currentTableData}
                  className={`flex items-center space-x-1 px-3 py-2 border rounded-md transition-colors ${
                    currentTableData 
                      ? 'bg-white border-gray-300 hover:bg-gray-50' 
                      : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Clear workspace"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
          
          {showStats && statsData ? (
            <div className="mb-6">
              {renderStats()}
              <button
                onClick={() => setShowStats(false)}
                className="mt-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Hide Statistics
              </button>
            </div>
          ) : currentTableData ? (
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
              <thead>
                {renderTableHeaders(currentTableData)}
              </thead>
              <tbody>
                {renderTableRows(currentTableData)}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg shadow-md text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-xl">Workspace is empty</p>
              <p className="mt-2">Upload a table or ask the assistant to find tables for you</p>
            </div>
          )}
        </div>
      </div>
      
      <CustomAssistant
        onAction={handleAction}
        presetData={{
          programmingGrade: programmingGradeData,
          gradeTotal: gradeTotalData,
        }}
        onLoadTable={loadTableToWorkspace}
      />
    </div>
  );
};

export default HomePage;
