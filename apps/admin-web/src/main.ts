import 'ant-design-vue/dist/reset.css'
import 'virtual:uno.css'

import App from './App.vue'
import router from './router'
import './styles/main.css'

// 在根组件挂载前统一注册状态管理和路由。
createApp(App).use(createPinia()).use(router).mount('#app')
