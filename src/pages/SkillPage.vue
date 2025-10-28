<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { INFINITE_STRING } from '@/constants'
import type { ActionTarget } from '@/models/actionTarget'
import { actionManager } from '@/models/global/ActionManager'
import { dataManager } from '@/models/global/DataManager'
import { inventory } from '@/models/global/InventoryManager'
import { isIntegerOrInfinity, stringToNumber } from '@/utils'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

const { t, locale } = useI18n()
const route = useRoute()
const skillId = ref(route.params.id as string)
onBeforeRouteUpdate(async (to) => {
  skillId.value = to.params.id as string
})

const skill = computed(() => dataManager.getSkillById(skillId.value))

// 判断是否需要使用 tab 分组
const hasTabGroups = computed(() => skill.value.actionTargetTabMap.size > 0)
const currentTab = ref<string>('')

// 获取可用的 tabs
const availableTabs = computed(() => Array.from(skill.value.actionTargetTabMap.keys()))

// 确保 currentTab 始终有效
const ensureValidTab = () => {
  if (hasTabGroups.value && availableTabs.value.length > 0) {
    if (!currentTab.value || !availableTabs.value.includes(currentTab.value)) {
      currentTab.value = availableTabs.value[0]
    }
  }
}

// 监听技能变化，重置 tab
onBeforeRouteUpdate(() => {
  ensureValidTab()
})

// 首次加载时初始化
ensureValidTab()

// 显示的 actionTargets
const displayedActionTargets = computed(() => {
  if (!hasTabGroups.value) {
    return skill.value.actionTargets
  }
  return skill.value.actionTargetTabMap.get(currentTab.value) || []
})

const openZone = shallowRef(undefined as ActionTarget | undefined)
const amountString = ref(INFINITE_STRING)
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value))
const durationSeconds = computed(() => (openZone.value ? openZone.value.duration.value / 1000 : 0))
const xpPerCycle = computed(() => openZone.value?.xp.value ?? 0)
const chestPointsPerCycle = computed(() => openZone.value?.chestPoints.value ?? 0)
const hasIngredients = computed(() => (openZone.value?.ingredients.length ?? 0) > 0)
const hasProducts = computed(() => (openZone.value?.products.length ?? 0) > 0)
const hasCurrentAction = computed(() => !!actionManager.currentAction.value)
const queuePosition = computed(() => actionManager.queuedActions.length + 1)

// 不满足条件的标记（用于字段标红）
const isLevelInsufficient = computed(() => {
  if (!openZone.value) return false
  return openZone.value.skill.level.value < openZone.value.minLevel
})

const insufficientIngredients = computed(() => {
  if (!openZone.value || !('ingredients' in openZone.value)) return [] as string[]
  const lack: string[] = []
  for (const ingredient of openZone.value.ingredients) {
    const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id)
    const available = inventoryItem?.amount.value ?? 0
    if (available < ingredient.count) lack.push(ingredient.item.id)
  }
  return lack
})

const hasInsufficientIngredients = computed(() => insufficientIngredients.value.length > 0)

// 检查是否满足开始条件
const canStartAction = computed(() => {
  if (!openZone.value) return { canStart: false, reasons: [] }

  const reasons: string[] = []

  // 检查等级要求
  if (openZone.value.skill.level.value < openZone.value.minLevel) {
    reasons.push(t('notification.levelTooLow', {
      skill: t(openZone.value.skill.name),
      level: openZone.value.skill.level.value,
      required: openZone.value.minLevel,
      action: t(openZone.value.name)
    }))
  }

  // 检查材料是否足够
  if ('ingredients' in openZone.value && openZone.value.ingredients.length > 0) {
    for (const ingredient of openZone.value.ingredients) {
      const inventoryItem = inventory.inventoryItemMap.get(ingredient.item.id)
      const available = inventoryItem?.amount.value ?? 0
      if (available < ingredient.count) {
        reasons.push(t('ui.insufficientMaterial', {
          item: t(ingredient.item.name),
          required: ingredient.count,
          available: available
        }))
      }
    }
  }

  return {
    canStart: reasons.length === 0,
    reasons
  }
})

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString(locale.value, { minimumFractionDigits: 0, maximumFractionDigits })
function openModal(zone: ActionTarget) {
  openZone.value = zone
}
function closeModal() {
  openZone.value = undefined
  amountString.value = INFINITE_STRING
}
function addAction() {
  if (openZone.value) {
    actionManager.addAction(openZone.value, stringToNumber(amountString.value))
    closeModal()
  }
}

function startImmediately() {
  if (openZone.value) {
    // 立即开始：若有运行中，打断并将原运行项排到队首，然后立即开始新行动
    actionManager.startImmediately(openZone.value, stringToNumber(amountString.value))
    closeModal()
  }
}

function handleAmountFocus(event: FocusEvent) {
  const target = event.target as HTMLInputElement
  window.requestAnimationFrame(() => target.select())
}
</script>

