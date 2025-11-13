<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

import ActionModalBox from '@/components/modalBox/ActionModalBox.vue'
import { actionConfigListBySkill, getSkillTabActionConfigsMapBySkillId } from '@/gameConfig'
import { useSkillStore } from '@/stores/skill'

const { t, locale } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const skillStore = useSkillStore()

const skill = computed(() => skillStore.getSkill(skillId.value))

// 判断是否需要使用 tab 分组
const skillActionTabs = computed(() => getSkillTabActionConfigsMapBySkillId(skillId.value))
const hasTabGroups = computed(() => Object.keys(skillActionTabs.value).length > 0)
const currentTab = ref<string>('')

// 获取可用的 tabs
const availableTabs = computed(() => Array.from(Object.keys(skillActionTabs.value)))

// 自动确保 currentTab 始终有效
watchEffect(() => {
  if (hasTabGroups.value && availableTabs.value.length > 0) {
    if (!currentTab.value || !availableTabs.value.includes(currentTab.value)) {
      currentTab.value = availableTabs.value[0]
    }
  }
})

// 显示的 actions
const displayedActions = computed(() => {
  if (!hasTabGroups.value) {
    return actionConfigListBySkill[skillId.value]
  }
  return skillActionTabs.value[currentTab.value] || []
})

// 预生成用于渲染的 tab 列表（方式 3）
const tabEntries = computed(() =>
  availableTabs.value.map((tab) => ({
    id: tab,
    label: t(`action.${tab}.name`),
  })),
)

const modalVisible = ref(false)
const selectedActionId = shallowRef<string | undefined>(undefined)

function openModal(actionId: string) {
  selectedActionId.value = actionId
  modalVisible.value = true
}
</script>

<template>
  <div v-if="skill" id="skill-page-container">
    <div class="page-header">
      <div class="page-header-main">
        <h2 class="page-title">{{ t(skill.name) }}</h2>
        <div class="page-badge">{{ t('ui.level', { level: skill.level }) }}</div>
      </div>
      <div class="page-description">{{ t(skill.description) }}</div>
      <div class="page-stats">
        <div class="page-stat">
          <span class="page-stat-label">{{ t('ui.xp') }}</span>
          <span class="page-stat-value">{{ skill.xp.toLocaleString(locale) }}</span>
        </div>
        <div class="page-stat">
          <span class="page-stat-label">{{ t('ui.nextLevel') }}</span>
          <span class="page-stat-value">{{
            skill.remainingXpForUpgrade.toLocaleString(locale)
          }}</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :style="{
            width: skill.upgradeProgress * 100 + '%',
          }"
        ></div>
      </div>
    </div>

    <!-- Tab 切换区域 -->
    <div v-if="hasTabGroups" class="tabs-header">
      <button
        v-for="tab in tabEntries"
        :key="tab.id"
        class="tab-button"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="grid-container">
      <div
        v-for="action in displayedActions"
        :key="action.id"
        class="grid-item"
        @click="openModal(action.id)"
      >
        <div>{{ t(action.name) }}</div>
      </div>
    </div>
  </div>
  <ActionModalBox v-model="modalVisible" :action-id="selectedActionId" />
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

#skill-page-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}
</style>
