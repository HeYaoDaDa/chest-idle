import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export type NotificationType = 'info' | 'warning' | 'error'

export interface NotificationEntry {
  id: number
  key: string
  params?: Record<string, unknown>
  type: NotificationType
}

export const useNotificationStore = defineStore('notification', () => {
  let counter = 0
  const notifications = shallowReactive<NotificationEntry[]>([])

  function push(
    key: string,
    params: Record<string, unknown> | undefined = undefined,
    type: NotificationType = 'info',
    duration = 4000,
  ): number {
    const id = ++counter
    notifications.push({ id, key, params, type })

    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => remove(id), duration)
    }

    return id
  }

  function info(key: string, params?: Record<string, unknown>, duration?: number): number {
    return push(key, params, 'info', duration)
  }

  function warning(key: string, params?: Record<string, unknown>, duration?: number): number {
    return push(key, params, 'warning', duration)
  }

  function error(key: string, params?: Record<string, unknown>, duration?: number): number {
    return push(key, params, 'error', duration)
  }

  function remove(id: number): void {
    const index = notifications.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      notifications.splice(index, 1)
    }
  }

  function clear(): void {
    notifications.splice(0, notifications.length)
  }

  return {
    notifications,
    push,
    info,
    warning,
    error,
    remove,
    clear,
  }
})
