# Python算法与表格Copilot集成指南

本文档介绍如何将Python算法与表格Copilot前端集成，并通过Copilot智能路由调用不同的算法。

## 架构概述

```
前端 (Next.js) <---> Python FastAPI服务 <---> 表格Copilot
```

集成采用了以下架构：
1. Python FastAPI服务提供算法API
2. 前端通过tableTools工具函数调用Python API
3. TableAgent根据用户输入智能路由到不同算法

## 目录结构

```
/
├── src/                      # 前端代码
│   └── app/
│       ├── agents/           # 智能代理
│       │   └── tableAgent.ts # 表格代理
│       └── services/
│           └── tableTools.ts # 表格工具函数
├── python_service/           # Python服务
│   ├── main.py               # FastAPI主程序
│   ├── requirements.txt      # 依赖项
│   ├── start.bat             # Windows启动脚本
│   ├── start.sh              # Linux/Mac启动脚本
│   ├── test.py               # 测试脚本
│   └── test_data.json        # 测试数据
└── PYTHON_INTEGRATION.md     # 本文档
```

## 安装与启动

### 1. 安装Python依赖

```bash
cd python_service
pip install -r requirements.txt
```

### 2. 启动Python服务

Windows:
```bash
cd python_service
start.bat
```

Linux/Mac:
```bash
cd python_service
chmod +x start.sh
./start.sh
```

或直接运行:
```bash
cd python_service
uvicorn main:app --reload
```

### 3. 测试Python服务

```bash
cd python_service
python test.py         # 测试简单算法
python test.py advanced # 测试高级算法
```

### 4. 启动前端应用

```bash
npm run dev
```

## 使用方法

### 通过Copilot使用Python算法

1. 打开表格Copilot界面
2. 加载一个包含文本数据的表格
3. 使用自然语言请求分析，例如：
   - "请对description列进行关键词分析"
   - "使用简单算法统计description列中的关键词"
   - "用高级NLP方法分析description列的词频"

Copilot会根据您的请求自动选择合适的算法，并调用Python服务进行处理。

### 算法说明

目前支持两种关键词分析算法：

1. **简单算法 (simple)**
   - 基本的词频统计
   - 适合简单文本分析
   - 返回总词数、唯一词数和前20个关键词

2. **高级算法 (advanced)**
   - 使用NLP库进行更复杂的词频分析
   - 提供更详细的文本统计信息
   - 返回总词数、唯一词数、前20个关键词，以及平均词数等高级统计

## 添加新算法

要添加新的Python算法，请按照以下步骤操作：

1. 在`python_service/main.py`中添加新的算法函数
2. 在API路由中添加对新算法的支持
3. 在`src/app/services/tableTools.ts`中更新工具函数
4. 在`src/app/agents/tableAgent.ts`中更新系统提示

## 故障排除

如果遇到问题，请检查：

1. Python服务是否正在运行 (http://localhost:8000)
2. 前端应用是否正在运行 (http://localhost:3000)
3. 控制台是否有错误信息
4. Python服务日志是否有错误信息

## 示例响应

简单算法响应示例：
```json
{
  "success": true,
  "table_name": "students",
  "column_analyzed": "description",
  "method": "简单词频统计法",
  "result": {
    "total_words": 52,
    "unique_words": 42,
    "top_keywords": [
      {"word": "喜欢", "count": 5},
      {"word": "和", "count": 4},
      {"word": "数学", "count": 3},
      {"word": "编程", "count": 2},
      {"word": "经常", "count": 2}
    ]
  }
}
``` 