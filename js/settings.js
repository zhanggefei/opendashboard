// 系统设置 v1.0 - 主题/布局/多语言/备份

class SettingsManager {
    constructor() {
        this.settings = {
            theme: 'default',
            layout: 'kanban',
            language: 'zh-CN',
            timezone: 'Asia/Shanghai',
            itemsPerPage: 20,
            autoSave: true,
            backup: {
                enabled: true,
                interval: 'daily'
            }
        };
        this.versionHistory = [];
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_settings');
        if (saved) {
            const data = JSON.parse(saved);
            this.settings = { ...this.settings, ...data.settings };
            this.versionHistory = data.versionHistory || [];
        }
        
        // 应用主题
        this.applyTheme();
        
        // 应用语言
        this.applyLanguage();
    }
    
    save() {
        localStorage.setItem('opendashboard_settings', JSON.stringify({
            settings: this.settings,
            versionHistory: this.versionHistory
        }));
    }
    
    // 应用主题
    applyTheme() {
        document.body.setAttribute('data-theme', this.settings.theme);
    }
    
    // 应用语言
    applyLanguage() {
        document.documentElement.lang = this.settings.language;
        // 实际项目中应加载对应语言包
    }
    
    // 切换布局
    toggleLayout() {
        this.settings.layout = this.settings.layout === 'kanban' ? 'list' : 'kanban';
        this.save();
        this.applyLayout();
    }
    
    // 应用布局
    applyLayout() {
        document.body.setAttribute('data-layout', this.settings.layout);
        if (window.applyFilters) {
            window.applyFilters();
        }
    }
    
    // 创建备份
    createBackup() {
        const backup = {
            version: Date.now(),
            date: new Date().toISOString(),
            tasks: window.tasks,
            settings: this.settings
        };
        
        // 保存到版本历史
        this.versionHistory.unshift(backup);
        
        // 保留最近 10 个版本
        if (this.versionHistory.length > 10) {
            this.versionHistory = this.versionHistory.slice(0, 10);
        }
        
        this.save();
        
        // 下载备份文件
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opendashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ 备份已创建并下载！');
    }
    
    // 从备份恢复
    restoreBackup(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (!confirm(`确定要恢复到 ${new Date(backup.date).toLocaleString('zh-CN')} 的备份吗？当前数据将被覆盖！`)) {
                    return;
                }
                
                window.tasks = backup.tasks || [];
                this.settings = { ...this.settings, ...backup.settings };
                
                window.saveTasks();
                this.save();
                this.applyTheme();
                this.applyLanguage();
                window.applyFilters();
                
                alert('✅ 恢复成功！');
                location.reload();
                
            } catch (err) {
                alert('备份文件格式错误');
            }
        };
        
        reader.readAsText(file);
    }
    
    // 显示设置面板
    showSettingsPanel() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>⚙️ 系统设置</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>🎨 外观</h4>
                        <div class="setting-item">
                            <label>主题</label>
                            <select onchange="window.settingsManager.settings.theme = this.value; window.settingsManager.save(); window.settingsManager.applyTheme();">
                                <option value="default" ${this.settings.theme === 'default' ? 'selected' : ''}>默认</option>
                                <option value="blue" ${this.settings.theme === 'blue' ? 'selected' : ''}>蓝色</option>
                                <option value="green" ${this.settings.theme === 'green' ? 'selected' : ''}>绿色</option>
                                <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>深色</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>布局</label>
                            <select onchange="window.settingsManager.settings.layout = this.value; window.settingsManager.save(); window.settingsManager.applyLayout();">
                                <option value="kanban" ${this.settings.layout === 'kanban' ? 'selected' : ''}>看板</option>
                                <option value="list" ${this.settings.layout === 'list' ? 'selected' : ''}>列表</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>🌍 区域</h4>
                        <div class="setting-item">
                            <label>语言</label>
                            <select onchange="window.settingsManager.settings.language = this.value; window.settingsManager.save(); window.settingsManager.applyLanguage();">
                                <option value="zh-CN" ${this.settings.language === 'zh-CN' ? 'selected' : ''}>简体中文</option>
                                <option value="zh-TW" ${this.settings.language === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                                <option value="en-US" ${this.settings.language === 'en-US' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>时区</label>
                            <select onchange="window.settingsManager.settings.timezone = this.value; window.settingsManager.save();">
                                <option value="Asia/Shanghai" ${this.settings.timezone === 'Asia/Shanghai' ? 'selected' : ''}>Asia/Shanghai</option>
                                <option value="Asia/Tokyo" ${this.settings.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Asia/Tokyo</option>
                                <option value="America/New_York" ${this.settings.timezone === 'America/New_York' ? 'selected' : ''}>America/New_York</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>💾 数据管理</h4>
                        <div class="setting-actions">
                            <button class="btn-primary" onclick="window.settingsManager.createBackup()">创建备份</button>
                            <button class="btn-secondary" onclick="document.getElementById('restoreFile').click()">恢复备份</button>
                            <input type="file" id="restoreFile" accept=".json" style="display: none;" onchange="window.settingsManager.restoreBackup(this.files[0])">
                        </div>
                        
                        <h4 style="margin-top: 20px;">版本历史</h4>
                        <div class="version-history">
                            ${this.versionHistory.length === 0 ? '<p class="empty-state">暂无备份历史</p>' : ''}
                            ${this.versionHistory.map(v => `
                                <div class="version-item">
                                    <span>${new Date(v.date).toLocaleString('zh-CN')}</span>
                                    <button class="btn-secondary" onclick="if(confirm('确定恢复到此版本？')) { window.settingsManager.restoreBackupFile(${v.version}); }">恢复</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // 从版本历史恢复
    restoreBackupFile(version) {
        const backup = this.versionHistory.find(v => v.version === version);
        if (!backup) return;
        
        if (confirm(`确定要恢复到 ${new Date(backup.date).toLocaleString('zh-CN')} 的版本吗？`)) {
            window.tasks = backup.tasks || [];
            this.settings = { ...this.settings, ...backup.settings };
            
            window.saveTasks();
            this.save();
            this.applyTheme();
            this.applyLanguage();
            window.applyFilters();
            
            alert('✅ 恢复成功！');
            location.reload();
        }
    }
}

// 全局注册
window.SettingsManager = SettingsManager;
