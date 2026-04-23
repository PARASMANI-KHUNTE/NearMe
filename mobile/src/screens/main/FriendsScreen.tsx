import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/Button';

const FriendsScreen = () => {
  const { friends } = useAppStore();
  const [search, setSearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const renderFriend = ({ item }: any) => (
    <View style={styles.friendRow}>
      <View style={styles.friendNameWrap}>
        <Ionicons name="person-circle-outline" size={24} color={theme.colors.accent} />
        <Text style={styles.friendName}>{item.name}</Text>
      </View>
      <Text style={[styles.status, item.status === 'nearby' ? styles.nearby : styles.offline]}>
        {item.status.toUpperCase()}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <Text style={styles.header}>Friends</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.accent} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={theme.colors.border}
          value={search}
          onChangeText={setSearch}
        />
        <Button title="Add" onPress={() => {}} style={styles.addButton} />
      </View>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderFriend}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No friends added yet.</Text>
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingLeft: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  addButton: {
    width: 80,
    paddingVertical: theme.spacing.sm,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  friendNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  friendName: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text,
    marginLeft: 8,
  },
  status: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
  },
  nearby: {
    color: theme.colors.secondary,
  },
  offline: {
    color: theme.colors.border,
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

export default FriendsScreen;
