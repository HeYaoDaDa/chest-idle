import './styles/app.scss'
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

const app = createApp(App)

app.use(i18n)
app.use(createPinia())
app.use(router)
app.use(FloatingVue, {
  themes: {
    'skill-tooltip': {
      triggers: ['hover', 'focus', 'touch'],
      placement: 'right-start',
      distance: 0,
      extends: false,
    }
  },
})

app.mount('#app')

document.title = i18n.global.t('gameName')
watch(
  () => i18n.global.locale.value,
  () => {
    document.title = i18n.global.t('gameName')
  },
)
