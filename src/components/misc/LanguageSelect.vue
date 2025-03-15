<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { computed } from 'vue'

const settingsStore = useSettingsStore()

const selectedLocale = computed({
  get: () => settingsStore.locale,
  set: (value) => settingsStore.setLocale(value),
})
</script>

<template>
  <select v-model="selectedLocale">
    <option v-for="[code, language] in settingsStore.localeOptions" :key="code" :value="code">
      {{ language }}
    </option>
  </select>
</template>
