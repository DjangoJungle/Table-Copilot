// 表格操作工具函数
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import tableDataService from './tableDataService';

// 定义工具函数的参数和返回值类型
const ListTablesSchema = z.object({});

const GetTableSchema = z.object({
  tableName: z.string().describe('要获取的表格名称')
});

const QueryTableSchema = z.object({
  tableName: z.string().describe('要查询的表格名称'),
  query: z.string().describe('SQL风格的查询语句，例如：SELECT * WHERE Major = "CS"')
});

const FilterTableSchema = z.object({
  tableName: z.string().describe('要过滤的表格名称'),
  condition: z.string().describe('过滤条件，例如：Major = "CS" AND MathsGrade > 80')
});

const JoinTablesSchema = z.object({
  leftTable: z.string().describe('左表名称'),
  rightTable: z.string().describe('右表名称'),
  leftKey: z.string().describe('左表连接键'),
  rightKey: z.string().describe('右表连接键'),
  joinType: z.enum(['inner', 'left', 'right', 'full']).describe('连接类型')
});

const AggregateTableSchema = z.object({
  tableName: z.string().describe('要聚合的表格名称'),
  groupBy: z.string().describe('分组字段，例如：Major'),
  aggregations: z.array(z.object({
    field: z.string().describe('要聚合的字段'),
    function: z.enum(['count', 'sum', 'avg', 'min', 'max']).describe('聚合函数'),
    alias: z.string().optional().describe('聚合结果的别名')
  })).describe('聚合操作列表')
});

const SortTableSchema = z.object({
  tableName: z.string().describe('要排序的表格名称'),
  sortBy: z.string().describe('排序字段'),
  order: z.enum(['asc', 'desc']).describe('排序顺序')
});

// 编辑表格数据
const EditTableSchema = z.object({
  tableName: z.string().describe('要编辑的表格名称'),
  rowIndex: z.number().describe('要编辑的行索引，从0开始'),
  columnName: z.string().describe('要编辑的列名'),
  newValue: z.any().describe('新的值')
});

// 添加新行
const AddRowSchema = z.object({
  tableName: z.string().describe('要添加行的表格名称'),
  rowData: z.record(z.string(), z.any()).describe('新行的数据，格式为{列名:值}')
});

// 删除行
const DeleteRowSchema = z.object({
  tableName: z.string().describe('要删除行的表格名称'),
  rowIndex: z.number().describe('要删除的行索引，从0开始')
});

// 另存为新表格
const SaveAsNewTableSchema = z.object({
  originalTableName: z.string().describe('原表格名称'),
  newTableName: z.string().describe('新表格名称')
});

// 删除表格
const DeleteTableSchema = z.object({
  tableName: z.string().describe('要删除的表格名称')
});

// Python关键词分析工具Schema
const KeywordAnalysisSchema = z.object({
  tableName: z.string().describe('要分析的表格名称'),
  column: z.string().describe('要分析的列名'),
  algorithm: z.enum(['simple', 'advanced']).optional().describe('分析算法类型: simple(简单词频统计) 或 advanced(高级NLP分析)')
});

