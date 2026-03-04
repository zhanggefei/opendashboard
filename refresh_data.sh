#!/bin/bash
# OpenDashboard 数据刷新脚本
# 页面加载时调用此脚本获取最新数据

cd /Users/zhang/.openclaw/workspace

# 同步任务数据
python3 sync_openclaw_tasks.py > /dev/null 2>&1 &

# 同步定时任务数据
cp cron/jobs.json opendashboard/tasks/cron_jobs.json 2>/dev/null &

# 等待完成
sleep 1

echo "✅ 数据已刷新"
