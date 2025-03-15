// Together.ai API客户端
import { z } from 'zod';

// 定义API响应类型
interface TogetherAIResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 定义API请求参数类型
interface TogetherAIRequestParams {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
}

// Together.ai API客户端类
export class TogetherAIClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY || '';
    this.baseUrl = 'https://api.together.xyz/v1/chat/completions';
    this.defaultModel = process.env.DEFAULT_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
    
    if (!this.apiKey) {
      console.warn('未设置Together.ai API密钥，请在.env.local文件中设置TOGETHER_API_KEY');
    }
  }

  // 发送请求到Together.ai API
  async sendRequest(params: TogetherAIRequestParams): Promise<TogetherAIResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Together.ai API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Together.ai API请求出错:', error);
      throw error;
    }
  }

  // 发送聊天请求
  async chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const max_tokens = options.max_tokens || 1024;

    const response = await this.sendRequest({
      model,
      messages,
      temperature,
      max_tokens
    });

    return response.choices[0]?.message?.content || '';
  }

  // 使用工具函数发送请求
  async chatWithTools(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    tools: any[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
    } = {}
  ): Promise<TogetherAIResponse> {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature || 0.7;
    const max_tokens = options.max_tokens || 1024;
    const tool_choice = options.tool_choice || 'auto';

    return await this.sendRequest({
      model,
      messages,
      temperature,
      max_tokens,
      tools,
      tool_choice
    });
  }
}

// 创建单例实例
const togetherAIClient = new TogetherAIClient();

export default togetherAIClient; 