<template>
  <div id="skill-page-container">
    <div class="skill-header">
      <div class="skill-header-main">
        <h2 class="skill-title">{{ t(skill.name) }}</h2>
        <div class="skill-level">{{ t('ui.level', { level: skill.level.value }) }}</div>
      </div>
      <div class="skill-description">{{ t(skill.description) }}</div>
      <div class="skill-stats">
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.xp') }}</span>
          <span class="skill-stat-value">{{ skill.xp.value.toLocaleString(locale) }}</span>
        </div>
        <div class="skill-stat">
          <span class="skill-stat-label">{{ t('ui.nextLevel') }}</span>
          <span class="skill-stat-value">{{
            skill.remainingXpForUpgrade.value.toLocaleString(locale)
          }}</span>
        </div>
      </div>
      <div class="skill-progress-bar-container">
        <div
          class="skill-progress-bar"
          :style="{
            width: skill.upgradeProgress.value * 100 + '%',
          }"
        ></div>
      </div>
    </div>

    <!-- Tab 切换区域 -->
    <div v-if="hasTabGroups" class="skill-tabs">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        class="skill-tab"
        :class="{ active: currentTab === tab }"
        @click="currentTab = tab"
      >
        {{ t(`actionTarget.${tab}.name`) }}
      </button>
    </div>

    <div id="skill-area-root">
      <div
        v-for="zone in displayedActionTargets"
        :key="zone.id"
        class="area-item"
        @click="openModal(zone)"
      >
        <div>{{ t(zone.name) }}</div>
        <div class="chest-progress">
          <div
            class="chest-progress-bar"
            :style="{
              width: (zone.chest.points.value / zone.chest.maxPoints) * 100 + '%',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
  <ModalBox v-if="openZone" @close="closeModal">
    <div class="zone-modal">
      <header class="zone-header">
        <div class="zone-header-text">
          <span class="zone-overline">{{ t(openZone.skill.name) }}</span>
          <h2 class="zone-title">{{ t(openZone.name) }}</h2>
          <p class="zone-description">{{ t(openZone.description) }}</p>
        </div>
        <button type="button" class="zone-close" @click="closeModal">×</button>
      </header>

      <div class="zone-info-list">
        <div class="info-row" :class="{ error: isLevelInsufficient }">
          <span class="info-label">{{ t('minLevelRequired') }}</span>
          <span class="info-value">{{ openZone.minLevel }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('duration') }}</span>
          <span class="info-value">{{ t('ui.seconds', { value: formatNumber(durationSeconds, 1) }) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.xpPerCycle') }}</span>
          <span class="info-value">{{ formatNumber(xpPerCycle) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.chestPoints') }}</span>
          <span class="info-value">{{ formatNumber(chestPointsPerCycle, 2) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('ui.chest') }}</span>
          <span class="info-value">{{ t(openZone.chest.name) }}</span>
        </div>

        <div class="info-row" :class="{ error: hasIngredients && hasInsufficientIngredients }">
          <span class="info-label">{{ t('ui.requiredMaterials') }}</span>
          <span class="info-value">
            <template v-if="hasIngredients">
              <template v-for="(ingredient, idx) in openZone.ingredients" :key="ingredient.item.id">
                <span>{{ t(ingredient.item.name) }} ×{{ formatNumber(ingredient.count) }}</span><span v-if="idx < openZone.ingredients.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noMaterialsRequired') }}
            </template>
          </span>
        </div>

        <div class="info-row">
          <span class="info-label">{{ t('ui.rewards') }}</span>
          <span class="info-value">
            <template v-if="hasProducts">
              <template v-for="(product, idx) in openZone.products" :key="product.item.id">
                <span>{{ t(product.item.name) }} ×{{ formatNumber(product.count) }}</span><span v-if="idx < openZone.products.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noRewards') }}
            </template>
          </span>
        </div>
      </div>

      <!-- 不再显示整块警告，改为字段级标红提示 -->

      <div class="zone-actions">
        <label class="zone-amount">
          <span class="zone-amount-label">{{ t('ui.amount') }}</span>
          <div class="zone-amount-input">
            <input type="text" v-model="amountString" @focus="handleAmountFocus" />
            <button
              type="button"
              class="zone-amount-infinity"
              :title="t('ui.unlimited')"
              @click="amountString = INFINITE_STRING"
            >
              {{ INFINITE_STRING }}
            </button>
          </div>
        </label>
        <div class="zone-action-buttons">
          <button
            v-if="hasCurrentAction"
            type="button"
            class="zone-button secondary"
            @click="addAction"
            :disabled="!allowAmount || !canStartAction.canStart"
          >
            {{ t('ui.addToQueue', { position: queuePosition }) }}
          </button>
          <button
            type="button"
            class="zone-button primary"
            @click="hasCurrentAction ? startImmediately() : addAction()"
            :disabled="!allowAmount || !canStartAction.canStart"
          >
            {{ hasCurrentAction ? t('ui.startImmediately') : t('start') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss">
#skill-page-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-tabs {
  display: flex;
  gap: 2px;
  padding: 2px 2px 0 2px;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
  margin-bottom: 0;

  .skill-tab {
    flex: 1;
    padding: 10px 16px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    transition:
      background 0.2s ease,
      color 0.2s ease;
    user-select: none;

    &:hover:not(.active) {
      background: rgba(226, 232, 240, 0.5);
      color: #475569;
    }

    &.active {
      background: rgba(255, 255, 255, 0.95);
      color: #2563eb;
      box-shadow: 0 -2px 8px rgba(37, 99, 235, 0.1);
    }
  }
}

.skill-header {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  text-align: center;

  .skill-header-main {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 6px;
  }

  .skill-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: 0.01em;
  }

  .skill-level {
    font-size: 11px;
    font-weight: 600;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.12);
    padding: 1px 6px;
    border-radius: 999px;
  }

  .skill-description {
    color: #475569;
    line-height: 1.3;
    font-size: 11px;
    margin: 0;
  }

  .skill-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .skill-stat {
    display: flex;
    flex-direction: column;
    gap: 1px;
    align-items: center;
  }

  .skill-stat-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    font-weight: 500;
  }

  .skill-stat-value {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .skill-progress-bar-container {
    width: 100%;
    height: 4px;
    background-color: rgba(226, 232, 240, 0.6);
    border-radius: 999px;
    overflow: hidden;

    .skill-progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      transition: width 0.3s ease;
      box-shadow: 0 0 8px rgba(37, 99, 235, 0.4);
    }
  }
}

#skill-area-root {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
  gap: 6px;

  .area-item {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.08);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 6px;
    text-align: center;
    user-select: none;
    cursor: pointer;
    box-sizing: border-box;
    font-size: 12px;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(37, 99, 235, 0.15);
      border-color: rgba(37, 99, 235, 0.35);
    }

    .chest-progress {
      width: 100%;
      height: 4px;
      background-color: rgba(226, 232, 240, 0.9);
      border-radius: 999px;
      overflow: hidden;

      .chest-progress-bar {
        height: 100%;
        background: linear-gradient(135deg, #22d3ee 0%, #2563eb 100%);
        transition: width 0.3s ease;
      }
    }
  }
}

