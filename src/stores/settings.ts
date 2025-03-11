import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

export const useSettingsStore = defineStore('settings', () => {
  const localeOptions: [string, string][] = [
    ["en", "English"],
    ["zh", "中文简体"]
  ];
  const i18n = useI18n();
  const locale = ref(i18n.locale.value);

  function setLocale(newLocale: string) {
    locale.value = newLocale;
    if (i18n.locale.value !== newLocale) {
      i18n.locale.value = newLocale;
    }
  }

  return {
    localeOptions,
    locale,

    setLocale
  }
});
