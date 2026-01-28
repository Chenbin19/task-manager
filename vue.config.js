module.exports = {
  // 开发服务器配置（代理核心）
  devServer: {
    port: 8099, // 前端项目端口（可改，避免冲突）
    open: true, // 启动后自动打开浏览器
    proxy: {
      // 匹配所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:3000', // Node接口服务地址
        changeOrigin: true, // 开启跨域代理（必须）
        pathRewrite: { '^/api': '/api' } // 路径不变，直接转发
      }
    }
  },
  // 生产环境构建配置（可选）
  productionSourceMap: false
};