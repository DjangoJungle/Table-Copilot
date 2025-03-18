'use client';

import React, { useState, useRef, useEffect } from 'react';
import tableDataService from '../services/tableDataService';

const RepositoryContent: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载表格列表
  const loadTables = () => {
    const tableNames = tableDataService.getAllTableNames();
    setTables(tableNames);
  };

  useEffect(() => {
    loadTables();
    
    // 添加localStorage事件监听器，当表格数据变化时刷新列表
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        loadTables();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  // 选择表格
  const handleSelectTable = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (data) {
      setSelectedTable(tableName);
      setTableData(data);
      setShowStats(false);
      
      // 使用自定义事件通知Layout组件表格被选中
      if (typeof window !== 'undefined') {
        // 创建自定义事件
        const event = new CustomEvent('tableSelected', {
          detail: { tableName, data }
        });
        
        // 触发事件
        window.dispatchEvent(event);
        
        // 同时更新localStorage，确保页面刷新后仍能保持状态
        const storedWorkspace = localStorage.getItem('tableWorkspace') || '[]';
        try {
          const parsedWorkspace = JSON.parse(storedWorkspace);
          
          // 检查表格是否已在工作区
          if (!parsedWorkspace.includes(tableName)) {
            // 添加到工作区
            parsedWorkspace.push(tableName);
            localStorage.setItem('tableWorkspace', JSON.stringify(parsedWorkspace));
            
            // 触发storage事件，通知其他组件
            window.dispatchEvent(new Event('storage'));
          }
        } catch (error) {
          console.error('更新工作区出错:', error);
        }
      }
    }
  };

  // 上传表格
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // 检查是否为数组
        if (!Array.isArray(jsonData)) {
          alert('上传的文件必须包含一个数组');
          return;
        }
        
        // 检查是否为空数组
        if (jsonData.length === 0) {
          alert('上传的数组不能为空');
          return;
        }
        
        // 生成表格名称
        const timestamp = new Date().getTime();
        const tableName = `table_${timestamp}`;
        
        // 保存表格数据
        tableDataService.addTable(tableName, jsonData);
        
        // 加载表格
        handleSelectTable(tableName);
        
        // 刷新表格列表
        loadTables();
        
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('无法解析JSON文件: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.readAsText(file);
  };

  // 计算统计信息
  const calculateStats = () => {
    if (!tableData) return;
    
    const stats: any = {
      rowCount: tableData.length,
      columnCount: Object.keys(tableData[0]).length,
      columns: {}
    };
    
    // 获取列名
    const columns = Object.keys(tableData[0]);
    
    // 计算每列的统计信息
    columns.forEach(column => {
      const values = tableData.map(row => row[column]);
      const numericValues = values.filter(value => typeof value === 'number');
      
      stats.columns[column] = {
        type: numericValues.length === values.length ? 'numeric' : 'mixed',
        uniqueValues: new Set(values).size,
        nullCount: values.filter(value => value === null || value === undefined).length
      };
      
      // 如果是数值列，计算更多统计信息
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        
        stats.columns[column] = {
          ...stats.columns[column],
          min,
          max,
          avg,
          sum
        };
      }
    });
    
    setStats(stats);
    setShowStats(true);
  };

  // 下载表格
  const handleDownload = () => {
    if (!tableData || !selectedTable) return;
    
    const jsonString = JSON.stringify(tableData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 删除表格
  const handleDeleteTable = (tableName: string) => {
    if (window.confirm(`确定要删除表格 ${tableName} 吗？此操作不可撤销。`)) {
      tableDataService.deleteTable(tableName);
      
      if (selectedTable === tableName) {
        setSelectedTable(null);
        setTableData(null);
        setShowStats(false);
      }
      
      loadTables();
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
    
    return data.slice(0, 100).map((row, rowIndex) => (
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

  // 渲染统计信息
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">表格概览</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">行数</p>
              <p className="text-xl font-semibold text-blue-600">{stats.rowCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">列数</p>
              <p className="text-xl font-semibold text-green-600">{stats.columnCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-2">列统计</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">列名</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">唯一值数</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">空值数</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最小值</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最大值</th>
                  <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均值</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.columns).map(([column, columnStats]: [string, any], index) => (
                  <tr key={column} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{column}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{columnStats.type}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{columnStats.uniqueValues}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{columnStats.nullCount}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {columnStats.min !== undefined ? columnStats.min : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {columnStats.max !== undefined ? columnStats.max : '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {columnStats.avg !== undefined ? columnStats.avg.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">表格仓库</h2>
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
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            上传表格
          </button>
        </div>
      </div>
      
      {tables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {tables.map((tableName) => (
            <div 
              key={tableName} 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedTable === tableName ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleSelectTable(tableName)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="font-medium">{tableName}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTable(tableName);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">没有可用的表格</h3>
          <p className="mt-1 text-sm text-gray-500">上传一个JSON文件或使用助手创建表格</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            上传表格
          </button>
        </div>
      )}
      
      {selectedTable && tableData && (
        <div className="bg-white rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-800">{selectedTable}</h3>
            <div className="flex space-x-2">
              <button
                onClick={calculateStats}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                {showStats ? '查看数据' : '查看统计'}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
              >
                下载
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {showStats ? (
              renderStats()
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    {renderTableHeaders(tableData)}
                  </thead>
                  <tbody>
                    {renderTableRows(tableData)}
                  </tbody>
                </table>
                {tableData.length > 100 && (
                  <div className="text-center mt-4 text-sm text-gray-500">
                    显示前100行数据，共 {tableData.length} 行
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryContent; 