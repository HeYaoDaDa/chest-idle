<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import { INFINITE_STRING } from '@/constants'
import type { Action } from '@/models/Action'
import { useActionQueueStore } from '@/stores/actionQueue'
import { usePlayerStore } from '@/stores/player'
import { isIntegerOrInfinity, stringToNumber } from '@/utils'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const playerStore = usePlayerStore()
const actionQueueStore = useActionQueueStore()

// Props
interface Props {
  modelValue: boolean
  action?: Action
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// 获取技能信息
const skill = computed(() => {
  if (!props.action) return null
  return playerStore.getSkill(props.action.skillId)
})

const amountString = ref(INFINITE_STRING)
const allowAmount = computed(() => isIntegerOrInfinity(amountString.value))
const durationSeconds = computed(() => (props.action ? props.action.getDuration() / 1000 : 0))
const xpPerCycle = computed(() => props.action?.getXp() ?? 0)
const chestPointsPerCycle = computed(() => props.action?.getChestPoints() ?? 0)
const hasIngredients = computed(() => (props.action?.ingredients.length ?? 0) > 0)
const hasProducts = computed(() => (props.action?.products.length ?? 0) > 0)
const hasCurrentAction = computed(() => !!actionQueueStore.currentAction)
const queuePosition = computed(() => actionQueueStore.queueLength + 1)

// 不满足条件的标记（用于字段标红）
const isLevelInsufficient = computed(() => {
  if (!props.action || !skill.value) return false
  return skill.value.level < props.action.minLevel
})

const insufficientIngredients = computed(() => {
  if (!props.action || !('ingredients' in props.action)) return [] as string[]
  const lack: string[] = []
  for (const ingredient of props.action.ingredients) {
    const inventoryItem = playerStore.inventoryMap.get(ingredient.item.id)
    const available = inventoryItem?.quantity ?? 0
    if (available < ingredient.count) lack.push(ingredient.item.id)
  }
  return lack
})

const hasInsufficientIngredients = computed(() => insufficientIngredients.value.length > 0)

// 检查是否满足开始条件
const canStartAction = computed(() => {
  if (!props.action) return { canStart: false, reasons: [] }

  const reasons: string[] = []

  // 检查等级要求
  if (skill.value && skill.value.level < props.action.minLevel) {
    reasons.push(t('notification.levelTooLow', {
      skill: t(skill.value.name),
      level: skill.value.level,
      required: props.action.minLevel,
      action: t(props.action.name),
    }))
  }

  // 检查材料是否足够
  if ('ingredients' in props.action && props.action.ingredients.length > 0) {
    for (const ingredient of props.action.ingredients) {
      const inventoryItem = playerStore.inventoryMap.get(ingredient.item.id)
      const available = inventoryItem?.quantity ?? 0
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

function closeModal() {
  emit('update:modelValue', false)
  amountString.value = INFINITE_STRING
}

function addAction() {
  if (props.action) {
    actionQueueStore.addAction(props.action, stringToNumber(amountString.value))
    closeModal()
  }
}

function startImmediately() {
  if (props.action) {
    // 立即开始：若有运行中，打断并将原运行项排到队首，然后立即开始新行动
    actionQueueStore.startImmediately(props.action, stringToNumber(amountString.value))
    closeModal()
  }
}

function handleAmountFocus(event: FocusEvent) {
  const target = event.target as HTMLInputElement
  window.requestAnimationFrame(() => target.select())
}

// 当模态框关闭时重置 amountString
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    amountString.value = INFINITE_STRING
  }
})
</script>

<template>
  <ModalBox v-if="modelValue && action" @close="closeModal">
    <div class="zone-modal">
      <header class="zone-header">
        <div class="zone-header-text">
          <span class="zone-overline">{{ skill ? t(skill.name) : '' }}</span>
          <h2 class="zone-title">{{ t(action.name) }}</h2>
          <p class="zone-description">{{ t(action.description) }}</p>
        </div>
        <button type="button" class="zone-close" @click="closeModal">×</button>
      </header>

      <div class="zone-info-list">
        <div class="info-row" :class="{ error: isLevelInsufficient }">
          <span class="info-label">{{ t('minLevelRequired') }}</span>
          <span class="info-value">{{ action.minLevel }}</span>
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
          <span class="info-value">{{ t(action.chest.name) }}</span>
        </div>

        <div class="info-row" :class="{ error: hasIngredients && hasInsufficientIngredients }">
          <span class="info-label">{{ t('ui.requiredMaterials') }}</span>
          <span class="info-value">
            <template v-if="hasIngredients">
              <template v-for="(ingredient, idx) in action.ingredients" :key="ingredient.item.id">
                <span>{{ t(ingredient.item.name) }} ×{{ formatNumber(ingredient.count) }}</span><span
                  v-if="idx < action.ingredients.length - 1">，</span>
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
              <template v-for="(product, idx) in action.products" :key="product.item.id">
                <span>{{ t(product.item.name) }} ×{{ formatNumber(product.count) }}</span><span
                  v-if="idx < action.products.length - 1">，</span>
              </template>
            </template>
            <template v-else>
              {{ t('ui.noRewards') }}
            </template>
          </span>
        </div>
      </div>

      <div class="zone-actions">
        <label class="zone-amount">
          <span class="zone-amount-label">{{ t('ui.amount') }}</span>
          <div class="zone-amount-input">
            <input type="text" v-model="amountString" @focus="handleAmountFocus" />
            <button type="button" class="zone-amount-infinity" :title="t('ui.unlimited')"
              @click="amountString = INFINITE_STRING">
              {{ INFINITE_STRING }}
            </button>
          </div>
        </label>
        <div class="zone-action-buttons">
          <button v-if="hasCurrentAction" type="button" class="zone-button secondary" @click="addAction"
            :disabled="!allowAmount || !canStartAction.canStart">
            {{ t('ui.addToQueue', { position: queuePosition }) }}
          </button>
          <button type="button" class="zone-button primary" @click="hasCurrentAction ? startImmediately() : addAction()"
            :disabled="!allowAmount || !canStartAction.canStart">
            {{ hasCurrentAction ? t('ui.startImmediately') : t('start') }}
          </button>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';

.zone-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
  min-width: min(460px, 100%);
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-lg;
}

.zone-header-text {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.zone-overline {
  text-transform: uppercase;
  font-size: $font-sm;
  letter-spacing: 0.08em;
  color: #6b7280;
}

.zone-title {
  margin: 0;
  font-size: $font-5xl;
  line-height: 1.2;
}

.zone-description {
  margin: 0;
  color: $text-tertiary;
  line-height: 1.5;
}

.zone-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: $text-tertiary;
  border-radius: $radius-full;
  width: $modal-close-button-size;
  height: $modal-close-button-size;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: $font-4xl;
  line-height: 1;

  &:hover {
    background: rgba(71, 85, 105, 0.22);
    color: #1f2937;
  }
}

.zone-info-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.zone-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.zone-amount {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.zone-amount-label {
  font-size: $font-base;
  font-weight: $font-weight-semibold;
  color: #1f2937;
}

.zone-amount-input {
  display: flex;
  gap: $spacing-md;

  input {
    flex: 1;
    border: 1px solid #cbd5f5;
    border-radius: $radius-sm;
    padding: $spacing-lg $spacing-xl;
    font-size: $font-md;
    color: $text-primary;

    &:focus {
      outline: none;
      border-color: $primary-light;
      box-shadow: 0 0 0 3px $primary-rgba-18;
    }
  }
}

.zone-amount-infinity {
  border: none;
  border-radius: $radius-sm;
  background: #e2e8f0;
  color: $text-primary;
  padding: 0 $spacing-2xl;
  cursor: pointer;
  font-size: $font-xl;

  &:hover {
    background: #cbd5f5;
  }
}

@media (max-width: 540px) {
  .zone-modal {
    min-width: unset;
  }

  .info-row {
    gap: $spacing-md;
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
