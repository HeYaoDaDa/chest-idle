import 'virtual:uno.css'
import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'

import App from './App'
import i18n from './i18n'
import router from './router'

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
