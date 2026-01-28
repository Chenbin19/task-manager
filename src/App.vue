<template>
  <div class="container">
    <!-- 筛选+操作按钮区 -->
    <div class="search-area">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline" style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
        <!-- 筛选条件 -->
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            size="mini">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.projectName" placeholder="请输入项目名称" size="mini" style="width: 200px;"></el-input>
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" size="mini" style="width: 200px;"></el-input>
        </el-form-item>
        <el-form-item label="项目进度">
          <el-select v-model="searchForm.projectStatus" placeholder="请选择进度" size="mini" style="width: 150px;">
            <el-option label="进行中" value="进行中"></el-option>
            <el-option label="测试中" value="测试中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 操作按钮组（搜索、重置、新增、生成周报、导出Excel） -->
        <div style="margin-left: auto; display: flex; gap: 8px;">
          <el-form-item>
            <el-button type="primary" @click="search" size="mini">搜索</el-button>
          </el-form-item>
          <el-form-item>
            <el-button size="mini" @click="resetSearch">重置</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-plus" size="mini" @click="addTask">新增任务</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" icon="el-icon-document" size="mini" @click="generateWeeklyReport">生成周报.txt</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="success" icon="el-icon-download" size="mini" @click="exportExcel">导出Excel</el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <!-- 表格区 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        border 
        style="width: 100%;"
        max-height="calc(100vh - 180px)"
        v-loading="loading">
        <el-table-column prop="createTime" label="日期" width="120" align="center">
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.createTime, searchForm.dateRange.join(''))"></span>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="项目名称" min-width="200">
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.projectName, searchForm.projectName)"></span>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" min-width="200">
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.taskName, searchForm.taskName)"></span>
          </template>
        </el-table-column>
        <el-table-column prop="weeklyWorkContent" label="工作内容" min-width="300">
          <template slot-scope="scope">
            <div style="white-space: pre-wrap; line-height: 1.4;" v-html="highlightText(scope.row.weeklyWorkContent, searchForm.weeklyWorkContent)"></div>
          </template>
        </el-table-column>
        <el-table-column prop="projectStatus" label="项目进度" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.projectStatus === '已完成' ? 'success' : (scope.row.projectStatus === '测试中' ? 'warning' : 'primary')">
              {{ scope.row.projectStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="150">
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.note, searchForm.note)"></span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit" @click="editTask(scope.row)"></el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete" @click="deleteTask(scope.row.id)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog title="任务编辑" :visible.sync="dialogVisible" width="700px" append-to-body>
      <el-form :model="form" label-width="100px" :rules="formRules" ref="taskForm">
        <el-form-item label="日期" prop="createTime">
          <!-- <el-input v-model="form.createTime" disabled></el-input> -->
          <el-date-picker
            v-model="form.createTime"
            type="date"
            start-placeholder="请选择日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            size="mini" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" type="textarea" :rows="2" placeholder="请输入项目名称"></el-input>
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="form.taskName" type="textarea" :rows="2" placeholder="请输入任务名称"></el-input>
        </el-form-item>
        <el-form-item label="工作内容" prop="weeklyWorkContent">
          <el-input v-model="form.weeklyWorkContent" type="textarea" :rows="6" placeholder="请输入工作内容（支持换行）"></el-input>
        </el-form-item>
        <el-form-item label="项目进度" prop="projectStatus">
          <el-select v-model="form.projectStatus" placeholder="请选择项目进度">
            <el-option label="进行中" value="进行中"></el-option>
            <el-option label="测试中" value="测试中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="请输入备注（选填）"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';

export default {
  name: 'App',
  data() {
    return {
      loading: false,
      searchForm: {
        dateRange: [],
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        note: '',
        projectStatus: ''
      },
      allData: [],
      tableData: [],
      dialogVisible: false,
      form: {
        id: '',
        createTime: '',
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        projectStatus: '',
        note: ''
      },
      // 表单校验规则
      formRules: {
        projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        weeklyWorkContent: [{ required: true, message: '请输入工作内容', trigger: 'blur' }],
        projectStatus: [{ required: true, message: '请选择项目进度', trigger: 'change' }]
      }
    }
  },
  mounted() {
    this.setDefaultDateRange();
    this.getTaskList();
    // 监听窗口大小变化，自适应表格高度
    window.addEventListener('resize', () => {
      this.$forceUpdate(); // 强制更新表格高度
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', () => {
      this.$forceUpdate();
    });
  },
  methods: {
    // ====================== 周报生成核心方法 ======================
    safeStrip(value) {
      if (value === null || value === undefined) {
        return '';
      }
      return String(value).trim();
    },

    processProjectData(jsonData) {
      const result = [];
      const indent = '    ';

      jsonData.forEach((item, index) => {
        const projectName = this.safeStrip(item.projectName);
        const workContent = this.safeStrip(item.weeklyWorkContent);
        const projectStatus = this.safeStrip(item.projectStatus);
        const note = this.safeStrip(item.note);

        if (!projectName || !projectStatus) {
          return;
        }

        let workText;
        if (workContent) {
          if (workContent.includes('\n')) {
            const workLines = workContent.split('\n')
              .map(line => line.trim())
              .filter(line => line);
            workText = workLines.length > 0 
              ? '\n' + workLines.map(line => indent + line).join('\n') 
              : '暂无具体工作内容';
          } else {
            workText = workContent;
          }
        } else {
          workText = '暂无具体工作内容';
        }

        let baseText = `${index + 1}、${projectName}项目：完成${workText}的工作，当前进度：${projectStatus}。`;
        if (note) {
          baseText += `（备注：${note}）`;
        }

        result.push(baseText);
      });

      return result;
    },

    generateWeeklyReport() {
      const rawData = [...this.tableData];
      if (rawData.length === 0) {
        this.$message.warning('当前无筛选数据，无法生成周报！');
        return;
      }

      const formattedText = this.processProjectData(rawData);
      if (formattedText.length === 0) {
        this.$message.warning('无有效项目数据（项目名/进度不能为空）！');
        return;
      }

      const textContent = formattedText.join('\n');
      const blob = new Blob([textContent], { type: 'text/plain; charset=utf-8' });
      const downloadLink = document.createElement('a');
      const now = new Date();
      const fileName = `周报_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.txt`;
      
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

      this.$message.success(`周报生成成功！文件名：${fileName}`);
    },

    // ====================== 基础方法 ======================
    // getMonthRange() {
    //   const now = new Date();
    //   const year = now.getFullYear();
    //   const month = now.getMonth();
    //   const firstDay = new Date(year, month, 1);
    //   const lastDay = new Date(year, month + 1, 0);
    //   const formatDate = (date) => {
    //     return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    //   };
    //   return [formatDate(firstDay), formatDate(lastDay)];
    // },
    getWeekRange() {
      // 获取当前日期
      const now = new Date();
      // 获取今天是一周的第几天（0-6，0代表周日）
      const dayOfWeek = now.getDay();
      
      // 计算本周一：当前日期减去 (今天是周几 - 1) 天
      // 特殊处理：如果今天是周日(0)，则减去6天
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      
      // 计算本周日：当前日期加上 (6 - 今天是周几) 天
      // 特殊处理：如果今天是周日(0)，则偏移量为0
      const sundayOffset = dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + sundayOffset);

      // 日期格式化函数
      const formatDate = (date) => {
        const year = date.getFullYear();
        // 月份从0开始，需要+1，不足两位补0
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        // 日期不足两位补0
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // 返回[本周一, 本周日]的格式化结果
      return [formatDate(monday), formatDate(sunday)];
    },

    setDefaultDateRange() {
      this.searchForm.dateRange = this.getWeekRange();
    },

    async getTaskList() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/api/tasks');
        if (res.data.code === 200) {
          this.allData = res.data.data;
          this.tableData = [...this.allData];
          this.search();
        }
      } catch (err) {
        this.$message.error('获取数据失败');
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    search() {
      let filteredData = [...this.allData];
      const { dateRange, projectName, taskName, weeklyWorkContent, note, projectStatus } = this.searchForm;
      
      if (dateRange && dateRange.length === 2) {
        const start = new Date(dateRange[0]);
        const end = new Date(dateRange[1]);
        filteredData = filteredData.filter(item => {
          const taskTime = new Date(item.createTime);
          return taskTime >= start && taskTime <= end;
        });
      }

      if (projectName) {
        filteredData = filteredData.filter(item => item.projectName.toLowerCase().includes(projectName.toLowerCase()));
      }
      if (taskName) {
        filteredData = filteredData.filter(item => item.taskName.toLowerCase().includes(taskName.toLowerCase()));
      }
      if (weeklyWorkContent) {
        filteredData = filteredData.filter(item => item.weeklyWorkContent.toLowerCase().includes(weeklyWorkContent.toLowerCase()));
      }
      if (note) {
        filteredData = filteredData.filter(item => item.note.toLowerCase().includes(note.toLowerCase()));
      }
      if (projectStatus) {
        filteredData = filteredData.filter(item => item.projectStatus === projectStatus);
      }

      this.tableData = filteredData;
    },

    resetSearch() {
      this.searchForm = {
        dateRange: this.getMonthRange(),
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        note: '',
        projectStatus: ''
      };
      this.tableData = [...this.allData];
      this.search();
    },

    highlightText(text, keyword) {
      if (!keyword || !text) return text;
      const reg = new RegExp(keyword, 'gi');
      return text.replace(reg, match => `<span class="red-text">${match}</span>`);
    },

    addTask() {
      const now = new Date();
      const createTime = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      this.form = {
        id: '',
        createTime: createTime,
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        projectStatus: '',
        note: ''
      };
      this.$refs.taskForm?.clearValidate(); // 清空表单校验
      this.dialogVisible = true;
    },

    editTask(row) {
      this.form = { ...row };
      this.$refs.taskForm?.clearValidate();
      this.dialogVisible = true;
    },

    async saveTask() {
      // 表单校验
      try {
        await this.$refs.taskForm.validate();
      } catch (err) {
        this.$message.warning('请完善必填字段！');
        return;
      }

      try {
        const res = await this.$axios.post('/api/tasks/save', this.form);
        if (res.data.code === 200) {
          this.$message.success('保存成功');
          this.dialogVisible = false;
          this.getTaskList();
        } else {
          this.$message.error(res.data.msg || '保存失败');
        }
      } catch (err) {
        this.$message.error('保存失败');
        console.error(err);
      }
    },

    async deleteTask(id) {
      try {
        await this.$confirm('确定要删除该任务吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        const res = await this.$axios.post('/api/tasks/delete', { id });
        if (res.data.code === 200) {
          this.$message.success('删除成功');
          this.getTaskList();
        } else {
          this.$message.error(res.data.msg || '删除失败');
        }
      } catch (err) {
        this.$message.info('已取消删除');
        console.error(err);
      }
    },

    exportExcel() {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }
      const exportData = this.tableData.map(item => ({
        '日期': item.createTime,
        '项目名称': item.projectName,
        '任务名称': item.taskName,
        '工作内容': item.weeklyWorkContent,
        '项目进度': item.projectStatus,
        '备注': item.note
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '项目任务数据');
      XLSX.writeFile(wb, '项目任务管理数据.xlsx');
      this.$message.success('导出成功');
    }
  }
}
</script>

<style scoped>
/* 全局样式重置，消除页面滚动条 */
.container {
  width: 99%;
  margin: 10px auto;
  height: calc(100vh - 20px); /* 占满可视区域，预留少量边距 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 禁止页面整体滚动 */
}

/* 搜索区样式 */
.search-area {
  padding: 15px 20px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 10px;
  flex-shrink: 0; /* 不被压缩 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* 表格容器 */
.table-container {
  flex: 1; /* 占满剩余高度 */
  overflow: hidden; /* 隐藏容器滚动，仅表格滚动 */
}

/* 表格样式优化 */
::v-deep .el-table {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #f8f9fa;
}

::v-deep .el-table__body-wrapper {
  scrollbar-width: thin; /* 窄滚动条（Firefox） */
}

/* 滚动条样式优化（Chrome/Safari） */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

/* 高亮文本样式 */
.red-text {
  color: #f56c6c;
  font-weight: 600;
}

/* 弹窗样式优化 */
::v-deep .el-dialog__body {
  padding: 20px;
}

::v-deep .el-textarea {
  width: 100%;
}
</style>
