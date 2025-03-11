<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref, watchEffect } from 'vue'
import { useDataStore } from '@/stores/data';
import { useI18n } from 'vue-i18n';

const router = useRouter()
const dataStore = useDataStore();
const { t } = useI18n();

const fail = ref(false);

watchEffect(() => {
  if ('none' === dataStore.dataStatus) {
    dataStore.loadData();
  } else if ('finish' === dataStore.dataStatus) {
    router.replace('/game');
  } else if ('fail' === dataStore.dataStatus) {
    fail.value = true;
  }
});
</script>

<template>
  <div id="load-page-root">
    <h1 id="load-data-fail-text" v-if="fail">{{ t('loadDataFail') }}</h1>
    <h1 v-else>{{ t('loading') }}</h1>
  </div>
</template>

<style lang="scss">
#load-page-root {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  #load-data-fail-text {
    color: red;
  }
}
</style>
