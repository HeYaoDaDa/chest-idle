<script setup lang="ts">
import { type PropType, computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'

defineOptions({
  name: 'FloatingPopover',
  inheritAttrs: false,
})

type Placement = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'

type Trigger = 'hover' | 'click'

const props = defineProps({
  trigger: {
    type: String as PropType<Trigger>,
    default: 'hover',
  },
  placement: {
    type: String as PropType<Placement>,
    default: 'top',
  },
  align: {
    type: String as PropType<Align>,
    default: 'center',
  },
  offset: {
    type: Number,
    default: 12,
  },
})

const attrs = useAttrs()

const emit = defineEmits<{
  open: []
  close: []
}>()

const isHover = computed(() => props.trigger === 'hover')
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({ opacity: '0' })

let hoverTimeout: number | undefined
let watchingPosition = false

function open() {
  if (isOpen.value) return
  isOpen.value = true
  emit('open')
  nextTick(() => {
    updatePosition()
    attachPositionListeners()
    if (props.trigger === 'click') {
      document.addEventListener('mousedown', handleDocumentClick, true)
    }
  })
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  emit('close')
  detachPositionListeners()
  if (props.trigger === 'click') {
    document.removeEventListener('mousedown', handleDocumentClick, true)
  }
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (!triggerRef.value?.contains(target) && !panelRef.value?.contains(target)) {
    close()
  }
}

function scheduleClose() {
  if (!isHover.value) return
  if (hoverTimeout) window.clearTimeout(hoverTimeout)
  hoverTimeout = window.setTimeout(() => {
    close()
  }, 120)
}

function cancelScheduledClose() {
  if (hoverTimeout) {
    window.clearTimeout(hoverTimeout)
    hoverTimeout = undefined
  }
}

function updatePosition() {
  if (!isOpen.value || !triggerRef.value || !panelRef.value) return
  const triggerRect = triggerRef.value.getBoundingClientRect()
  const panelRect = panelRef.value.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset

  let top = 0
  let left = 0

  switch (props.placement) {
    case 'bottom':
      top = triggerRect.bottom + props.offset
      break
    case 'top':
      top = triggerRect.top - panelRect.height - props.offset
      break
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - panelRect.height / 2
      left = triggerRect.left - panelRect.width - props.offset
      break
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - panelRect.height / 2
      left = triggerRect.right + props.offset
      break
  }

  if (props.placement === 'top' || props.placement === 'bottom') {
    switch (props.align) {
      case 'start':
        left = triggerRect.left
        break
      case 'center':
        left = triggerRect.left + triggerRect.width / 2 - panelRect.width / 2
        break
      case 'end':
        left = triggerRect.right - panelRect.width
        break
    }
  } else {
    switch (props.align) {
      case 'start':
        top = triggerRect.top
        break
      case 'center':
        top = triggerRect.top + triggerRect.height / 2 - panelRect.height / 2
        break
      case 'end':
        top = triggerRect.bottom - panelRect.height
        break
    }
  }

  panelStyle.value = {
    top: `${top + scrollY}px`,
    left: `${left + scrollX}px`,
  }
}

function attachPositionListeners() {
  if (watchingPosition) return
  watchingPosition = true
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
}

function detachPositionListeners() {
  if (!watchingPosition) return
  watchingPosition = false
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
}

onMounted(() => {
  if (isHover.value) {
    const el = triggerRef.value
    if (!el) return
    el.addEventListener('mouseenter', onTriggerMouseEnter)
    el.addEventListener('mouseleave', onTriggerMouseLeave)
  }
})

onBeforeUnmount(() => {
  detachPositionListeners()
  document.removeEventListener('mousedown', handleDocumentClick, true)
  const el = triggerRef.value
  if (el && isHover.value) {
    el.removeEventListener('mouseenter', onTriggerMouseEnter)
    el.removeEventListener('mouseleave', onTriggerMouseLeave)
  }
})

watch(triggerRef, (newEl, oldEl) => {
  if (!isHover.value) return
  if (oldEl) {
    oldEl.removeEventListener('mouseenter', onTriggerMouseEnter)
    oldEl.removeEventListener('mouseleave', onTriggerMouseLeave)
  }
  if (newEl) {
    newEl.addEventListener('mouseenter', onTriggerMouseEnter)
    newEl.addEventListener('mouseleave', onTriggerMouseLeave)
  }
})

function onTriggerMouseEnter() {
  cancelScheduledClose()
  open()
}

function onTriggerMouseLeave() {
  scheduleClose()
}

function onPanelMouseEnter() {
  cancelScheduledClose()
}

function onPanelMouseLeave() {
  scheduleClose()
}

watch(
  () => [props.placement, props.align, props.offset],
  () => {
    if (isOpen.value) {
      nextTick(() => updatePosition())
    }
  },
)

watch(isOpen, (value) => {
  if (!value) {
    cancelScheduledClose()
  }
})

const triggerListeners = computed(() => {
  if (isHover.value) {
    return {}
  }
  return {
    onClick: (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      toggle()
    },
  }
})
</script>

<template>
  <span
    ref="triggerRef"
    :class="['popover-root', attrs.class]"
    v-bind="triggerListeners"
  >
    <slot />
  </span>
  <Teleport to="body">
    <Transition name="float-fade">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="popover-panel"
        :style="panelStyle"
        @mouseenter="onPanelMouseEnter"
        @mouseleave="onPanelMouseLeave"
      >
        <slot name="content" :close="close" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.popover-root {
  display: inline-block;
  position: relative;
}

.popover-panel {
  position: absolute;
  z-index: 2100;
  min-width: 180px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
  padding: 14px 16px;
  color: #0f172a;
  backdrop-filter: blur(8px) saturate(120%);
}

.float-fade-enter-active,
.float-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.float-fade-enter-from,
.float-fade-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
