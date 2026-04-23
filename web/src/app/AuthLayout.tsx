import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MapPin } from 'lucide-react';

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
      <header className="px-10 py-8 flex items-center justify-between relative z-10">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/landing')}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MapPin className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">NearMe</h1>
        </div>
        <ThemeToggle />
      </header>
      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-lg mb-20 animate-scale-in">
          <Outlet />
        </div>
      </div>
      
      <footer className="py-8 text-center relative z-10">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
           Connect Securely. Live Privately.
        </p>
      </footer>
    </div>
  );
}

export default AuthLayout;