import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useFriendStore } from '../../store/friendStore';
import { MapView } from '../../features/map/components/MapView';

export function MapPage() {
  const { friends } = useFriendStore();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const nearbyFriendsList = friends.filter((f) => f.status === 'nearby');

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Map</h1>
          <p className="text-[var(--text-muted)] text-sm">Real-time proximity visualization</p>
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
