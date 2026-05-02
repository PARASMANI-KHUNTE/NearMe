import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../../components/Button';
import { FriendService, FriendRequest, FriendRequestUser } from '../../services/friendService';
import { UserService } from '../../services/userService';
import { User } from '../../services/authService';
import { socketService } from '../../services/socketService';
import { logger } from '../../utils/logger';
import { useAuthStore } from '../../store/authStore';

type TabType = 'friends' | 'requests' | 'search';

interface FriendWithStatus extends User {
  status?: 'nearby' | 'offline';
}

const FriendsScreen = () => {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [proximityConsent, setProximityConsent] = useState<Record<string, boolean>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadFriends = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [data, statuses] = await Promise.all([
        FriendService.getFriends(),
        FriendService.getFriendsStatuses().catch(() => []),
      ]);
      const statusMap = new Map(statuses.map((entry) => [entry.id, entry.status]));
      setFriends(data.map((friend) => ({
        ...friend,
        status: statusMap.get(friend.id || friend._id || '') || 'offline',
      })));
      // Clear failed images when friends list refreshes
      setFailedImages(new Set());
    } catch (err: any) {
      logger.error('Load friends error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadPendingRequests = useCallback(async () => {
    if (!token) return;
    try {
      const data = await FriendService.getPendingRequests();
      setPendingRequests(data);
      // Clear failed images for request avatars
      setFailedImages(new Set());
    } catch (err: any) {
      logger.error('Load pending requests error:', err);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setRefreshing(false);
  }, [loadFriends, loadPendingRequests]);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, [loadFriends, loadPendingRequests]);

  // Real-time friend request notifications via socket
  useEffect(() => {
    if (!token) return;
    const handleFriendRequest = () => {
      loadPendingRequests();
    };
    socketService.subscribe('friend_request', handleFriendRequest);
    return () => {
      socketService.unsubscribe('friend_request', handleFriendRequest);
    };
  }, [token, loadPendingRequests]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    try {
      setIsSearching(true);
      const results = await UserService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err: any) {
      Alert.alert('Search Error', err.message || 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSendRequest = async (userId: string) => {
    try {
      setActionLoading(userId);
      await FriendService.sendRequest(userId);
      Alert.alert('Success', 'Friend request sent!');
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await FriendService.acceptRequest(requestId);
      await Promise.all([loadFriends(), loadPendingRequests()]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await FriendService.rejectRequest(requestId);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleProximity = async (friendId: string) => {
    const current = proximityConsent[friendId] ?? true;
    const next = !current;
    setProximityConsent(prev => ({ ...prev, [friendId]: next }));
    try {
      const { api } = await import('../../services/api');
      await api.patch(`/friends/${friendId}/proximity`, { enabled: next });
    } catch {
      setProximityConsent(prev => ({ ...prev, [friendId]: current }));
      Alert.alert('Error', 'Failed to update proximity setting');
    }
  };

  const renderAvatar = (name: string, picture?: string) => {
    if (picture && !failedImages.has(picture)) {
      return (
        <Image
          source={{ uri: picture }}
          style={styles.avatarImg}
          onError={() => {
            setFailedImages(prev => new Set([...prev, picture]));
          }}
        />
      );
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarLetter}>{name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
    );
  };

  const renderFriend = ({ item }: { item: FriendWithStatus }) => {
    const hasProximity = proximityConsent[item.id || item._id || ''] ?? true;
    return (
    <View style={styles.friendRow}>
      {renderAvatar(item.name, item.picture)}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.proximityBtn, hasProximity ? styles.proximityBtnOn : styles.proximityBtnOff]}
        onPress={() => handleToggleProximity(item.id || item._id || '')}
      >
        <Ionicons
          name={hasProximity ? 'location-outline' : 'ban-outline'}
          size={16}
          color={hasProximity ? theme.colors.secondary : theme.colors.border}
        />
      </TouchableOpacity>
      <View style={[styles.statusDot, item.status === 'nearby' ? styles.dotNearby : styles.dotOffline]}>
        <Text style={[styles.statusText, item.status === 'nearby' ? styles.textNearby : styles.textOffline]}>
          {item.status?.toUpperCase() || 'OFFLINE'}
        </Text>
      </View>
    </View>
    );
  };

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestRow}>
      <View style={styles.requestInfo}>
        {renderAvatar(
          typeof item.requesterId === 'string' ? 'User' : item.requesterId.name,
          typeof item.requesterId === 'string' ? undefined : item.requesterId.picture
        )}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.friendName}>
            {typeof item.requesterId === 'string' ? 'Friend Request' : item.requesterId.name}
          </Text>
          <Text style={styles.friendEmail} numberOfLines={1}>
            {typeof item.requesterId === 'string'
              ? item.requesterId
              : item.requesterId.uniqueId || 'Sent you a friend request'}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.acceptBtn]}
          onPress={() => handleAcceptRequest(item._id)}
          disabled={actionLoading === item._id}
        >
          {actionLoading === item._id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleRejectRequest(item._id)}
          disabled={actionLoading === item._id}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: User }) => (
    <View style={styles.friendRow}>
      {renderAvatar(item.name, item.picture)}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => handleSendRequest(item.id)}
        disabled={actionLoading === item.id}
      >
        {actionLoading === item.id ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : (
          <Ionicons name="person-add-outline" size={20} color={theme.colors.accent} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.header}>Friends</Text>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['friends', 'requests', 'search'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={
                tab === 'friends'
                  ? 'people-outline'
                  : tab === 'requests'
                    ? 'notifications-outline'
                    : 'search-outline'
              }
              size={16}
              color={activeTab === tab ? theme.colors.primary : theme.colors.border}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'requests' && pendingRequests.length > 0
                ? ` (${pendingRequests.length})`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id || item._id || ''}
          renderItem={renderFriend}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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
                  <Ionicons name="people-outline" size={48} color={theme.colors.border} />
                  <Text style={styles.emptyText}>No friends yet</Text>
                  <Text style={styles.emptySubtext}>Search for users to add as friends</Text>
                  <Button
                    title="Find Friends"
                    onPress={() => setActiveTab('search')}
                    style={{ marginTop: 16 }}
                  />
                </>
              )}
            </View>
          }
        />
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <FlatList
          data={pendingRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderRequest}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          }
        />
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={theme.colors.accent} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by NearMe ID..."
              placeholderTextColor={theme.colors.border}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginRight: 12 }} />
            ) : (
              <TouchableOpacity onPress={handleSearch} style={styles.searchBtn} disabled={!searchQuery.trim()}>
                <Text style={[styles.searchBtnText, !searchQuery.trim() && { opacity: 0.4 }]}>Search</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id || item._id || ''}
            renderItem={renderSearchResult}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.colors.border} />
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? 'No users found'
                    : 'Search for people to add'}
                </Text>
              </View>
            }
          />
        </View>
      )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
  },
  tabActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.border,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.typography.body.fontSize,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dotNearby: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  dotOffline: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textNearby: {
    color: theme.colors.secondary,
  },
  textOffline: {
    color: theme.colors.border,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: theme.colors.secondary,
  },
  rejectBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },
  proximityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  proximityBtnOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  proximityBtnOff: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    borderColor: 'rgba(100,116,139,0.3)',
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
  },
  emptySubtext: {
    color: theme.colors.text,
    opacity: 0.4,
    fontSize: theme.typography.small.fontSize,
  },
});

export default FriendsScreen;
