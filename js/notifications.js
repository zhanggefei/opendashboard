// 通知系统增强 v2.0 - 多渠道 + 免打扰

class NotificationManager {
    constructor() {
        this.settings = {
            enabled: true,
            dnd: false, // 免打扰模式
            dndStart: '22:00',
            dndEnd: '08:00',
            channels: {
                desktop: true,
                sound: true,
                badge: true
            }
        };
        this.notifications = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_notifications');
        if (saved) {
            const data = JSON.parse(saved);
            this.settings = { ...this.settings, ...data.settings };
            this.notifications = data.notifications || [];
        }
        
        // 请求桌面通知权限
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_notifications', JSON.stringify({
            settings: this.settings,
            notifications: this.notifications
        }));
    }
    
    // 检查是否在免打扰时间
    isDNDTime() {
        if (!this.settings.dnd) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = this.settings.dndStart.split(':').map(Number);
        const [endHour, endMin] = this.settings.dndEnd.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (startTime > endTime) {
            // 跨夜情况
            return currentTime >= startTime || currentTime <= endTime;
        } else {
            return currentTime >= startTime && currentTime <= endTime;
        }
    }
    
    // 发送通知
    send(title, options = {}) {
        const notification = {
            id: `notif_${Date.now()}`,
            title: title,
            body: options.body || '',
            icon: options.icon || '/favicon.ico',
            timestamp: new Date().toISOString(),
            read: false,
            type: options.type || 'info' // info, success, warning, error
        };
        
        this.notifications.unshift(notification);
        
        // 保留最近 100 条
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }
        
        this.save();
        
        // 如果不在免打扰时间，发送桌面通知
        if (!this.isDNDTime() && this.settings.enabled) {
            if (this.settings.channels.desktop && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(title, {
                        body: options.body,
                        icon: notification.icon,
                        badge: '/favicon.ico'
                    });
                }
            }
            
            // 播放提示音
            if (this.settings.channels.sound) {
                this.playSound();
            }
        }
        
        // 更新徽章
        this.updateBadge();
        
        return notification;
    }
    
    // 播放提示音
    playSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
        audio.play().catch(() => {}); // 忽略错误
    }
    
    // 更新徽章计数
    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        // 更新标题徽章
        if (this.settings.channels.badge && unreadCount > 0) {
            document.title = `(${unreadCount}) ${document.title.replace(/^\(\d+\) /, '')}`;
        } else {
            document.title = document.title.replace(/^\(\d+\) /, '');
        }
    }
    
    // 标记为已读
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.save();
            this.updateBadge();
        }
    }
    
    // 全部标记为已读
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.save();
        this.updateBadge();
    }
    
    // 删除通知
    deleteNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.save();
        this.updateBadge();
    }
    
    // 清空所有通知
    clearAll() {
        if (confirm('确定要清空所有通知吗？')) {
            this.notifications = [];
            this.save();
            this.updateBadge();
        }
    }
    
    // 显示通知中心
    showNotificationCenter() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>🔔 通知中心</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="notification-actions">
                        <button class="btn-secondary" onclick="window.notificationManager.markAllAsRead(); window.notificationManager.showNotificationCenter();">全部已读</button>
                        <button class="btn-secondary" onclick="window.notificationManager.clearAll(); this.closest('.modal').remove();">清空全部</button>
                        <button class="btn-secondary" onclick="window.notificationManager.toggleDND(); this.closest('.modal').remove();">${this.settings.dnd ? '关闭免打扰' : '开启免打扰'}</button>
                    </div>
                    
                    <div class="notification-list">
                        ${this.notifications.length === 0 ? '<p class="empty-state">暂无通知</p>' : ''}
                        ${this.notifications.map(n => `
                            <div class="notification-item ${n.read ? 'read' : 'unread'} ${n.type}">
                                <div class="notification-content">
                                    <div class="notification-title">${n.title}</div>
                                    <div class="notification-body">${n.body}</div>
                                    <div class="notification-time">${new Date(n.timestamp).toLocaleString('zh-CN')}</div>
                                </div>
                                <button class="notification-close" onclick="window.notificationManager.deleteNotification('${n.id}'); window.notificationManager.showNotificationCenter();">×</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 切换免打扰模式
    toggleDND() {
        this.settings.dnd = !this.settings.dnd;
        this.save();
        alert(`免打扰模式已${this.settings.dnd ? '开启' : '关闭'}`);
    }
    
    // 显示通知设置
    showSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>⚙️ 通知设置</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.enabled ? 'checked' : ''} onchange="window.notificationManager.settings.enabled = this.checked; window.notificationManager.save();">
                            启用通知
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.dnd ? 'checked' : ''} onchange="window.notificationManager.toggleDND(); this.closest('.modal').remove();">
                            免打扰模式
                        </label>
                        <div class="setting-note">开启后将在设定时间段内静音通知</div>
                    </div>
                    <div class="setting-item">
                        <label>免打扰开始时间</label>
                        <input type="time" value="${this.settings.dndStart}" onchange="window.notificationManager.settings.dndStart = this.value; window.notificationManager.save();">
                    </div>
                    <div class="setting-item">
                        <label>免打扰结束时间</label>
                        <input type="time" value="${this.settings.dndEnd}" onchange="window.notificationManager.settings.dndEnd = this.value; window.notificationManager.save();">
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.channels.desktop ? 'checked' : ''} onchange="window.notificationManager.settings.channels.desktop = this.checked; window.notificationManager.save();">
                            桌面通知
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.channels.sound ? 'checked' : ''} onchange="window.notificationManager.settings.channels.sound = this.checked; window.notificationManager.save();">
                            提示音
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" ${this.settings.channels.badge ? 'checked' : ''} onchange="window.notificationManager.settings.channels.badge = this.checked; window.notificationManager.save();">
                            标题徽章
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// 全局注册
window.NotificationManager = NotificationManager;
