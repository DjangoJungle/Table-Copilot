import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AssistantResponse } from '../types';
import TablePreview from './TablePreview';
import TableEditor from './TableEditor';
import tableDataService from '../services/tableDataService';

interface Message {
  content: string | any[];
  type: 'user' | 'assistant';
  timestamp: Date;
  messageType?: 'text' | 'table' | 'thought' | 'candidate_tables';
  isTyping?: boolean;
  tableName?: string;
  candidateTables?: string[];
}

interface ThoughtStep {
  title: string;
  description: string;
  data?: any;
}

interface CustomAssistantProps {
  onLoadTable?: (tableName: string, data: any[]) => void;
  currentTableName?: string | null;
  currentTableData?: any[] | null;
  workspaceTables?: { name: string; data: any[] }[];
  onClearWorkspace?: () => void;
  allTables?: { name: string; data: any[] }[];
}

const ThinkingAnimation = () => (
  <div className="flex space-x-2 p-3 bg-white rounded-lg shadow-sm">
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const TypewriterText: React.FC<{ text: string; onComplete: () => void; stopTyping: boolean }> = ({ text, onComplete, stopTyping }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (stopTyping) {
      // 如果停止打字，直接显示全部文本
      setDisplayText(text);
      setCurrentIndex(text.length);
      onComplete();
      return;
    }

    if (currentIndex < text.length) {
      const delay = Math.random() * 10 + 5; // 5-15ms 随机延迟，比原来更快
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, text, stopTyping]);

  return (
    <div className="whitespace-pre-wrap markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayText}
      </ReactMarkdown>
    </div>
  );
};

