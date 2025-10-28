<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { ROUTE_PATH_GAME } from '@/router'
import { global } from '@/models/global'

const router = useRouter()
const { t } = useI18n()

const fail = ref(false)

watchEffect(() => {
  if ('none' === global.status.value) {
    global.load()
  } else if ('finish' === global.status.value) {
    router.replace(ROUTE_PATH_GAME)
  } else if ('fail' === global.status.value) {
    fail.value = true
  }
})
</script>

<template>
  <div id="load-page-root">
    <h1 id="load-data-fail-text" v-if="fail">{{ t('loadDataFail') }}</h1>
    <h1 v-else>{{ t('loading') }}...</h1>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

#load-page-root {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  #load-data-fail-text {
    color: $error-color;
  }
}
</style>

