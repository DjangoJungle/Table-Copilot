// 表格Agent框架
import { tableTools, tableToolsSchemas } from '../services/tableTools';
import togetherAIClient from '../services/togetherAIClient';

// 定义工具函数类型
interface Tool {
  name: string;
  description: string;
  parameters: any;
  function: (...args: any[]) => Promise<any>;
}

// 定义Together.ai API响应中的消息类型
interface TogetherAIMessage {
  role: string;
  content: string;
  tool_calls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    }
  }[];
}

// 定义Agent类型
export class TableAgent {
  private tools: Tool[];
  private systemPrompt: string;
  private conversationHistory: { role: 'system' | 'user' | 'assistant'; content: string; tool_calls?: any[] }[];
  private workspaceTableData: { tableName: string; data: any[] } | null = null;

  constructor() {
    // 初始化工具函数
    this.tools = [
      {
        name: 'listTables',
        description: '列出所有可用的表格',
        parameters: tableToolsSchemas.listTables,
        function: tableTools.listTables
      },
      {
        name: 'getTable',
        description: '获取指定表格的数据',
        parameters: tableToolsSchemas.getTable,
        function: tableTools.getTable
      },
      {
        name: 'queryTable',
        description: '使用SQL风格的查询语句查询表格数据',
        parameters: tableToolsSchemas.queryTable,
        function: tableTools.queryTable
      },
      {
        name: 'filterTable',
        description: '根据条件过滤表格数据',
        parameters: tableToolsSchemas.filterTable,
        function: tableTools.filterTable
      },
      {
        name: 'joinTables',
        description: '连接两个表格',
        parameters: tableToolsSchemas.joinTables,
        function: tableTools.joinTables
      },
      {
        name: 'aggregateTable',
        description: '聚合表格数据',
        parameters: tableToolsSchemas.aggregateTable,
        function: tableTools.aggregateTable
      },
      {
        name: 'sortTable',
        description: '排序表格数据',
        parameters: tableToolsSchemas.sortTable,
        function: tableTools.sortTable
      },
      {
        name: 'editTableCell',
        description: '编辑表格单元格',
        parameters: tableToolsSchemas.editTableCell,
        function: tableTools.editTableCell
      },
      {
        name: 'addTableRow',
        description: '向表格添加新行',
        parameters: tableToolsSchemas.addTableRow,
        function: tableTools.addTableRow
      },
      {
        name: 'deleteTableRow',
        description: '从表格删除行',
        parameters: tableToolsSchemas.deleteTableRow,
        function: tableTools.deleteTableRow
      },
      {
        name: 'saveAsNewTable',
        description: '将表格另存为新表格',
        parameters: tableToolsSchemas.saveAsNewTable,
        function: tableTools.saveAsNewTable
      },
      {
        name: 'deleteTable',
        description: '删除表格',
        parameters: tableToolsSchemas.deleteTable,
        function: tableTools.deleteTable
      }
    ];

    // 初始化系统提示
    this.systemPrompt = `你是一个专业的表格数据分析助手，可以帮助用户分析和处理表格数据。
你可以使用以下工具函数来操作表格数据：

1. listTables - 列出所有可用的表格
2. getTable - 获取指定表格的数据
3. queryTable - 使用SQL风格的查询语句查询表格数据
4. filterTable - 根据条件过滤表格数据
5. joinTables - 连接两个表格
6. aggregateTable - 聚合表格数据
7. sortTable - 排序表格数据
8. editTableCell - 编辑表格单元格
9. addTableRow - 向表格添加新行
10. deleteTableRow - 从表格删除行
11. saveAsNewTable - 将表格另存为新表格
12. deleteTable - 删除表格

请根据用户的问题，选择合适的工具函数来回答。如果需要多个步骤来解决问题，请逐步执行并解释每一步的操作和结果。
在回答中，请尽量使用表格形式展示数据结果，并提供简洁明了的分析和解释。

特别注意：
1. 当用户询问表格相关信息时，首先使用listTables工具列出所有可用表格，然后推荐合适的表格供用户选择。
2. 当用户选择了某个表格后，该表格会被加载到工作区，你可以直接访问工作区的表格数据。
3. 在回答用户查询时，优先考虑工作区中的表格数据，如果工作区中有表格，请在回答中明确提及你正在使用工作区中的表格。
4. 如果用户的查询需要使用多个表格，但工作区中只有一个表格，可以建议用户加载其他相关表格，或者尝试使用joinTables工具连接其他表格。
5. 当用户要求编辑表格时，请使用editTableCell、addTableRow或deleteTableRow工具函数。
6. 当用户要求将表格另存为新表格时，请使用saveAsNewTable工具函数。
7. 当用户要求删除表格时，请使用deleteTable工具函数，但要谨慎操作，确认用户真的想要删除表格。`;

    // 初始化对话历史
    this.conversationHistory = [
      { role: 'system', content: this.systemPrompt }
    ];
  }

