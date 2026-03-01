// 智能提醒模块

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.checkInterval = 60000; // 每分钟检查一次
        this.start();
    }

    // 启动提醒检查
    start() {
        setInterval(() => {
            this.checkNotifications();
        }, this.checkInterval);
        console.log('🔔 智能提醒服务已启动');
    }

    // 检查待发送的提醒
    checkNotifications() {
        const now = new Date();
        
        if (!window.tasksData || !window.tasksData.notifications) return;
        
        window.tasksData.notifications.forEach(notification => {
            if (notification.sent) return;
            
            const scheduledTime = new Date(notification.scheduledTime);
            if (now >= scheduledTime) {
                this.sendNotification(notification);
            }
        });
    }

    // 发送提醒
    sendNotification(notification) {
        console.log('🔔 发送提醒:', notification.message);
        
        // 显示浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('OpenDashboard 提醒', {
                body: notification.message,
                icon: '/favicon.ico'
            });
        }
        
        // 标记为已发送
        notification.sent = true;
        
        // 保存到本地
        this.saveNotifications();
    }

    // 保存提醒状态
    saveNotifications() {
        console.log('保存提醒状态...');
        // 实际应用中会同步到后端
    }

    // 请求通知权限
    requestPermission() {
        if (!('Notification' in window)) {
            alert('您的浏览器不支持桌面通知');
            return;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ 通知权限已授予');
                }
            });
        }
    }
}

// 任务提醒检查
function checkTaskReminders() {
    if (!window.tasksData || !window.tasksData.tasks) return;
    
    const now = new Date();
    
    window.tasksData.tasks.forEach(task => {
        if (!task.deadline || task.status === 'done') return;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline - now;
        
        // 已超时
        if (timeDiff < 0 && task.status !== 'done') {
            showReminder(`⚠️ 任务 ${task.id} 已超时！`, 'error');
        }
        // 截止前 30 分钟
        else if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
            showReminder(`⏰ 任务 ${task.id} 将在 30 分钟内截止`, 'warning');
        }
        // 截止前 1 小时
        else if (timeDiff > 30 * 60 * 1000 && timeDiff < 60 * 60 * 1000) {
            showReminder(`⏰ 任务 ${task.id} 将在 1 小时内截止`, 'info');
        }
    });
}

// 显示提醒
function showReminder(message, type = 'info') {
    // 创建提醒元素
    const reminder = document.createElement('div');
    reminder.className = `reminder reminder-${type}`;
    reminder.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    
    // 添加到页面
    document.body.appendChild(reminder);
    
    // 3 秒后动画显示
    setTimeout(() => {
        reminder.classList.add('show');
    }, 100);
    
    // 10 秒后自动移除
    setTimeout(() => {
        reminder.classList.remove('show');
        setTimeout(() => reminder.remove(), 300);
    }, 10000);
}

// 导出函数
window.NotificationManager = NotificationManager;
window.checkTaskReminders = checkTaskReminders;
window.showReminder = showReminder;
