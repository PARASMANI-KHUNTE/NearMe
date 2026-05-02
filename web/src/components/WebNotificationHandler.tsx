import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useLocationStore } from '../store/locationStore';

const WEB_NOTIFICATION_KEY = 'web-notification-permission';

export function WebNotificationHandler() {
  const { notifications, muteNotifications } = useNotificationStore();
  const { shareLocation } = useLocationStore();

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(WEB_NOTIFICATION_KEY, permission);
    } catch {
      // Permission request failed
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (muteNotifications) return;
    if (!shareLocation) return;

    const latest = notifications[0];
    if (!latest || latest.type !== 'proximity_alert') return;

    // Prevent duplicate notifications
    const lastShown = localStorage.getItem('last-notification-shown');
    if (lastShown === latest.id) return;

    try {
      const notification = new Notification('NearMe Alert', {
        body: latest.message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: latest.id,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      localStorage.setItem('last-notification-shown', latest.id);
    } catch {
      // Notification creation failed
    }
  }, [notifications, muteNotifications, shareLocation]);

  return null;
}
