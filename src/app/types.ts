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

export interface StudentInfo {
  Id: number;
  Name: string;
  Major: string;
  MathsGrade: number;
  Status: string;
  Year: number;
}

export interface ProgrammingGrade {
  Id: number;
  Name: string;
  Grade: number;
  Level: string;
}

export interface GradeTotal {
  Id: number;
  Name: string;
  Major: string;
  Maths: number;
  CSharp: number;
  AvgGrade: number;
  Rank: number;
}

export interface AssistantResponse {
  type: 'text' | 'table';
  content: string | any[];
  tableName?: string;
}
