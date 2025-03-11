import './styles/app.scss'
import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(FloatingVue, {
  themes: {
    'skill-tooltip': {
      triggers: ['hover', 'focus', 'touch'],
      placement: 'right',
      distance: 0,
    },
    'item-tooltip': {
      $extend: 'skill-tooltip',
      placement: 'bottom'
    },
  },
})

app.mount('#app')

document.title = i18n.global.t('gameName');
watch(
  () => i18n.global.locale.value,
  () => {
    document.title = i18n.global.t('gameName');
  }
);
