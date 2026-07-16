import 'ant-design-vue/dist/reset.css'
import 'virtual:uno.css'

import App from './App.vue'
import router from './router'
import './styles/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')
