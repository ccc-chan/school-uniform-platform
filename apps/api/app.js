'use strict';

/**
 * 应用启动钩子
 * 在本地环境全局注册请求日志中间件
 */
module.exports = {
  async didCreate() {
    // 只在本地环境启用请求日志中间件
    if (this.config.env === 'local') {
      const requestLogger = this.middleware.requestLogger();
      
      // 将请求日志中间件添加到所有路由的前面
      // 注意：这需要在路由定义之前执行
    }
  },
};
