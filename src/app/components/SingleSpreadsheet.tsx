import React from "react";
import Spreadsheet from "react-spreadsheet";
import { SpreadsheetData, SpreadsheetRow } from "../types";

interface SingleSpreadsheetProps {
  spreadsheet: SpreadsheetData;
  setSpreadsheet: (spreadsheet: SpreadsheetData) => void;
}

const SingleSpreadsheet = ({ spreadsheet, setSpreadsheet }: SingleSpreadsheetProps) => {
  return (
    <div className="flex-1 overflow-auto p-5">
      {/* 标题输入框 */}
      <input
        type="text"
        value={spreadsheet.title}
        className="w-full p-2 mb-5 text-center text-2xl font-bold outline-none bg-transparent border-b border-gray-200 focus:border-blue-500 transition-colors"
        onChange={(e) =>
          setSpreadsheet({ ...spreadsheet, title: e.target.value })
        }
      />
      
      <div className="flex items-start">
        {/* 表格组件 */}
        <div className="flex-1">
          <Spreadsheet
            data={spreadsheet.rows}
            onChange={(data) => {
              console.log("data", data);
              setSpreadsheet({ ...spreadsheet, rows: data as any });
            }}
          />
        </div>
        
        {/* 添加列按钮 */}
        <button
          className="bg-blue-500 text-white rounded-lg ml-4 w-8 h-8 hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md"
          onClick={() => {
            // 添加空单元格到每一行
            const spreadsheetRows = [...spreadsheet.rows];
            for (let i = 0; i < spreadsheet.rows.length; i++) {
              spreadsheetRows[i] = [...spreadsheetRows[i], { value: "" }];
            }
            setSpreadsheet({
              ...spreadsheet,
              rows: spreadsheetRows,
            });
          }}
          title="添加列"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* 添加行按钮 */}
      <button
        className="bg-blue-500 text-white rounded-lg w-8 h-8 mt-4 hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md"
        onClick={() => {
          const numberOfColumns = spreadsheet.rows[0].length;
          const newRow: SpreadsheetRow = Array(numberOfColumns).fill({ value: "" });
          setSpreadsheet({
            ...spreadsheet,
            rows: [...spreadsheet.rows, newRow],
          });
        }}
        title="添加行"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default SingleSpreadsheet;