.zone-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: min(460px, 100%);
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.zone-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zone-overline {
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.zone-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.zone-description {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.zone-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
  border-radius: 999px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 20px;
  line-height: 1;
}

.zone-close:hover {
  background: rgba(71, 85, 105, 0.22);
  color: #1f2937;
}

.zone-info-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  padding: 2px 0;
}

.info-label {
  font-size: 12px;
  color: #64748b;
  letter-spacing: 0.02em;
}

.info-value {
  font-size: 14px;
  color: #0f172a;
  font-weight: 600;
}

.info-row.error .info-label {
  color: #dc2626;
}

.info-row.error .info-value {
  color: #dc2626;
}

.zone-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.zone-stat {
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zone-stat-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}

.zone-stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.zone-resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.zone-resource {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-resource h3 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1f2937;
}

.zone-resource ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.zone-resource li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #0f172a;
}

.resource-name {
  font-weight: 500;
}

.resource-count {
  color: #334155;
}

.zone-resource-empty {
  margin: 0;
  font-style: italic;
  color: #94a3b8;
}

.zone-warnings {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.05) 100%);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-warning-title {
  font-size: 14px;
  font-weight: 700;
  color: #b91c1c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.zone-warning-list {
  margin: 0;
  padding: 0 0 0 20px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zone-warning-item {
  font-size: 14px;
  color: #dc2626;
  position: relative;
  line-height: 1.5;
}

.zone-warning-item::before {
  content: '⚠';
  position: absolute;
  left: -20px;
  color: #f59e0b;
}

.zone-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zone-amount {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.zone-amount-label {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.zone-amount-input {
  display: flex;
  gap: 6px;
}

.zone-amount-input input {
  flex: 1;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #0f172a;
}

.zone-amount-input input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.zone-amount-infinity {
  border: none;
  border-radius: 6px;
  background: #e2e8f0;
  color: #0f172a;
  padding: 0 12px;
  cursor: pointer;
  font-size: 18px;
}

.zone-amount-infinity:hover {
  background: #cbd5f5;
}

.zone-action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.zone-button {
  border: none;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.zone-button.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
}

.zone-button.primary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.zone-button.secondary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
}

.zone-button.secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.zone-button.secondary:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.zone-button.ghost {
  background: #e2e8f0;
  color: #1f2937;
}

.zone-button.ghost:hover {
  background: #cbd5e1;
}

@media (max-width: 540px) {
  .zone-modal {
    min-width: unset;
  }

  .info-row {
    gap: 6px;
  }

  .zone-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .zone-resources {
    grid-template-columns: 1fr;
  }

  .zone-button {
    width: 100%;
  }

  .zone-action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
