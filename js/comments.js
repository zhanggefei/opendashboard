// 任务评论与日志模块

class TaskCommentManager {
    constructor() {
        this.comments = {}; // taskId -> comments[]
        this.logs = {}; // taskId -> logs[]
    }

    // 添加评论
    addComment(taskId, content, author = '当前用户') {
        if (!this.comments[taskId]) {
            this.comments[taskId] = [];
        }
        
        const comment = {
            id: `c${Date.now()}`,
            taskId,
            content,
            author,
            timestamp: new Date().toISOString(),
            replies: []
        };
        
        this.comments[taskId].push(comment);
        this.save();
        return comment;
    }

    // 回复评论
    replyComment(taskId, commentId, content, author = '当前用户') {
        if (!this.comments[taskId]) return false;
        
        const comment = this.comments[taskId].find(c => c.id === commentId);
        if (!comment) return false;
        
        const reply = {
            id: `r${Date.now()}`,
            content,
            author,
            timestamp: new Date().toISOString()
        };
        
        comment.replies.push(reply);
        this.save();
        return reply;
    }

    // 删除评论
    deleteComment(taskId, commentId) {
        if (!this.comments[taskId]) return false;
        
        const index = this.comments[taskId].findIndex(c => c.id === commentId);
        if (index === -1) return false;
        
        this.comments[taskId].splice(index, 1);
        this.save();
        return true;
    }

    // 获取评论
    getComments(taskId) {
        return this.comments[taskId] || [];
    }

    // 添加日志
    addLog(taskId, action, details = '', author = '系统') {
        if (!this.logs[taskId]) {
            this.logs[taskId] = [];
        }
        
        const log = {
            id: `l${Date.now()}`,
            taskId,
            action,
            details,
            author,
            timestamp: new Date().toISOString()
        };
        
        this.logs[taskId].push(log);
        this.save();
        return log;
    }

    // 自动记录任务变更
    logTaskChange(taskId, field, oldValue, newValue, author = '系统') {
        const actionMap = {
            status: '状态变更',
            priority: '优先级调整',
            assignee: '负责人变更',
            progress: '进度更新',
            title: '标题修改',
            description: '描述修改'
        };
        
        const action = actionMap[field] || '信息更新';
        const details = `${field}: ${oldValue} → ${newValue}`;
        
        return this.addLog(taskId, action, details, author);
    }

    // 获取日志
    getLogs(taskId, limit = 50) {
        const taskLogs = this.logs[taskId] || [];
        return taskLogs.slice(-limit);
    }

    // 保存
    save() {
        console.log('保存评论和日志...');
        // 实际应用中会同步到后端
        localStorage.setItem('taskComments', JSON.stringify(this.comments));
        localStorage.setItem('taskLogs', JSON.stringify(this.logs));
    }

    // 加载
    load() {
        try {
            this.comments = JSON.parse(localStorage.getItem('taskComments')) || {};
            this.logs = JSON.parse(localStorage.getItem('taskLogs')) || {};
        } catch (e) {
            console.error('加载评论失败:', e);
        }
    }
}

