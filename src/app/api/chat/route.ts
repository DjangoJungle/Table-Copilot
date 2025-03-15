import { NextRequest, NextResponse } from 'next/server';
import { TableAgent } from '../../agents/tableAgent';
import tableDataService from '../../services/tableDataService';

// 创建一个全局的TableAgent实例
let tableAgent: TableAgent | null = null;

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const { query, workspaceTable, allTables } = await request.json();

    // 如果客户端传递了所有表格数据，更新服务器端的tableDataService
    if (allTables && typeof allTables === 'object') {
      // 遍历所有表格数据并更新服务器端的tableDataService
      Object.entries(allTables).forEach(([tableName, data]) => {
        if (Array.isArray(data)) {
          tableDataService.setTableDataDirect(tableName, data);
        }
      });
    }

    // 如果tableAgent不存在，创建一个新的实例
    if (!tableAgent) {
      tableAgent = new TableAgent();
    }

    // 处理查询
    const result = await tableAgent.processQuery(query, workspaceTable);

    return NextResponse.json(result);
  } catch (error) {
    console.error('处理查询出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '处理查询时出错' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // 重置TableAgent实例
    tableAgent = null;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('重置TableAgent出错:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '重置TableAgent时出错' 
      },
      { status: 500 }
    );
  }
} 