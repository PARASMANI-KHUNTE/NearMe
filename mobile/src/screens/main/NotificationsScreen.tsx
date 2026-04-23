import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

const NotificationsScreen = () => {
  const { notifications, setNotifications } = useAppStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.notification, item.read ? styles.read : styles.unread]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.messageRow}>
        <Ionicons
          name={item.read ? 'mail-open-outline' : 'notifications-outline'}
          size={18}
          color={item.read ? theme.colors.border : theme.colors.accent}
        />
        <Text style={[styles.message, !item.read && styles.boldMessage]}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No new notifications.</Text>
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
  header: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  notification: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  read: {
    opacity: 0.7,
  },
  message: {
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boldMessage: {
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.text,
    opacity: 0.6,
  }
});

export default NotificationsScreen;
