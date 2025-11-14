import { defineComponent, computed, ref, shallowRef, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'

import ActionModalBox from '@/components/modalBox/ActionModalBox'
import { actionConfigListBySkill, getSkillTabActionConfigsMapBySkillId } from '@/gameConfig'
import { useSkillStore } from '@/stores/skill'

export default defineComponent({
  name: 'SkillPage',
  setup() {
    const { t, locale } = useI18n()
    const route = useRoute()
    const skillId = ref(route.params.id as string)

    onBeforeRouteUpdate(async (to) => {
      skillId.value = to.params.id as string
    })

    const skillStore = useSkillStore()
    const skill = computed(() => skillStore.getSkill(skillId.value))

    const skillActionTabs = computed(() => getSkillTabActionConfigsMapBySkillId(skillId.value))
    const hasTabGroups = computed(() => Object.keys(skillActionTabs.value).length > 0)
    const currentTab = ref<string>('')
    const availableTabs = computed(() => Array.from(Object.keys(skillActionTabs.value)))

    watchEffect(() => {
      if (hasTabGroups.value && availableTabs.value.length > 0) {
        if (!currentTab.value || !availableTabs.value.includes(currentTab.value)) {
          currentTab.value = availableTabs.value[0]
        }
      }
    })

    const displayedActions = computed(() => {
      if (!hasTabGroups.value) {
        return actionConfigListBySkill[skillId.value]
      }
      return skillActionTabs.value[currentTab.value] || []
    })

    const tabEntries = computed(() =>
      availableTabs.value.map((tab) => ({
        id: tab,
        label: t(`action.${tab}.name`),
      })),
    )

    const modalVisible = ref(false)
    const selectedActionId = shallowRef<string | undefined>(undefined)

    const openModal = (actionId: string) => {
      selectedActionId.value = actionId
      modalVisible.value = true
    }

    return () => {
      if (!skill.value) return null

      return (
        <div class="flex flex-col gap-2 p-8">
          <div class="mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
            <div class="flex justify-between items-baseline mb-2">
              <h2 class="text-2xl font-bold text-gray-900">{t(skill.value.name)}</h2>
              <div class="text-sm font-semibold text-blue-700 px-2 py-1 bg-white rounded">
                {t('ui.level', { level: skill.value.level })}
              </div>
            </div>
            <div class="text-gray-700 mb-3">{t(skill.value.description)}</div>
            <div class="flex gap-6 mb-2">
              <div class="flex flex-col">
                <span class="text-xs text-gray-500 uppercase">{t('ui.xp')}</span>
                <span class="text-base font-semibold text-gray-900">
                  {skill.value.xp.toLocaleString(locale.value)}
                </span>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-gray-500 uppercase">{t('ui.nextLevel')}</span>
                <span class="text-base font-semibold text-gray-900">
                  {skill.value.remainingXpForUpgrade.toLocaleString(locale.value)}
                </span>
              </div>
            </div>
            <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-cyan-400 to-primary transition-all"
                style={{ width: skill.value.upgradeProgress * 100 + '%' }}
              ></div>
            </div>
          </div>

          {hasTabGroups.value && (
            <div class="flex gap-1 mb-2 border-b border-gray-200">
              {tabEntries.value.map((tab) => (
                <button
                  key={tab.id}
                  class={`px-4 py-2 font-semibold transition border-b-2 ${
                    currentTab.value === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => (currentTab.value = tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div class="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-0.5">
            {displayedActions.value.map((action) => (
              <div
                key={action.id}
                class="w-16 h-16 rounded bg-white border border-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-center p-2"
                onClick={() => openModal(action.id)}
              >
                <div class="text-xs font-semibold text-gray-900 text-center leading-tight">
                  {t(action.name)}
                </div>
              </div>
            ))}
          </div>

          <ActionModalBox
            modelValue={modalVisible.value}
            onUpdate:modelValue={(val: boolean) => (modalVisible.value = val)}
            actionId={selectedActionId.value}
          />
        </div>
      )
    }
  },
})
