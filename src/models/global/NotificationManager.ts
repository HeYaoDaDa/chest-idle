import { shallowReactive } from 'vue'

export type NotificationType = 'info' | 'warning' | 'error'

export interface NotificationEntry {
  id: number
  key: string
  params?: Record<string, unknown>
  type: NotificationType
}

class NotificationManager {
  private counter = 0
  public readonly notifications = shallowReactive<NotificationEntry[]>([])

  push(
    key: string,
    params: Record<string, unknown> | undefined = undefined,
    type: NotificationType = 'info',
    duration = 4000,
  ): number {
    const id = ++this.counter
    this.notifications.push({ id, key, params, type })

    if (duration > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.remove(id), duration)
    }

    return id
  }

  info(key: string, params?: Record<string, unknown>, duration?: number): number {
    return this.push(key, params, 'info', duration)
  }

  warning(key: string, params?: Record<string, unknown>, duration?: number): number {
    return this.push(key, params, 'warning', duration)
  }

  error(key: string, params?: Record<string, unknown>, duration?: number): number {
    return this.push(key, params, 'error', duration)
  }

  remove(id: number): void {
    const index = this.notifications.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      this.notifications.splice(index, 1)
    }
  }

  clear(): void {
    this.notifications.splice(0, this.notifications.length)
  }
}

export const notificationManager = new NotificationManager()
