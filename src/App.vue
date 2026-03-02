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
            align="right"
            unlink-panels
            :picker-options="pickerOptions"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            size="mini"
            clearable
          />
        </el-form-item>

        <el-form-item label="关键词搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索项目名称/任务名称/工作内容"
            size="mini"
            style="width: 300px"
            clearable
            @keyup.enter.native="search"
          />
        </el-form-item>

        <el-form-item label="项目进度">
          <el-select
            v-model="searchForm.projectStatus"
            placeholder="请选择进度"
            size="mini"
            style="width: 150px"
            clearable
          >
            <el-option label="进行中" value="进行中" />
            <el-option label="测试中" value="测试中" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>

        <!-- 操作按钮组 -->
        <el-form-item class="operation-buttons">
          <el-button
            type="primary"
            @click="search"
            size="mini"
            icon="el-icon-search"
            >搜索</el-button
          >
          <el-button size="mini" @click="resetSearch" icon="el-icon-refresh"
            >重置</el-button
          >
          <el-button
            type="primary"
            @click="addTask"
            size="mini"
            icon="el-icon-plus"
            >新增任务</el-button
          >
          <el-button
            type="warning"
            @click="generateWeeklyReport"
            size="mini"
            icon="el-icon-document"
            >生成周报.txt</el-button
          >
          <el-button
            type="success"
            @click="exportExcel"
            size="mini"
            icon="el-icon-download"
            >导出Excel</el-button
          >
          <el-button
            type="info"
            @click="triggerFileInput"
            size="mini"
            icon="el-icon-upload"
            >导入Excel</el-button
          >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx, .xls"
            class="file-input"
            @change="handleExcelUpload"
          />
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
        style="width: 100%"
        max-height="600px"
        v-loading="loading"
        element-loading-text="数据加载中..."
        highlight-current-row
      >
        <el-table-column
          prop="createTime"
          label="日期"
          width="120"
          header-align="center"
          sortable
          align="center"
        >
          <template slot-scope="scope">
            <span v-html="highlightText(scope.row.createTime, '')"></span>
          </template>
        </el-table-column>

        <el-table-column prop="projectName" label="项目名称" min-width="200">
          <template slot-scope="scope">
            <span
              v-html="highlightText(scope.row.projectName, searchForm.keyword)"
            ></span>
          </template>
        </el-table-column>

        <el-table-column prop="taskName" label="任务名称" min-width="200">
          <template slot-scope="scope">
            <span
              v-html="highlightText(scope.row.taskName, searchForm.keyword)"
            ></span>
          </template>
        </el-table-column>

        <el-table-column
          prop="weeklyWorkContent"
          label="工作内容"
          min-width="300"
        >
          <template slot-scope="scope">
            <div
              class="work-content"
              v-html="
                highlightText(scope.row.weeklyWorkContent, searchForm.keyword)
              "
            ></div>
          </template>
        </el-table-column>

        <el-table-column
          prop="projectStatus"
          label="项目进度"
          width="120"
          align="center"
        >
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
            <span
              v-html="highlightText(scope.row.note, searchForm.keyword)"
            ></span>
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
            style="width: 100%"
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
            style="width: 100%"
            clearable
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
        <el-button type="primary" @click="saveTask" :loading="saveLoading"
          >保存</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as XLSX from "xlsx";

