import { defineStore } from "pinia";
import { shallowReactive } from "vue";

export const useNotificationStore = defineStore('notification', () => {
  const notifications = shallowReactive([] as Notification[]);

  function notification(type: 'info' | 'warn', text: string) {
    notifications.unshift(new Notification(type, text, setTimeout(() => notifications.pop(), 5000)));
  }

  function closeNotification(index: number) {
    notifications[index].cancel();
    notifications.splice(index, 1);
  }

  return {
    notifications,

    notification,
    closeNotification
  }
});

export class Notification {
  constructor(
    public type: 'info' | 'warn',
    public content: string,
    public timeoutId: number,
  ) { }

  cancel() {
    clearTimeout(this.timeoutId);
  }
}
