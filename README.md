task-manager
项目说明
轻量级项目任务管理工具，支持任务增删改查、当月默认时间筛选、关键词搜索高亮、Excel 导出、格式化周报 TXT 生成，表格独立滚动且全组件适配 mini 紧凑尺寸，数据本地持久化存储。基于 Vue2 + Express + Electron 开发，支持本地网页运行和桌面应用打包部署。
环境准备
运行环境：Node.js v14+（推荐 v18/v20 LTS 版本）
依赖管理：npm（Node 内置）或 yarn
浏览器兼容：Chrome/Firefox/Edge 现代浏览器（网页版）；Windows 7+（桌面应用版）
Project setup
bash
运行
# 安装项目依赖
npm install
启动本地 Node 接口服务（必选）
bash
运行
# 启动接口服务（默认端口 3000）
node server.js
说明：
负责处理所有任务增删改查接口请求，开发环境数据存储于项目根目录response.json
需保持终端窗口打开，关闭则服务停止
启动成功终端会展示：✅ 服务启动：http://localhost:3000
端口被占用时，修改 server.js 中 const port = 3000 为其他端口（如 3001）
Compiles and hot-reloads for development（网页版）
bash
运行
# 启动前端开发服务（默认端口 8099）
npm run serve
说明：
前端服务启动后访问地址：http://localhost:8099
需先启动 Node 接口服务，否则会出现接口请求失败问题
前端端口修改：在 vue.config.js 中配置 devServer.port
Compiles and minifies for production（网页版打包）
bash
运行
# 打包前端静态资源（输出到 dist 目录）
npm run build
Lints and fixes files
bash
运行
# 代码格式检查与自动修复
npm run lint
桌面应用（Electron）相关命令
bash
运行
# 启动Electron开发环境（自动加载前端+接口服务）
npm run electron:start

# 打包桌面应用（全平台）
npm run electron:build

# 打包Windows平台桌面应用（x64架构）
npm run electron:build:win
说明：
打包产物输出到 release 目录
Windows 打包产物包含：
win-unpacked：解压即可运行的免安装版
任务管理工具 Portable.exe：便携版可执行文件
任务管理工具 Setup.exe：安装版程序
桌面应用数据存储：生产环境下数据文件 response.json 生成在 exe 同级目录
清理打包产物（常用命令）
bash
运行
# Windows PowerShell 清理所有打包产物
Remove-Item -Recurse -Force release
Remove-Item -Recurse -Force dist
Remove-Item -Force response.json  # 可选：清空本地任务数据

# Windows CMD 清理所有打包产物
rmdir /s /q release
rmdir /s /q dist
del /f response.json  # 可选：清空本地任务数据

# Mac/Linux 清理所有打包产物
rm -rf release dist
rm -f response.json  # 可选：清空本地任务数据
核心功能
任务管理：新增 / 编辑 / 删除任务，创建时间自动填充当前年月日（格式：YYYY-MM-DD）
筛选搜索：默认筛选当月数据，支持多条件关键词模糊搜索，匹配关键词自动高亮
数据导出：一键导出当前筛选结果为 Excel 文件，或生成格式化周报 TXT 文件（兼容主流文本编辑器）
布局优化：表格超出高度时独立滚动，页面无整体滚动条，适配 mini 紧凑尺寸显示
注意事项
端口冲突：Node 接口服务默认 3000，前端服务默认 8099，端口被占用时需手动修改对应配置文件
数据存储：
开发环境：数据保存在项目根目录 response.json
桌面应用生产环境：数据保存在 exe 同级目录 response.json
删除该文件会清空所有任务数据，建议定期备份
桌面应用控制台：
开发环境启动会自动打开控制台（方便调试）
关闭控制台：注释 main.js 中 mainWindow.webContents.openDevTools() 代码
打包异常：
若打包失败，先执行「清理打包产物」命令，再重新安装依赖（npm install）
确保 electron-builder 版本与 Node 版本兼容（推荐 electron-builder@24.6.4）