<script setup lang="ts">
import ModalBox from '@/components/misc/ModalBox.vue'
import type { InventoryItem } from '@/models/InventoryItem'
import type { Equipment } from '@/models/item/Equipment'
import type { Slot } from '@/models/Slot'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  show: boolean
  // Equipment Modal props
  equipment?: Equipment
  equipmentSlot?: Slot
  // Inventory Modal props
  inventoryItem?: InventoryItem
}

interface Emits {
  (e: 'close'): void
  (e: 'unequip'): void
  (e: 'equip'): void
  (e: 'openChest', amount: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const chestOpenAmount = ref(1)

// Computed properties
const isEquipmentMode = computed(() => !!props.equipment)
const isInventoryMode = computed(() => !!props.inventoryItem)

const item = computed(() => {
  if (isEquipmentMode.value) return props.equipment!
  if (isInventoryMode.value) return props.inventoryItem!.item
  return null
})

const itemName = computed(() => item.value ? t(item.value.name) : '')
const itemDescription = computed(() => item.value ? t(item.value.description) : '')

const effects = computed(() => {
  if (isEquipmentMode.value) return props.equipment!.effects
  if (isInventoryMode.value && props.inventoryItem!.item.isEquipment()) {
    return props.inventoryItem!.item.effects
  }
  return []
})

const slotInfo = computed(() => {
  if (isEquipmentMode.value) return props.equipmentSlot
  if (isInventoryMode.value && props.inventoryItem!.item.isEquipment()) {
    return props.inventoryItem!.item.slot
  }
  return null
})

const quantity = computed(() => {
  if (isInventoryMode.value) return props.inventoryItem!.quantity
  return 0
})

const isChest = computed(() => {
  return isInventoryMode.value && props.inventoryItem!.item.isChest()
})

const maxChestAmount = computed(() => {
  if (isChest.value) return props.inventoryItem!.quantity
  return 1
})

const isValidChestAmount = computed(() => {
  return chestOpenAmount.value >= 1 && chestOpenAmount.value <= maxChestAmount.value
})

// Actions
function close() {
  emit('close')
}

function unequip() {
  emit('unequip')
}

function equip() {
  emit('equip')
}

function setMaxChestAmount() {
  chestOpenAmount.value = maxChestAmount.value
}

function openChest() {
  if (isValidChestAmount.value) {
    emit('openChest', chestOpenAmount.value)
  }
}

// 监听 Modal 打开/关闭，重置开箱数量
watch(() => props.show, (newShow) => {
  if (newShow && isChest.value) {
    // Modal 打开时，重置为 1 或当前最大值（如果只有 1 个）
    chestOpenAmount.value = Math.min(1, maxChestAmount.value)
  }
})
</script>

<template>
  <ModalBox v-if="show" @close="close">
    <div class="item-modal">
      <div class="item-modal-header">
        <h3 class="item-modal-title">{{ itemName }}</h3>
        <span v-if="isEquipmentMode && slotInfo" class="item-modal-type">
          {{ t('ui.type') }}: {{ t(slotInfo.name) }}
        </span>
        <span v-if="isInventoryMode" class="item-modal-quantity">
          {{ t('ui.quantity') }}: {{ quantity }}
        </span>
      </div>

      <div class="item-modal-content">
        <p class="item-modal-description">{{ itemDescription }}</p>

        <div v-if="isInventoryMode && slotInfo" class="item-modal-section">
          <div class="item-modal-info-row">
            <span class="info-label">{{ t('ui.slot') }}</span>
            <span class="info-value">{{ t(slotInfo.name) }}</span>
          </div>
        </div>

        <div v-if="effects.length > 0" class="item-modal-section">
          <h4 class="item-modal-section-title">{{ t('ui.effects') }}</h4>
          <div class="item-modal-effects">
            <div v-for="(effect, index) in effects" :key="index" class="item-modal-effect">
              <span class="effect-state">{{ t(`property.${effect.property}.name`) }}</span>
              <span class="effect-value">
                {{ effect.type === 'flat' ? '+' : effect.type === 'percentage' ? '+' : '-' }}{{ effect.value }}{{
                  effect.type === 'percentage' || effect.type === 'inversePercentage' ? '%' : ''
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="item-modal-footer">
        <div class="zone-action-buttons">
          <!-- Equipment mode: Unequip button -->
          <button v-if="isEquipmentMode" type="button" class="zone-button ghost" @click="unequip">
            {{ t('ui.unequip') }}
          </button>

          <!-- Inventory mode: Equip or Open chest -->
          <template v-if="isInventoryMode">
            <button v-if="inventoryItem!.item.isEquipment()" type="button" class="zone-button primary" @click="equip">
              {{ t('ui.equip') }}
            </button>

            <div v-if="isChest" class="chest-controls">
              <div v-if="maxChestAmount > 1" class="chest-amount-controls">
                <input v-model.number="chestOpenAmount" type="number" :min="1" :max="maxChestAmount"
                  class="chest-amount-input" :placeholder="String(maxChestAmount)" />
                <button type="button" class="zone-button ghost max-button" @click="setMaxChestAmount">
                  Max
                </button>
              </div>
              <button type="button" class="zone-button primary" @click="openChest" :disabled="!isValidChestAmount">
                {{ t('ui.open') }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </ModalBox>
</template>

<style lang="scss" scoped>
@use '@/styles/shared-components';
</style>
