<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import ActionQueue from '@/components/ActionQueue.vue'
import LeftSidebar from '@/components/LeftSidebar.vue'

import MyStuffPage from './MyStuffPage.vue'

const { t } = useI18n()

// left sidebar
const sidebarExpanded = ref(false)

// ============ 拖拽调整宽度功能 ============
const tabsWidth = ref(360)
const isDraggingTabs = ref(false)
let startX = 0
let initialWidth = 0
const parentElement = ref<HTMLElement | undefined>(undefined)

// 宽度约束
const minTabsWidth = 280
const maxTabsWidthPercentage = 0.5

onMounted(() => {
  // 获取父容器引用
  const container = document.getElementById('game-page-layout-container')
  if (container) {
    parentElement.value = container
  }
})

function startDragTabs(e: MouseEvent) {
  isDraggingTabs.value = true
  startX = e.clientX
  initialWidth = tabsWidth.value

  document.addEventListener('mousemove', dragTabs)
  document.addEventListener('mouseup', stopDragTabs)
  document.body.classList.add('dragging')
}

function dragTabs(e: MouseEvent) {
  if (!isDraggingTabs.value) return

  const deltaX = e.clientX - startX
  let newWidth = initialWidth - deltaX

  newWidth = Math.max(newWidth, minTabsWidth)

  if (parentElement.value && 'offsetWidth' in parentElement.value) {
    newWidth = Math.min(newWidth, parentElement.value.offsetWidth * maxTabsWidthPercentage)
  }

  tabsWidth.value = newWidth
}

function stopDragTabs() {
  isDraggingTabs.value = false
  document.removeEventListener('mousemove', dragTabs)
  document.removeEventListener('mouseup', stopDragTabs)
  document.body.classList.remove('dragging')
}

// 样式对象抽离到脚本层
const containerStyle = computed(() => ({
  '--tabs-width': tabsWidth.value + 'px',
}))

const tabsWidthStyle = computed(() => ({
  width: tabsWidth.value + 'px',
}))
</script>

<template>
  <div id="game-page-root">
    <div v-if="sidebarExpanded" class="sidebar-mask" @click="sidebarExpanded = false"></div>

    <div
      id="game-page-layout-container"
      :class="{ 'sidebar-expanded': sidebarExpanded }"
      :style="containerStyle"
    >
      <div id="header">
        <div id="header-title-action">
          <div class="header-title">
            <h1>{{ t('gameName') }}</h1>
          </div>
          <ActionQueue />
        </div>
      </div>
      <LeftSidebar v-model="sidebarExpanded" />
      <div id="content">
        <RouterView />
      </div>
      <div id="tabs-container" ref="tabs-container" :style="tabsWidthStyle">
        <div class="drag-handle drag-handle-left" @mousedown="startDragTabs">
          <div class="drag-indicator"></div>
        </div>
        <MyStuffPage />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

#game-page-root {
  height: 100%;
  padding: $spacing-xs;
  box-sizing: border-box;

  #game-page-layout-container {
    height: 100%;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) var(--tabs-width, 360px);
    grid-template-rows: auto minmax(0, 1fr);
    gap: $spacing-xs;

    > div {
      background: $bg-primary;
      backdrop-filter: blur(12px);
      border: 1px solid $border-color;
      border-radius: $spacing-xs;
      padding: $spacing-xs;
      box-shadow: $shadow-lg;
      overflow: hidden;
    }

    #header {
      grid-column: 1 / 4;
      grid-row: 1 / 2;

      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-xl $spacing-3xl;

      h1 {
        margin: 0;
        font-size: $font-6xl;
        font-weight: $font-weight-bold;
        letter-spacing: 0.02em;
        color: $text-primary;
      }

      #header-title-action {
        display: flex;
        flex-flow: row nowrap;
        gap: $spacing-4xl;
        align-items: center;
      }
    }

    #sidebar {
      grid-column: 1 / 2;
      grid-row: 2 / 3;
    }

    #content {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      > * {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: $spacing-3xl;
      }
    }

    #tabs-container {
      grid-column: 3 / 4;
      grid-row: 2 / 3;
      display: flex;
      flex-direction: row;
      padding: 0;
      overflow: hidden;

      .drag-handle-left {
        width: $drag-handle-width;
        cursor: ew-resize;
        background: rgba(148, 163, 184, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.2s ease;

        &:hover {
          background: $primary-rgba-15;
        }

        .drag-indicator {
          width: $spacing-xs;
          height: 40px;
          background: rgba(148, 163, 184, 0.4);
          border-radius: 1px;
          transition: background 0.2s ease;
        }

        &:hover .drag-indicator {
          background: rgba(37, 99, 235, 0.6);
        }
      }

      .tabs-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }

    .tabs-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .tab-panel {
      height: 100%;
      overflow-y: auto;
      padding: $spacing-xs;
    }

    #abilities {
      display: flex;
      justify-content: center;
      align-items: center;
      color: $text-quaternary;
      font-style: italic;
    }
  }
}

@media (max-width: 960px) {
  #game-page-root {
    padding: 0;
    position: relative;

    .sidebar-mask {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 999;
    }

    #game-page-layout-container {
      display: flex;
      flex-direction: column;
      height: 100%;

      > div {
        padding: $spacing-xs;
      }

      #header {
        .header-title h1 {
          display: none;
        }

        #header-title-action {
          width: 100%;
          justify-content: flex-end;
        }
      }

      #tabs-container {
        display: none;
      }

      #content {
        flex: 1;
        min-height: 0;
        margin-left: 56px;

        > * {
          padding: $spacing-2xl;
        }
      }
    }

    &.sidebar-expanded #content {
      margin-left: 200px;
    }
  }
}

@media (min-width: 961px) {
  #game-page-root {
    .sidebar-mask {
      display: none;
    }
  }
}
</style>