  // 获取工具函数列表
  getTools(): any[] {
    return this.tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  // 执行工具函数
  async executeToolCall(toolName: string, args: any): Promise<any> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`未找到工具函数: ${toolName}`);
    }

    try {
      return await tool.function(args);
    } catch (error) {
      console.error(`执行工具函数 ${toolName} 出错:`, error);
      throw error;
    }
  }

  // 设置工作区表格数据
  setWorkspaceTableData(tableName: string, data: any[]): void {
    this.workspaceTableData = { tableName, data };
    
    // 添加工作区更新消息到对话历史
    this.conversationHistory.push({
      role: 'system',
      content: `工作区已更新，当前加载的表格是: ${tableName}，包含 ${data.length} 行数据。表格结构: ${JSON.stringify(Object.keys(data[0] || {}))}`
    });
  }

  // 获取工作区表格数据
  getWorkspaceTableData(): { tableName: string; data: any[] } | null {
    return this.workspaceTableData;
  }

  // 处理用户查询
  async processQuery(query: string, workspaceTable?: { tableName: string; data: any[] }): Promise<{
    success: boolean;
    result: string;
    thoughts?: string;
    tableData?: any[];
    tableName?: string;
    candidateTables?: string[];
    error?: string;
  }> {
    try {
      // 如果提供了工作区表格数据，更新工作区
      if (workspaceTable && workspaceTable.tableName && workspaceTable.data) {
        this.setWorkspaceTableData(workspaceTable.tableName, workspaceTable.data);
      }

      // 添加工作区信息到查询
      let enhancedQuery = query;
      if (this.workspaceTableData) {
        enhancedQuery = `${query}\n\n注意：当前工作区已加载表格 "${this.workspaceTableData.tableName}"，包含 ${this.workspaceTableData.data.length} 行数据。`;
      }

      // 添加用户消息到对话历史
      this.conversationHistory.push({ role: 'user', content: enhancedQuery });

      // 调用Together.ai API
      const response = await togetherAIClient.chatWithTools(
        this.conversationHistory,
        this.getTools(),
        { temperature: 0.7 }
      );

      // 处理响应
      const message = response.choices[0]?.message as TogetherAIMessage;
      if (!message) {
        throw new Error('未收到有效响应');
      }

      // 检查是否有工具调用
      if (message.tool_calls && message.tool_calls.length > 0) {
        // 记录思考过程
        let thoughts = '思考过程:\n';
        let finalTableData: any[] | undefined;
        let finalTableName: string | undefined;
        let candidateTables: string[] = [];

        // 执行每个工具调用
        for (const toolCall of message.tool_calls) {
          const { name, arguments: argsJson } = toolCall.function;
          const args = JSON.parse(argsJson);

          thoughts += `\n步骤: 调用 ${name}\n`;
          thoughts += `参数: ${JSON.stringify(args, null, 2)}\n`;

          // 执行工具函数
          const result = await this.executeToolCall(name, args);
          thoughts += `结果: ${JSON.stringify(result, null, 2)}\n`;

          // 如果是列出表格的调用，记录候选表格
          if (name === 'listTables' && result.tableNames) {
            candidateTables = result.tableNames;
          }

          // 如果结果包含表格数据，保存最后一个结果
          if (result.data && Array.isArray(result.data)) {
            finalTableData = result.data;
            finalTableName = result.tableName;
          }

          // 将工具调用结果添加到对话历史
          this.conversationHistory.push({
            role: 'assistant',
            content: '',
            tool_calls: [toolCall]
          });

          this.conversationHistory.push({
            role: 'user',
            content: JSON.stringify(result)
          });
        }

        // 生成最终回答
        const finalResponse = await togetherAIClient.chat(
          [...this.conversationHistory, 
            { 
              role: 'user', 
              content: '请根据以上工具调用的结果，给出一个完整的回答。如果有表格数据，请用表格形式展示，并提供简洁的分析。如果有多个可用表格，请推荐最合适的表格供用户选择。' 
            }
          ],
          { temperature: 0.7 }
        );

        // 添加助手回答到对话历史
        this.conversationHistory.push({
          role: 'assistant',
          content: finalResponse
        });

        return {
          success: true,
          result: finalResponse,
          thoughts,
          tableData: finalTableData,
          tableName: finalTableName,
          candidateTables: candidateTables.length > 0 ? candidateTables : undefined
        };
      } else {
        // 直接回答，没有工具调用
        const content = message.content || '';
        
        // 添加助手回答到对话历史
        this.conversationHistory.push({
          role: 'assistant',
          content
        });

        return { success: true, result: content };
      }
    } catch (error) {
      console.error('处理查询出错:', error);
      return {
        success: false,
        result: `抱歉，处理您的查询时出现错误: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 清除对话历史
  clearConversation(): void {
    this.conversationHistory = [
      { role: 'system', content: this.systemPrompt }
    ];
    // 保留工作区表格数据
  }

  // 清除工作区
  clearWorkspace(): void {
    this.workspaceTableData = null;
    // 添加工作区更新消息到对话历史
    this.conversationHistory.push({
      role: 'system',
      content: '工作区已清空，当前没有加载任何表格。'
    });
  }
} 