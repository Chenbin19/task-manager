<template>
  <div class="task-management-container">
    <!-- 筛选+操作按钮区 -->
    <div class="search-area">
      <el-form 
        :inline="true" 
        :model="searchForm" 
        class="search-form"
        @submit.native.prevent="search"
      >
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            size="mini"
            clearable
          />
        </el-form-item>

        <el-form-item label="项目名称">
          <el-input 
            v-model="searchForm.projectName" 
            placeholder="请输入项目名称" 
            size="mini" 
            style="width: 200px;"
            clearable
            @keyup.enter.native="search"
          />
        </el-form-item>

        <el-form-item label="任务名称">
          <el-input 
            v-model="searchForm.taskName" 
            placeholder="请输入任务名称" 
            size="mini" 
            style="width: 200px;"
            clearable
            @keyup.enter.native="search"
          />
        </el-form-item>

        <el-form-item label="项目进度">
          <el-select 
            v-model="searchForm.projectStatus" 
            placeholder="请选择进度" 
            size="mini" 
            style="width: 150px;"
            clearable
          >
            <el-option label="进行中" value="进行中" />
            <el-option label="测试中" value="测试中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>

        <!-- 操作按钮组 -->
        <el-form-item class="operation-buttons">
          <el-button type="primary" @click="search" size="mini" icon="el-icon-search">搜索</el-button>
          <el-button size="mini" @click="resetSearch" icon="el-icon-refresh">重置</el-button>
          <el-button type="primary" @click="addTask" size="mini" icon="el-icon-plus">新增任务</el-button>
          <el-button type="warning" @click="generateWeeklyReport" size="mini" icon="el-icon-document">生成周报.txt</el-button>
          <el-button type="success" @click="exportExcel" size="mini" icon="el-icon-download">导出Excel</el-button>
          <el-button type="info" @click="triggerFileInput" size="mini" icon="el-icon-upload">导入Excel</el-button>
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx, .xls"
            class="file-input"
            @change="handleExcelUpload"
          >
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格展示区 -->
    <div class="table-container">
      <el-table 
        :data="tableData" 
        border 
        fit
        stripe
        style="width: 100%;"
        max-height="calc(100vh - 180px)"
        v-loading="loading"
        element-loading-text="数据加载中..."
        highlight-current-row
      >
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
            <div class="work-content" v-html="highlightText(scope.row.weeklyWorkContent, searchForm.weeklyWorkContent)"></div>
          </template>
        </el-table-column>
        
        <el-table-column prop="projectStatus" label="项目进度" width="120" align="center">
          <template slot-scope="scope">
            <el-tag 
              :type="getStatusTagType(scope.row.projectStatus)"
              size="mini"
            >
              {{ scope.row.projectStatus }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="note" label="备注" min-width="150">
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.note, searchForm.note)"></span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="primary" 
              icon="el-icon-edit" 
              @click="editTask(scope.row)"
              circle
            />
            <el-button 
              size="mini" 
              type="danger" 
              icon="el-icon-delete" 
              @click="deleteTask(scope.row.id)"
              circle
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 空数据提示 -->
      <div v-if="!loading && tableData.length === 0" class="empty-data">
        <el-empty description="暂无任务数据"></el-empty>
      </div>
    </div>

    <!-- 任务编辑弹窗 -->
    <el-dialog 
      :title="form.id ? '编辑任务' : '新增任务'" 
      :visible.sync="dialogVisible" 
      width="700px" 
      append-to-body
      destroy-on-close
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        :rules="formRules" 
        ref="taskForm"
        label-position="left"
      >
        <el-form-item label="日期" prop="createTime">
          <el-date-picker
            v-model="form.createTime"
            type="date"
            placeholder="请选择日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            size="mini"
            style="width: 100%;"
            required
          />
        </el-form-item>
        
        <el-form-item label="项目名称" prop="projectName">
          <el-input 
            v-model="form.projectName" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入项目名称"
            resize="none"
          />
        </el-form-item>
        
        <el-form-item label="任务名称" prop="taskName">
          <el-input 
            v-model="form.taskName" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入任务名称"
            resize="none"
          />
        </el-form-item>
        
        <el-form-item label="工作内容" prop="weeklyWorkContent">
          <el-input 
            v-model="form.weeklyWorkContent" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入工作内容（支持换行）"
            resize="vertical"
          />
        </el-form-item>
        
        <el-form-item label="项目进度" prop="projectStatus">
          <el-select 
            v-model="form.projectStatus" 
            placeholder="请选择项目进度"
            size="mini"
            style="width: 100%;"
          >
            <el-option label="进行中" value="进行中" />
            <el-option label="测试中" value="测试中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注" prop="note">
          <el-input 
            v-model="form.note" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入备注（选填）"
            resize="none"
          />
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTask" :loading="saveLoading">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';

