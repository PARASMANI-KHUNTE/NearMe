import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function AudioNotificationHandler() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { notifications } = useNotificationStore();

  useEffect(() => {
    // Initialize audio on mount
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.3; // Low volume for privacy

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Play sound for new proximity alerts
    const latestNotification = notifications[0];
    if (latestNotification?.type === 'proximity_alert' && audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(err => {
        console.log('Audio play failed (user interaction required):', err);
      });
    }
  }, [notifications]);

  return null; // This component doesn't render anything
}