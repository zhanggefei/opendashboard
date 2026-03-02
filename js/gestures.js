// 移动端手势支持 v1.0

class GestureManager {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.longPressTimer = null;
        this.isLongPress = false;
        
        this.init();
    }
    
    init() {
        // 监听触摸事件
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        
        // 长按检测
        this.isLongPress = false;
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
        }, 800);
    }
    
    handleTouchMove(e) {
        this.touchEndX = e.touches[0].clientX;
        this.touchEndY = e.touches[0].clientY;
        
        // 移动时取消长按
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
    }
    
    handleTouchEnd(e) {
        // 取消长按计时器
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        
        if (!this.touchEndX || !this.touchEndY) {
            return;
        }
        
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = this.touchEndY - this.touchStartY;
        
        // 判断是水平滑动还是垂直滑动
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平滑动
            if (Math.abs(diffX) > 50) { // 滑动距离阈值
                if (diffX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(diffY) > 50) {
                if (diffY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }
        }
        
        // 长按处理
        if (this.isLongPress) {
            this.handleLongPress();
        }
        
        // 重置
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
    }
    
    handleSwipeLeft() {
        // 左滑 - 删除任务
        const selectedCard = document.querySelector('.task-card.selected');
        if (selectedCard) {
            const taskId = selectedCard.dataset.taskId;
            if (confirm('确定要删除这个任务吗？')) {
                if (window.bulkOps) {
                    window.bulkOps.selectedTasks.add(taskId);
                    window.bulkOps.batchDelete();
                }
            }
        }
    }
    
    handleSwipeRight() {
        // 右滑 - 标记为完成
        const selectedCard = document.querySelector('.task-card.selected');
        if (selectedCard) {
            const taskId = selectedCard.dataset.taskId;
            if (window.bulkOps) {
                window.bulkOps.selectedTasks.add(taskId);
                window.bulkOps.batchUpdateStatus('done');
            }
        }
    }
    
    handleSwipeUp() {
        // 上滑 - 刷新
        if (window.loadTasks) {
            window.loadTasks();
        }
    }
    
    handleSwipeDown() {
        // 下滑 - 打开筛选
        const filterBar = document.querySelector('.filter-bar');
        if (filterBar) {
            filterBar.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    handleLongPress() {
        // 长按 - 编辑任务
        const selectedCard = document.querySelector('.task-card.selected');
        if (selectedCard) {
            const taskId = selectedCard.dataset.taskId;
            // 触发编辑逻辑
            console.log('长按编辑任务:', taskId);
        }
    }
    
    // 在任务卡片上绑定点击选择
    bindTaskCards() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                // 移除其他卡片的选中状态
                document.querySelectorAll('.task-card').forEach(c => c.classList.remove('selected'));
                // 选中当前卡片
                card.classList.add('selected');
            });
        });
    }
}

// 全局注册
window.GestureManager = GestureManager;
