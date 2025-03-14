import React, { useState, useRef, useEffect } from 'react';
import { ProgrammingGrade, GradeTotal, AssistantResponse } from '../types';

interface Message {
  content: string | any[];
  type: 'user' | 'assistant';
  timestamp: Date;
  messageType?: 'text' | 'table' | 'thought';
  isTyping?: boolean;
  tableName?: string;
}

interface ThoughtStep {
  title: string;
  description: string;
  data?: any;
}

interface CustomAssistantProps {
  onAction: (actionName: string, params?: any) => Promise<AssistantResponse>;
  presetData: {
    programmingGrade: ProgrammingGrade[];
    gradeTotal: GradeTotal[];
  };
  onLoadTable: (tableName: string, data: any[]) => void;
}

const ThinkingAnimation = () => (
  <div className="flex space-x-2 p-3 bg-white rounded-lg shadow-sm">
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const TypewriterText: React.FC<{ text: string; onComplete: () => void }> = ({ text, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const delay = Math.random() * 30 + 20; // 20-50ms 随机延迟
      const timer = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentIndex, text]);

  return <div className="whitespace-pre-wrap">{displayText}</div>;
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

export const CustomAssistant: React.FC<CustomAssistantProps> = ({ onAction, presetData, onLoadTable }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hello! I'm the Table Assistant, ready to help you query and analyze table data. What can I help you with?",
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleOpen = () => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  };

  const addMessageWithTypingEffect = (message: Message) => {
    const messageWithTyping = { ...message, isTyping: true };
    setMessages(prev => [...prev, messageWithTyping]);
  };

  const completeTyping = (index: number) => {
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, isTyping: false } : msg
    ));
  };

  const simulateThinking = async () => {
    setIsThinking(true);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // 500-1500ms 思考时间
    setIsThinking(false);
  };

  const generateThoughtProcess = async (query: string) => {
    // NL解码步骤
    const nlProcessingSteps: ThoughtStep[] = [
      {
        title: "Natural Language Processing",
        description: "Analyzing query intent and extracting key entities...",
        data: {
          query,
          tokens: query.toLowerCase().split(/\s+/),
          entities: {
            subject: "students",
            attribute: "programming abilities",
            action: "find joinable tables"
          }
        }
      },
      {
        title: "Query Classification",
        description: "Determining query type and required information...",
        data: {
          queryType: "TABLE_DISCOVERY",
          confidence: 0.92,
          requiredInfo: ["student data", "programming skills", "joinable tables"]
        }
      }
    ];
    
    // 添加思考过程消息
    setMessages(prev => [...prev, {
      content: nlProcessingSteps,
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'thought'
    }]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 表格元数据解码步骤
    const metadataSteps: ThoughtStep[] = [
      {
        title: "Table Metadata Analysis",
        description: "Scanning available tables and their schemas...",
        data: {
          availableTables: [
            { name: "stu_info", columns: ["Id", "Name", "Major", "MathsGrade", "Status", "Year"] },
            { name: "programming_grade", columns: ["Id", "Name", "Grade", "Level"] },
            { name: "grade_total", columns: ["Id", "Name", "Major", "Maths", "CSharp", "AvgGrade", "Rank"] }
          ]
        }
      },
      {
        title: "Join Key Identification",
        description: "Identifying potential join keys between tables...",
        data: {
          joinKeys: [
            { tables: ["stu_info", "programming_grade"], key: "Id" },
            { tables: ["stu_info", "grade_total"], key: "Id" },
            { tables: ["programming_grade", "grade_total"], key: "Id" }
          ]
        }
      }
    ];
    
    // 添加元数据解码消息
    setMessages(prev => [...prev, {
      content: metadataSteps,
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'thought'
    }]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 相似度匹配步骤
    const similaritySteps: ThoughtStep[] = [
      {
        title: "Semantic Matching",
        description: "Calculating semantic similarity between query and table attributes...",
        data: {
          matches: [
            { table: "programming_grade", attribute: "Grade", similarity: 0.87 },
            { table: "programming_grade", attribute: "Level", similarity: 0.82 },
            { table: "grade_total", attribute: "CSharp", similarity: 0.91 },
            { table: "stu_info", attribute: "Major", similarity: 0.65 }
          ]
        }
      },
      {
        title: "Relevance Ranking",
        description: "Ranking tables by relevance to query...",
        data: {
          rankings: [
            { table: "programming_grade", score: 0.89, reason: "Contains programming grade information" },
            { table: "grade_total", score: 0.85, reason: "Contains C# programming scores" },
            { table: "stu_info", score: 0.72, reason: "Contains basic student information" }
          ]
        }
      }
    ];
    
    // 添加相似度匹配消息
    setMessages(prev => [...prev, {
      content: similaritySteps,
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'thought'
    }]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 候选表格发现步骤
    const candidateSteps: ThoughtStep[] = [
      {
        title: "Candidate Table Selection",
        description: "Selecting most relevant tables based on query intent...",
        data: {
          selectedTables: ["programming_grade", "grade_total"],
          confidence: 0.93
        }
      },
      {
        title: "Result Preparation",
        description: "Preparing tables for presentation...",
        data: {
          action: "Display tables with load option",
          tables: ["programming_grade", "grade_total"],
          joinability: "Can be joined on Id field"
        }
      }
    ];
    
    // 添加候选表格发现消息
    setMessages(prev => [...prev, {
      content: candidateSteps,
      type: 'assistant',
      timestamp: new Date(),
      messageType: 'thought'
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
      messageType: 'text'
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    await simulateThinking();

    // 处理特定查询
    if (inputValue.toLowerCase().includes('programming abilities') || 
        inputValue.toLowerCase().includes('joinable tables')) {
      // 添加系统响应
      addMessageWithTypingEffect({
        content: "I'll find relevant tables for you. Let me think through this step by step...",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成思考过程
      await generateThoughtProcess(inputValue);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 添加结论
      addMessageWithTypingEffect({
        content: "I found two relevant tables that might help you:",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await simulateThinking();

      // 显示编程成绩表
      const programmingResponse = await onAction('showProgrammingGrade');
      addMessageWithTypingEffect({
        content: "programming_grade table:",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });
      
      if (programmingResponse.type === 'table') {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(prev => [...prev, {
          content: programmingResponse.content,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'table',
          tableName: programmingResponse.tableName
        }]);
      }

      await simulateThinking();

      // 显示总成绩表
      const totalResponse = await onAction('showGradeTotal');
      addMessageWithTypingEffect({
        content: "grade_total table:",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });
      
      if (totalResponse.type === 'table') {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(prev => [...prev, {
          content: totalResponse.content,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'table',
          tableName: totalResponse.tableName
        }]);
      }
    } else if (inputValue.toLowerCase().includes('student') || 
               inputValue.toLowerCase().includes('information')) {
      // 添加系统响应
      addMessageWithTypingEffect({
        content: "I found student information table that might help you:",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });

      await simulateThinking();

      // 显示学生信息表
      const studentResponse = await onAction('showStudentInfo');
      
      if (studentResponse.type === 'table') {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMessages(prev => [...prev, {
          content: studentResponse.content,
          type: 'assistant',
          timestamp: new Date(),
          messageType: 'table',
          tableName: studentResponse.tableName
        }]);
      }
    } else {
      // 默认响应
      addMessageWithTypingEffect({
        content: "Sorry, I don't understand your request. You can try asking about students' programming abilities or joinable tables.",
        type: 'assistant',
        timestamp: new Date(),
        messageType: 'text'
      });
    }
  };

  const handleLoadTable = (data: any[], tableName?: string) => {
    if (!tableName) return;
    onLoadTable(tableName, data);
  };

  const renderTableData = (data: any[], tableName?: string) => {
    if (!data || data.length === 0) return null;
    
    const headers = Object.keys(data[0]);
    
    return (
      <div className="relative">
        <div className="absolute top-0 right-0 p-2">
          <button
            onClick={() => handleLoadTable(data, tableName)}
            className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Load to Workspace
          </button>
        </div>
        <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200 mt-6">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header) => (
                  <td key={header} className="px-3 py-2 text-sm text-gray-900">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-300 z-50 flex items-center space-x-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-full mr-2 bg-blue-700 px-2 py-1 rounded whitespace-nowrap">
          Open Assistant
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 w-[500px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 z-50 transition-all duration-300 origin-bottom-right ${
        isVisible 
          ? 'opacity-100 h-[600px] transform scale-100' 
          : 'opacity-0 h-0 transform scale-95'
      }`}
    >
      {/* 头部 */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Table Assistant</span>
        </h3>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-blue-700 rounded group relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-full mr-2 bg-blue-700 px-2 py-1 rounded whitespace-nowrap text-sm">
            Minimize
          </span>
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
              }`}
            >
              {message.messageType === 'table' ? (
                renderTableData(message.content as any[], message.tableName)
              ) : message.messageType === 'thought' ? (
                <ThoughtProcess steps={message.content as ThoughtStep[]} />
              ) : message.isTyping ? (
                <TypewriterText 
                  text={message.content as string} 
                  onComplete={() => completeTyping(index)}
                />
              ) : (
                <div className="whitespace-pre-wrap">{message.content as string}</div>
              )}
              <div
                className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <ThinkingAnimation />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your question..."
            disabled={isThinking}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isThinking || !inputValue.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}; 