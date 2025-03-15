"use client";
import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { CustomAssistant } from "./components/CustomAssistant";
import TableEditor from "./components/TableEditor";
import tableDataService from "./services/tableDataService";

const HomePage = () => {
  const [currentTableData, setCurrentTableData] = useState<any[] | null>(null);
  const [currentTableName, setCurrentTableName] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 表格编辑状态
  const [showTableEditor, setShowTableEditor] = useState<boolean>(false);

  // 初始化时加载表格列表
  useEffect(() => {
    const tableNames = tableDataService.getAllTableNames();
    setAvailableTables(tableNames);
  }, []);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const tableName = file.name.replace(/\.[^/.]+$/, "");
          
          // 保存到数据服务
          try {
            const response = await fetch('/api/tables', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tableName,
                data: parsedData
              })
            });
            
            if (!response.ok) {
              throw new Error(`保存表格失败: ${response.status}`);
            }
            
            // 更新可用表格列表
            const tableNames = tableDataService.getAllTableNames();
            setAvailableTables(tableNames);
            
            // 加载到工作区
            setCurrentTableData(parsedData);
            setCurrentTableName(tableName);
            setShowStats(false);
          } catch (error) {
            console.error('保存表格失败:', error);
            alert(`保存表格失败: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          alert("无效的数据格式。请上传有效的JSON数组。");
        }
      } catch (error) {
        alert("解析文件出错。请确保它是有效的JSON文件。");
      }
    };
    reader.readAsText(file);
    
    // 重置输入值以允许再次上传相同的文件
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
    
    if (showStats) {
      // 如果已经显示统计，则关闭
      setShowStats(false);
      return;
    }
    
    const stats: any = {};
    const numericColumns: string[] = [];
    const headers = Object.keys(currentTableData[0]);
    
    // 识别数值列
    headers.forEach(header => {
      if (typeof currentTableData[0][header] === 'number') {
        numericColumns.push(header);
      }
    });
    
    // 计算数值列的统计信息
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
    
    // 计算行数
    stats.rowCount = currentTableData.length;
    
    setStatsData(stats);
    setShowStats(true);
  };

  const handleLoadTable = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (data) {
      loadTableToWorkspace(tableName, data);
    }
  };

  const handleClearWorkspace = () => {
    setCurrentTableData(null);
    setCurrentTableName(null);
    setShowStats(false);
  };

  // 编辑当前表格
  const handleEditCurrentTable = () => {
    if (!currentTableName || !currentTableData) return;
    setShowTableEditor(true);
  };

  // 保存编辑后的表格
  const handleSaveEditedTable = (tableName: string, data: any[]) => {
    try {
      tableDataService.updateTableData(tableName, data);
      setShowTableEditor(false);
      
      // 更新工作区
      loadTableToWorkspace(tableName, data);
      
      // 刷新表格列表
      const tableNames = tableDataService.getAllTableNames();
      setAvailableTables(tableNames);
    } catch (error) {
      console.error('保存表格出错:', error);
      alert(`保存表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 另存为新表格
  const handleSaveAsNewTable = (originalName: string, newName: string, data: any[]) => {
    try {
      // 检查表格名称是否已存在
      const existingTables = tableDataService.getAllTableNames();
      if (existingTables.includes(newName)) {
        throw new Error(`表格名称 ${newName} 已存在`);
      }
      
      tableDataService.saveAsNewTable(originalName, newName, data);
      setShowTableEditor(false);
      
      // 更新工作区
      loadTableToWorkspace(newName, data);
      
      // 刷新表格列表
      const tableNames = tableDataService.getAllTableNames();
      setAvailableTables(tableNames);
      
      // 只在浏览器环境中触发事件
      if (typeof window !== 'undefined') {
        // 触发localStorage事件，通知其他组件刷新
        window.dispatchEvent(new Event('storage'));
      }
      
      // 显示成功消息
      alert(`表格已成功另存为 ${newName}`);
    } catch (error) {
      console.error('另存为新表格出错:', error);
      alert(`另存为新表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 渲染统计信息
  const renderStats = () => {
    if (!statsData) return null;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-3">表格统计</h3>
        <p className="mb-2">行数: {statsData.rowCount}</p>
        
        {Object.keys(statsData).filter(key => key !== 'rowCount').map(column => (
          <div key={column} className="mb-4">
            <h4 className="font-medium text-blue-600">{column}</h4>
            <div className="grid grid-cols-4 gap-2 mt-1">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">最小值</span>
                <p>{statsData[column].min}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">最大值</span>
                <p>{statsData[column].max}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">平均值</span>
                <p>{statsData[column].avg}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">总和</span>
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
          onLoadTable={loadTableToWorkspace}
        />
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <h2 className="text-xl font-semibold">表格工作区</h2>
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
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>上传表格</span>
                </button>
                
                {currentTableData && (
                  <>
                    <button
                      onClick={handleEditCurrentTable}
                      className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>编辑</span>
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>下载</span>
                    </button>
                    
                    <button
                      onClick={calculateStats}
                      className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>{showStats ? '隐藏统计' : '显示统计'}</span>
                    </button>

                    <button
                      onClick={handleClearWorkspace}
                      className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>清空</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-4">
              {showStats ? (
                renderStats()
              ) : currentTableData ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      {renderTableHeaders(currentTableData)}
                    </thead>
                    <tbody>
                      {renderTableRows(currentTableData)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">没有表格数据</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    上传一个JSON文件或使用助手加载表格数据
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      上传表格
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CustomAssistant
        onLoadTable={loadTableToWorkspace}
        currentTableName={currentTableName}
        currentTableData={currentTableData}
      />
      
      {/* 表格编辑模态框 */}
      {showTableEditor && currentTableData && currentTableName && (
        <TableEditor
          tableName={currentTableName}
          data={currentTableData}
          onSave={handleSaveEditedTable}
          onSaveAsNew={handleSaveAsNewTable}
          onCancel={() => setShowTableEditor(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
