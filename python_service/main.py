from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import collections
import re
from sklearn.feature_extraction.text import CountVectorizer
import pandas as pd
import json

app = FastAPI(title="表格数据分析API")

# 添加CORS支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TableRequest(BaseModel):
    table_name: str
    data: List[Dict[str, Any]]
    column: str  # 要分析的列名
    algorithm: Optional[str] = "simple"  # 默认使用简单算法

@app.get("/")
async def root():
    return {"message": "表格数据分析API服务正常运行"}

@app.post("/api/keyword_stats")
async def keyword_stats(request: TableRequest):
    """
    对表格数据中的指定列进行关键词统计分析
    """
    try:
        # 检查数据是否有效
        if not request.data or len(request.data) == 0:
            raise HTTPException(status_code=400, detail="表格数据为空")
        
        # 检查列是否存在
        if request.column not in request.data[0]:
            raise HTTPException(status_code=400, detail=f"列 '{request.column}' 不存在")
        
        # 根据算法类型选择不同的处理方法
        if request.algorithm.lower() == "simple":
            result = simple_keyword_analysis(request.data, request.column)
            method_description = "简单词频统计法"
        elif request.algorithm.lower() == "advanced":
            result = advanced_keyword_analysis(request.data, request.column)
            method_description = "高级NLP词频分析法"
        else:
            raise HTTPException(status_code=400, detail=f"不支持的算法类型: {request.algorithm}")
        
        return {
            "success": True,
            "table_name": request.table_name,
            "column_analyzed": request.column,
            "method": method_description,
            "result": result
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def simple_keyword_analysis(data: List[Dict[str, Any]], column: str):
    """
    简单的关键词统计方法：直接计数
    """
    # 提取指定列的所有值
    texts = [str(item[column]) for item in data if item[column] is not None]
    
    # 简单分词（按空格和标点符号分割）
    words = []
    for text in texts:
        # 转换为小写并分割
        words.extend(re.findall(r'\b\w+\b', text.lower()))
    
    # 计算词频
    word_counts = collections.Counter(words)
    
    # 获取前20个最常见的词
    top_words = word_counts.most_common(20)
    
    return {
        "total_words": len(words),
        "unique_words": len(word_counts),
        "top_keywords": [{"word": word, "count": count} for word, count in top_words]
    }

def advanced_keyword_analysis(data: List[Dict[str, Any]], column: str):
    """
    高级的关键词统计方法：使用NLP库
    """
    # 提取指定列的所有值
    texts = [str(item[column]) for item in data if item[column] is not None]
    
    # 使用CountVectorizer进行词频分析
    vectorizer = CountVectorizer(
        lowercase=True,
        token_pattern=r'\b\w+\b',
        max_features=100
    )
    
    # 转换文本数据
    X = vectorizer.fit_transform(texts)
    
    # 获取词汇表
    words = vectorizer.get_feature_names_out()
    
    # 计算词频总和
    word_counts = X.sum(axis=0).A1
    
    # 创建词频DataFrame
    word_freq_df = pd.DataFrame({
        'word': words,
        'count': word_counts
    })
    
    # 按频率排序
    word_freq_df = word_freq_df.sort_values('count', ascending=False).head(20)
    
    # 计算TF-IDF得分
    word_freq_df['frequency'] = word_freq_df['count'] / word_freq_df['count'].sum()
    
    return {
        "total_words": int(word_counts.sum()),
        "unique_words": len(words),
        "top_keywords": json.loads(word_freq_df.to_json(orient='records')),
        "advanced_stats": {
            "average_words_per_entry": sum(len(text.split()) for text in texts) / len(texts),
            "longest_entry_words": max(len(text.split()) for text in texts)
        }
    }

# 测试用例
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 