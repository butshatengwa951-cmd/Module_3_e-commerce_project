import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'
const a=createApp(App);a.use(createPinia());a.use(router);a.mount('#app')
