export interface Cell {
  value: string;
}

export type SpreadsheetRow = Cell[];

export interface SpreadsheetData {
  title: string;
  rows: SpreadsheetRow[];
}

export interface TableData {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: TableData[];
}

export interface AssistantResponse {
  type: 'text' | 'table';
  content: string | any[];
  tableName?: string;
}
