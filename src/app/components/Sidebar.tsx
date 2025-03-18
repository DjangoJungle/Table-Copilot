import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import tableDataService from '../services/tableDataService';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [tableList, setTableList] = useState<string[]>([]);
  
  // 加载表格列表
  const loadTableList = () => {
    const tables = tableDataService.getAllTableNames();
    setTableList(tables);
  };
  
  useEffect(() => {
    loadTableList();
    
    // 添加localStorage事件监听器，当表格数据变化时刷新列表
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        loadTableList();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // 每5秒刷新一次表格列表
      const intervalId = setInterval(loadTableList, 5000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
      };
    }
  }, []);
  
  const navItems = [
    { path: '/', label: 'Repository', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { path: '/process', label: 'Process', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 应用标题 */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Table Copilot</h1>
        <p className="text-sm text-gray-500">智能表格分析助手</p>
      </div>
      
      {/* 主导航 */}
      <nav className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">主导航</h2>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* 表格列表 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">可用表格</h2>
          <button 
            onClick={loadTableList}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            刷新
          </button>
        </div>
        
        {tableList.length > 0 ? (
          <ul className="space-y-1">
            {tableList.map((tableName) => (
              <li key={tableName} className="text-sm">
                <button 
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    // 预览表格功能可以在这里实现
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 mr-2 text-gray-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {tableName}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">暂无可用表格</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
