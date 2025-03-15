import { NextRequest, NextResponse } from 'next/server';
import tableDataService from '@/app/services/tableDataService';

// 获取所有表格
export async function GET(request: NextRequest) {
  try {
    const tables = tableDataService.getAllTables();
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('获取表格数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取表格数据失败' },
      { status: 500 }
    );
  }
}

// 添加或更新表格
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, data } = body;

    if (!tableName || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: '无效的请求数据' },
        { status: 400 }
      );
    }

    // 检查表格是否已存在
    const existingData = tableDataService.getTableData(tableName);
    
    if (existingData) {
      // 更新现有表格
      tableDataService.updateTableData(tableName, data);
      return NextResponse.json({ 
        success: true, 
        message: `表格 ${tableName} 已更新`,
        rowCount: data.length
      });
    } else {
      // 添加新表格
      tableDataService.addTable(tableName, data);
      return NextResponse.json({ 
        success: true, 
        message: `表格 ${tableName} 已创建`,
        rowCount: data.length
      });
    }
  } catch (error) {
    console.error('添加/更新表格失败:', error);
    return NextResponse.json(
      { success: false, error: '添加/更新表格失败' },
      { status: 500 }
    );
  }
}

// 删除表格
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');

    if (!tableName) {
      return NextResponse.json(
        { success: false, error: '缺少表格名称参数' },
        { status: 400 }
      );
    }

    const result = tableDataService.deleteTable(tableName);
    
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: `表格 ${tableName} 已删除` 
      });
    } else {
      return NextResponse.json(
        { success: false, error: `表格 ${tableName} 不存在` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('删除表格失败:', error);
    return NextResponse.json(
      { success: false, error: '删除表格失败' },
      { status: 500 }
    );
  }
} 