import './styles/app.scss'
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)

app.mount('#app')

document.title = i18n.global.t('gameName')
watch(
  () => i18n.global.locale.value,
  () => {
    document.title = i18n.global.t('gameName')
  },
)
