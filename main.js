// main.js - 优化端口加载逻辑
process.env.NODE_ENV = 'production';

const { app, BrowserWindow } = require('electron');
const path = require('path');

// 单实例锁
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow;
let server;

// 关闭Electron安全警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

function createWindow() {
  // 启动Node服务并获取端口
  try {
    const serverModule = require('./server.js');
    server = serverModule.server;
    const port = serverModule.port;
    console.log(`📌 获取到Node服务端口：${port}`);
  } catch (err) {
    console.error('Node服务启动失败：', err);
    // 启动失败显示错误页面
    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    mainWindow.loadURL(`data:text/html,<h1>服务启动失败</h1><p>错误：${err.message}</p>`);
    return;
  }

  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true // 保留调试工具
    }
  });

  // 延迟加载页面确保服务就绪
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 500);

  // 窗口关闭时释放资源
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) server.close();
  });
}

// 应用就绪后创建窗口
app.whenReady().then(createWindow);

// 所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (server) server.close();
    app.quit();
  }
});

// macOS激活应用时重建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
