import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationService } from '../../services/notificationService';

export function NotificationsPage() {
  const { notifications, markAsRead, setNotifications } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await notificationService.getNotifications();
        if (isMounted) {
          setNotifications(data);
        }
      } catch {
        if (isMounted) {
          setLoadError('Could not load notifications.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [setNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Notifications</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Real-time alerts and updates</p>
        </div>
        
        {unreadNotifications.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {loadError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <Card className="py-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">Loading notifications...</p>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No notifications yet</h3>
          <p className="text-[var(--text-muted)] text-sm">
            You'll be notified when friends are nearby or send requests.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-4">
                New ({unreadNotifications.length})
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    variant="glass"
                    className="p-4 cursor-pointer hover:opacity-90"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                        {notification.type === 'proximity_alert' ? (
                          <span>📍</span>
                        ) : (
                          <span>👋</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[var(--text)] font-medium">{notification.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-4">
                Earlier ({readNotifications.length})
              </h2>
              <div className="space-y-2">
                {readNotifications.map((notification) => (
                  <Card key={notification.id} className="p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center">
                        <span>📍</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text)]">{notification.message}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
