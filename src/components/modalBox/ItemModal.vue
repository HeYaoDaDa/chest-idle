<script setup lang="ts">
import ModalBox from '@/components/ModalBox.vue'
import { slotConfigMap } from '@/gameConfig'
import { useInventoryStore } from '@/stores/inventory'
import { useEquippedItemStore } from '@/stores/equippedItem'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  show: boolean
  itemId: string
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
const inventoryItem = computed(() => {
  return useInventoryStore().getInventoryItem(props.itemId)
})

// Computed properties
const equippedItemStore = useEquippedItemStore()

// 判断该物品当前是否处于"已装备"状态（被任一槽位引用）
const isEquipped = computed(() => {
  for (const slotId in equippedItemStore.equippedItems) {
    if (equippedItemStore.equippedItems[slotId] === props.itemId) return true
  }
  return false
})

// 处于装备槽时展示卸下；处于库存时展示数量/装备/开箱等
const isEquipmentMode = computed(() => isEquipped.value)
const isInventoryMode = computed(() => !isEquipped.value)

const item = computed(() => inventoryItem.value?.item)

const itemName = computed(() => item.value ? t(item.value.name) : '')
const itemDescription = computed(() => item.value ? t(item.value.description) : '')

const slotInfo = computed(() => item.value?.equipment ? slotConfigMap[item.value.equipment.slotId] : undefined)

const quantity = computed(() => (isInventoryMode.value ? (inventoryItem.value?.count ?? 0) : 0))

const isChest = computed(() => isInventoryMode.value && !!inventoryItem.value?.item.chest)

const maxChestAmount = computed(() => (isChest.value ? (inventoryItem.value?.count ?? 1) : 1))

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
      </div>

      <div class="item-modal-footer">
        <div class="zone-action-buttons">
          <!-- Equipment mode: Unequip button -->
          <button v-if="isEquipmentMode" type="button" class="zone-button ghost" @click="unequip">
            {{ t('ui.unequip') }}
          </button>

          <!-- Inventory mode: Equip or Open chest -->
          <template v-if="isInventoryMode">
            <button v-if="inventoryItem!.item.equipment" type="button" class="zone-button primary" @click="equip">
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
