'use client';

import React, { useState, useEffect } from 'react';
import CustomAssistant from './CustomAssistant';
import TableWorkspace from './TableWorkspace';
import tableDataService from '../services/tableDataService';

const ProcessContent: React.FC = () => {
  const [workspaceTables, setWorkspaceTables] = useState<{
    tableName: string;
    data: any[];
  }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [allTables, setAllTables] = useState<{
    name: string;
    data: any[];
  }[]>([]);

  // 加载所有表格
  const loadAllTables = () => {
    const tableNames = tableDataService.getAllTableNames();
    const tables = tableNames.map(name => ({
      name,
      data: tableDataService.getTableData(name) || []
    })).filter(table => table.data.length > 0);
    
    setAllTables(tables);
  };

  // 加载工作区表格
  useEffect(() => {
    // 加载所有表格
    loadAllTables();
    
    // 从localStorage获取工作区表格
    if (typeof window !== 'undefined') {
      const storedWorkspace = localStorage.getItem('tableWorkspace');
      if (storedWorkspace) {
        try {
          const parsedWorkspace = JSON.parse(storedWorkspace);
          
          // 加载每个表格的数据
          const loadedTables = parsedWorkspace.map((tableName: string) => {
            const data = tableDataService.getTableData(tableName);
            return { tableName, data: data || [] };
          }).filter((table: any) => table.data.length > 0);
          
          setWorkspaceTables(loadedTables);
        } catch (error) {
          console.error('加载工作区出错:', error);
        }
      }
      
      // 添加localStorage事件监听器，当表格数据变化时刷新
      const handleStorageChange = () => {
        loadAllTables();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  // 保存工作区到localStorage
  const saveWorkspaceToStorage = (tables: { tableName: string; data: any[] }[]) => {
    if (typeof window !== 'undefined') {
      const tableNames = tables.map(table => table.tableName);
      localStorage.setItem('tableWorkspace', JSON.stringify(tableNames));
    }
  };

  // 添加表格到工作区
  const handleAddToWorkspace = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (!data) return;
    
    // 检查表格是否已在工作区
    const exists = workspaceTables.some(t => t.tableName === tableName);
    
    if (!exists) {
      const updatedWorkspace = [...workspaceTables, { tableName, data }];
      setWorkspaceTables(updatedWorkspace);
      saveWorkspaceToStorage(updatedWorkspace);
    }
  };

  // 从工作区移除表格
  const handleRemoveFromWorkspace = (tableName: string) => {
    const updatedWorkspace = workspaceTables.filter(t => t.tableName !== tableName);
    setWorkspaceTables(updatedWorkspace);
    saveWorkspaceToStorage(updatedWorkspace);
  };

  // 清空工作区
  const handleClearWorkspace = () => {
    setWorkspaceTables([]);
    saveWorkspaceToStorage([]);
  };

  // 选择表格
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName === selectedTable ? null : tableName);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">数据处理</h2>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* 左侧：工作区 */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-800">工作区</h3>
            {workspaceTables.length > 0 && (
              <button
                onClick={handleClearWorkspace}
                className="text-sm text-red-500 hover:text-red-700"
              >
                清空工作区
              </button>
            )}
          </div>
          
          {workspaceTables.length > 0 ? (
            <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm">
              <TableWorkspace 
                tables={workspaceTables}
                onRemoveTable={handleRemoveFromWorkspace}
                selectedTable={selectedTable}
                onSelectTable={handleSelectTable}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-sm p-8 text-center">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">工作区为空</h3>
                <p className="mt-1 text-sm text-gray-500">从仓库或搜索结果中添加表格到工作区</p>
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧：AI助手 */}
        <div className="flex flex-col h-full overflow-hidden">
          <h3 className="text-lg font-medium text-gray-800 mb-2">AI助手</h3>
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <CustomAssistant 
              workspaceTables={workspaceTables.map(t => ({ 
                name: t.tableName, 
                data: t.data 
              }))}
              onClearWorkspace={handleClearWorkspace}
              allTables={allTables}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessContent; 