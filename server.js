// server.js - 优化数据路径逻辑
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const port = 3000;
let server = null;

// 配置跨域和JSON解析
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// 托管Vue静态资源
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`✅ 托管静态资源：${distPath}`);
}

// 区分环境配置数据文件路径
let dataPath;
if (process.env.NODE_ENV === 'production') {
  // 生产环境：exe同级目录
  dataPath = path.join(path.dirname(process.execPath), 'response.json');
} else {
  // 开发环境：项目根目录
  dataPath = path.join(__dirname, 'response.json');
}
console.log(`📁 最终数据文件路径：${dataPath}`);

// 初始化数据文件（确保目录和文件存在）
async function initDataFile() {
  try {
    await fs.ensureDir(path.dirname(dataPath));
    if (!await fs.pathExists(dataPath)) {
      await fs.writeJson(dataPath, [], { spaces: 2 });
      console.log(`✅ 初始化数据文件：${dataPath}`);
    }
  } catch (err) {
    console.error('❌ 初始化数据失败：', err.message);
    // 兜底：写入项目根目录
    const fallbackPath = path.join(__dirname, 'response.json');
    await fs.writeJson(fallbackPath, [], { spaces: 2 });
    dataPath = fallbackPath;
    console.log(`⚠️ 兜底初始化数据文件：${fallbackPath}`);
  }
}

// 获取所有任务
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await fs.readJson(dataPath);
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ 
      code: 500, 
      msg: '获取数据失败', 
      error: err.message,
      path: dataPath
    });
  }
});

// 保存任务（新增/修改）
app.post('/api/tasks/save', async (req, res) => {
  try {
    const newTask = req.body;
    if (!newTask.projectName || !newTask.taskName) {
      return res.status(400).json({ code: 400, msg: '项目/任务名称不能为空' });
    }

    let data = await fs.readJson(dataPath);
    if (newTask.id) {
      const index = data.findIndex(item => item.id === newTask.id);
      if (index > -1) data[index] = newTask;
      else return res.json({ code: 404, msg: '未找到该任务' });
    } else {
      newTask.id = Date.now().toString();
      newTask.createTime = new Date().toLocaleDateString().replace(/\//g, '-');
      data.push(newTask);
    }

    await fs.writeJson(dataPath, data, { spaces: 2 });
    res.json({ 
      code: 200, 
      msg: '保存成功', 
      data: newTask,
      path: dataPath
    });
  } catch (err) {
    console.error('保存失败：', err);
    res.status(500).json({ 
      code: 500, 
      msg: '保存失败', 
      error: err.message,
      path: dataPath
    });
  }
});

// 删除任务
app.post('/api/tasks/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ code: 400, msg: 'ID不能为空' });

    let data = await fs.readJson(dataPath);
    data = data.filter(item => item.id !== id);
    await fs.writeJson(dataPath, data, { spaces: 2 });
    res.json({ 
      code: 200, 
      msg: '删除成功',
      path: dataPath
    });
  } catch (err) {
    res.status(500).json({ 
      code: 500, 
      msg: '删除失败', 
      error: err.message,
      path: dataPath
    });
  }
});

// 兜底路由（适配Vue前端路由）
app.get('/*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ code: 404, msg: '接口不存在' });
  }
});

// 启动服务
initDataFile().then(() => {
  server = app.listen(port, () => {
    console.log(`✅ 服务启动：http://localhost:${port}`);
  });
});

// 导出服务实例和配置
module.exports = { server, app, port };