// 渲染评论区
function renderComments(taskId) {
    const comments = window.commentManager?.getComments(taskId) || [];
    
    if (comments.length === 0) {
        return '<div class="empty-state">暂无评论，快来抢沙发吧~</div>';
    }
    
    let html = '<div class="comments-list">';
    
    comments.forEach(comment => {
        const time = new Date(comment.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-time">${time}</span>
                <button class="comment-delete" onclick="deleteComment('${taskId}', '${comment.id}')">删除</button>
            </div>
            <div class="comment-content">${comment.content}</div>
            
            ${comment.replies && comment.replies.length > 0 ? `
            <div class="comment-replies">
                ${comment.replies.map(reply => {
                    const replyTime = new Date(reply.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return `
                    <div class="comment-reply">
                        <span class="comment-author">${reply.author}</span>
                        <span class="comment-time">${replyTime}</span>
                        <div class="comment-content">${reply.content}</div>
                    </div>`;
                }).join('')}
            </div>
            ` : ''}
            
            <div class="comment-actions">
                <button class="comment-reply-btn" onclick="showReplyInput('${taskId}', '${comment.id}')">回复</button>
            </div>
            
            <div id="replyInput-${comment.id}" class="reply-input" style="display: none;">
                <textarea placeholder="写下你的回复..."></textarea>
                <button onclick="submitReply('${taskId}', '${comment.id}')">发送</button>
            </div>
        </div>`;
    });
    
    html += '</div>';
    return html;
}

// 渲染日志
function renderLogs(taskId) {
    const logs = window.commentManager?.getLogs(taskId) || [];
    
    if (logs.length === 0) {
        return '<div class="empty-state">暂无操作日志</div>';
    }
    
    let html = '<div class="logs-timeline">';
    
    logs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
        <div class="log-item">
            <div class="log-time">${time}</div>
            <div class="log-content">
                <span class="log-action">${log.action}</span>
                ${log.details ? `<span class="log-details">${log.details}</span>` : ''}
                <span class="log-author">${log.author}</span>
            </div>
        </div>`;
    });
    
    html += '</div>';
    return html;
}

// 显示评论区模态框
function showCommentsModal(taskId) {
    const task = window.tasksData?.tasks?.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal comments-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>💬 任务评论与日志 - ${task.id}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="modal-body">
                <div class="tabs">
                    <button class="tab active" onclick="switchTab('comments')">评论</button>
                    <button class="tab" onclick="switchTab('logs')">日志</button>
                </div>
                
                <div id="commentsTab" class="tab-content active">
                    <div class="add-comment">
                        <textarea id="newComment" placeholder="写下你的评论..."></textarea>
                        <button onclick="addNewComment('${taskId}')">发表评论</button>
                    </div>
                    ${renderComments(taskId)}
                </div>
                
                <div id="logsTab" class="tab-content">
                    ${renderLogs(taskId)}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 添加新评论
function addNewComment(taskId) {
    const textarea = document.getElementById('newComment');
    const content = textarea.value.trim();
    
    if (!content) {
        alert('请输入评论内容');
        return;
    }
    
    window.commentManager?.addComment(taskId, content, '我');
    textarea.value = '';
    
    // 重新渲染
    const modal = document.querySelector('.comments-modal');
    if (modal) {
        modal.remove();
        showCommentsModal(taskId);
    }
}

// 显示回复输入框
function showReplyInput(taskId, commentId) {
    const input = document.getElementById(`replyInput-${commentId}`);
    if (input) {
        input.style.display = input.style.display === 'none' ? 'block' : 'none';
    }
}

// 提交回复
function submitReply(taskId, commentId) {
    const input = document.getElementById(`replyInput-${commentId}`);
    const textarea = input.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (!content) {
        alert('请输入回复内容');
        return;
    }
    
    window.commentManager?.replyComment(taskId, commentId, content, '我');
    
    // 重新渲染
    const modal = document.querySelector('.comments-modal');
    if (modal) {
        modal.remove();
        showCommentsModal(taskId);
    }
}

// 删除评论
function deleteComment(taskId, commentId) {
    if (confirm('确定要删除这条评论吗？')) {
        window.commentManager?.deleteComment(taskId, commentId);
        
        // 重新渲染
        const modal = document.querySelector('.comments-modal');
        if (modal) {
            modal.remove();
            showCommentsModal(taskId);
        }
    }
}

// 切换标签页
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.tab:nth-child(${tab === 'comments' ? 1 : 2})`).classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
}

// 全局实例
window.TaskCommentManager = TaskCommentManager;
window.renderComments = renderComments;
window.renderLogs = renderLogs;
window.showCommentsModal = showCommentsModal;
window.addNewComment = addNewComment;
window.deleteComment = deleteComment;
window.switchTab = switchTab;
