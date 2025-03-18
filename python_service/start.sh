#!/bin/bash
echo "启动表格数据分析Python服务..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 