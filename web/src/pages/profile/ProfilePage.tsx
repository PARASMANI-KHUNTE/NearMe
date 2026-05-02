import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { socketService } from '../../services/socketService';
import { authService } from '../../services/authService';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { shareLocation, radius, invisibleMode, setShareLocation, setRadius, setInvisibleMode } = useLocationStore();
  const { muteNotifications, setMuteNotifications } = useNotificationStore();
  const [uniqueId, setUniqueId] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchShareProfile = async () => {
      try {
        const response = await api.get('/api/users/share');
        if (response.data.data?.uniqueId) {
          setUniqueId(response.data.data.uniqueId);
        }
      } catch (error) {
        logger.error('Failed to fetch share profile:', error);
      }
    };
    fetchShareProfile();
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(uniqueId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = () => {
    const shareData = {
      title: 'Add me on NearMe',
      text: `Add me on NearMe using my ID: ${uniqueId}`,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      handleCopyId();
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">Profile</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your account and settings</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="glass" className="text-center p-6">
            <div className="relative inline-block">
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f59e0b&color=fff&size=128`}
                alt={user?.name || 'User profile'}
                className="w-24 h-24 rounded-2xl mx-auto object-cover ring-4 ring-[var(--primary)]/20"
                onError={(e) => {
                  // If the image fails to load (e.g., Google picture URL broken), fallback to avatar
                  const target = e.currentTarget;
                  if (!target.src.includes('ui-avatars.com')) {
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f59e0b&color=fff&size=128`;
                  }
                }}
              />
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-[var(--text)]">{user?.name}</h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">{user?.email}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Your NearMe ID</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-mono font-bold text-[var(--primary)] tracking-widest">{uniqueId}</span>
                <button onClick={handleCopyId} className="p-1 hover:opacity-70 transition-opacity">
                  {isCopied ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">Share this ID to add friends</p>
            </div>
          </Card>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleShare}
            disabled={!uniqueId}
          >
            Share NearMe ID
          </Button>

          <Button
            variant="glass"
            className="w-full text-error hover:bg-error/10"
            onClick={handleLogout}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Button>
        </div>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Settings</h2>

            <div className="space-y-6">
              <Toggle
                label="Share My Location"
                description="Allow friends to see when you're nearby"
                checked={shareLocation}
                onChange={setShareLocation}
              />

              <Toggle
                label="Invisible Mode"
                description="Hide your presence completely while still tracking others"
                checked={invisibleMode}
                onChange={setInvisibleMode}
              />

              <Toggle
                label="Mute Notifications"
                description="Disable sound alerts for proximity alerts"
                checked={muteNotifications}
                onChange={setMuteNotifications}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[var(--text)] font-medium">Detection Radius</p>
                  <span className="text-[var(--primary)] font-semibold">
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
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((radius - 1) / 4999) * 100}%, var(--surface) ${((radius - 1) / 4999) * 100}%, var(--surface) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>1m</span>
                  <span>5km</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Email</span>
                <span className="text-[var(--text)]">{user?.email}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