export default {
  name: "TaskManagement",
  data() {
    return {
      loading: false,
      saveLoading: false,
      dialogVisible: false,
      searchForm: {
        dateRange: [],
        keyword: "",
        projectStatus: "",
      },
      pickerOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
      },
      allData: [],
      tableData: [],
      form: {
        id: "",
        createTime: "",
        projectName: "",
        taskName: "",
        weeklyWorkContent: "",
        projectStatus: "",
        note: "",
      },
      formRules: {
        createTime: [
          { required: true, message: "请选择日期", trigger: "change" },
        ],
        projectName: [
          { required: true, message: "请输入项目名称", trigger: "blur" },
        ],
        taskName: [
          { required: true, message: "请输入任务名称", trigger: "blur" },
        ],
        weeklyWorkContent: [
          { required: true, message: "请输入工作内容", trigger: "blur" },
        ],
        projectStatus: [
          { required: true, message: "请选择项目进度", trigger: "change" },
        ],
      },
      resizeHandler: null,
    };
  },
  mounted() {
    this.setDefaultDateRange();
    this.getTaskList();
    this.resizeHandler = () => {
      this.tableData = [...this.tableData];
    };
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeHandler);
  },
  methods: {
    safeStrip(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },
    getWeekRange() {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - mondayOffset);
      const sundayOffset = dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + sundayOffset);
      const fmt = (d) =>
        `${d.getFullYear()}-${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      return [fmt(monday), fmt(sunday)];
    },
    setDefaultDateRange() {
      this.searchForm.dateRange = this.getWeekRange();
    },
    getStatusTagType(status) {
      return (
        { 已完成: "success", 测试中: "warning", 进行中: "primary" }[status] ||
        "info"
      );
    },
    highlightText(text, keyword) {
      if (!keyword || !text) return text;
      const key = this.safeStrip(keyword).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      return text.replace(
        new RegExp(key, "gi"),
        (m) => `<span class="highlight-text">${m}</span>`
      );
    },
    formatExcelDate(excelDate) {
      if (!excelDate) return "";
      const s = this.safeStrip(excelDate);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      if (!isNaN(Number(s))) {
        const serial = Number(s);
        const base =
          serial > 60 ? new Date(1900, 0, 1) : new Date(1899, 11, 30);
        const t = new Date(base);
        t.setDate(base.getDate() + serial - 1);
        return t.toISOString().split("T")[0];
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
    },
    readExcelFile(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = (e) => {
          try {
            resolve(
              XLSX.read(new Uint8Array(e.target.result), { type: "array" })
            );
          } catch (err) {
            reject(err);
          }
        };
        r.onerror = () => reject(new Error("读取失败"));
        r.readAsArrayBuffer(file);
      });
    },
    processProjectData(data) {
      return data.reduce((res, item, i) => {
        const pn = this.safeStrip(item.projectName),
          tn = this.safeStrip(item.taskName),
          wc = this.safeStrip(item.weeklyWorkContent),
          ps = this.safeStrip(item.projectStatus),
          note = this.safeStrip(item.note);
        if (!pn || !tn || !ps) return res;
        let wt = "";
        if (wc) {
          const lines = wc
            .split("\n")
            .map((l) => this.safeStrip(l))
            .filter(Boolean);
          if (lines.length)
            wt =
              "\n    " +
              lines.map((l, j) => `${i + 1}.${j + 1}：${l}`).join("\n    ");
        }
        res.push(
          `${i + 1}、${pn}项目：${tn}，当前进度：${ps}${
            note ? "（备注：" + note + "）" : ""
          }${wt}`
        );
        return res;
      }, []);
    },
    async getTaskList() {
      this.loading = true;
      try {
        const { data } = await this.$axios.get("/api/tasks");
        if (data.code === 200) {
          this.allData = data.data;
          this.tableData = [...this.allData];
          this.search();
        }
      } catch (e) {
        this.$message.error("获取失败");
      } finally {
        this.loading = false;
      }
    },

    search() {
      let data = [...this.allData];
      const { dateRange, keyword, projectStatus } = this.searchForm;
      const kw = this.safeStrip(keyword).toLowerCase();

      // 时间
      if (dateRange?.length === 2) {
        const st = new Date(dateRange[0]),
          ed = new Date(dateRange[1]);
        ed.setHours(23, 59, 59, 999);
        data = data.filter((it) => {
          const t = new Date(it.createTime);
          return t >= st && t <= ed;
        });
      }

      // 关键词
      if (kw) {
        data = data.filter((it) => {
          const pn = it.projectName?.toLowerCase() || "";
          const tn = it.taskName?.toLowerCase() || "";
          const wc = it.weeklyWorkContent?.toLowerCase() || "";
          return pn.includes(kw) || tn.includes(kw) || wc.includes(kw);
        });
      }

      // 进度
      if (projectStatus) {
        data = data.filter((it) => it.projectStatus === projectStatus);
      }

      // 默认倒序
      this.tableData = data.sort(
        (a, b) => new Date(b.createTime) - new Date(a.createTime)
      );
    },
    resetSearch() {
      this.searchForm = {
        dateRange: this.getWeekRange(),
        keyword: "",
        projectStatus: "",
      };
      this.search();
    },
    getCurrentWeekThursday() {
      const now = new Date();
      const d = now.getDay();
      const add = (4 - d + 7) % 7;
      const t = new Date(now);
      t.setDate(now.getDate() + add);
      return `${t.getFullYear()}-${(t.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;
    },
    addTask() {
      this.dialogVisible = false;
      this.$nextTick(() => {
        this.form = {
          id: "",
          createTime: this.getCurrentWeekThursday(),
          projectName: "",
          taskName: "",
          weeklyWorkContent: "",
          projectStatus: "",
          note: "",
        };
        this.$refs.taskForm?.clearValidate();
        this.dialogVisible = true;
      });
    },
    editTask(row) {
      this.dialogVisible = false;
      this.$nextTick(() => {
        this.form = { ...row };
        this.$refs.taskForm?.clearValidate();
        this.dialogVisible = true;
      });
    },
    async saveTask() {
      try {
        await this.$refs.taskForm.validate();
        this.saveLoading = true;
        const { data } = await this.$axios.post("/api/tasks/save", this.form);
        if (data.code === 200) {
          this.$message.success("保存成功");
          this.dialogVisible = false;
          this.getTaskList();
        } else this.$message.error(data.msg || "失败");
      } catch (e) {
        if (e.name !== "ValidationError") {
          this.$message.error("保存失败");
        }
      } finally {
        this.saveLoading = false;
      }
    },
    async deleteTask(id) {
      try {
        await this.$confirm("确定删除？", "提示", { type: "warning" });
        const { data } = await this.$axios.post("/api/tasks/delete", { id });
        if (data.code === 200) {
          this.$message.success("删除成功");
          this.getTaskList();
        } else this.$message.error("失败");
      } catch (e) {
        if (e !== "cancel") this.$message.info("已取消");
      }
    },
    generateWeeklyReport() {
      if (!this.tableData.length) return this.$message.warning("无数据");
      const txt = this.processProjectData(this.tableData).join("\n");
      const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `周报_${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.$message.success("生成成功");
    },
    exportExcel() {
      if (!this.tableData.length) return this.$message.warning("无数据");
      const exp = this.tableData.map((it) => ({
        日期: it.createTime,
        项目名称: it.projectName,
        任务名称: it.taskName,
        工作内容: it.weeklyWorkContent,
        项目进度: it.projectStatus,
        备注: it.note,
      }));
      const ws = XLSX.utils.json_to_sheet(exp);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "任务");
      const suffix =
        this.searchForm.dateRange?.length === 2
          ? `${this.searchForm.dateRange[0]}_${this.searchForm.dateRange[1]}`
          : new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `日志_${suffix}.xlsx`);
      this.$message.success("导出成功");
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    async handleExcelUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls"].includes(ext)) {
        this.$message.error("格式错误");
        this.$refs.fileInput.value = "";
        return;
      }
      this.loading = true;
      try {
        const wb = await this.readExcelFile(file);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const head = json[0]?.map((it) => this.safeStrip(it)) || [];
        const needs = [
          "日期",
          "项目名称",
          "任务名称",
          "工作内容",
          "项目进度",
          "备注",
        ];
        const miss = needs.filter((h) => !head.includes(h));
        if (miss.length) {
          this.$message.error("缺少：" + miss.join("、"));
          return;
        }
        const rows = [];
        for (let i = 1; i < json.length; i++) {
          const r = json[i];
          if (!r || r.every((x) => !this.safeStrip(x))) continue;
          const row = {
            id: "",
            createTime: this.formatExcelDate(r[head.indexOf("日期")]),
            projectName: this.safeStrip(r[head.indexOf("项目名称")]),
            taskName: this.safeStrip(r[head.indexOf("任务名称")]),
            weeklyWorkContent: this.safeStrip(r[head.indexOf("工作内容")]),
            projectStatus: this.safeStrip(r[head.indexOf("项目进度")]),
            note: this.safeStrip(r[head.indexOf("备注")]),
          };
          if (
            row.projectName &&
            row.taskName &&
            row.weeklyWorkContent &&
            row.projectStatus
          )
            rows.push(row);
        }
        if (!rows.length) {
          this.$message.warning("无有效数据");
          return;
        }
        await this.$confirm(
          `覆盖${this.allData.length}条，导入${rows.length}条？`,
          "警告",
          { type: "warning" }
        );
        await this.$axios.post("/api/tasks/deleteAll");
        const { data } = await this.$axios.post("/api/tasks/batchSave", rows);
        if (data.code === 200) {
          this.$message.success("导入成功");
          this.getTaskList();
        } else this.$message.error("导入失败");
      } catch (e) {
        if (e !== "cancel" && e !== "close")
          this.$message.error("失败：" + e.message);
      } finally {
        this.$refs.fileInput.value = "";
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.task-management-container {
  width: 99%;
  margin: 10px auto;
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 10px;
}
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
.file-input {
  display: none;
}
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
.work-content {
  white-space: pre-wrap;
  line-height: 1.5;
  word-break: break-word;
}
::v-deep .highlight-text {
  color: #f56c6c;
  font-weight: 600;
  background: #fff2f2;
  padding: 0 2px;
  border-radius: 2px;
}

::v-deep .el-table {
  --el-table-header-text-color: #333;
  --el-table-row-hover-bg-color: #f8f9fa;
}
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}
::v-deep .el-dialog__body {
  padding: 20px;
}

@media (max-width: 1200px) {
  .operation-buttons {
    margin-left: 0 !important;
    margin-top: 10px;
    width: 100%;
  }
}
</style>