// 工具函数实现
export const tableTools = {
  // 列出所有表格
  listTables: async () => {
    const tableNames = tableDataService.getAllTableNames();
    return {
      tableNames,
      message: `找到 ${tableNames.length} 个表格`
    };
  },

  // 获取表格数据
  getTable: async (params: z.infer<typeof GetTableSchema>) => {
    const { tableName } = params;
    const data = tableDataService.getTableData(tableName);
    
    if (!data) {
      return {
        success: false,
        message: `表格 ${tableName} 不存在`
      };
    }
    
    return {
      success: true,
      tableName,
      data,
      rowCount: data.length,
      columns: data.length > 0 ? Object.keys(data[0]) : []
    };
  },

  // 查询表格数据
  queryTable: async (params: z.infer<typeof QueryTableSchema>) => {
    const { tableName, query } = params;
    const data = tableDataService.getTableData(tableName);
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `表格 ${tableName} 不存在或为空`
      };
    }

    try {
      // 简单的SQL解析器，仅支持基本的SELECT和WHERE
      // 实际项目中可以使用更复杂的SQL解析库
      let result = [...data];
      
      // 解析WHERE条件
      if (query.includes('WHERE')) {
        const whereClause = query.split('WHERE')[1].trim();
        result = filterByCondition(result, whereClause);
      }
      
      // 解析SELECT字段
      if (query.startsWith('SELECT')) {
        const selectPart = query.split('WHERE')[0].replace('SELECT', '').trim();
        
        if (selectPart !== '*') {
          const fields = selectPart.split(',').map(f => f.trim());
          result = result.map(row => {
            const newRow: Record<string, any> = {};
            fields.forEach(field => {
              newRow[field] = row[field];
            });
            return newRow;
          });
        }
      }
      
      return {
        success: true,
        tableName,
        data: result,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        message: `查询失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  // 过滤表格数据
  filterTable: async (params: z.infer<typeof FilterTableSchema>) => {
    const { tableName, condition } = params;
    const data = tableDataService.getTableData(tableName);
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `表格 ${tableName} 不存在或为空`
      };
    }

    try {
      const result = filterByCondition(data, condition);
      
      return {
        success: true,
        tableName,
        data: result,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        message: `过滤失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  // 连接两个表格
  joinTables: async (params: z.infer<typeof JoinTablesSchema>) => {
    const { leftTable, rightTable, leftKey, rightKey, joinType } = params;
    const leftData = tableDataService.getTableData(leftTable);
    const rightData = tableDataService.getTableData(rightTable);
    
    if (!leftData || leftData.length === 0) {
      return {
        success: false,
        message: `表格 ${leftTable} 不存在或为空`
      };
    }
    
    if (!rightData || rightData.length === 0) {
      return {
        success: false,
        message: `表格 ${rightTable} 不存在或为空`
      };
    }

    try {
      let result: any[] = [];
      
      // 实现不同类型的连接
      switch (joinType) {
        case 'inner':
          result = leftData.flatMap(leftRow => {
            const matches = rightData.filter(rightRow => leftRow[leftKey] === rightRow[rightKey]);
            return matches.map(rightRow => ({
              ...leftRow,
              ...Object.fromEntries(
                Object.entries(rightRow).map(([key, value]) => 
                  [key === rightKey ? key : `${rightTable}_${key}`, value]
                )
              )
            }));
          });
          break;
          
        case 'left':
          result = leftData.flatMap(leftRow => {
            const matches = rightData.filter(rightRow => leftRow[leftKey] === rightRow[rightKey]);
            if (matches.length === 0) {
              return [{
                ...leftRow,
                ...Object.fromEntries(
                  Object.keys(rightData[0] || {}).map(key => 
                    [key === rightKey ? key : `${rightTable}_${key}`, null]
                  )
                )
              }];
            }
            return matches.map(rightRow => ({
              ...leftRow,
              ...Object.fromEntries(
                Object.entries(rightRow).map(([key, value]) => 
                  [key === rightKey ? key : `${rightTable}_${key}`, value]
                )
              )
            }));
          });
          break;
          
        // 其他连接类型可以类似实现
        default:
          throw new Error(`不支持的连接类型: ${joinType}`);
      }
      
      return {
        success: true,
        tableName: `${leftTable}_${joinType}_join_${rightTable}`,
        data: result,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  // 聚合表格数据
  aggregateTable: async (params: z.infer<typeof AggregateTableSchema>) => {
    const { tableName, groupBy, aggregations } = params;
    const data = tableDataService.getTableData(tableName);
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `表格 ${tableName} 不存在或为空`
      };
    }

    try {
      // 按分组字段分组
      const groups = new Map<string, any[]>();
      
      data.forEach(row => {
        const groupValue = row[groupBy];
        if (!groups.has(groupValue)) {
          groups.set(groupValue, []);
        }
        groups.get(groupValue)!.push(row);
      });
      
      // 对每个分组应用聚合函数
      const result = Array.from(groups.entries()).map(([groupValue, rows]) => {
        const resultRow: Record<string, any> = {
          [groupBy]: groupValue
        };
        
        aggregations.forEach(agg => {
          const { field, function: func, alias } = agg;
          const columnName = alias || `${func}_${field}`;
          
          switch (func) {
            case 'count':
              resultRow[columnName] = rows.length;
              break;
            case 'sum':
              resultRow[columnName] = rows.reduce((sum, row) => sum + (row[field] || 0), 0);
              break;
            case 'avg':
              resultRow[columnName] = rows.reduce((sum, row) => sum + (row[field] || 0), 0) / rows.length;
              break;
            case 'min':
              resultRow[columnName] = Math.min(...rows.map(row => row[field] || 0));
              break;
            case 'max':
              resultRow[columnName] = Math.max(...rows.map(row => row[field] || 0));
              break;
          }
        });
        
        return resultRow;
      });
      
      return {
        success: true,
        tableName: `${tableName}_aggregated`,
        data: result,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        message: `聚合失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  // 排序表格数据
  sortTable: async (params: z.infer<typeof SortTableSchema>) => {
    const { tableName, sortBy, order } = params;
    const data = tableDataService.getTableData(tableName);
    
    if (!data || data.length === 0) {
      return {
        success: false,
        message: `表格 ${tableName} 不存在或为空`
      };
    }

    try {
      const result = [...data].sort((a, b) => {
        const valueA = a[sortBy];
        const valueB = b[sortBy];
        
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return order === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        const strA = String(valueA);
        const strB = String(valueB);
        
        return order === 'asc' 
          ? strA.localeCompare(strB) 
          : strB.localeCompare(strA);
      });
      
      return {
        success: true,
        tableName,
        data: result,
        rowCount: result.length
      };
    } catch (error) {
      return {
        success: false,
        message: `排序失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },

  // 编辑表格单元格
  editTableCell: async ({ tableName, rowIndex, columnName, newValue }: z.infer<typeof EditTableSchema>) => {
    try {
      const tableData = tableDataService.getTableData(tableName);
      if (!tableData) {
        return { success: false, error: `表格 ${tableName} 不存在` };
      }
      
      if (rowIndex < 0 || rowIndex >= tableData.length) {
        return { success: false, error: `行索引 ${rowIndex} 超出范围` };
      }
      
      if (!tableData[0].hasOwnProperty(columnName)) {
        return { success: false, error: `列 ${columnName} 不存在` };
      }
      
      // 创建新的表格数据副本
      const newData = [...tableData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnName]: newValue
      };
      
      // 更新表格数据
      tableDataService.updateTableData(tableName, newData);
      
      return { 
        success: true, 
        message: `已成功编辑表格 ${tableName} 的第 ${rowIndex + 1} 行 ${columnName} 列`,
        data: newData
      };
    } catch (error) {
      return { 
        success: false, 
        error: `编辑表格单元格失败: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },

  // 添加新行
  addTableRow: async ({ tableName, rowData }: z.infer<typeof AddRowSchema>) => {
    try {
      const tableData = tableDataService.getTableData(tableName);
      if (!tableData || tableData.length === 0) {
        return { success: false, error: `表格 ${tableName} 不存在或为空` };
      }
      
      // 检查提供的行数据是否包含所有必要的列
      const columns = Object.keys(tableData[0]);
      const missingColumns = columns.filter(col => !rowData.hasOwnProperty(col));
      
      if (missingColumns.length > 0) {
        // 对于缺失的列，使用空值
        missingColumns.forEach(col => {
          rowData[col] = '';
        });
      }
      
      // 创建新的表格数据副本并添加新行
      const newData = [...tableData, rowData];
      
      // 更新表格数据
      tableDataService.updateTableData(tableName, newData);
      
      return { 
        success: true, 
        message: `已成功向表格 ${tableName} 添加新行`,
        data: newData
      };
    } catch (error) {
      return { 
        success: false, 
        error: `添加表格行失败: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },

  // 删除行
  deleteTableRow: async ({ tableName, rowIndex }: z.infer<typeof DeleteRowSchema>) => {
    try {
      const tableData = tableDataService.getTableData(tableName);
      if (!tableData) {
        return { success: false, error: `表格 ${tableName} 不存在` };
      }
      
      if (rowIndex < 0 || rowIndex >= tableData.length) {
        return { success: false, error: `行索引 ${rowIndex} 超出范围` };
      }
      
      // 创建新的表格数据副本并删除指定行
      const newData = [...tableData];
      newData.splice(rowIndex, 1);
      
      // 更新表格数据
      tableDataService.updateTableData(tableName, newData);
      
      return { 
        success: true, 
        message: `已成功从表格 ${tableName} 删除第 ${rowIndex + 1} 行`,
        data: newData
      };
    } catch (error) {
      return { 
        success: false, 
        error: `删除表格行失败: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },

  // 另存为新表格
  saveAsNewTable: async ({ originalTableName, newTableName }: z.infer<typeof SaveAsNewTableSchema>) => {
    try {
      const tableData = tableDataService.getTableData(originalTableName);
      if (!tableData) {
        return { success: false, error: `表格 ${originalTableName} 不存在` };
      }
      
      // 检查新表格名称是否已存在
      const existingTables = tableDataService.getAllTableNames();
      if (existingTables.includes(newTableName)) {
        return { success: false, error: `表格名称 ${newTableName} 已存在` };
      }
      
      // 保存为新表格
      tableDataService.saveAsNewTable(originalTableName, newTableName, tableData);
      
      return { 
        success: true, 
        message: `已成功将表格 ${originalTableName} 另存为 ${newTableName}`,
        tableName: newTableName,
        data: tableData
      };
    } catch (error) {
      return { 
        success: false, 
        error: `另存为新表格失败: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },

  // 删除表格
  deleteTable: async ({ tableName }: z.infer<typeof DeleteTableSchema>) => {
    try {
      const result = tableDataService.deleteTable(tableName);
      if (!result) {
        return { success: false, error: `表格 ${tableName} 不存在` };
      }
      
      return { 
        success: true, 
        message: `已成功删除表格 ${tableName}`
      };
    } catch (error) {
      return { 
        success: false, 
        error: `删除表格失败: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  },

  // Python关键词分析工具函数
  keywordAnalysis: async (args: { tableName: string; column: string; algorithm?: 'simple' | 'advanced' }): Promise<any> => {
    try {
      const { tableName, column, algorithm = 'simple' } = args;
      
      // 获取表格数据
      const tableData = tableDataService.getTableData(tableName);
      
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        throw new Error(`表格 ${tableName} 不存在或为空`);
      }
      
      // 检查列是否存在
      if (!(column in tableData[0])) {
        throw new Error(`列 ${column} 在表格 ${tableName} 中不存在`);
      }
      
      // 调用Python API
      const response = await fetch('http://localhost:8000/api/keyword_stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table_name: tableName,
          data: tableData,
          column,
          algorithm
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '分析失败');
      }
      
      return {
        tableName,
        column,
        method: result.method,
        data: result.result
      };
    } catch (error) {
      console.error('关键词分析出错:', error);
      throw error;
    }
  }
};

// 辅助函数：根据条件过滤数据
function filterByCondition(data: any[], condition: string): any[] {
  // 简单的条件解析器，支持基本的AND、OR、比较操作符
  // 实际项目中可以使用更复杂的表达式解析库
  
  // 处理AND条件
  if (condition.includes(' AND ')) {
    const conditions = condition.split(' AND ');
    return conditions.reduce((filteredData, cond) => 
      filterByCondition(filteredData, cond), data);
  }
  
  // 处理OR条件
  if (condition.includes(' OR ')) {
    const conditions = condition.split(' OR ');
    const results = conditions.flatMap(cond => filterByCondition(data, cond));
    // 去重
    return Array.from(new Map(results.map(item => 
      [item[Object.keys(item)[0]], item])).values());
  }
  
  // 处理基本比较
  let operator = '';
  let parts: string[] = [];
  
  if (condition.includes('>=')) {
    operator = '>=';
    parts = condition.split('>=');
  } else if (condition.includes('<=')) {
    operator = '<=';
    parts = condition.split('<=');
  } else if (condition.includes('>')) {
    operator = '>';
    parts = condition.split('>');
  } else if (condition.includes('<')) {
    operator = '<';
    parts = condition.split('<');
  } else if (condition.includes('=')) {
    operator = '=';
    parts = condition.split('=');
  } else if (condition.includes('!=')) {
    operator = '!=';
    parts = condition.split('!=');
  } else {
    throw new Error(`不支持的条件: ${condition}`);
  }
  
  if (parts.length !== 2) {
    throw new Error(`无效的条件格式: ${condition}`);
  }
  
  const field = parts[0].trim();
  let value: any = parts[1].trim();
  
  // 处理字符串值
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  } else if (!isNaN(Number(value))) {
    value = Number(value);
  }
  
  // 应用比较操作符
  return data.filter(row => {
    const fieldValue = row[field];
    
    switch (operator) {
      case '=': return fieldValue == value;
      case '!=': return fieldValue != value;
      case '>': return fieldValue > value;
      case '>=': return fieldValue >= value;
      case '<': return fieldValue < value;
      case '<=': return fieldValue <= value;
      default: return false;
    }
  });
}

// 导出工具函数的JSON Schema
export const tableToolsSchemas = {
  listTables: zodToJsonSchema(ListTablesSchema),
  getTable: zodToJsonSchema(GetTableSchema),
  queryTable: zodToJsonSchema(QueryTableSchema),
  filterTable: zodToJsonSchema(FilterTableSchema),
  joinTables: zodToJsonSchema(JoinTablesSchema),
  aggregateTable: zodToJsonSchema(AggregateTableSchema),
  sortTable: zodToJsonSchema(SortTableSchema),
  editTableCell: zodToJsonSchema(EditTableSchema),
  addTableRow: zodToJsonSchema(AddRowSchema),
  deleteTableRow: zodToJsonSchema(DeleteRowSchema),
  saveAsNewTable: zodToJsonSchema(SaveAsNewTableSchema),
  deleteTable: zodToJsonSchema(DeleteTableSchema),
  keywordAnalysis: zodToJsonSchema(KeywordAnalysisSchema)
}; 