import React from 'react';

interface TablePreviewProps {
  tableName: string;
  data: any[];
  onClose: () => void;
  onLoadToWorkspace: () => void;
}

const TablePreview: React.FC<TablePreviewProps> = ({ 
  tableName, 
  data, 
  onClose,
  onLoadToWorkspace
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">预览: {tableName}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p>表格为空或数据格式无效</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  const headers = Object.keys(data[0]);
  const previewData = data.slice(0, 5); // 只显示前5行

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">预览: {tableName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-2 text-sm text-gray-500">
          共 {data.length} 行数据，显示前 {Math.min(5, data.length)} 行
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-2 bg-gray-100 border">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {headers.map(header => (
                    <td key={`${rowIndex}-${header}`} className="px-4 py-2 border text-center">
                      {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onLoadToWorkspace}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            加载到工作区
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablePreview; 