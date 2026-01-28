module.exports = {
  // 静态资源相对路径
  publicPath: './',
  // 输出目录
  outputDir: 'dist',
  // 关闭生产环境sourcemap
  productionSourceMap: false,
  // 开发服务器配置
  devServer: {
    port: 8099, // 前端端口
    open: true, // 自动打开浏览器
    proxy: {
      // 接口代理配置
      '/api': {
        target: 'http://localhost:3000', // 接口服务地址
        changeOrigin: true, // 开启跨域代理
        pathRewrite: { '^/api': '/api' } // 路径转发规则
      }
    }
  }
};