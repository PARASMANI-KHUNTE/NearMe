import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useFriendStore } from '../../store/friendStore';
import { useLocationStore } from '../../store/locationStore';
import { useAuthStore } from '../../store/authStore';
import { MapView } from '../../features/map/components/MapView';
import { useMapStore } from '../../features/map/types/mapStore';
import { locationService } from '../../services/locationService';
import { logger } from '../../utils/logger';
import type { FriendZoneData } from '../../types';

const REFRESH_INTERVAL = 60000;

export function MapPage() {
  const { friends } = useFriendStore();
  const { shareLocation, radius } = useLocationStore();
  const { token } = useAuthStore();
  const { setNearbyFriends, userLocation } = useMapStore();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);

  const nearbyFriendsList = friends.filter((f) => f.status === 'nearby');

  const fetchNearbyUsers = useCallback(async () => {
    if (!token || !shareLocation || !userLocation) {
      setNearbyFriends([]);
      setNearbyCount(0);
      return;
    }
    try {
      setIsRefreshing(true);
      const { lat, lng } = userLocation;
      const users = await locationService.getNearbyUsers({
        latitude: lat,
        longitude: lng,
        radius,
      });
      const mapped: FriendZoneData[] = users.map((u) => ({
        id: u.id,
        name: u.name,
        approximateLocation: { lat: u.latitude ?? lat, lng: u.longitude ?? lng },
        distance: u.distance,
      }));
      setNearbyFriends(mapped);
      setNearbyCount(mapped.length);
    } catch (err) {
      logger.error('Failed to fetch nearby users:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [token, shareLocation, radius, userLocation, setNearbyFriends]);

  useEffect(() => {
    fetchNearbyUsers();
    const interval = setInterval(fetchNearbyUsers, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNearbyUsers]);

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Map</h1>
          <p className="text-[var(--text-muted)] text-sm">Real-time proximity visualization</p>
        </div>
        <div className="flex items-center gap-3">
          {nearbyCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-sm font-semibold text-[var(--primary)]">
              <Users className="w-3.5 h-3.5" />
              {nearbyCount} nearby
            </div>
          )}
          <Button
            variant="glass"
            size="sm"
            onClick={fetchNearbyUsers}
            isLoading={isRefreshing}
            className="rounded-full"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-[280px] md:min-h-[420px] rounded-xl overflow-hidden">
          <MapView height="100%" />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                Nearby ({nearbyFriendsList.length})
              </h2>
            </div>

            {nearbyFriendsList.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                <p className="text-4xl mb-2">👥</p>
                <p className="text-sm">No friends nearby</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyFriendsList.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedFriendId === friend.id
                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20'
                        : 'bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                      <span className="text-[var(--text)] font-medium">{friend.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedFriendId === friend.id ? 'primary' : 'secondary'}
                      onClick={() => setSelectedFriendId(friend.id)}
                    >
                      Route
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {selectedFriendId && (
            <Card variant="glass" className="p-4 text-center">
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Meetup confirmation required for routing
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setSelectedFriendId(null)}
              >
                Clear Selection
              </Button>
            </Card>
          )}

          <p className="text-xs text-[var(--text-muted)] text-center">
            🔒 Exact locations are never shown
          </p>
        </div>
      </div>
    </div>
  );
}
