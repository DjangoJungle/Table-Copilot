import React, { useEffect, useState } from 'react';
import { TableData } from '../types';
import tableDataService from '../services/tableDataService';
import TablePreview from './TablePreview';

interface SidebarProps {
  selectedSpreadsheetIndex: number;
  setSelectedSpreadsheetIndex: (index: number) => void;
  onLoadTable: (tableName: string, data: any[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLoadTable }) => {
  const [repositoryData, setRepositoryData] = useState<TableData[]>([
    {
      id: 'grades',
      name: 'Grades',
      type: 'directory',
      children: []
    },
    {
      id: 'students',
      name: 'Students',
      type: 'directory',
      children: []
    },
    {
      id: 'courses',
      name: 'Courses',
      type: 'directory',
      children: []
    },
    {
      id: 'faculty',
      name: 'Faculty',
      type: 'directory',
      children: []
    },
    {
      id: 'reports',
      name: 'Reports',
      type: 'directory',
      children: []
    }
  ]);
  
  // 预览状态
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewTableName, setPreviewTableName] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  // 初始化时加载表格列表
  useEffect(() => {
    updateTableList();

    // 只在浏览器环境中添加事件监听器
    if (typeof window !== 'undefined') {
      // 添加事件监听器，监听localStorage变化
      window.addEventListener('storage', handleStorageChange);
      
      // 创建一个定时器，每5秒刷新一次表格列表
      const intervalId = setInterval(updateTableList, 5000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
      };
    }
  }, []);

  // 处理localStorage变化
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'table_copilot_tables') {
      updateTableList();
    }
  };

  // 更新表格列表
  const updateTableList = () => {
    const tableNames = tableDataService.getAllTableNames();
    
    // 将表格分类到不同目录
    const newRepositoryData = [...repositoryData];
    
    // 清空所有子项
    newRepositoryData.forEach(dir => {
      dir.children = [];
    });
    
    // 根据表名分类
    tableNames.forEach(tableName => {
      let targetDir = newRepositoryData[0]; // 默认放在第一个目录
      
      if (tableName.includes('grade') || tableName.includes('score')) {
        targetDir = newRepositoryData.find(dir => dir.id === 'grades') || targetDir;
      } else if (tableName.includes('stu') || tableName.includes('student')) {
        targetDir = newRepositoryData.find(dir => dir.id === 'students') || targetDir;
      } else if (tableName.includes('course')) {
        targetDir = newRepositoryData.find(dir => dir.id === 'courses') || targetDir;
      } else if (tableName.includes('teacher') || tableName.includes('faculty') || tableName.includes('department')) {
        targetDir = newRepositoryData.find(dir => dir.id === 'faculty') || targetDir;
      } else if (tableName.includes('report')) {
        targetDir = newRepositoryData.find(dir => dir.id === 'reports') || targetDir;
      }
      
      targetDir.children?.push({
        id: tableName,
        name: `${tableName}.csv`,
        type: 'file'
      });
    });
    
    setRepositoryData(newRepositoryData);
  };

  const handleLoadTable = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (data) {
      onLoadTable(tableName, data);
      // 加载表格后刷新列表
      updateTableList();
    }
  };

  const handlePreviewTable = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (data) {
      setPreviewData(data);
      setPreviewTableName(tableName);
      setShowPreview(true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const loadPreviewToWorkspace = () => {
    if (previewData && previewTableName) {
      onLoadTable(previewTableName, previewData);
      closePreview();
    }
  };

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
  
    // 文件项添加操作按钮
    const tableName = item.id;
    
    return (
      <div className="group">
        <div
          className="flex items-center px-4 py-2 hover:bg-gray-100"
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
          <span className="flex-1 cursor-pointer" onClick={() => handlePreviewTable(tableName)}>
            {item.name}
          </span>
          <div className="hidden group-hover:flex space-x-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLoadTable(tableName);
              }}
              className="p-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              title="加载到工作区"
            >
              加载
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewTable(tableName);
              }}
              className="p-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              title="预览表格"
            >
              预览
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      
      {/* 表格预览弹窗 */}
      {showPreview && previewData && (
        <TablePreview
          tableName={previewTableName}
          data={previewData}
          onClose={closePreview}
          onLoadToWorkspace={loadPreviewToWorkspace}
        />
      )}
    </div>
  );
};

export default Sidebar;