export default {
  name: 'TaskManagement',
  data() {
    return {
      // 加载状态
      loading: false,
      saveLoading: false,
      // 弹窗显示状态
      dialogVisible: false,
      // 搜索表单
      searchForm: {
        dateRange: [],
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        note: '',
        projectStatus: ''
      },
      // 数据源
      allData: [],
      tableData: [],
      // 编辑表单
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
        createTime: [{ required: true, message: '请选择日期', trigger: 'change' }],
        projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        weeklyWorkContent: [{ required: true, message: '请输入工作内容', trigger: 'blur' }],
        projectStatus: [{ required: true, message: '请选择项目进度', trigger: 'change' }]
      },
      // 窗口resize处理函数（用于销毁监听）
      resizeHandler: null
    };
  },
  mounted() {
    // 设置默认时间范围
    this.setDefaultDateRange();
    // 获取任务列表
    this.getTaskList();
    // 窗口大小变化监听
    this.resizeHandler = () => {
      this.tableData = [...this.tableData]; // 触发表格重渲染
    };
    window.addEventListener('resize', this.resizeHandler);
  },
  beforeDestroy() {
    // 清理事件监听，避免内存泄漏
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  },
  methods: {
    // ====================== 工具方法 ======================
    /**
     * 安全去除字符串首尾空格
     * @param {any} value - 要处理的值
     * @returns {string} 处理后的字符串
     */
    safeStrip(value) {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    },

    /**
     * 获取本周的日期范围（周一到周日）
     * @returns {string[]} [周一, 周日]
     */
    getWeekRange() {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      const sundayOffset = dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + sundayOffset);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return [formatDate(monday), formatDate(sunday)];
    },

    /**
     * 设置默认时间范围为本周
     */
    setDefaultDateRange() {
      this.searchForm.dateRange = this.getWeekRange();
    },

    /**
     * 根据进度获取标签类型
     * @param {string} status - 项目进度
     * @returns {string} 标签类型
     */
    getStatusTagType(status) {
      const statusMap = {
        '已完成': 'success',
        '测试中': 'warning',
        '进行中': 'primary'
      };
      return statusMap[status] || 'info';
    },

    /**
     * 高亮搜索关键词（处理特殊字符）
     * @param {string} text - 原文本
     * @param {string} keyword - 关键词
     * @returns {string} 高亮后的HTML字符串
     */
    highlightText(text, keyword) {
      if (!keyword || !text) return text;
      // 正则转义特殊字符
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(escapedKeyword, 'gi');
      return text.replace(reg, match => `<span class="highlight-text">${match}</span>`);
    },

    /**
     * 格式化Excel日期为yyyy-MM-dd（修复Excel 1900闰年bug）
     * @param {any} excelDate - Excel中的日期值
     * @returns {string} 格式化后的日期
     */
    formatExcelDate(excelDate) {
      if (!excelDate) return '';
      const strippedDate = this.safeStrip(excelDate);

      // 已是yyyy-MM-dd格式
      if (/^\d{4}-\d{2}-\d{2}$/.test(strippedDate)) {
        return strippedDate;
      }

      // Excel日期序列号（处理1900闰年bug）
      if (!isNaN(Number(strippedDate))) {
        const excelSerial = Number(strippedDate);
        // Excel 1900年错误地认为是闰年，序列号60对应1900-02-29（实际不存在）
        const baseDate = excelSerial > 60 ? new Date(1900, 0, 1) : new Date(1899, 11, 30);
        const targetDate = new Date(baseDate);
        targetDate.setDate(baseDate.getDate() + excelSerial - 1);
        return targetDate.toISOString().split('T')[0];
      }

      // 其他日期格式转换
      const dateObj = new Date(strippedDate);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }

      return '';
    },

    /**
     * 读取Excel文件
     * @param {File} file - Excel文件
     * @returns {Promise<XLSX.WorkBook>} Excel工作簿
     */
    readExcelFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            resolve(workbook);
          } catch (err) {
            reject(new Error(`解析Excel失败：${err.message}`));
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * 处理项目数据生成周报文本
     * @param {Array} data - 任务数据
     * @returns {Array} 格式化后的周报内容数组
     */
    processProjectData(data) {
      return data.reduce((result, item, index) => {
        const projectName = this.safeStrip(item.projectName);
        const taskName = this.safeStrip(item.taskName);
        const workContent = this.safeStrip(item.weeklyWorkContent);
        const projectStatus = this.safeStrip(item.projectStatus);
        const note = this.safeStrip(item.note);

        if (!projectName || !taskName || !projectStatus) return result;

        let workText = '';
        if (workContent) {
          const workLines = workContent.split('\n')
            .map(line => this.safeStrip(line))
            .filter(line => line);

          if (workLines.length > 0) {
            const indent = '    ';
            const formattedLines = workLines.map((line, subIndex) => 
              `${indent}${index + 1}.${subIndex + 1}：${line.replace(/\n/g, `\n${indent}`)}`
            );
            workText = '\n' + formattedLines.join('\n');
          }
        }

        let baseText = `${index + 1}、${projectName}项目：${taskName}，当前进度：${projectStatus}${note ? `（备注：${note}）` : ''}`;
        if (workText) baseText += workText;

        result.push(baseText);
        return result;
      }, []);
    },

    // ====================== 业务逻辑 ======================
    /**
     * 获取任务列表
     */
    async getTaskList() {
      this.loading = true;
      try {
        const res = await this.$axios.get('/api/tasks');
        if (res.data.code === 200) {
          this.allData = res.data.data;
          this.tableData = [...this.allData];
          this.search(); // 触发搜索过滤
        }
      } catch (err) {
        this.$message.error('获取任务数据失败，请稍后重试');
        console.error('获取任务列表失败：', err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 搜索过滤数据
     */
    search() {
      let filteredData = [...this.allData];
      const { dateRange, projectName, taskName, weeklyWorkContent, note, projectStatus } = this.searchForm;
      
      // 时间范围过滤（包含结束日期全天）
      if (dateRange && dateRange.length === 2) {
        const start = new Date(dateRange[0]);
        const end = new Date(dateRange[1]);
        end.setHours(23, 59, 59, 999); // 修复：包含结束日期的最后一秒
        filteredData = filteredData.filter(item => {
          const taskTime = new Date(item.createTime);
          return taskTime >= start && taskTime <= end;
        });
      }

      // 关键词过滤（忽略大小写）
      if (projectName) {
        filteredData = filteredData.filter(item => 
          item.projectName.toLowerCase().includes(projectName.toLowerCase())
        );
      }
      if (taskName) {
        filteredData = filteredData.filter(item => 
          item.taskName.toLowerCase().includes(taskName.toLowerCase())
        );
      }
      if (weeklyWorkContent) {
        filteredData = filteredData.filter(item => 
          item.weeklyWorkContent.toLowerCase().includes(weeklyWorkContent.toLowerCase())
        );
      }
      if (note) {
        filteredData = filteredData.filter(item => 
          item.note.toLowerCase().includes(note.toLowerCase())
        );
      }
      
      // 进度过滤
      if (projectStatus) {
        filteredData = filteredData.filter(item => item.projectStatus === projectStatus);
      }

      this.tableData = filteredData;
    },

    /**
     * 重置搜索条件
     */
    resetSearch() {
      this.searchForm = {
        dateRange: this.getWeekRange(),
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        note: '',
        projectStatus: ''
      };
      this.search();
    },

    /**
     * 新增任务
     */
    addTask() {
      // 重置表单
      this.form = {
        id: '',
        createTime: new Date().toISOString().split('T')[0],
        projectName: '',
        taskName: '',
        weeklyWorkContent: '',
        projectStatus: '',
        note: ''
      };
      this.$refs.taskForm?.clearValidate();
      this.dialogVisible = true;
    },

    /**
     * 编辑任务
     * @param {Object} row - 任务行数据
     */
    editTask(row) {
      this.form = { ...row };
      this.$refs.taskForm?.clearValidate();
      this.dialogVisible = true;
    },

    /**
     * 保存任务
     */
    async saveTask() {
      try {
        // 表单校验
        await this.$refs.taskForm.validate();
        this.saveLoading = true;

        // 调用保存接口
        const res = await this.$axios.post('/api/tasks/save', this.form);
        if (res.data.code === 200) {
          this.$message.success(this.form.id ? '编辑任务成功' : '新增任务成功');
          this.dialogVisible = false;
          this.getTaskList(); // 刷新列表
        } else {
          this.$message.error(res.data.msg || '保存任务失败');
        }
      } catch (err) {
        if (err.name !== 'ValidationError') {
          this.$message.error('保存任务失败，请稍后重试');
          console.error('保存任务失败：', err);
        }
      } finally {
        this.saveLoading = false;
      }
    },

    /**
     * 删除任务
     * @param {string} id - 任务ID
     */
    async deleteTask(id) {
      try {
        await this.$confirm(
          '确定要删除该任务吗？删除后无法恢复！',
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const res = await this.$axios.post('/api/tasks/delete', { id });
        if (res.data.code === 200) {
          this.$message.success('删除任务成功');
          this.getTaskList(); // 刷新列表
        } else {
          this.$message.error(res.data.msg || '删除任务失败');
        }
      } catch (err) {
        if (err !== 'cancel') {
          this.$message.info('已取消删除');
        }
      }
    },

    /**
     * 生成周报
     */
    generateWeeklyReport() {
      if (this.tableData.length === 0) {
        this.$message.warning('当前无筛选数据，无法生成周报');
        return;
      }

      const formattedText = this.processProjectData(this.tableData);
      if (formattedText.length === 0) {
        this.$message.warning('无有效项目数据（项目名/进度不能为空）');
        return;
      }

      // 生成文件并下载
      const textContent = formattedText.join('\n');
      const blob = new Blob([textContent], { type: 'text/plain; charset=utf-8' });
      const downloadLink = document.createElement('a');
      const now = new Date();
      const fileName = `周报_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.txt`;
      
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // 清理资源
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

      this.$message.success(`周报生成成功！文件名：${fileName}`);
    },

    /**
     * 导出Excel
     */
    exportExcel() {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }

      // 格式化导出数据
      const exportData = this.tableData.map(item => ({
        '日期': item.createTime,
        '项目名称': item.projectName,
        '任务名称': item.taskName,
        '工作内容': item.weeklyWorkContent,
        '项目进度': item.projectStatus,
        '备注': item.note
      }));

      // 生成Excel文件
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '项目任务数据');
      
      // 下载文件（增加日期后缀）
      const fileName = `项目任务管理数据_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      this.$message.success('Excel导出成功');
    },

    /**
     * 触发文件选择框
     */
    triggerFileInput() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click();
      }
    },

    /**
     * 处理Excel上传
     * @param {Event} e - 文件选择事件
     */
    async handleExcelUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      // 校验文件格式
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExt)) {
        this.$message.error('请上传.xlsx或.xls格式的Excel文件');
        this.$refs.fileInput.value = ''; // 清空选择
        return;
      }

      this.loading = true;
      try {
        // 读取Excel文件
        const workbook = await this.readExcelFile(file);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 校验表头
        const headerRow = excelData[0]?.map(item => this.safeStrip(item));
        const requiredHeaders = ['日期', '项目名称', '任务名称', '工作内容', '项目进度', '备注'];
        const missingHeaders = requiredHeaders.filter(header => !headerRow.includes(header));
        
        if (missingHeaders.length > 0) {
          this.$message.error(`Excel表头格式错误！缺少字段：${missingHeaders.join('、')}`);
          return;
        }

        // 格式化数据
        const formattedData = [];
        for (let i = 1; i < excelData.length; i++) {
          const row = excelData[i];
          if (!row || row.every(item => this.safeStrip(item) === '')) continue;

          const taskData = {
            id: '',
            createTime: this.formatExcelDate(row[headerRow.indexOf('日期')]),
            projectName: this.safeStrip(row[headerRow.indexOf('项目名称')]),
            taskName: this.safeStrip(row[headerRow.indexOf('任务名称')]),
            weeklyWorkContent: this.safeStrip(row[headerRow.indexOf('工作内容')]),
            projectStatus: this.safeStrip(row[headerRow.indexOf('项目进度')]),
            note: this.safeStrip(row[headerRow.indexOf('备注')])
          };

          // 校验必填字段
          if (taskData.projectName && taskData.taskName && taskData.weeklyWorkContent && taskData.projectStatus) {
            formattedData.push(taskData);
          }
        }

        if (formattedData.length === 0) {
          this.$message.warning('Excel文件中无有效任务数据（必填字段不能为空）');
          return;
        }

        // 确认覆盖数据
        await this.$confirm(
          `即将覆盖现有${this.allData.length}条数据，导入${formattedData.length}条新数据，是否继续？`,
          '数据覆盖警告',
          {
            confirmButtonText: '确认覆盖',
            cancelButtonText: '取消',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        );

        // 批量保存数据
        await this.$axios.post('/api/tasks/deleteAll');
        const res = await this.$axios.post('/api/tasks/batchSave', formattedData);
        
        if (res.data.code === 200) {
          this.$message.success(`Excel导入成功！共导入${formattedData.length}条有效数据`);
          this.getTaskList(); // 刷新列表
        } else {
          this.$message.error(`导入失败：${res.data.msg || '后端处理异常'}`);
        }
      } catch (err) {
        if (err !== 'cancel' && err !== 'close') {
          this.$message.error(`Excel导入失败：${err.message || '未知错误'}`);
          console.error('Excel上传错误：', err);
        }
      } finally {
        // 清空文件选择并关闭加载
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 容器样式 */
.task-management-container {
  width: 99%;
  margin: 10px auto;
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 10px;
}

/* 搜索区域样式 */
.search-area {
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.operation-buttons {
  margin-left: auto !important;
  display: flex;
  gap: 8px;
}

/* 文件输入框隐藏 */
.file-input {
  display: none;
}

/* 表格区域样式 */
.table-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
}

/* 工作内容样式 */
.work-content {
  white-space: pre-wrap;
  line-height: 1.5;
  word-break: break-word;
}

/* 高亮文本样式 */
.highlight-text {
  color: #f56c6c;
  font-weight: 600;
  background-color: #fff2f2;
  padding: 0 2px;
  border-radius: 2px;
}

/* Element UI 样式穿透 */
::v-deep .el-table {
  --el-table-header-text-color: #303133;
  --el-table-row-hover-bg-color: #f8f9fa;
  --el-table-current-row-bg-color: #e8f4ff;
}

::v-deep .el-table__body-wrapper {
  scrollbar-width: thin;
}

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

::v-deep .el-dialog__body {
  padding: 20px;
}

::v-deep .el-textarea {
  width: 100%;
}

/* 适配小屏幕 */
@media (max-width: 1200px) {
  .operation-buttons {
    margin-left: 0 !important;
    margin-top: 10px;
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
