import { defineComponent, Teleport, Transition, onMounted, onUnmounted } from 'vue'

export default defineComponent({
  name: 'ModalBox',
  emits: ['close'],
  setup(props, { emit, slots }) {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        emit('close')
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
    })

    return () => (
      <Teleport to="body">
        <div class="fixed inset-0 z-2000 grid place-items-center p-4 lg:p-8">
          <div
            class="absolute inset-0 bg-gray-900/55 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              emit('close')
            }}
          />
          <Transition
            enterActiveClass="transition-all duration-200 ease-out"
            leaveActiveClass="transition-all duration-200 ease-in"
            enterFromClass="opacity-0 translate-y-3 scale-98"
            leaveToClass="opacity-0 translate-y-3 scale-98"
            appear
          >
            <div class="relative max-h-[min(720px,90vh)] w-[min(480px,100%)] bg-white rounded-lg shadow-2xl overflow-auto p-3 lg:p-4">
              {slots.default?.()}
            </div>
          </Transition>
        </div>
      </Teleport>
    )
  },
})
