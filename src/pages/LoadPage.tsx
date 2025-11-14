import { defineComponent, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

export default defineComponent({
  name: 'LoadPage',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const appStore = useAppStore()
    const fail = ref(false)

    watchEffect(() => {
      if ('loading' === appStore.state) {
      } else if ('ready' === appStore.state) {
        router.replace('/game')
      } else if ('error' === appStore.state) {
        fail.value = true
      } else {
        appStore.loadApplication()
      }
    })

    return () => (
      <div class="h-screen flex justify-center items-center">
        <h1 class={`text-3xl font-bold ${fail.value ? 'text-red-700' : 'text-gray-800'}`}>
          {fail.value ? t('loadDataFail') : `${t('loading')}...`}
        </h1>
      </div>
    )
  },
})
