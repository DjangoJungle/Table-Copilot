import { NextRequest, NextResponse } from 'next/server';
import { tableAgent } from '@/app/services/tableAgent';
import tableDataService from '@/app/services/tableDataService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, workspaceTables, allTables } = body;
    
    // 如果客户端提供了所有表格数据，更新服务器端的tableDataService
    if (allTables && Array.isArray(allTables)) {
      // 清空现有表格并添加客户端提供的表格
      const tableNames = tableDataService.getAllTableNames();
      tableNames.forEach(name => {
        if (!name.startsWith('sample_')) { // 保留示例表格
          tableDataService.deleteTable(name);
        }
      });
      
      // 添加客户端提供的表格
      allTables.forEach(table => {
        if (table.name && Array.isArray(table.data)) {
          tableDataService.addTable(table.name, table.data);
        }
      });
    }
    
    // 处理查询
    const response = await tableAgent.processQuery(query, workspaceTables);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('处理查询时出错:', error);
    return NextResponse.json(
      { error: `处理查询时出错: ${error instanceof Error ? error.message : String(error)}` },
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