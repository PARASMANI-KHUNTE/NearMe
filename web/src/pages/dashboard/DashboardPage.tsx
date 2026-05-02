import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  MapPin,
  Shield,
  Zap,
  RefreshCcw,
  Clock,
  ChevronRight,
  UserPlus,
  Send,
  Settings
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { useLocationStore } from '../../store/locationStore';
import { useFriendStore } from '../../store/friendStore';
import { useLocationTracker } from '../../hooks/useLocationTracker';

export function DashboardPage() {
  const navigate = useNavigate();
  const { shareLocation, radius, preciseSharing, invisibleMode, setShareLocation, setRadius, setPreciseSharing, setInvisibleMode } = useLocationStore();
  const { friends } = useFriendStore();
  const { loading, error, isTracking, lastUpdate, refresh } = useLocationTracker();

  const nearbyFriends = friends.filter((f) => f.status === 'nearby');

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-8">
      {/* Hero Status Section */}
      <section className="flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-base md:text-lg">Manage your proximity presence and connections.</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="glass"
            size="sm"
            onClick={refresh}
            isLoading={loading}
            className="rounded-full"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <div className={`flex items-center gap-2 px-6 py-3 rounded-full glass border-none font-bold text-sm ${isTracking ? 'text-primary' : 'text-[var(--text-muted)]'
            }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-primary animate-pulse' : 'bg-[var(--border)]'}`} />
            {isTracking ? 'LIVE TRACKING' : 'IDLE'}
          </div>
        </div>
      </section>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-[2rem] bg-error/10 border border-error/20 text-error flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6" />
            <p className="font-medium">{error}</p>
          </div>
          <Button variant="danger" size="sm" onClick={refresh}>Retry</Button>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Stats & Controls */}
        <div className="lg:col-span-7 space-y-8">

          {/* Proximity Card */}
          <Card variant="glass" className="p-6 md:p-10 border-none relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs mb-2">Network Status</p>
              <h2 className="text-5xl md:text-6xl font-black text-primary mb-4 leading-none">{nearbyFriends.length}</h2>
              <p className="text-xl font-bold mb-6 text-[var(--text)]">Friends Nearby Right Now</p>

              <div className="flex items-center gap-4 text-sm bg-white/5 rounded-2xl p-4 inline-flex">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-[var(--text-muted)]">
                  {lastUpdate ? `Last updated ${lastUpdate.toLocaleTimeString()}` : 'No updates received yet'}
                </span>
              </div>
            </div>
          </Card>

          {/* Settings Card */}
          <Card className="p-6 md:p-10 border-[var(--border)]">
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Privacy Controls</h2>
            </div>

            <div className="space-y-10">
              <Toggle
                label="Proximity Broadcasting"
                description="When enabled, you'll be discoverable to mutual friends nearby."
                checked={shareLocation}
                onChange={setShareLocation}
              />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">Detection Range</p>
                    <p className="text-sm text-[var(--text-muted)]">Set the radius for proximity alerts.</p>
                  </div>
                  <span className="text-2xl font-black text-primary">
                    {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="5000"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-3 bg-[var(--surface-hover)] rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <span>1m</span>
                  <span>5km</span>
                </div>
              </div>

              <Toggle
                label="High Precision Mode"
                description="Increase accuracy temporarily for active meetups."
                checked={preciseSharing}
                onChange={setPreciseSharing}
                disabled={!shareLocation}
              />

              <Toggle
                label="Invisible Mode"
                description="Hide your presence completely while still tracking others."
                checked={invisibleMode}
                onChange={setInvisibleMode}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Friends & Activity */}
        <div className="lg:col-span-5 space-y-8">

          <Card className="p-8 border-[var(--border)] h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Nearby Circle
              </h2>
              <Link to="/friends" className="text-xs font-bold text-primary hover:underline">VIEW ALL</Link>
            </div>

            <div className="space-y-4">
                {nearbyFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4 rounded-3xl bg-surface-hover/30">
                  <MapPin className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
                  <p className="text-[var(--text-muted)] font-medium">No one is currently <br />in your radius.</p>
                </div>
              ) : (
                nearbyFriends.map((friend) => (
                  <motion.div
                    layout
                    key={friend.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover/30 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={friend.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Friend')}&background=random`}
                          alt={friend.name || 'Friend'}
                          className="w-12 h-12 rounded-xl object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('ui-avatars.com')) {
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Friend')}&background=random`;
                            }
                          }}
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[var(--surface)]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{friend.name}</p>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-tighter">Nearby</p>
                      </div>
                    </div>
                    <Button variant="glass" size="sm" className="rounded-xl w-10 h-10 p-0" onClick={() => navigate('/map')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="rounded-2xl py-6 flex flex-col gap-2" onClick={() => navigate('/friends')}>
                  <UserPlus className="w-5 h-5" />
                  <span className="text-xs">Invite</span>
                </Button>
                <Button variant="secondary" className="rounded-2xl py-6 flex flex-col gap-2" onClick={refresh} isLoading={loading}>
                  <Send className="w-5 h-5" />
                  <span className="text-xs">Broadcast</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
