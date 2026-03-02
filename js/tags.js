// 任务标签系统 v1.0

class TagManager {
    constructor() {
        this.tags = [];
        this.taskTags = {};
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem('opendashboard_tags');
        if (saved) {
            const data = JSON.parse(saved);
            this.tags = data.tags || [];
            this.taskTags = data.taskTags || {};
        }
    }
    
    save() {
        localStorage.setItem('opendashboard_tags', JSON.stringify({
            tags: this.tags,
            taskTags: this.taskTags
        }));
    }
    
    // 创建标签
    createTag(name, color) {
        if (this.tags.find(t => t.name === name)) {
            alert('标签已存在');
            return null;
        }
        
        const tag = {
            id: `tag_${Date.now()}`,
            name: name,
            color: color || this.getRandomColor(),
            createdAt: new Date().toISOString()
        };
        
        this.tags.push(tag);
        this.save();
        return tag;
    }
    
    // 删除标签
    deleteTag(tagId) {
        this.tags = this.tags.filter(t => t.id !== tagId);
        // 清理所有任务上的此标签
        Object.keys(this.taskTags).forEach(taskId => {
            this.taskTags[taskId] = this.taskTags[taskId].filter(id => id !== tagId);
        });
        this.save();
    }
    
    // 给任务添加标签
    addTagToTask(taskId, tagId) {
        if (!this.taskTags[taskId]) {
            this.taskTags[taskId] = [];
        }
        
        if (!this.taskTags[taskId].includes(tagId)) {
            this.taskTags[taskId].push(tagId);
            this.save();
        }
    }
    
    // 移除任务标签
    removeTagFromTask(taskId, tagId) {
        if (this.taskTags[taskId]) {
            this.taskTags[taskId] = this.taskTags[taskId].filter(id => id !== tagId);
            this.save();
        }
    }
    
    // 获取任务的标签
    getTaskTags(taskId) {
        const tagIds = this.taskTags[taskId] || [];
        return tagIds.map(id => this.tags.find(t => t.id === id)).filter(t => t);
    }
    
    // 根据标签筛选任务
    getTasksByTag(tagId) {
        return Object.keys(this.taskTags)
            .filter(taskId => this.taskTags[taskId].includes(tagId));
    }
    
    // 获取随机颜色
    getRandomColor() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // 显示标签管理模态框
    showTagManager() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🏷️ 标签管理</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="tag-create">
                        <input type="text" id="newTagName" placeholder="标签名称" style="padding: 8px; border: 2px solid #e5e7eb; border-radius: 6px; width: 200px;">
                        <input type="color" id="newTagColor" value="#667eea" style="width: 50px; height: 38px; border: none; cursor: pointer;">
                        <button class="btn-primary" onclick="window.tagManager.createTagFromInput()">创建</button>
                    </div>
                    
                    <div class="tags-list">
                        ${this.tags.map(tag => `
                            <div class="tag-item">
                                <span class="tag-color" style="background: ${tag.color}"></span>
                                <span class="tag-name">${tag.name}</span>
                                <span class="tag-count">${this.getTasksByTag(tag.id).length} 个任务</span>
                                <button class="btn-remove" onclick="window.tagManager.deleteTag('${tag.id}')">删除</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    createTagFromInput() {
        const name = document.getElementById('newTagName').value.trim();
        const color = document.getElementById('newTagColor').value;
        
        if (!name) {
            alert('请输入标签名称');
            return;
        }
        
        const tag = this.createTag(name, color);
        if (tag) {
            this.showTagManager(); // 刷新列表
        }
    }
}

// 全局注册
window.TagManager = TagManager;
