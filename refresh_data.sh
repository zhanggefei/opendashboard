#!/bin/bash
# OpenDashboard 数据刷新脚本
# 触发 OpenClaw 任务同步

cd /Users/zhang/.openclaw/workspace

# 执行任务同步
python3 /Users/zhang/.openclaw/workspace/sync_openclaw_tasks.py > /dev/null 2>&1

echo "✅ 数据已刷新"
