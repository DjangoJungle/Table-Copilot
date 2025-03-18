'use client';

import React, { useState } from 'react';

interface TableWorkspaceProps {
  tables?: {
    tableName: string;
    data: any[];
  }[];
  onRemoveTable?: (tableName: string) => void;
  selectedTable?: string | null;
  onSelectTable?: (tableName: string) => void;
}

const TableWorkspace: React.FC<TableWorkspaceProps> = ({ 
  tables = [], // 设置默认值为空数组
  onRemoveTable,
  selectedTable,
  onSelectTable
}) => {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // 切换表格展开状态
  const toggleExpand = (tableName: string) => {
    setExpandedTable(expandedTable === tableName ? null : tableName);
  };

  // 选择表格
  const handleSelectTable = (tableName: string) => {
    if (onSelectTable) {
      onSelectTable(tableName);
    }
  };

  // 渲染表格头部
  const renderTableHeaders = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    
    return (
      <tr>
        {columns.map((column, index) => (
          <th 
            key={index}
            className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border"
          >
            {column}
          </th>
        ))}
      </tr>
    );
  };

  // 渲染表格行
  const renderTableRows = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    
    return data.slice(0, 10).map((row, rowIndex) => (
      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        {columns.map((column, colIndex) => (
          <td 
            key={`${rowIndex}-${colIndex}`}
            className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 border"
          >
            {row[column] !== null && row[column] !== undefined ? String(row[column]) : ''}
          </td>
        ))}
      </tr>
    ));
  };

  if (tables.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        工作区中没有表格
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {tables.map((table) => (
        <div 
          key={table.tableName} 
          className={`border rounded-lg overflow-hidden transition-all ${
            selectedTable === table.tableName ? 'border-blue-500 shadow-md' : 'border-gray-200'
          }`}
        >
          <div 
            className={`flex items-center justify-between p-3 cursor-pointer ${
              selectedTable === table.tableName ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleSelectTable(table.tableName)}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <h3 className="font-medium">{table.tableName}</h3>
                <p className="text-xs text-gray-500">{table.data.length} 行数据</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onRemoveTable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTable(table.tableName);
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(table.tableName);
                }}
                className="text-gray-400 hover:text-blue-500 p-1"
              >
                {expandedTable === table.tableName ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {expandedTable === table.tableName && (
            <div className="border-t border-gray-200 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  {renderTableHeaders(table.data)}
                </thead>
                <tbody>
                  {renderTableRows(table.data)}
                </tbody>
              </table>
              
              {table.data.length > 10 && (
                <div className="text-center py-2 text-sm text-gray-500 border-t">
                  显示前10行，共 {table.data.length} 行
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TableWorkspace; 