'use client';

import React, { useState } from 'react';
import tableDataService from '../services/tableDataService';
import TableWorkspace from './TableWorkspace';

const SearchContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tableName: string;
    data: any[];
    matchCount: number;
  }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{
    tableName: string;
    data: any[];
  } | null>(null);
  const [workspaceTables, setWorkspaceTables] = useState<{
    tableName: string;
    data: any[];
  }[]>([]);

  // 执行搜索
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // 获取所有表格
      const tableNames = tableDataService.getAllTableNames();
      
      // 搜索结果
      const results: {
        tableName: string;
        data: any[];
        matchCount: number;
      }[] = [];
      
      // 在每个表格中搜索
      tableNames.forEach(tableName => {
        const tableData = tableDataService.getTableData(tableName);
        
        if (!tableData || !Array.isArray(tableData) || tableData.length === 0) return;
        
        // 搜索匹配项
        const matches = tableData.filter(row => {
          // 将每个单元格的值转换为字符串并检查是否包含搜索词
          return Object.values(row).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
        
        if (matches.length > 0) {
          results.push({
            tableName,
            data: matches,
            matchCount: matches.length
          });
        }
      });
      
      // 按匹配数量排序结果
      results.sort((a, b) => b.matchCount - a.matchCount);
      
      setSearchResults(results);
    } catch (error) {
      console.error('搜索出错:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 查看表格详情
  const handleViewTable = (tableName: string, data: any[]) => {
    setSelectedTable({
      tableName,
      data
    });
  };

  // 添加到工作区
  const handleAddToWorkspace = (tableName: string, data: any[]) => {
    // 检查表格是否已在工作区
    const exists = workspaceTables.some(t => t.tableName === tableName);
    
    if (!exists) {
      setWorkspaceTables([...workspaceTables, { tableName, data }]);
    }
  };

  // 从工作区移除表格
  const handleRemoveFromWorkspace = (tableName: string) => {
    setWorkspaceTables(workspaceTables.filter(t => t.tableName !== tableName));
  };

  // 清空工作区
  const handleClearWorkspace = () => {
    setWorkspaceTables([]);
  };

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">搜索中...</span>
        </div>
      );
    }
    
    if (searchResults.length === 0 && searchTerm.trim() !== '') {
      return (
        <div className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">未找到匹配项</h3>
          <p className="mt-1 text-sm text-gray-500">尝试使用不同的搜索词或检查拼写</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {searchResults.map((result, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-gray-800">{result.tableName}</h3>
                <p className="text-sm text-gray-500">找到 {result.matchCount} 个匹配项</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewTable(result.tableName, result.data)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  查看
                </button>
                <button
                  onClick={() => handleAddToWorkspace(result.tableName, result.data)}
                  className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                >
                  添加到工作区
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {Object.keys(result.data[0]).map((column, colIndex) => (
                      <th 
                        key={colIndex}
                        className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.data.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td 
                          key={cellIndex}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                        >
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {result.data.length > 3 && (
                <div className="text-center py-2 text-sm text-gray-500 border-t">
                  显示前3行，共 {result.data.length} 行
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">表格搜索</h2>
        
        <div className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="搜索表格内容..."
              className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {isSearching ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                搜索中
              </div>
            ) : (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索
              </div>
            )}
          </button>
        </div>
      </div>
      
      {/* 工作区 */}
      {workspaceTables.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-800">工作区</h3>
            <button
              onClick={handleClearWorkspace}
              className="text-sm text-red-500 hover:text-red-700"
            >
              清空工作区
            </button>
          </div>
          
          <TableWorkspace 
            tables={workspaceTables}
            onRemoveTable={handleRemoveFromWorkspace}
          />
        </div>
      )}
      
      {/* 表格详情 */}
      {selectedTable && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-800">{selectedTable.tableName}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAddToWorkspace(selectedTable.tableName, selectedTable.data)}
                className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
              >
                添加到工作区
              </button>
              <button
                onClick={() => setSelectedTable(null)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {Object.keys(selectedTable.data[0]).map((column, colIndex) => (
                      <th 
                        key={colIndex}
                        className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTable.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <td 
                          key={cellIndex}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-500"
                        >
                          {value !== null && value !== undefined ? String(value) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* 搜索结果 */}
      <div className="flex-1 overflow-auto">
        {renderSearchResults()}
      </div>
    </div>
  );
};

export default SearchContent; 