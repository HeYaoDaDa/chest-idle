import { createI18n } from 'vue-i18n';
import enUS from './en';
import zhCN from './zh';

const userLocale = navigator.language || 'en';
const defaultLocale = userLocale.startsWith('zh') ? 'zh' : 'en';
const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'en',
  legacy: false,
  messages: {
    'en': enUS,
    'zh': zhCN
  }
})

export default i18n;
