# 荷兰语A2词汇学习系统

轻量级的荷兰语A2词汇学习网页，支持离线使用和移动端。

## 功能特点

- 📱 支持PWA，可安装到手机桌面
- 🔌 离线可用（Service Worker缓存）
- 💾 学习进度本地保存
- 📤 一键分享网站链接
- 🎯 卡片/列表/随机学习模式
- 🔍 搜索和筛选功能
- 📊 学习统计追踪

## 部署到 GitHub Pages（完全免费）

### 方法一：Fork部署（最简单）

1. Fork 这个仓库
2. 进入你 Fork 后的仓库设置
3. 找到 Settings → Pages
4. Source 选择 `Deploy from a branch`
5. Branch 选择 `main` 和 `/ (root)`
6. 点击 Save，等待几分钟
7. 访问：`https://你的用户名.github.io/仓库名/dutch-vocabulary-a2.html`

### 方法二：手动创建

1. 创建新的 GitHub 仓库
2. 上传以下文件：
   - `dutch-vocabulary-a2.html`
   - `vocabulary-data.js`
   - `manifest.json`
   - `service-worker.js`
3. 启用 GitHub Pages（同上步骤3-7）

## 本地使用

直接双击 `dutch-vocabulary-a2.html` 文件即可在浏览器中打开使用。

## 文件说明

- `dutch-vocabulary-a2.html` - 主页面
- `vocabulary-data.js` - 词汇数据
- `manifest.json` - PWA配置文件
- `service-worker.js` - 离线缓存支持

## 在手机上安装

1. 用手机浏览器访问部署好的网址
2. 在浏览器菜单中选择"添加到主屏幕"
3. 现在可以像APP一样使用了

## License

MIT License - 免费使用和分发