const ThoughtProcess: React.FC<{ steps: ThoughtStep[] }> = ({ steps }) => {
  return (
    <div className="border-l-2 border-blue-400 pl-4 space-y-3 my-2">
      {steps.map((step, index) => (
        <div key={index} className="thought-step">
          <h4 className="text-sm font-semibold text-blue-700">{step.title}</h4>
          <p className="text-xs text-gray-600 mb-1">{step.description}</p>
          {step.data && (
            <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-x-auto">
              {typeof step.data === 'object' 
                ? JSON.stringify(step.data, null, 2)
                : step.data}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const CandidateTables: React.FC<{ 
  tables: string[]; 
  onSelectTable: (tableName: string) => void 
}> = ({ tables, onSelectTable }) => {
  return (
    <div className="border-l-2 border-green-400 pl-4 my-2">
      <h4 className="text-sm font-semibold text-green-700 mb-2">可用表格</h4>
      <div className="flex flex-wrap gap-2">
        {tables.map((tableName) => (
          <button
            key={tableName}
            onClick={() => onSelectTable(tableName)}
            className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-800 rounded-full text-sm transition-colors"
          >
            {tableName}
          </button>
        ))}
      </div>
    </div>
  );
};

export const CustomAssistant: React.FC<CustomAssistantProps> = ({ 
  onLoadTable, 
  currentTableName, 
  currentTableData,
  workspaceTables = [],
  onClearWorkspace,
  allTables
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "你好！我是表格助手，可以帮助你查询和分析表格数据。有什么我可以帮你的吗？",
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);
  const [isStopTypingVisible, setIsStopTypingVisible] = useState(false);
  const [stopTyping, setStopTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 表格预览状态
  const [previewTableName, setPreviewTableName] = useState<string>('');
  const [previewTableData, setPreviewTableData] = useState<any[] | null>(null);
  const [showTablePreview, setShowTablePreview] = useState<boolean>(false);
  
  // 表格编辑状态
  const [editTableName, setEditTableName] = useState<string>('');
  const [editTableData, setEditTableData] = useState<any[] | null>(null);
  const [showTableEditor, setShowTableEditor] = useState<boolean>(false);
  
  // 表格管理状态
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [showTableManager, setShowTableManager] = useState<boolean>(false);
  
  // 窗口大小状态
  const [dimensions, setDimensions] = useState({
    width: 384, // 默认宽度 (w-96 = 24rem = 384px)
    height: 500, // 默认高度
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 });
  const [initialDimensions, setInitialDimensions] = useState({ width: 384, height: 500 });

  // 当工作区表格变化时，通知助手
  useEffect(() => {
    if (currentTableName && currentTableData && currentTableData.length > 0) {
      // 添加工作区更新消息
      setMessages(prev => [
        ...prev,
        {
          content: `工作区已更新，当前加载的表格是: ${currentTableName}，包含 ${currentTableData.length} 行数据。`,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
    }
  }, [currentTableName, currentTableData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // 处理窗口大小调整
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // 计算鼠标移动的距离
      const deltaX = resizeStartPosition.x - e.clientX;
      const deltaY = resizeStartPosition.y - e.clientY;
      
      // 计算新的尺寸
      const newWidth = Math.max(300, initialDimensions.width + deltaX);
      const newHeight = Math.max(300, initialDimensions.height + deltaY);
      
      if (containerRef.current) {
        // 添加调整大小时的视觉反馈
        containerRef.current.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      }
      
      setDimensions({
        width: newWidth,
        height: newHeight
      });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      
      if (containerRef.current) {
        // 恢复正常阴影
        containerRef.current.style.boxShadow = '';
      }
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartPosition, initialDimensions]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStartPosition({ x: e.clientX, y: e.clientY });
    setInitialDimensions({ ...dimensions });
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  };

  const handleClose = () => {
    // 添加淡出动画
    if (containerRef.current) {
      containerRef.current.classList.add('animate-fadeOut');
      containerRef.current.classList.remove('animate-fadeIn');
      
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    } else {
    setIsVisible(false);
    }
  };

  const handleOpen = () => {
        setIsVisible(true);
    // 淡入动画会通过CSS处理
  };

  const handleToggle = () => {
    if (isOpen) {
      // 关闭时的动画
      if (containerRef.current) {
        containerRef.current.style.height = '56px';
      }
    } else {
      // 打开时的动画
      if (containerRef.current) {
        containerRef.current.style.height = `${dimensions.height}px`;
      }
    }
    setIsOpen(!isOpen);
  };

  const addMessageWithTypingEffect = (message: Message) => {
    setMessages(prev => [...prev, { ...message, isTyping: true }]);
    setStopTyping(false); // 重置截停状态
  };

  const completeTyping = (index: number) => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isTyping: false } : msg));
  };

  const handleStopTyping = () => {
    setStopTyping(true);
  };

  const parseThoughts = (thoughtsText: string): ThoughtStep[] => {
    // 简单解析思考过程文本为结构化步骤
    const steps: ThoughtStep[] = [];
    const lines = thoughtsText.split('\n');
    
    let currentStep: ThoughtStep | null = null;
    
    for (const line of lines) {
      if (line.startsWith('步骤:')) {
        if (currentStep) {
          steps.push(currentStep);
        }
        currentStep = {
          title: line.replace('步骤:', '').trim(),
          description: ''
        };
      } else if (line.startsWith('参数:') && currentStep) {
        currentStep.description = line.replace('参数:', '').trim();
      } else if (line.startsWith('结果:') && currentStep) {
        try {
          const resultJson = line.replace('结果:', '').trim();
          currentStep.data = JSON.parse(resultJson);
        } catch (e) {
          currentStep.data = line.replace('结果:', '').trim();
        }
      }
    }
    
    if (currentStep) {
      steps.push(currentStep);
    }
    
    return steps;
  };

  const handleSelectTable = async (tableName: string) => {
    try {
      // 先预览表格
      const tableData = tableDataService.getTableData(tableName);
      
      if (!tableData || !Array.isArray(tableData)) {
        throw new Error(`表格 ${tableName} 不存在或格式无效`);
      }
      
      setPreviewTableName(tableName);
      setPreviewTableData(tableData);
      setShowTablePreview(true);
      
    } catch (error) {
      console.error('选择表格出错:', error);
      
      setTimeout(() => {
        const errorMessage: Message = {
          content: `抱歉，选择表格时出现错误: ${error instanceof Error ? error.message : String(error)}`,
      type: 'assistant',
      timestamp: new Date(),
          messageType: 'text'
        };
        
        addMessageWithTypingEffect(errorMessage);
      }, 500);
    }
  };
  
  const handleLoadTableFromPreview = () => {
    if (previewTableData && previewTableName && onLoadTable) {
      // 加载表格到工作区
      onLoadTable(previewTableName, previewTableData);
      
      // 添加选择表格的消息
      setMessages(prev => [
        ...prev,
        {
          content: `我已选择表格: ${previewTableName}`,
          type: 'user',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
      
      // 关闭预览
      setShowTablePreview(false);
      
      // 使用选中的表格继续查询
      handleTableAnalysis(previewTableName, previewTableData);
    }
  };
  
  const handleTableAnalysis = async (tableName: string, tableData: any[]) => {
    setIsThinking(true);
    
    try {
      // 调用API处理查询
      const userQuery = `请分析${tableName}表格的数据结构和内容`;
      
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: userQuery,
          workspaceTable: {
            tableName,
            data: tableData
          },
          allTables: tableDataService.getAllTables() // 添加所有表格数据
        })
      });
      
      if (!chatResponse.ok) {
        throw new Error(`API请求失败: ${chatResponse.status}`);
      }
      
      const chatData = await chatResponse.json();
      
      if (!chatData.success) {
        throw new Error(chatData.error || '处理查询时出错');
      }
      
      // 添加助手回复
      setTimeout(() => {
        const assistantMessage: Message = {
          content: chatData.result,
      type: 'assistant',
      timestamp: new Date(),
          messageType: 'text'
        };
        
        addMessageWithTypingEffect(assistantMessage);
        setIsThinking(false);
      }, 500);
      
    } catch (error) {
      console.error('分析表格出错:', error);
      
      setTimeout(() => {
        const errorMessage: Message = {
          content: `抱歉，分析表格时出现错误: ${error instanceof Error ? error.message : String(error)}`,
      type: 'assistant',
      timestamp: new Date(),
          messageType: 'text'
        };
        
        addMessageWithTypingEffect(errorMessage);
        setIsThinking(false);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isProcessingQuery) return;

    const userMessage: Message = {
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
      messageType: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    setIsProcessingQuery(true);
    
    try {
      // 调用API处理查询
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: inputValue,
          workspaceTable: currentTableName && currentTableData ? {
            tableName: currentTableName,
            data: currentTableData
          } : undefined,
          allTables: tableDataService.getAllTables() // 添加所有表格数据
        })
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '处理查询时出错');
      }
      
      // 处理思考过程
      if (data.thoughts) {
        const thoughtSteps = parseThoughts(data.thoughts);
        
        const thoughtMessage: Message = {
          content: thoughtSteps,
        type: 'assistant',
        timestamp: new Date(),
          messageType: 'thought'
        };
        
        setMessages(prev => [...prev, thoughtMessage]);
      }
      
      // 处理候选表格
      if (data.candidateTables && data.candidateTables.length > 0) {
        const candidateTablesMessage: Message = {
          content: '以下是可用的表格，点击可选择加载到工作区:',
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'candidate_tables',
          candidateTables: data.candidateTables
        };
        
        setMessages(prev => [...prev, candidateTablesMessage]);
      }
      
      // 处理表格数据
      if (data.tableData && data.tableName && onLoadTable) {
        // 加载表格到工作区
        onLoadTable(data.tableName, data.tableData);
      }
      
      // 添加助手回复
      setTimeout(() => {
        const assistantMessage: Message = {
          content: data.result,
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
        };
        
        addMessageWithTypingEffect(assistantMessage);
        setIsThinking(false);
      }, 500);
      
    } catch (error) {
      console.error('处理查询出错:', error);
      
      setTimeout(() => {
        const errorMessage: Message = {
          content: `抱歉，处理您的查询时出现错误: ${error instanceof Error ? error.message : String(error)}`,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'text'
        };
        
        addMessageWithTypingEffect(errorMessage);
        setIsThinking(false);
      }, 500);
    } finally {
      setIsProcessingQuery(false);
    }
  };

  const clearConversation = async () => {
    try {
      await fetch('/api/chat', {
        method: 'DELETE'
      });
      
      setMessages([
        {
          content: "对话已重置。我是表格助手，可以帮助你查询和分析表格数据。有什么我可以帮你的吗？",
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
    } catch (error) {
      console.error('清除对话历史出错:', error);
    }
  };

  // 清空工作区
  const clearWorkspace = () => {
    if (onLoadTable) {
      onLoadTable('', []);
    }
    
    // 添加消息
    const message: Message = {
      content: '工作区已清空。',
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'text'
    };
    
    addMessageWithTypingEffect(message);
  };

  const renderMarkdownContent = (content: string) => {
    // 预处理内容，将表格包裹在div中以支持水平滚动
    const processedContent = content.replace(
      /(\|[^\n]*\|\n\|[-:| ]*\|.*?(?=\n\n|\n[^|]|$))/g,
      '<div class="table-container">$1</div>'
    );
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }: any) => (
            <div className="table-container">
              <table {...props} />
            </div>
          ),
          pre: ({ node, ...props }: any) => (
            <pre className="overflow-x-auto" {...props} />
          ),
          code: ({ node, inline, ...props }: any) => (
            inline ? 
            <code {...props} /> : 
            <div className="overflow-x-auto">
              <code {...props} />
            </div>
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const renderMessage = (message: Message, index: number) => {
    const isLastMessage = index === messages.length - 1;
    
    if (message.type === 'user') {
      return (
        <div className="flex justify-end mb-4 message-animation">
          <div className="bg-blue-500 text-white rounded-lg py-2 px-4 max-w-[80%] overflow-auto">
            <p className="whitespace-pre-wrap">{message.content as string}</p>
          </div>
        </div>
      );
    }
    
    if (message.messageType === 'thought') {
      return (
        <div className="flex mb-4 message-animation">
          <div className="bg-gray-100 rounded-lg py-3 px-4 max-w-[90%] overflow-auto">
            <div className="mb-2">
              <span className="text-xs text-gray-500">思考过程</span>
            </div>
            <ThoughtProcess steps={message.content as ThoughtStep[]} />
          </div>
        </div>
      );
    }

    if (message.messageType === 'candidate_tables' && message.candidateTables) {
      return (
        <div className="flex mb-4 message-animation">
          <div className="bg-gray-100 rounded-lg py-3 px-4 max-w-[90%] overflow-auto">
            <div className="mb-2">
              <span className="text-xs text-gray-500">{message.content as string}</span>
            </div>
            <CandidateTables 
              tables={message.candidateTables} 
              onSelectTable={handleSelectTable} 
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex mb-4 message-animation">
        <div className="bg-white rounded-lg py-2 px-4 shadow-sm max-w-[80%] overflow-auto markdown-content">
          {message.isTyping ? (
            <>
              <TypewriterText 
                text={message.content as string} 
                onComplete={() => completeTyping(index)}
                stopTyping={stopTyping}
              />
              {isLastMessage && message.isTyping && (
          <button
                  onClick={handleStopTyping}
                  className="text-xs text-blue-500 hover:text-blue-700 mt-2 stop-button px-2 py-1 rounded-full bg-blue-50"
          >
                  停止生成
          </button>
              )}
            </>
          ) : (
            <div className="markdown-content">
              {renderMarkdownContent(message.content as string)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 加载可用表格列表
  const loadAvailableTables = () => {
    const tables = tableDataService.getAllTableNames();
    setAvailableTables(tables);
  };

  // 初始化时加载表格列表
  useEffect(() => {
    loadAvailableTables();
  }, []);

  // 打开表格管理器
  const openTableManager = () => {
    loadAvailableTables();
    setShowTableManager(true);
  };

  // 编辑表格
  const handleEditTable = (tableName: string) => {
    try {
      const tableData = tableDataService.getTableData(tableName);
      
      if (!tableData || !Array.isArray(tableData)) {
        throw new Error(`表格 ${tableName} 不存在或格式无效`);
      }
      
      setEditTableName(tableName);
      setEditTableData(tableData);
      setShowTableEditor(true);
      setShowTableManager(false); // 关闭表格管理器
    } catch (error) {
      console.error('编辑表格出错:', error);
      alert(`编辑表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 保存编辑后的表格
  const handleSaveEditedTable = (tableName: string, data: any[]) => {
    try {
      tableDataService.updateTableData(tableName, data);
      setShowTableEditor(false);
      
      // 如果当前工作区是这个表格，更新工作区
      if (currentTableName === tableName && onLoadTable) {
        onLoadTable(tableName, data);
      }
      
      // 添加消息
      const message: Message = {
        content: `表格 ${tableName} 已更新。`,
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      };
      
      addMessageWithTypingEffect(message);
      
      // 刷新表格列表
      loadAvailableTables();
    } catch (error) {
      console.error('保存表格出错:', error);
      alert(`保存表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 另存为新表格
  const handleSaveAsNewTable = (originalName: string, newName: string, data: any[]) => {
    try {
      // 检查表格名称是否已存在
      const existingTables = tableDataService.getAllTableNames();
      if (existingTables.includes(newName)) {
        throw new Error(`表格名称 ${newName} 已存在`);
      }
      
      tableDataService.saveAsNewTable(originalName, newName, data);
      setShowTableEditor(false);
      
      // 添加消息
      const message: Message = {
        content: `表格已另存为 ${newName}。`,
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      };
      
      addMessageWithTypingEffect(message);
      
      // 刷新表格列表
      loadAvailableTables();
    } catch (error) {
      console.error('另存为新表格出错:', error);
      alert(`另存为新表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 删除表格
  const handleDeleteTable = (tableName: string) => {
    if (window.confirm(`确定要删除表格 ${tableName} 吗？此操作不可撤销。`)) {
      try {
        tableDataService.deleteTable(tableName);
        
        // 如果当前工作区是这个表格，清空工作区
        if (currentTableName === tableName) {
          clearWorkspace();
        }
        
        // 添加消息
        const message: Message = {
          content: `表格 ${tableName} 已删除。`,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'text'
        };
        
        addMessageWithTypingEffect(message);
        
        // 刷新表格列表
        loadAvailableTables();
      } catch (error) {
        console.error('删除表格出错:', error);
        alert(`删除表格出错: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  // 处理加载表格
  const handleLoadTable = (tableName: string) => {
    const data = tableDataService.getTableData(tableName);
    if (data && onLoadTable) {
      onLoadTable(tableName, data);
      setMessages(prev => [
        ...prev,
        {
          content: `已加载表格 ${tableName} 到工作区，包含 ${data.length} 行数据。`,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'text'
        }
      ]);
    }
  };

  // 预览表格
  const handlePreviewTable = (tableName: string) => {
    try {
      const tableData = tableDataService.getTableData(tableName);
      
      if (!tableData || !Array.isArray(tableData)) {
        throw new Error(`表格 ${tableName} 不存在或格式无效`);
      }
      
      setPreviewTableName(tableName);
      setPreviewTableData(tableData);
      setShowTablePreview(true);
      
    } catch (error) {
      console.error('预览表格出错:', error);
      alert(`预览表格出错: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 assistant-button animate-fadeIn flex items-center justify-center"
        style={{ width: '48px', height: '48px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-white"
    >
      {/* 头部 */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="font-medium">表格助手</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={openTableManager}
            className="text-white hover:text-gray-200 transition-colors"
            title="管理表格"
          >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          </button>
        <button
            onClick={clearConversation}
            className="text-white hover:text-gray-200 transition-colors"
            title="清除对话历史"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        </div>
      </div>

      {/* 工作区状态 */}
      {currentTableName && (
        <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs text-blue-700">工作区: {currentTableName}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditTable(currentTableName)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              编辑
            </button>
            <button
              onClick={clearWorkspace}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              清除
            </button>
          </div>
        </div>
      )}
      
      {/* 消息区域 */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={index}>
              {renderMessage(message, index)}
          </div>
        ))}
        {isThinking && (
            <div className="flex mb-4">
            <ThinkingAnimation />
          </div>
        )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessingQuery}
          />
          <button
            type="submit"
            className={`bg-blue-600 text-white px-4 py-2 rounded-r-lg ${
              isProcessingQuery ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isProcessingQuery}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
      
      {/* 表格预览弹窗 */}
      {showTablePreview && previewTableData && (
        <TablePreview
          tableName={previewTableName}
          data={previewTableData}
          onClose={() => setShowTablePreview(false)}
          onLoadToWorkspace={handleLoadTableFromPreview}
        />
      )}
      
      {/* 表格编辑弹窗 */}
      {showTableEditor && editTableData && (
        <TableEditor
          tableName={editTableName}
          data={editTableData}
          onCancel={() => setShowTableEditor(false)}
          onSave={handleSaveEditedTable}
          onSaveAsNew={handleSaveAsNewTable}
        />
      )}
      
      {/* 表格管理器弹窗 */}
      {showTableManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">表格管理</h2>
              <button 
                onClick={() => setShowTableManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTables.map((tableName) => (
                  <div key={tableName} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-blue-600">{tableName}</h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditTable(tableName)}
                          className="text-gray-500 hover:text-blue-600"
                          title="编辑表格"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(tableName)}
                          className="text-gray-500 hover:text-red-600"
                          title="删除表格"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleLoadTable(tableName)}
                        className="flex-1 bg-blue-600 text-white text-sm py-1 px-2 rounded hover:bg-blue-700"
                      >
                        加载到工作区
                      </button>
                      <button
                        onClick={() => handlePreviewTable(tableName)}
                        className="flex-1 bg-gray-200 text-gray-800 text-sm py-1 px-2 rounded hover:bg-gray-300"
                      >
                        预览
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomAssistant; 