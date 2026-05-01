import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Notification } from '../../services/notificationService';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const NotificationsScreen = () => {
  const { token } = useAuthStore();
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    unreadCount 
  } = useNotificationStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications, token]);

  const onRefresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'proximity_alert': return 'location-outline';
      case 'friend_request': return 'person-add-outline';
      case 'meet_request': return 'hand-left-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'proximity_alert': return theme.colors.accent;
      case 'friend_request': return theme.colors.secondary;
      case 'meet_request': return theme.colors.primary;
      default: return theme.colors.text;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notification, item.read ? styles.read : styles.unread]}
      onPress={() => !item.read && markAsRead(item._id)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBadge, { backgroundColor: `${getNotificationColor(item.type)}20` }]}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={20}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.message, !item.read && styles.boldMessage]}>{item.content}</Text>
        <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Ionicons name="notifications" size={14} color={theme.colors.primary} />
          <Text style={styles.badgeText}>{unreadCount} unread</Text>
        </View>
      )}

      <FlatList
        data={notifications as any}
        keyExtractor={item => item._id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.accent} />
            ) : (
              <>
                <Ionicons name="notifications-off-outline" size={56} color={theme.colors.border} />
                <Text style={styles.emptyText}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  You'll be notified when friends are nearby or send you requests
                </Text>
              </>
            )}
          </View>
        }
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  header: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(79,70,229,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.3)',
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.md,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    backgroundColor: 'rgba(79,70,229,0.08)',
  },
  read: {
    opacity: 0.65,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  boldMessage: {
    fontWeight: 'bold',
  },
  timeText: {
    color: theme.colors.text,
    opacity: 0.45,
    fontSize: theme.typography.small.fontSize,
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: theme.spacing.xl * 2,
    gap: 8,
  },
  emptyText: {
    color: theme.colors.text,
    opacity: 0.7,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    color: theme.colors.text,
    opacity: 0.4,
    fontSize: theme.typography.small.fontSize,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default NotificationsScreen;
