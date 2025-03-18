# 表格数据分析Python服务

这是一个用于表格数据分析的Python FastAPI服务，提供了两种不同的关键词统计匹配算法。

## 功能

- 简单关键词统计：基本的词频统计
- 高级关键词统计：使用NLP库进行更复杂的词频分析

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
uvicorn main:app --reload
```

服务将在 http://localhost:8000 上运行。

## API文档

启动服务后，可以在 http://localhost:8000/docs 查看API文档。

### 主要接口

#### POST /api/keyword_stats

对表格数据中的指定列进行关键词统计分析。

请求体示例：

```json
{
  "table_name": "students",
  "data": [
    {"id": 1, "name": "张三", "description": "喜欢编程和数学"},
    {"id": 2, "name": "李四", "description": "对数学和物理感兴趣"}
  ],
  "column": "description",
  "algorithm": "simple"  // 或 "advanced"
}
```

响应示例：

```json
{
  "success": true,
  "table_name": "students",
  "column_analyzed": "description",
  "method": "简单词频统计法",
  "result": {
    "total_words": 6,
    "unique_words": 5,
    "top_keywords": [
      {"word": "数学", "count": 2},
      {"word": "编程", "count": 1},
      {"word": "和", "count": 1},
      {"word": "物理", "count": 1},
      {"word": "感兴趣", "count": 1}
    ]
  }
}
```

## 与前端集成

此服务设计为与表格Copilot前端集成，通过API调用提供数据分析功能。 