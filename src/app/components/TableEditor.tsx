import React, { useState, useEffect } from 'react';
import tableDataService from '../services/tableDataService';

interface TableEditorProps {
  tableName: string;
  data: any[];
  onSave: (tableName: string, data: any[]) => void;
  onSaveAsNew: (originalName: string, newName: string, data: any[]) => void;
  onCancel: () => void;
}

const TableEditor: React.FC<TableEditorProps> = ({
  tableName,
  data,
  onSave,
  onSaveAsNew,
  onCancel
}) => {
  const [editedData, setEditedData] = useState<any[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [cellValue, setCellValue] = useState<string>('');

  // 初始化编辑数据
  useEffect(() => {
    setEditedData([...data]);
  }, [data]);

  // 获取表格列
  const columns = editedData.length > 0 ? Object.keys(editedData[0]) : [];

  // 处理单元格编辑
  const handleCellEdit = (rowIndex: number, columnName: string, value: any) => {
    const newData = [...editedData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnName]: value
    };
    setEditedData(newData);
  };

  // 开始编辑单元格
  const startEditing = (rowIndex: number, columnName: string) => {
    setEditingCell({ rowIndex, columnName });
    setCellValue(String(editedData[rowIndex][columnName] ?? ''));
  };

  // 完成编辑单元格
  const finishEditing = () => {
    if (editingCell) {
      const { rowIndex, columnName } = editingCell;
      let value: any = cellValue;

      // 尝试转换为数字
      if (!isNaN(Number(cellValue)) && cellValue.trim() !== '') {
        value = Number(cellValue);
      }

      handleCellEdit(rowIndex, columnName, value);
      setEditingCell(null);
    }
  };

  // 添加新行
  const addRow = () => {
    if (editedData.length === 0) return;
    
    // 创建一个空行，使用现有列作为键
    const newRow: Record<string, any> = {};
    columns.forEach(column => {
      newRow[column] = '';
    });
    
    setEditedData([...editedData, newRow]);
  };

  // 删除行
  const deleteRow = (rowIndex: number) => {
    const newData = [...editedData];
    newData.splice(rowIndex, 1);
    setEditedData(newData);
  };

  // 保存表格
  const handleSave = () => {
    onSave(tableName, editedData);
  };

  // 保存为新表格
  const handleSaveAsNew = () => {
    if (!newTableName.trim()) {
      alert('请输入新表格名称');
      return;
    }
    
    try {
      onSaveAsNew(tableName, newTableName, editedData);
      setShowSaveAsDialog(false);
    } catch (error) {
      alert(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">编辑表格: {tableName}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSaveAsDialog(true)}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              另存为
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          {editedData.length > 0 ? (
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-gray-100 border">#</th>
                  {columns.map(column => (
                    <th key={column} className="px-4 py-2 bg-gray-100 border">{column}</th>
                  ))}
                  <th className="px-4 py-2 bg-gray-100 border">操作</th>
                </tr>
              </thead>
              <tbody>
                {editedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    <td className="px-4 py-2 border text-center">{rowIndex + 1}</td>
                    {columns.map(column => (
                      <td 
                        key={`${rowIndex}-${column}`} 
                        className="px-4 py-2 border text-center"
                        onClick={() => startEditing(rowIndex, column)}
                      >
                        {editingCell && 
                         editingCell.rowIndex === rowIndex && 
                         editingCell.columnName === column ? (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={finishEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                finishEditing();
                              }
                            }}
                            className="w-full px-2 py-1 border border-blue-500 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          row[column] !== null && row[column] !== undefined ? String(row[column]) : ''
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="text-red-500 hover:text-red-700"
                        title="删除行"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p>表格为空或数据格式无效</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <button
            onClick={addRow}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            disabled={editedData.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加行
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
      
      {/* 另存为对话框 */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">另存为新表格</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                新表格名称
              </label>
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入新表格名称"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveAsDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleSaveAsNew}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableEditor; 