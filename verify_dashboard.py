#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenDashboard 数据验证脚本
验证任务数据的准确性和一致性
"""

import json
import subprocess
from datetime import datetime
import sys

LOCAL_FILE = '/Users/zhang/.openclaw/workspace/opendashboard/tasks/tasks.json'

def validate_dashboard_data():
    """验证 Dashboard 数据准确性"""
    print("=" * 70)
    print("🔍 OpenDashboard 数据验证")
    print("=" * 70)
    
    errors = []
    warnings = []
    
    # 1. 读取数据
    try:
        with open(LOCAL_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print("✅ 数据文件读取成功")
    except Exception as e:
        print(f"❌ 数据文件读取失败：{e}")
        return False
    
    # 2. 验证统计数字
    tasks = data.get('tasks', [])
    todo_tasks = data.get('todoTasks', [])
    completed_tasks = data.get('completedTasks', [])
    statistics = data.get('statistics', {})
    
    # 计算实际数量
    actual_progress = sum(1 for t in tasks if t.get('status') == 'progress')
    actual_todo = sum(1 for t in tasks if t.get('status') == 'todo') + len(todo_tasks)
    actual_done = len(completed_tasks)
    actual_total = len(tasks)
    
    # 对比统计数据
    stat_progress = statistics.get('progress', -1)
    stat_todo = statistics.get('todo', -1)
    stat_done = statistics.get('done', -1)
    stat_total = statistics.get('total', -1)
    
    print(f"\n📊 统计数据验证:")
    
    if stat_progress != actual_progress:
        errors.append(f"执行中数量错误：统计={stat_progress}, 实际={actual_progress}")
        print(f"   ❌ 执行中：统计={stat_progress}, 实际={actual_progress}")
    else:
        print(f"   ✅ 执行中：{actual_progress}")
    
    if stat_todo != actual_todo:
        errors.append(f"待办数量错误：统计={stat_todo}, 实际={actual_todo}")
        print(f"   ❌ 待办：统计={stat_todo}, 实际={actual_todo}")
    else:
        print(f"   ✅ 待办：{actual_todo}")
    
    if stat_done != actual_done:
        errors.append(f"已完成数量错误：统计={stat_done}, 实际={actual_done}")
        print(f"   ❌ 已完成：统计={stat_done}, 实际={actual_done}")
    else:
        print(f"   ✅ 已完成：{actual_done}")
    
    if stat_total != actual_total:
        errors.append(f"总数错误：统计={stat_total}, 实际={actual_total}")
        print(f"   ❌ 总数：统计={stat_total}, 实际={actual_total}")
    else:
        print(f"   ✅ 总数：{actual_total}")
    
    # 3. 验证任务状态分布
    status_distribution = {}
    for task in tasks:
        status = task.get('status', 'unknown')
        status_distribution[status] = status_distribution.get(status, 0) + 1
    
    print(f"\n📋 任务状态分布:")
    for status, count in sorted(status_distribution.items()):
        print(f"   {status}: {count} 个")
    
    # 4. 验证任务 ID 唯一性
    task_ids = [t.get('id') for t in tasks]
    if len(task_ids) != len(set(task_ids)):
        errors.append("任务 ID 不唯一")
        print(f"\n   ❌ 任务 ID 存在重复")
    else:
        print(f"\n   ✅ 任务 ID 唯一性验证通过")
    
    # 5. 验证优先级设置
    priorities = {'P0': 0, 'P1': 0, 'P2': 0}
    for task in tasks:
        priority = task.get('priority', 'P2')
        priorities[priority] = priorities.get(priority, 0) + 1
    
    print(f"\n🎯 优先级分布:")
    for priority, count in sorted(priorities.items()):
        if count > 0:
            print(f"   {priority}: {count} 个")
    
    # 6. 验证周期性任务
    periodic_tasks = [t for t in tasks if 'feishu' in t.get('metadata', {}).get('source', '') or 'health' in t.get('metadata', {}).get('source', '')]
    if periodic_tasks:
        print(f"\n💚 周期性任务检查:")
        for task in periodic_tasks:
            exec_time = task.get('executionTime', '')
            if exec_time != '每 5 分钟':
                warnings.append(f"周期性任务执行时间显示错误：{task.get('title')} = {exec_time}")
                print(f"   ⚠️  {task.get('title')}: 执行时间={exec_time} (应为'每 5 分钟')")
            else:
                print(f"   ✅ {task.get('title')}: {exec_time}")
    
    # 7. 检查数据时效性
    last_update = data.get('lastUpdate', '')
    print(f"\n⏰ 数据时效性:")
    print(f"   最后更新：{last_update}")
    
    try:
        update_time = datetime.fromisoformat(last_update.replace('+08:00', ''))
        age_minutes = (datetime.now() - update_time).total_seconds() / 60
        print(f"   数据年龄：{age_minutes:.1f} 分钟")
        
        if age_minutes > 10:
            warnings.append(f"数据超过 10 分钟未更新")
            print(f"   ⚠️  数据已超过 10 分钟未更新")
        else:
            print(f"   ✅ 数据更新及时")
    except:
        warnings.append("无法解析最后更新时间")
        print(f"   ⚠️  无法解析时间格式")
    
    # 8. 验证结果汇总
    print("\n" + "=" * 70)
    print("📋 验证结果汇总")
    print("=" * 70)
    
    if errors:
        print(f"\n❌ 发现 {len(errors)} 个错误:")
        for err in errors:
            print(f"   - {err}")
    else:
        print(f"\n✅ 无错误")
    
    if warnings:
        print(f"\n⚠️  发现 {len(warnings)} 个警告:")
        for warn in warnings:
            print(f"   - {warn}")
    else:
        print(f"\n✅ 无警告")
    
    # 9. 最终判定
    print("\n" + "=" * 70)
    if errors:
        print("❌ 验证失败 - 需要修复")
        return False
    elif warnings:
        print("⚠️  验证通过（有警告）")
        return True
    else:
        print("✅ 验证通过 - 数据准确")
        return True

def auto_fix():
    """自动修复数据"""
    print("\n🔧 尝试自动修复...")
    
    # 重新运行同步脚本
    result = subprocess.run(
        ['python3', '/Users/zhang/.openclaw/workspace/sync_openclaw_tasks.py'],
        capture_output=True, text=True, timeout=60
    )
    
    if result.returncode == 0:
        print("✅ 重新同步完成")
        return True
    else:
        print(f"❌ 重新同步失败：{result.stderr}")
        return False

if __name__ == '__main__':
    print(f"验证时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = validate_dashboard_data()
    
    if not success:
        print("\n是否自动修复？(y/n)")
        # 非交互模式下自动修复
        if len(sys.argv) > 1 and sys.argv[1] == '--auto':
            auto_fix()
            validate_dashboard_data()  # 重新验证
        else:
            print("提示：运行 python3 verify_dashboard.py --auto 自动修复")
            sys.exit(1)
