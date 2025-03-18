import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TableWorkspace from './TableWorkspace';
import CustomAssistant from './CustomAssistant';
import { useRouter, usePathname } from 'next/navigation';
import tableDataService from '../services/tableDataService';

// 创建一个全局状态管理对象，确保在页面切换时保持状态
const globalState = {
  workspaceTables: [] as {
    tableName: string;
    data: any[];
  }[],
  currentTableName: null as string | null,
  currentTableData: null as any[] | null,
};

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab }) => {
  const [currentTableName, setCurrentTableName] = useState<string | null>(globalState.currentTableName);
  const [currentTableData, setCurrentTableData] = useState<any[] | null>(globalState.currentTableData);
  const [workspaceTables, setWorkspaceTables] = useState<{
    tableName: string;
    data: any[];
  }[]>(globalState.workspaceTables);
  const pathname = usePathname();
  
  // 更新全局状态
  const updateGlobalState = (
    tables: typeof workspaceTables, 
    tableName: string | null, 
    tableData: any[] | null
  ) => {
    globalState.workspaceTables = tables;
    globalState.currentTableName = tableName;
    globalState.currentTableData = tableData;
  };
  
  // 处理加载表格到工作区
  const handleLoadTable = (tableName: string, data: any[]) => {
    setCurrentTableName(tableName);
    setCurrentTableData(data);
    
    // 检查表格是否已在工作区
    const exists = workspaceTables.some(t => t.tableName === tableName);
    
    if (!exists && data.length > 0) {
      const updatedWorkspace = [...workspaceTables, { tableName, data }];
      setWorkspaceTables(updatedWorkspace);
      updateGlobalState(updatedWorkspace, tableName, data);
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        const tableNames = updatedWorkspace.map(table => table.tableName);
        localStorage.setItem('tableWorkspace', JSON.stringify(tableNames));
        
        // 触发storage事件，通知其他组件
        window.dispatchEvent(new Event('storage'));
      }
    } else {
      updateGlobalState(workspaceTables, tableName, data);
    }
  };
  
  // 从工作区移除表格
  const handleRemoveFromWorkspace = (tableName: string) => {
    const updatedWorkspace = workspaceTables.filter(t => t.tableName !== tableName);
    setWorkspaceTables(updatedWorkspace);
    
    // 如果移除的是当前选中的表格，清空当前表格或选择另一个表格
    let newCurrentName = currentTableName;
    let newCurrentData = currentTableData;
    
    if (currentTableName === tableName) {
      if (updatedWorkspace.length > 0) {
        newCurrentName = updatedWorkspace[0].tableName;
        newCurrentData = updatedWorkspace[0].data;
      } else {
        newCurrentName = null;
        newCurrentData = null;
      }
      setCurrentTableName(newCurrentName);
      setCurrentTableData(newCurrentData);
    }
    
    updateGlobalState(updatedWorkspace, newCurrentName, newCurrentData);
    
    // 保存到localStorage
    if (typeof window !== 'undefined') {
      const tableNames = updatedWorkspace.map(table => table.tableName);
      localStorage.setItem('tableWorkspace', JSON.stringify(tableNames));
      
      // 触发storage事件，通知其他组件
      window.dispatchEvent(new Event('storage'));
    }
  };
  
  // 监听localStorage变化，更新工作区
  useEffect(() => {
    const handleStorageChange = () => {
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
            
            // 更新工作区
            setWorkspaceTables(loadedTables);
            
            // 如果当前没有选中表格，但工作区有表格，则选中第一个
            if (!currentTableName && loadedTables.length > 0) {
              setCurrentTableName(loadedTables[0].tableName);
              setCurrentTableData(loadedTables[0].data);
              updateGlobalState(loadedTables, loadedTables[0].tableName, loadedTables[0].data);
            } else {
              updateGlobalState(loadedTables, currentTableName, currentTableData);
            }
          } catch (error) {
            console.error('加载工作区出错:', error);
          }
        }
      }
    };
    
    // 初始加载
    if (workspaceTables.length === 0) {
      handleStorageChange();
    }
    
    // 添加事件监听
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // 添加自定义事件监听，用于组件间通信
      window.addEventListener('tableSelected', (e: any) => {
        const { tableName, data } = e.detail;
        handleLoadTable(tableName, data);
      });
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('tableSelected', (e: any) => {
          const { tableName, data } = e.detail;
          handleLoadTable(tableName, data);
        });
      };
    }
  }, [currentTableName, currentTableData]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* 左侧导航栏 */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <Sidebar />
      </div>
      
      {/* 中间内容区 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 表格工作区 */}
        <div className="h-1/2 border-b border-gray-200 overflow-auto">
          <TableWorkspace 
            tables={workspaceTables}
            selectedTable={currentTableName}
            onSelectTable={(tableName) => {
              const table = workspaceTables.find(t => t.tableName === tableName);
              if (table) {
                setCurrentTableName(tableName);
                setCurrentTableData(table.data);
                updateGlobalState(workspaceTables, tableName, table.data);
              }
            }}
            onRemoveTable={handleRemoveFromWorkspace}
          />
        </div>
        
        {/* 功能区 - 根据路由显示不同内容 */}
        <div className="h-1/2 overflow-auto p-4">
          {children}
        </div>
      </div>
      
      {/* 右侧Copilot区 */}
      <div className="w-96 border-l border-gray-200 bg-white shadow-sm overflow-auto">
        <CustomAssistant 
          onLoadTable={handleLoadTable}
          currentTableName={currentTableName}
          currentTableData={currentTableData}
          workspaceTables={workspaceTables.map(t => ({ 
            name: t.tableName, 
            data: t.data 
          }))}
          onClearWorkspace={() => {
            setWorkspaceTables([]);
            setCurrentTableName(null);
            setCurrentTableData(null);
            updateGlobalState([], null, null);
            
            // 清空localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('tableWorkspace');
              
              // 触发storage事件，通知其他组件
              window.dispatchEvent(new Event('storage'));
            }
          }}
        />
      </div>
    </div>
  );
};

export default Layout; 