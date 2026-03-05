#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成带有统计数据的 HTML（避免缓存问题）
"""

import json
import re
from datetime import datetime

TASKS_FILE = '/Users/zhang/.openclaw/workspace/opendashboard/tasks/tasks.json'
HTML_FILE = '/Users/zhang/.openclaw/workspace/opendashboard/index.html'
OUTPUT_FILE = '/Users/zhang/.openclaw/workspace/opendashboard/index_generated.html'

def inject_statistics():
    """将统计数据注入 HTML"""
    # 读取统计数据
    with open(TASKS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stats = data.get('statistics', {})
    progress = stats.get('progress', 0)
    todo = stats.get('todo', 0)
    done = stats.get('done', 0)
    
    # 读取 HTML
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 替换统计数字
    # 替换执行中
    html = re.sub(
        r'progressCount\">\d+ 个',
        f'progressCount">{progress}个',
        html
    )
    
    # 替换待办
    html = re.sub(
        r'todoCount\">\d+ 个',
        f'todoCount">{todo}个',
        html
    )
    
    # 替换已完成
    html = re.sub(
        r'completedCount\">\d+ 个',
        f'completedCount">{done}个',
        html
    )
    
    # 添加内联脚本确保数据正确
    inline_script = f"""
    <script>
        // 内联统计数据（优先显示）
        window.INLINE_STATS = {{ progress: {progress}, todo: {todo}, done: {done} }};
        console.log('📊 内联统计数据:', window.INLINE_STATS);
    </script>
    """
    
    # 在 app.js 之前插入
    html = html.replace(
        '<script src="js/app.js',
        inline_script + '<script src="js/app.js'
    )
    
    # 保存
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ 生成完成：{OUTPUT_FILE}")
    print(f"   执行中：{progress}")
    print(f"   待办：{todo}")
    print(f"   已完成：{done}")

if __name__ == '__main__':
    inject_statistics()
