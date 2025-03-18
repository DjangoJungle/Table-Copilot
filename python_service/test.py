#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import requests
import sys

def test_keyword_analysis(algorithm="simple"):
    """测试关键词分析API"""
    print(f"测试 {algorithm} 算法的关键词分析...")
    
    # 加载测试数据
    with open("test_data.json", "r", encoding="utf-8") as f:
        test_data = json.load(f)
    
    # 修改算法类型
    test_data["algorithm"] = algorithm
    
    # 发送请求
    try:
        response = requests.post(
            "http://localhost:8000/api/keyword_stats",
            json=test_data
        )
        
        # 检查响应
        if response.status_code == 200:
            result = response.json()
            print(f"请求成功! 使用的方法: {result.get('method', '未知')}")
            print("\n结果摘要:")
            
            if result.get("success"):
                data = result.get("result", {})
                print(f"- 总词数: {data.get('total_words', 0)}")
                print(f"- 唯一词数: {data.get('unique_words', 0)}")
                
                # 打印前5个关键词
                top_keywords = data.get("top_keywords", [])[:5]
                if top_keywords:
                    print("\n前5个关键词:")
                    for kw in top_keywords:
                        print(f"- {kw.get('word')}: {kw.get('count')} 次")
                
                # 如果是高级算法，打印高级统计信息
                if algorithm == "advanced" and "advanced_stats" in data:
                    adv_stats = data["advanced_stats"]
                    print("\n高级统计信息:")
                    for key, value in adv_stats.items():
                        print(f"- {key}: {value}")
            else:
                print(f"API返回错误: {result.get('error', '未知错误')}")
                
            print("\n完整响应:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"测试出错: {e}")
        print("请确保Python服务已启动 (uvicorn main:app --reload)")

if __name__ == "__main__":
    # 默认测试简单算法
    algorithm = "simple"
    
    # 如果命令行参数指定了算法，使用指定的算法
    if len(sys.argv) > 1 and sys.argv[1] in ["simple", "advanced"]:
        algorithm = sys.argv[1]
    
    test_keyword_analysis(algorithm) 