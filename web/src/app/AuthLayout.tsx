import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { NearMeLogo } from '../components/branding/NearMeLogo';

function AuthLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
      <div className="mesh-bg opacity-40" />

      {/* Header */}
      <header className="px-6 sm:px-10 py-6 sm:py-8 flex items-center justify-between relative z-10">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/landing')}
        >
          <NearMeLogo size="sm" />
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 relative z-10">
        <div className="w-full max-w-lg mb-12 sm:mb-20 animate-fade-in">
          <Outlet />
        </div>
      </div>

      <footer className="py-6 sm:py-8 px-4 text-center relative z-10">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
           Connect Securely. Live Privately.
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;
