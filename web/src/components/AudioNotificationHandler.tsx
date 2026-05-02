import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { logger } from '../utils/logger';

export function AudioNotificationHandler() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { notifications, muteNotifications } = useNotificationStore();

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const latestNotification = notifications[0];
    if (latestNotification?.type === 'proximity_alert' && audioRef.current && !muteNotifications) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        logger.info('Audio play failed (user interaction required):', err);
      });
    }
  }, [notifications, muteNotifications]);

  return null;
}
