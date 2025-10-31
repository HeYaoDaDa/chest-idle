import { shallowRef, computed, type ComputedRef } from 'vue'
import type { Equipment } from '@/models/item/Equipment'
import type { InventoryItem } from '@/models/inventory/InventoryItem'
import type { Slot } from '@/models/Slot'
import { useInventoryStore } from '@/stores/inventory'

/**
 * 装备和背包管理的公用 Composable
 * 处理装备选择、背包物品选择和开箱功能
 */
export function useEquipmentAndInventory() {
  const inventoryStore = useInventoryStore()

  // ============ 状态管理 ============
  const selectedEquipment = shallowRef<{ slot: Slot; equipment: Equipment } | null>(null)
  const selectedInventoryItem = shallowRef<InventoryItem | null>(null)
  const chestOpenAmount = shallowRef<number>(1)
  const chestOpenResults = shallowRef<{ itemName: string; amount: number }[] | null>(null)
  const activeTab = shallowRef<'inventory' | 'equipment' | 'abilities'>('inventory')

  // ============ 计算属性 ============
  const maxChestAmount: ComputedRef<number> = computed(() => {
    return selectedInventoryItem.value?.quantity || 1
  })

  const isValidChestAmount: ComputedRef<boolean> = computed(() => {
    const amount = chestOpenAmount.value
    return amount >= 1 && amount <= maxChestAmount.value && Number.isInteger(amount)
  })

  // ============ 装备模态框函数 ============
  /**
   * 打开装备编辑模态框
   */
  function openEquipmentModal(slot: Slot, equipment: Equipment): void {
    selectedEquipment.value = { slot, equipment }
  }

  /**
   * 关闭装备编辑模态框
   */
  function closeEquipmentModal(): void {
    selectedEquipment.value = null
  }

  /**
   * 卸下装备并关闭模态框
   */
  function unequipAndClose(): void {
    if (selectedEquipment.value) {
      selectedEquipment.value.slot.unEquip()
      closeEquipmentModal()
    }
  }

  // ============ 背包物品模态框函数 ============
  /**
   * 打开背包物品编辑模态框
   */
  function openInventoryModal(item: InventoryItem): void {
    selectedInventoryItem.value = item
    chestOpenAmount.value = 1
    chestOpenResults.value = null // 清空之前的开箱结果
  }

  /**
   * 关闭背包物品编辑模态框
   */
  function closeInventoryModal(): void {
    selectedInventoryItem.value = null
    // 不要在这里清空开箱结果，让结果模态框单独管理
  }

  /**
   * 装备物品并关闭模态框
   */
  function equipAndClose(): void {
    if (selectedInventoryItem.value) {
      selectedInventoryItem.value.equip()
      closeInventoryModal()
    }
  }

  /**
   * 设置开箱数量为最大值
   */
  function setMaxChestAmount(): void {
    chestOpenAmount.value = maxChestAmount.value
  }

  // ============ 开箱函数 ============
  /**
   * 打开宝箱并记录获得的物品
   */
  function openChestAndClose(): void {
    if (selectedInventoryItem.value && isValidChestAmount.value) {
      const chest = selectedInventoryItem.value
      const chestId = chest.item.id
      const results = new Map<string, number>()

      // 记录开箱前的库存
      const inventoryBefore = new Map<string, number>()
      inventoryStore.inventoryItems.forEach((item: InventoryItem) => {
        inventoryBefore.set(item.item.id, item.quantity)
      })

      // 批量开箱
      for (let i = 0; i < chestOpenAmount.value; i++) {
        chest.openChest()
      }

      // 计算新增的物品（排除宝箱本身）
  inventoryStore.inventoryItems.forEach((item: InventoryItem) => {
        // 跳过宝箱本身
        if (item.item.id === chestId) return

        const beforeAmount = inventoryBefore.get(item.item.id) || 0
  const afterAmount = item.quantity
        const gained = afterAmount - beforeAmount
        if (gained > 0) {
          results.set(item.item.name, gained)
        }
      })

      // 转换为显示格式
      const resultArray = Array.from(results.entries()).map(([itemName, amount]) => ({
        itemName,
        amount,
      }))

      // 设置开箱结果（即使是空数组也要显示）
      chestOpenResults.value = resultArray
      closeInventoryModal()
    }
  }

  /**
   * 关闭开箱结果模态框
   */
  function closeChestResults(): void {
    chestOpenResults.value = null
  }

  // ============ 返回公共接口 ============
  return {
    // 状态
    selectedEquipment,
    selectedInventoryItem,
    chestOpenAmount,
    chestOpenResults,
    activeTab,

    // 计算属性
    maxChestAmount,
    isValidChestAmount,

    // 装备函数
    openEquipmentModal,
    closeEquipmentModal,
    unequipAndClose,

    // 背包函数
    openInventoryModal,
    closeInventoryModal,
    equipAndClose,
    setMaxChestAmount,

    // 开箱函数
    openChestAndClose,
    closeChestResults,
  }
}
