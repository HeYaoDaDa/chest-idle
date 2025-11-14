import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'

import NotificationCenter from '@/components/NotificationCenter'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <div class="h-full w-full">
        <NotificationCenter />
        <RouterView />
      </div>
    )
  },
})
