const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
// 修复跨域配置：允许所有来源、所有请求方法、所有请求头
app.use(cors({
  origin: '*', // 允许所有域名访问（本地开发用，生产环境可指定具体域名）
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, '.')));
// 新增：根路径访问时加载index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 数据文件路径
const dataPath = path.join(__dirname, 'response.json');

// 初始化 json 文件（如果不存在则创建空数组，添加权限配置）
async function initJsonFile() {
  try {
    if (!await fs.pathExists(dataPath)) {
      await fs.writeJson(dataPath, [], {
        spaces: 2,
        encoding: 'utf8'
      });
      console.log('初始化 response.json 成功');
    }
  } catch (err) {
    console.error('初始化 json 文件失败：', err);
  }
}
initJsonFile();

// 1. 获取所有数据
app.get('/api/tasks', async (req, res) => {
  try {
    const data = await fs.readJson(dataPath);
    res.json({
      code: 200,
      data
    });
  } catch (err) {
    console.error('获取数据失败：', err);
    res.status(500).json({
      code: 500,
      msg: '获取数据失败',
      error: err.message
    });
  }
});

// 2. 新增/修改数据（id 存在则修改，不存在则新增）
app.post('/api/tasks/save', async (req, res) => {
  try {
    const newTask = req.body;
    // 校验必填字段（可选，增强健壮性）
    if (!newTask.projectName || !newTask.taskName) {
      return res.status(400).json({
        code: 400,
        msg: '项目名称和任务名称不能为空'
      });
    }
    const data = await fs.readJson(dataPath);

    if (newTask.id) {
      // 修改：保留原有逻辑
      const index = data.findIndex(item => item.id === newTask.id);
      if (index > -1) {
        data[index] = newTask;
      } else {
        return res.json({
          code: 404,
          msg: '未找到该任务'
        });
      }
    } else {
      // 新增：补充创建时间（当前年月日）
      newTask.id = Date.now().toString();
      // 格式化当前日期为 yyyy-MM-dd
      const now = new Date();
      newTask.createTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      data.push(newTask);
    }

    await fs.writeJson(dataPath, data, {
      spaces: 2,
      encoding: 'utf8'
    });
    res.json({
      code: 200,
      msg: '保存成功',
      data: newTask
    });
  } catch (err) {
    console.error('保存数据失败：', err);
    res.status(500).json({
      code: 500,
      msg: '保存失败',
      error: err.message
    });
  }
});

// 3. 删除数据
app.post('/api/tasks/delete', async (req, res) => {
  try {
    const {
      id
    } = req.body;
    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '任务ID不能为空'
      });
    }
    let data = await fs.readJson(dataPath);
    data = data.filter(item => item.id !== id);
    await fs.writeJson(dataPath, data, {
      spaces: 2,
      encoding: 'utf8'
    });
    res.json({
      code: 200,
      msg: '删除成功'
    });
  } catch (err) {
    console.error('删除数据失败：', err);
    res.status(500).json({
      code: 500,
      msg: '删除失败',
      error: err.message
    });
  }
});

// 启动服务
const port = 3000;
app.listen(port, () => {
  console.log(`服务启动成功：http://localhost:${port}`);
  console.log(`数据文件路径：${dataPath}`);
});
