// Supabase 配置
const SUPABASE_URL = 'https://axgapthmsaeuwmsnhuqq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Z2FwdGhtc2FldXdtc25odXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzMwMDIsImV4cCI6MjA3NDIwOTAwMn0.XphJIMAPXMe5GB7m38V8ran4Gif9fdiOMKORfcXJh30';

// 初始化 Supabase 客户端
let supabaseClient = null;

// 同步管理器
const SyncManager = {
    isSyncing: false,
    syncTimeout: null,

    // 初始化 Supabase
    init() {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase SDK not loaded');
            return false;
        }

        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized');

            // 监听认证状态变化
            supabaseClient.auth.onAuthStateChange((event, session) => {
                this.handleAuthChange(event, session);
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            return false;
        }
    },

    // 处理认证状态变化
    async handleAuthChange(event, session) {
        if (session) {
            // 用户已登录
            console.log('User logged in:', session.user.email);
            this.updateUIForLoggedIn(session.user);
            await this.loadCloudProgress();
        } else {
            // 用户未登录或已登出
            console.log('User logged out');
            this.updateUIForLoggedOut();
        }
    },

    // 更新登录状态 UI
    updateUIForLoggedIn(user) {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            authStatus.innerHTML = `
                <span class="user-email">${user.email}</span>
                <button onclick="SyncManager.logout()" class="logout-btn">登出</button>
            `;
        }

        // 显示同步状态
        this.showSyncStatus('cloud');
    },

    // 更新未登录状态 UI
    updateUIForLoggedOut() {
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            authStatus.innerHTML = `
                <button onclick="showLoginModal()" class="login-btn">登录同步</button>
            `;
        }

        // 显示本地存储状态
        this.showSyncStatus('local');
    },

    // 显示同步状态
    showSyncStatus(status) {
        const syncIndicator = document.getElementById('syncIndicator');
        if (!syncIndicator) return;

        const statusIcons = {
            'cloud': '☁️',
            'local': '💾',
            'syncing': '🔄',
            'error': '⚠️'
        };

        const statusTexts = {
            'cloud': '云端同步',
            'local': '本地存储',
            'syncing': '同步中...',
            'error': '同步失败'
        };

        syncIndicator.innerHTML = `
            <span class="sync-icon">${statusIcons[status] || ''}</span>
            <span class="sync-text">${statusTexts[status] || ''}</span>
        `;
    },

    // 登录
    async login(email) {
        try {
            this.showSyncStatus('syncing');

            // 使用 GitHub Pages URL 作为重定向地址
            const redirectUrl = window.location.protocol === 'file:'
                ? 'https://nikkimars.github.io/dutch-vocabulary-A2/dutch-vocabulary-a2.html'
                : window.location.origin + window.location.pathname;

            const { data, error } = await supabaseClient.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: redirectUrl
                }
            });

            if (error) throw error;

            alert('验证邮件已发送到 ' + email + '\\n请查看邮箱并点击链接完成登录');
            return true;
        } catch (error) {
            console.error('Login error:', error);
            this.showSyncStatus('error');
            alert('登录失败：' + error.message);
            return false;
        }
    },

    // 登出
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.updateUIForLoggedOut();
        } catch (error) {
            console.error('Logout error:', error);
            alert('登出失败：' + error.message);
        }
    },

    // 保存进度到云端
    async saveToCloud() {
        if (!supabaseClient) return;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            this.showSyncStatus('syncing');
            this.isSyncing = true;

            const progressData = {
                user_id: user.id,
                learned_words: Array.from(learnedWords),
                preferences: {
                    filter_theme: currentFilter,
                    filter_letter: currentLetter,
                    view_mode: currentMode
                },
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseClient
                .from('progress')
                .upsert(progressData);

            if (error) throw error;

            console.log('Progress saved to cloud');
            this.showSyncStatus('cloud');
        } catch (error) {
            console.error('Save to cloud error:', error);
            this.showSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    },

    // 从云端加载进度
    async loadCloudProgress() {
        if (!supabaseClient) return;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            this.showSyncStatus('syncing');

            const { data, error } = await supabaseClient
                .from('progress')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

            if (data) {
                // 检查是否需要合并
                const localCount = learnedWords.size;
                const cloudCount = data.learned_words ? data.learned_words.length : 0;

                if (localCount > 0 && cloudCount > 0 && localCount !== cloudCount) {
                    // 有冲突，询问用户
                    const useCloud = confirm(
                        `检测到数据差异：\\n` +
                        `本地进度：${localCount} 个单词\\n` +
                        `云端进度：${cloudCount} 个单词\\n\\n` +
                        `是否使用云端数据？（选择"取消"将保留本地数据）`
                    );

                    if (!useCloud) {
                        // 保留本地数据并同步到云端
                        await this.saveToCloud();
                        return;
                    }
                }

                // 加载云端数据
                learnedWords = new Set(data.learned_words || []);

                // 加载偏好设置
                if (data.preferences) {
                    currentFilter = data.preferences.filter_theme || 'all';
                    currentLetter = data.preferences.filter_letter || 'all';
                    currentMode = data.preferences.view_mode || 'cards';
                }

                // 保存到本地存储
                StorageManager.saveLearnedWords();
                StorageManager.savePreferences();

                // 更新界面
                updateStats();
                displayVocabulary();
                restoreFilterStates();

                console.log('Progress loaded from cloud');
                this.showSyncStatus('cloud');
            } else {
                // 云端没有数据，上传本地数据
                if (learnedWords.size > 0) {
                    await this.saveToCloud();
                }
            }
        } catch (error) {
            console.error('Load from cloud error:', error);
            this.showSyncStatus('error');
        }
    },

    // 延迟同步（防抖）
    scheduleSave() {
        if (!supabaseClient) return;

        // 清除之前的定时器
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // 2秒后同步
        this.syncTimeout = setTimeout(() => {
            this.saveToCloud();
        }, 2000);
    },

    // 检查登录状态
    async checkAuth() {
        if (!supabaseClient) return null;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            return user;
        } catch (error) {
            console.error('Check auth error:', error);
            return null;
        }
    }
};

// 登录模态框控制
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('emailInput').focus();
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 处理登录表单提交
async function handleLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();

    if (!email) {
        alert('请输入邮箱地址');
        return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('请输入有效的邮箱地址');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '发送中...';
    loginBtn.disabled = true;

    const success = await SyncManager.login(email);

    if (success) {
        hideLoginModal();
        emailInput.value = '';
    }

    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
}