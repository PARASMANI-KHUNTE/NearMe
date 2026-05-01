import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Map as MapIcon, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socketService';
import { authService } from '../services/authService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AudioNotificationHandler } from '../components/AudioNotificationHandler';
import { NearMeLogo } from '../components/branding/NearMeLogo';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
  { path: '/friends', label: 'Friends', icon: <Users className="w-5 h-5" /> },
  { path: '/map', label: 'Map', icon: <MapIcon className="w-5 h-5" /> },
  { path: '/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { path: '/profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
];

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize global background location tracking
  useLocationTracker();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    socketService.disconnect();
    await authService.logout();
    logout();
    navigate('/landing');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex relative">
      <div className="mesh-bg opacity-20" />
      <AudioNotificationHandler />

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-20 glass z-40 px-6 flex items-center justify-between border-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-surface/50 text-[var(--text)]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <NearMeLogo size="sm" />
          </div>
          <ThemeToggle />
        </header>
      )}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-[60] w-72 h-screen p-6' : 'w-80 h-screen sticky top-0 p-6'}
          flex flex-col gap-6
        `}
        initial={isMobile ? { x: '-100%' } : false}
        animate={isMobile ? { x: sidebarOpen ? 0 : '-100%' } : { x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="glass rounded-[2rem] h-full flex flex-col p-6 border-[var(--border)]">
          <div className="flex items-center justify-between mb-8 px-2">
            <NearMeLogo size="sm" />
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-surface-hover">
                <X className="w-5 h-5" />
              </button>
            )}
            {!isMobile && <ThemeToggle />}
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    relative group flex items-center gap-4 px-5 py-4 rounded-2xl font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-white bg-primary shadow-lg shadow-primary-glow' 
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-surface-hover'
                    }
                  `}
                >
                  <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-white rounded-full ml-1"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-[var(--border)] space-y-4">
            <div className="flex items-center gap-4 px-2">
              <div className="relative">
                <img
                  src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=f59e0b&color=fff`}
                  alt={user?.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[var(--border)]"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-[var(--surface)] rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-[var(--text-muted)] hover:text-error hover:bg-error/10 rounded-2xl transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 p-6 ${isMobile ? 'pt-24' : ''}`}>
        <div className="glass rounded-[2.5rem] h-full overflow-hidden p-8 border-[var(--border)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
