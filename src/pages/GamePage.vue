<script setup lang="ts">
import ActionQueue from '@/components/misc/ActionQueue.vue'
import { usePlayerStore } from '@/stores/player'
import { shallowRef, onMounted, isRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MyStuffPage from './MyStuffPage.vue'

const { t } = useI18n()

const playerStore = usePlayerStore()

const unwrapNumber = (value: number | Ref<number>) => (isRef(value) ? value.value : value)

// GamePage 特定的状态
const sidebarExpanded = shallowRef(false)

// ============ 拖拽调整宽度功能 ============
const tabsWidth = shallowRef(360)
const isDraggingTabs = shallowRef(false)
let startX = 0
let initialWidth = 0
const parentElement = shallowRef<HTMLElement | undefined>(undefined)

// 宽度约束
const minTabsWidth = 280
const maxTabsWidthPercentage = 0.5

onMounted(() => {
  // 从 localStorage 恢复宽度
  const savedTabsWidth = localStorage.getItem('tabsWidth')
  if (savedTabsWidth) {
    tabsWidth.value = parseInt(savedTabsWidth)
  }

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

  // 保存宽度到 localStorage
  localStorage.setItem('tabsWidth', tabsWidth.value.toString())
}

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

function closeSidebar() {
  sidebarExpanded.value = false
}
</script>

<template>
  <div id="game-page-root">
    <div v-if="sidebarExpanded" class="sidebar-mask" @click="closeSidebar"></div>

    <div id="game-page-layout-container" :class="{ 'sidebar-expanded': sidebarExpanded }" :style="{
      '--tabs-width': tabsWidth + 'px'
    }">
      <div id="header">
        <div id="header-title-action">
          <div class="header-title">
            <h1>{{ t('gameName') }}</h1>
          </div>
          <ActionQueue />
        </div>
      </div>
      <div id="sidebar" :class="{ expanded: sidebarExpanded }">
        <div class="mobile-sidebar-controls">
          <a class="sidebar-control-link" @click="toggleSidebar">
            <div class="skill-name">
              <span v-if="!sidebarExpanded">☰</span>
              <span v-else>✕</span>
            </div>
          </a>
          <router-link class="sidebar-control-link" :to="`/game/mystuff`" active-class="active-link"
            @click="closeSidebar">
            <div class="skill-name">{{ t('ui.myStuff') }}</div>
          </router-link>
        </div>
        <router-link v-for="skill in playerStore.skillsList" :key="skill.id" :to="`/game/${skill.id}`"
          active-class="active-link" @click="closeSidebar">
          <div class="skill-name">
            <span class="name-text">{{ t(skill.name) }}</span>
            <span class="level-text">{{ t('ui.level', { level: unwrapNumber(skill.level) }) }}</span>
          </div>
          <div class="skill-progress-wrapper">
            <div class="skill-progress-bar" :style="{
              width: unwrapNumber(skill.upgradeProgress) * 100 + '%',
            }"></div>
          </div>
        </router-link>
        <router-link :to="`/game/states`" active-class="active-link" @click="closeSidebar">
          <div class="skill-name">States</div>
        </router-link>
      </div>
      <div id="content">
        <RouterView />
      </div>
      <div id="tabs-container" ref="tabs-container" :style="{ width: tabsWidth + 'px' }">
        <div class="drag-handle drag-handle-left" @mousedown="startDragTabs">
          <div class="drag-indicator"></div>
        </div>
        <MyStuffPage />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
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

    >div {
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
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
      padding: $spacing-xs;
      overflow-y: auto;

      .mobile-sidebar-controls {
        display: none;
      }

      a,
      .sidebar-control-link {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: stretch;
        gap: 3px;
        padding: $spacing-lg $spacing-xl;
        border-radius: $radius-md;
        background: rgba(248, 250, 252, 0.72);
        font-weight: $font-weight-semibold;
        color: $text-secondary;
        transition:
          transform $transition-fast,
          box-shadow $transition-fast,
          background $transition-fast;
        cursor: pointer;
        user-select: none;

        &:hover:not(.active-link) {
          background: rgba(226, 232, 240, 0.9);
          transform: translateY(-2px);
          box-shadow: $shadow-sm;
        }

        &.active-link {
          background: $gradient-primary;
          color: #ffffff;
          box-shadow: 0 12px 22px $primary-rgba-28;
        }

        .skill-name {
          font-size: $font-base;
          line-height: 1.3;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: $spacing-lg;

          .name-text {
            flex: 0 0 auto;
          }

          .level-text {
            flex: 0 0 auto;
            font-size: $font-xs;
            opacity: 0.8;
          }
        }

        .skill-progress-wrapper {
          width: 100%;
          height: 3px;
          background: rgba(148, 163, 184, 0.2);
          border-radius: $spacing-xs;
          overflow: hidden;

          .skill-progress-bar {
            height: 100%;
            background: currentColor;
            transition: width $transition-slow;
          }
        }
      }
    }

    #content {
      grid-column: 2 / 3;
      grid-row: 2 / 3;
      padding: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      >* {
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

      >div {
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

      #sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 56px !important;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(12px);
        box-shadow: 4px 0 12px $shadow-color;
        flex-direction: column;
        flex-wrap: nowrap;
        transition: width $transition-slow, transform $transition-slow;
        padding: $spacing-sm;

        .mobile-sidebar-controls {
          display: flex;
          flex-direction: column;
          gap: $spacing-xs;
          margin-bottom: $spacing-xs;

          .sidebar-control-link {
            flex: 0 0 auto;
          }
        }

        a,
        .sidebar-control-link {
          flex: 0 0 auto;
          padding: $spacing-lg $spacing-sm;

          .skill-name {
            font-size: $font-xs;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .level-text {
              display: none;
            }
          }

          .skill-progress-wrapper {
            display: none;
          }
        }

        &.expanded {
          width: 200px !important;

          a,
          .sidebar-control-link {
            padding: $spacing-lg $spacing-xl;

            .skill-name {
              font-size: $font-base;
              text-align: left;
              display: flex;

              .level-text {
                display: inline;
              }
            }

            .skill-progress-wrapper {
              display: block;
            }
          }
        }
      }

      #content {
        flex: 1;
        min-height: 0;
        margin-left: 56px;

        >* {
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

    #game-page-layout-container {
      #sidebar .mobile-sidebar-controls {
        display: none;
      }
    }
  }
}
</style>
