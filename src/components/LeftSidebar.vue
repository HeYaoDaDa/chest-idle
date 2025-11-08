<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const playerStore = usePlayerStore()

// Props
interface Props {
  expanded: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  toggle: []
  close: []
}>()

function handleToggle() {
  emit('toggle')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div id="sidebar" :class="{ expanded }">
    <div class="mobile-sidebar-controls">
      <a class="sidebar-control-link" @click="handleToggle">
        <div class="skill-name">
          <span v-if="!expanded">☰</span>
          <span v-else>✕</span>
        </div>
      </a>
      <router-link class="sidebar-control-link" :to="`/game/mystuff`" active-class="active-link"
        @click="handleClose">
        <div class="skill-name">{{ t('ui.myStuff') }}</div>
      </router-link>
    </div>
    <router-link v-for="skill in playerStore.skillsList" :key="skill.id" :to="`/game/${skill.id}`"
      active-class="active-link" @click="handleClose">
      <div class="skill-name">
        <span class="name-text">{{ t(skill.name) }}</span>
        <span class="level-text">{{ t('ui.level', { level: skill.level }) }}</span>
      </div>
      <div class="skill-progress-wrapper">
        <div class="skill-progress-bar" :style="{
          width: skill.upgradeProgress * 100 + '%',
        }"></div>
      </div>
    </router-link>
    <router-link :to="`/game/states`" active-class="active-link" @click="handleClose">
      <div class="skill-name">States</div>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

#sidebar {
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

@media (max-width: 960px) {
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
}

@media (min-width: 961px) {
  #sidebar .mobile-sidebar-controls {
    display: none;
  }
}
</style>
