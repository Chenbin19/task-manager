markdown
# task-manager

## 项目说明
轻量级项目任务管理工具，支持任务增删改查、当月默认时间筛选、关键词搜索高亮、Excel导出、格式化周报TXT生成，表格独立滚动且全组件适配mini紧凑尺寸，数据本地持久化存储。

## Project setup
npm install
plaintext

### 启动本地Node接口服务（必选）
node server.js
plaintext
> 说明：
> - 负责处理所有任务增删改查接口请求，数据存储于项目根目录`response.json`
> - 需保持终端窗口打开，关闭则服务停止
> - 启动成功终端会展示服务运行地址提示

### Compiles and hot-reloads for development
npm run serve
plaintext
> 前端服务启动后访问地址：http://localhost:8099
> 需先启动Node接口服务，否则会出现接口请求失败问题

### Compiles and minifies for production
npm run build
plaintext

### Lints and fixes files
npm run lint
plaintext

### 核心功能
1. 任务管理：新增/编辑/删除任务，创建时间自动填充当前年月日
2. 筛选搜索：默认筛选当月数据，支持多条件关键词模糊搜索，匹配关键词自动高亮
3. 数据导出：一键导出当前筛选结果为Excel文件，或生成格式化周报TXT文件
4. 布局优化：表格超出高度时独立滚动，页面无整体滚动条

### 注意事项
1. 运行环境：需安装Node.js v14+（推荐v18/v20），建议使用Chrome/Firefox/Edge现代浏览器
2. 端口说明：Node接口服务默认3000，前端服务默认8099，端口被占用时需手动修改对应配置
3. 数据存储：任务数据本地保存在`response.json`，删除该文件会清空所有任务数据

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
