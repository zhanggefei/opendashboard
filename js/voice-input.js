// 语音输入任务 v1.0 - 集成 Whisper

class VoiceInputManager {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.supportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    // 开始录音
    startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('您的浏览器不支持录音功能');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                
                this.mediaRecorder.addEventListener('dataavailable', event => {
                    this.audioChunks.push(event.data);
                });
                
                this.mediaRecorder.addEventListener('stop', () => {
                    this.processAudio();
                });
                
                this.mediaRecorder.start();
                this.isRecording = true;
                
                // UI 反馈
                this.showRecordingIndicator();
            })
            .catch(error => {
                console.error('录音失败:', error);
                alert('无法访问麦克风，请检查权限设置');
            });
    }
    
    // 停止录音
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.hideRecordingIndicator();
        }
    }
    
    // 处理录音
    async processAudio() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // 保存到临时文件
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 使用 Whisper 转文字
        const text = await this.transcribeWithWhisper(audioBlob);
        
        if (text) {
            this.parseVoiceCommand(text);
        }
    }
    
    // 使用 Whisper 转文字
    async transcribeWithWhisper(audioBlob) {
        // 调用本地 Whisper 服务
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        try {
            // 假设有 Whisper API 服务
            const response = await fetch('http://localhost:5000/transcribe', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                return result.text;
            }
        } catch (error) {
            console.error('Whisper 转文字失败:', error);
            // 降级处理：使用浏览器自带语音识别
            return await this.transcribeWithBrowser(audioBlob);
        }
        
        return null;
    }
    
    // 浏览器自带语音识别（降级方案）
    async transcribeWithBrowser(audioBlob) {
        if (!this.supportsSpeechRecognition) {
            alert('您的浏览器不支持语音识别');
            return null;
        }
        
        return new Promise((resolve) => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'zh-CN';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };
            
            recognition.onerror = (error) => {
                console.error('语音识别失败:', error);
                resolve(null);
            };
            
            recognition.start();
            
            // 30 秒超时
            setTimeout(() => {
                recognition.stop();
                resolve(null);
            }, 30000);
        });
    }
    
    // 解析语音命令
    parseVoiceCommand(text) {
        console.log('语音输入:', text);
        
        // 简单命令解析
        const commands = {
            '新建任务': () => this.createTask(text),
            '创建任务': () => this.createTask(text),
            '添加任务': () => this.createTask(text),
            '删除': () => this.deleteTask(text),
            '完成': () => this.completeTask(text),
        };
        
        // 匹配命令
        for (const [keyword, action] of Object.entries(commands)) {
            if (text.includes(keyword)) {
                action();
                return;
            }
        }
        
        // 默认：创建任务
        this.createTask(text);
    }
    
    // 创建任务
    createTask(voiceText) {
        // 提取任务标题（简单实现）
        const title = voiceText.replace(/(新建 | 创建 | 添加 | 任务)/g, '').trim();
        
        if (!title) {
            alert('未识别到任务内容，请再说一次');
            return;
        }
        
        // 调用创建任务函数
        if (window.showCreateTaskFromTemplate) {
            // 填充表单
            setTimeout(() => {
                document.getElementById('newTaskTitle').value = title;
                document.getElementById('newTaskDesc').value = '通过语音创建';
            }, 100);
        }
        
        alert(`✅ 识别到任务：${title}\n正在创建...`);
    }
    
    // 删除任务
    deleteTask(voiceText) {
        // 实现删除逻辑
        console.log('删除任务:', voiceText);
    }
    
    // 完成任务
    completeTask(voiceText) {
        // 实现完成逻辑
        console.log('完成任务:', voiceText);
    }
    
    // 显示录音指示器
    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'recordingIndicator';
        indicator.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(0,0,0,0.8); color: white; padding: 30px; 
                        border-radius: 10px; z-index: 9999; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎤</div>
                <div>正在录音...</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 10px;">再次点击停止</div>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    
    // 隐藏录音指示器
    hideRecordingIndicator() {
        const indicator = document.getElementById('recordingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 显示语音输入按钮
    showVoiceButton() {
        const voiceBtn = document.createElement('button');
        voiceBtn.id = 'voiceInputBtn';
        voiceBtn.innerHTML = '🎤';
        voiceBtn.title = '语音输入任务';
        voiceBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            z-index: 1000;
            transition: transform 0.2s;
        `;
        voiceBtn.onmouseover = () => voiceBtn.style.transform = 'scale(1.1)';
        voiceBtn.onmouseout = () => voiceBtn.style.transform = 'scale(1)';
        voiceBtn.onclick = () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        };
        
        document.body.appendChild(voiceBtn);
    }
}

// 全局注册
window.VoiceInputManager = VoiceInputManager;
