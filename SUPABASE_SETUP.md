# Supabase 设置指南

## 步骤 1：创建 Supabase 账号和项目

1. 访问 https://supabase.com
2. 点击 "Start your project" 按钮
3. 使用 GitHub 账号登录（推荐）或邮箱注册
4. 创建新项目：
   - Project name: `dutch-vocabulary` （或任意名称）
   - Database Password: 设置一个强密码（记住它）
   - Region: 选择离你最近的区域
   - Pricing Plan: 选择 **Free** （免费版）

## 步骤 2：获取项目配置

项目创建完成后（需要等待 1-2 分钟），获取以下信息：

1. 在项目主页，点击左侧的 **Settings** → **API**
2. 找到并复制：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（很长的字符串）

## 步骤 3：创建数据库表

1. 点击左侧的 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴以下 SQL 代码：

```sql
-- 创建进度表
CREATE TABLE IF NOT EXISTS progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    learned_words TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view own progress"
    ON progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
    ON progress FOR DELETE
    USING (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX idx_progress_user_id ON progress(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

4. 点击 **Run** 按钮执行 SQL

## 步骤 4：配置邮件模板（可选）

1. 点击左侧的 **Authentication** → **Email Templates**
2. 选择 **Magic Link** 模板
3. 可以自定义邮件内容为中文：

**Subject**:
```
登录你的荷兰语学习账号
```

**Body**:
```html
<h2>登录链接</h2>
<p>点击下面的链接登录你的荷兰语学习账号：</p>
<p><a href="{{ .ConfirmationURL }}">登录</a></p>
<p>如果你没有请求此链接，请忽略这封邮件。</p>
<p>链接将在 1 小时后过期。</p>
```

## 步骤 5：更新代码配置

1. 打开 `supabase-config.js` 文件
2. 替换以下内容：

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // 替换为你的项目 URL
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // 替换为你的 Anon Key
```

## 步骤 6：测试

1. 在浏览器中打开 `dutch-vocabulary-a2.html`
2. 点击右上角的 "登录同步" 按钮
3. 输入你的邮箱地址
4. 检查邮箱，点击登录链接
5. 登录成功后，你的学习进度会自动同步到云端

## 常见问题

### Q: 邮件收不到？
A: 检查垃圾邮件文件夹，或在 Supabase Dashboard 的 **Authentication** → **Users** 中查看用户列表

### Q: 如何查看数据？
A: 在 Supabase Dashboard 的 **Table Editor** → **progress** 可以查看所有用户的学习进度

### Q: 免费版限制？
- 500MB 数据库存储
- 2GB 文件存储
- 50,000 月活用户
- 完全够用！

## 安全提示

- **Anon Key** 是公开的，可以安全地放在前端代码中
- **Service Role Key** 是私密的，永远不要泄露（我们不需要用到）
- 数据库密码要保管好，但日常使用不需要它

## 需要帮助？

如果遇到问题，可以：
1. 查看 Supabase 官方文档：https://supabase.com/docs
2. 检查浏览器控制台的错误信息
3. 确认 URL 和 Key 是否正确复制